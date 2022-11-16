const
  common = require('../helpers/common'),
  Collection = require('../helpers/Collection'),
  Player = require('./Player'),
  User = require('./User');

class Game {
  constructor(table) {
    this._table = table;

    this._state = 'game-created';
    this._stateHistory = [];
    this._update = Date.now();
    this._stateExlude = {'game-created': true, 'pending:': true, 'game-stopped': true};

    this._round = 0;
    this._roulette = false;
    this._activePlayer = new Player(true);
    this._targetPlayer = new Player(false);
    this._resultKiss = null;
    this._history = new Collection();
    this._historyLimit = global.setups.game.historyLimit;

    this._activeUser = null;
    this._activeSeat = 0;
    this._receivedKiss = 0;

    this._timeouts = new Collection();
    this._intervals = {
      newRound: 1000,
      autoRotate: 5000,
      selectTarget: 4000,
      nextRound: 4000,
      autoKiss: 8000
    };

    this._watherTimeout = null;
    this._temporaryTarget = null;

    this.watcher();
  }

  /**
   * Наблюдатель за игрой, запускается каждые 2 минуты и проверяет не зависла ли она
   * если зависла (время смены статуса большое), пробует перезапуск раунда
   */
  watcher() {
    // отключаем наблюдателя, если стол готов к удалению.
    if(this._table.deleted) return;

    if( (Date.now() - this._update) > global.setups.game.sleep ) {
      global.log.error('Завили', this._stateHistory.join(' > '));
      this.newRound('watcher - reload');
    }

    this._watherTimeout = null;
    this._watherTimeout = setTimeout( () => {
      this.watcher();
    }, global.setups.game.watcher);
  }

  get state() {
    return this._state;
  }

  get data() {
    return {
      state: this._state,
      round: this._round,
      player: this._activePlayer.get(),
      target: this._targetPlayer.get(),
      result: this._resultKiss
    }
  }

  get app() {
    return this._table.app;
  }

  get tid() {
    return this._table._id;
  }

  get table (){
    return this._table;
  }

  /**
   * Возвращает противположного игрока
   * @param {boolean} active - статус известного игрока
   * @returns {Player}
   */
  getAnotherPlayer(active) {
    return active ? this._targetPlayer : this._activePlayer;
  }

  /**
   * Подключение к игре пользователя (бота)
   */
  connect() {
    this.checkGame();
  }

  /**
   * Отключение от игры пользователя (бота)
   * @param {string} uid - id юзера который вышел из-за стола
   */
  disconnect(uid){
    this.checkGame(uid);
  }

  /**
   * Проверяем игру на соотвествие рабочим параметрам
   * @param {=string} uid - id юзера который вышел из-за стола
   */
  checkGame(uid) {
    try {
      if(!this.table.isReadyToPlay) {
        this.reset();
        this._setState('pending');
        this._table.nowImportant();
        this._table.app.emitGameData(this.tid, this.data, 'table');
      } else {

        // если пользователь вышел, и он был в "активной игре", то делаем перезапуск
        if(this._checkRestart(uid)) {
          this.nextRound('check-game, check-restart');
          return;
        }

        if(this._state === 'game-created' || this._state === 'pending') {
          this._table.nowNormal();
          if(this._history.size) this._activeSeat = this.nextActiveSeat();
          this.gameStart(this._activeSeat);
        }
      }
    } catch(e) {
      global.log.error('Ожидание игры', e);
      this.nextRound('check-game, error');
    }
  }

  /**
   * Возаращет true если пользователь был "участником игры"
   * @param uid - user id
   * @return {boolean}
   * @private
   */
  _checkRestart(uid) {
    if(!uid) return false;
    return this._activePlayer.uid === uid || this._targetPlayer.uid === uid;
  }

  /**
   * Новая игра, ставим активого игока, запускаем новый раунд
   */
  gameStart(activeSeat = 0){
    try {
      // добавить хитрые формулы для поиска нового игрока
      //this._activePlayer.seat = activeSeat;
      this.newRound();

    } catch(e) {
      this.nextRound('game-start');
    }
  }

  /**
   * Новый раунд, выбираем нового активного игрока.
   * Отправляем данные игры, разрешаем игроку крутить.
   * Через таймаут запускаем авто-вращение.
   */
  newRound() {
    //console.log('Round: ', this._round);

    try {
      // берем игрока со стола, с места из активного
      const player = this._table.getUserFromSeat(this._activeSeat);
      this._activeUser = player;

      if(!player) return this.nextRound('new-round, player');
      if(!this.setActive(player)) return this.nextRound('new-round, set-active');

      // отправка данных игры и разрешения на вращение для клиента
      this.app.emitGameData(this.tid, this.data, 'table');
      this.app.emitAllowRotate(player);

      // отключаем отложенный запуск авто-вращения
      if(this._table.deleted) return;

      // переходим к следующему действию, авто-вращение рулетки
      this._timeouts.set('autoRotate', setTimeout(
        () => this.rotateRoulette(true),
        this._intervals.autoRotate
      ));

    }catch(e) {
      global.log.warn('Новый раунд, стол:', this._table.id, e);
      this.nextRound('new-round, error');
    }
  }

  /**
   * Вращение рулетки запускается актвиным игроком по событию или принудительно игрой по таймауту.
   * @param {boolean} auto - true если автоматичский запуск игрой, иначе false
   */
   rotateRoulette(auto) {
    try {
      // подсчитваем вращение бутылки
      if(this._activeUser) this._activeUser.rotateUp(auto);

      // ищем будущую цель
      const {seat, target} = this.findTargetPlayer();

      // если не нашли, то делаем перезапуск
      if(!target) return this.nextRound('rotate-roulette, find-target');

      this._setState('rotate-roulette');
      this._roulette = true;
      this._temporaryTarget = target;

      // запускаем рулетку на столе
      this.app.emitStartRotate(this.tid, seat);
      this._activePlayer.autoTurn = auto;

      // отключаем отложенный запуск авто-вращения рулетки
      // (если оно было запущено вручную)
      this._resetRunAutoRotate();

      // если стол готов к удалению, не продолжаем игру
      if(this._table.deleted) return;

      // переходим к следующему действию, выбор цели
      this._timeouts.set('selectTarget', setTimeout(
        () => this.selectTarget(),
        this._intervals.selectTarget
      ));

    }catch(e) {
      global.log.error("Неудачное вращении", e);
      this.nextRound('rotate-roulette, error');
    }
  }

  /**
   * Отключает отложенный запуск авто-вращения
   * @private
   */
  _resetRunAutoRotate() {
    clearTimeout(this._timeouts.get('autoRotate'));
    this._timeouts.delete('autoRotate');
  }

  /**
   * Выбор цели после вращения, отправка данных об игре, отправка запроса на поцелуй
   * (хотя цель уже получена, остается лишь записать)
   */
  selectTarget(){
    try{
      //console.log('Round', this._round);

      this._roulette = false;
      // ставим цель, из временных данных, если не вышло, делаем рестарт игры
      if(!this.setTarget(this._temporaryTarget)) return this.nextRound('select-target, no set-target');

      this.app.emitGameData(this.tid, this.data, 'table');

      // если стол готов к удалению, не продолжаем игру
      if(this._table.deleted) return;

      // запуск запроса на поцелуи
      this.kissRequest();
    }catch(e) {
      global.log.error('Поиск цели', e);
      this.nextRound('select-target, error');
    }
  }

  /**
   * Отправка запросов на поцелуй обоим игрокам (активный и цель)
   */
  kissRequest() {
    try {
      this._setState('kiss-request [ 0/2 ]');

      // шлем клиентам запросы
      this.app.emitKissRequest(this._activePlayer, this._round);
      this.app.emitKissRequest(this._targetPlayer, this._round);

      // если стол готов к удалению, не продолжаем игру
      if(this._table.deleted) return;

      // делаем отложенный запуск на авто-поцелуи
      // (нужно если что то пошло не так)
      this._timeouts.set('autoKiss', setTimeout(
        () => this.autoReceiveKiss(),
        this._intervals.autoKiss
      ));
    }catch(e) {
      global.log.error('Запрос поцелуя', e);
      this.nextRound('kiss-request');
    }
  }

  /**
   * Получаем результат поцелуя от игрока
   * @param {{active, kiss, tid, uid, round, auto, ?force}} data {актинвый ли?, результат поцелуя, автоматичский ли?}
   */
  receiveKiss(data){
    try {
      const current = data.active ? this._activePlayer : this._targetPlayer;

      //console.log(data);

      if(!data.force) {
        if(this._table._id !== data.tid) return;
        if(this._round !== data.round) return;
        if(current.uid !== data.uid) return;
      }

      current.autoKiss = data.auto;
      current.kiss = data.kiss;

      this._receivedKiss++;
      this._setState('kiss-request [ ' + this._receivedKiss + '/2 ]');

      // отправка данных принятого поцелуя, другому игроку
      if(data.active){
        this.app.emitReceivedKiss(this._activePlayer, this._targetPlayer);
      } else {
        this.app.emitReceivedKiss(this._targetPlayer, this._activePlayer);
      }

      ////////////////////////////////////////

      // если оба поцелуя получены
      if(this._activePlayer.kiss !== null && this._targetPlayer.kiss !== null){
        this._resultKiss = (this._activePlayer.kiss && this._targetPlayer.kiss);

        // шлем результаты на стол
        this.app.emitRoundResult(this.tid, this._resultKiss);

        if(this._resultKiss) {
          const date = Date.now();
          let kiss;

          kiss = {
            from: this._targetPlayer.uid,
            type: this._targetPlayer.type,
            date: date
          };
          // шлем успешниый поцелуй для активного игрока
          this.app.emitSuccessKiss(this.tid, this._activePlayer.uid, kiss);

          kiss = {
            from: this._activePlayer.uid,
            type: this._activePlayer.type,
            date: date
          };
          // шлем успешниый поцелуй для целевого игрока
          this.app.emitSuccessKiss(this.tid, this._targetPlayer.uid, kiss);
        }

        // отключаем автопоцелуй, если мы получили оба
        this._resetRunAutoKiss();

        // если стол готов к удалению, не продолжаем игру
        if(this._table.deleted) return;

        // переходим к следующему действию, следующий раунд (без ошибок)
        this._timeouts.set('nextRound', setTimeout(
          () => this.nextRound(),
          this._intervals.nextRound
        ));
      }
    }catch(e) {
      global.log.error('Получение поцелуя', e);
      this.nextRound('receive-kiss');
    }
  }

  /**
   * Отключает запуск авто-поцелуев
   * @private
   */
  _resetRunAutoKiss() {
    clearTimeout(this._timeouts.get('autoKiss'));
    this._timeouts.delete('autoKiss');
  }

  /**
   * Запуск следующего раунда
   * Записывает текущий в историю, подбирает нового активного игрока, сбрасывает данные игры.
   */
  nextRound(error) {
    // пишем в историю
    this.historyHandler();

    // полный сброс
    this.reset();
    this._setState('next-round');

    // если это нормальный запуск, увеличиваем раунды у игроков и в игре
    if(!error){
      this._table.roundsUpdate();
      this._round++;
    } else {
      global.log.debug('Перезапуск раунда, стол:', this._table._id, error);
    }

    // новое место активного игрока
    this._activeSeat = this.nextActiveSeat();
    this._table.app.emitGameData(this.tid, this.data, 'table');

    // если стол готов к удалению, не продолжаем игру
    if(this._table.deleted) return;

    // переходим к следующему действию, новый раунд
    this._timeouts.set('newRound', setTimeout(
      () =>  this.newRound(),
      this._intervals.newRound
    ));
  }

  _setState(state) {
    this._state = state;
    this._update = Date.now();

    this._stateHistory.push(state);
    if(this._stateHistory.length > global.setups.game.stateCount) this._stateHistory.shift();
  }

  /**
   * Сброс значений раунда к дефолтным
   */
  reset() {
    this.clearTimeouts();
    this._temporaryTarget = null;
    this._activeUser = null;
    this._activePlayer.reset();
    this._targetPlayer.reset();
    this._resultKiss = null;
    this._receivedKiss = 0;
    this._roulette = false;
  }


  /**
   * Остановка игры
   * - очистка таймаутов
   * - сброс состояний
   * - добавляем раунд
   */
  stop() {
    this._setState('game-stopped');
    clearTimeout(this._watherTimeout);
    this._watherTimeout = null;
    this.reset();
    this._round++;

    global.log.info('Игра остановлена');
  }

  /**
   * Сбрасываем все таймауты
   */
  clearTimeouts(){
    for(const key of this._timeouts.keys()) {
      clearTimeout(this._timeouts.get(key));
    }

    this._timeouts.clear();
  }

  /**
   * Установка состояния игры на "игрок-выбран", установка занчений от переданного пользоваля
   * @param player {User|Bot} Пользователь или бот
   */
  setActive(player){
    try {
      this._activePlayer.uid = player.getId();
      this._activePlayer.type = player.getType();
      this._activePlayer.gender = player.getGender();
      this._activePlayer.seat = player.getSeat();
      this._setState('active-selected');

      return true;
    } catch(e) {
      return false;
    }
  }

  /**
   * Пробуем установить целевого игрока, стейт "цель-выбрана"
   * @param {User|Bot} player
   */
  setTarget(player) {
    try {
      this._targetPlayer.uid = player.getId();
      this._targetPlayer.type = player.getType();
      this._targetPlayer.gender = player.getGender();
      this._targetPlayer.seat = player.getSeat();
      this._setState('target-selected');

      return  true;
    } catch(e) {
      return false;
    }
  }

  /**
   * Управление историей игры, запись, очитска лишних ходов.
   */
  historyHandler(){
    const turn = {
      round: this._round,
      player: this._activePlayer.get(),
      target: this._targetPlayer.get(),
      result: this._resultKiss
    };

    this._history.set(this._round, turn);
    if(this._history.size > this._historyLimit) this._history.remove(0);
  }

  /**
   * Автоматический поцелуй игроков (в случаях проблем с получением ответа)
   */
  autoReceiveKiss(round){
    const that = this;

    if(this._activePlayer.kiss === null) {
      this.receiveKiss({
        active: true,
        kiss: false,
        auto: true,
        force: true
      });
      //afk(this._activePlayer);
    }

    if(this._targetPlayer.kiss === null) {
      this.receiveKiss({
          active: false,
          kiss: false,
          auto: true,
          force: true
        }
      );
      //afk(this._targetPlayer);
    }

    /**
     *
     * @param {Player} player
     */
    function afk(player) {
      const uid = player.uid;

      try {
        const user = that.app.user(uid);

        if(user && user.updateAFK() > 5) {
          that.app.closeApp(user)
        }
      }catch(e) {
        global.log.warn('Не смог проставить AFK', uid, e);
      }
    }
  }

  /**
   * Возвращает новое место активного игрока
   * @param {=number} seat - старое место активного игрока
   * @returns {null|number} index места за столом
   */
  nextActiveSeat(seat){
    try {
      let count = 8;

      seat = seat !== undefined ? seat : this._activeSeat;
      if(isNaN(seat)) seat = 0;

      while(count--){
        seat++;
        if(seat === 8) seat = 0;

        if(this._table.getPlayerFromSeat(seat)) {
          return seat;
        }
      }

      return 0;
    }catch(e) {
      global.log.warn('Не могу поставить Active Seat, tid:' + this._table.id, e);
      return 0;
    }
  }

  /**
   * Ищем целевого игрока
   * @returns {{seat: <null|number>, target: <null|User>}}
   */
  findTargetPlayer() {
    const group = this._activePlayer.gender === 'male' ? 'female' : 'male';
    const count = this._table._groups[group].size;
    let targetIndex, user;

    if(count < 1) return {seat: null, target: null};

    targetIndex = common.randomNumber(0, count - 1);
    user = this._table._groups[group].takeOne(targetIndex);
    if(!user) return {seat: null, target: null};

    try {
      return {seat: user.getSeat(), target: user};
    }catch(e) {
      return {seat: null, target: null};
    }
  }

}

module.exports = Game;