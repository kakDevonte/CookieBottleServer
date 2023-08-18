const
  common = require('../helpers/common'),
  Collection = require('../helpers/Collection'),
  Message = require('./messages/Message'),
  Game = require('./Game'),
  Chat = require('./Chat');

class Table {
  constructor(id, list) {
    this._id = id;
    this._tables = list;
    this._lock = new Set();

    this._userList = this._tables.app._usersList;
    this._important = false;

    this._users = new Collection();
    this._players = new Collection();
    this._seats = [null, null, null, null, null, null, null, null];
    this._full = false;

    this._game = new Game(this);
    this._chat = new Chat(this);
    this._message = new Message(this);

    this._groups = {
      male: new Collection(),
      female: new Collection()
    };

    this._bots = {
      male: new Collection(),
      female: new Collection(),
      special: null
    };

    this._limitForMerge = 15;
    this._needMerge = 0;

    this._oldTablesList = {};

    this._checkPlayerTimeout = null;
  }

  get app() { return this._tables.app; }
  get id() { return this._id; }
  get message() { return this._message; }
  get game() { return this._game; }
  get seats() { return this._seats; }
  get users(){ return this._users; }
  get players(){ return this._players; }
  get chat() { return this._chat; }
  get isReadyToPlay() { return this._groups.male.size > 1 && this._groups.female.size > 1; }
  get isFull() { return this._full; }
  get specialBot() { return this._bots.special; }

  getId() { return this._id }

  get deleted(){ return this._lock.has('delete'); }

  /**
   * Показывает заблокирован ли стол (по конкретной причине или вообще)
   * @param reason
   * @return {boolean}
   */
  isLock(reason) {
    if(reason) return this._lock.has(reason);
    return this._lock.size > 0;
  }

  /**
   * Возвращает значение показывающее можно ли боту покинуть стол.
   * @param {string} group
   * @return {boolean}
   */
  isAllowLeave(group){
    return (this._groups[group].size - 1) > 1;
  }

  /**
   * Делает этот стол важным, добавляя его в список важных
   */
  nowImportant() {
    this._important = true;
    this._tables.importantTable(this._id, this);
  }

  /**
   * Делает этт стол обычным, убирая из списка важных
   */
  nowNormal() {
    this._important = false;
    this._tables.importantTable(this._id);
  }

  /**
   * Блокирует стол для скрытия из взаимодействия с ним других методов
   * @param {string} reason - причина блокировки
   */
  lock(reason) {
    if(!reason) return;
    this._lock.add(reason);
    global.log.info('[Бутылка] Стол:', this._id, 'заблокирован! Причина:', reason);
  }

  /**
   * Снимает блокировку стола, разрешая взаимодействовать с ним другим методам
   * @param {=string} reason - причина блокировки
   */
  unlock(reason) {
    if(reason) {
      if(reason === 'merge') this._needMerge = 0;
      this._lock.delete(reason);
      global.log.info('[Бутылка] Стол:', this._id, 'блоикровка по причине:', reason, 'снята!');
    } else {
      this._lock.clear();
      global.log.info('[Бутылка] Стол:', this._id, 'блоикровка снята!');
    }
  }

  /**
   * Возвращет количество пустхы мест за столом, всего или по группам
   * @param {string=} group - male | female
   * @return {number}
   */
  countEmptySeats(group) {
    if(group) return 4 - this._groups[group].size;
    return 8 - this._users.size;
  }

  /**
   * Возвращет количество занятых мест за столом, всего или по группам
   * @param {string=} group - male | female
   * @return {number}
   */
  countUsedSeats(group) {
    if(group) return this._groups[group].size;
    return this._users.size;
  }

  /**
   * Возвращет количество ботов за столом, всего или по группам
   * @param {=string} group - группа, пол
   * @return {number}
   */
  countBots(group) {
    if(group) return this._bots[group].size;
    return this._bots.male.size + this._bots.female.size;
  }

  /**
   * Возвращет количество пользователей за столом, всего или по группам
   * @param {=string} group - группа, пол
   * @return {number}
   */
  countUsers(group) {
    if(group) return this._groups[group].size - this._bots[group].size;
    return this._users.size;
  }

  /**
   * Возвращает пользователя по номеру места за столом
   * @param seat
   * @returns {void|*}
   */
  getUserFromSeat(seat) {
    const uid = this._seats[seat];

    if(uid){
      return this._userList.get(uid);
    }

    global.log.debug('[Бутылка] Пользователь не найден на этом месте');
    return  null;
  }

  /**
   * Возарщает id игрока по номеру места за столом
   * @param seat {number}
   * @returns {{}|null}
   */
  getPlayerFromSeat(seat) {
    return this._seats[seat];
  }

  /**
   * Вовзращает количество мужчин за столом
   * @return {number}
   */
  getMaleCount() {
    return this._groups.male.size;
  }

  /**
   * Вовзращает количество женщин за столом
   * @return {number}
   */
  getFemaleCount() {
    return this._groups.female.size;
  }

  /**
   * Сажает пользователя за стол
   * @param {User} user - пользователь
   * @return {boolean|void} - true если посажен успешно
   */
  putUser(user) {
    const gender = user.getGender();
    const uid = user.getId();

    //if(!this._replaceBot(gender)) return global.log.warn('Стол полон');

    this._players.set(uid, user);
    this._users.set(uid, user);
    this._groups[gender].set(uid, user);
    this._putToSeat(user);
    //this._oldTables(user, 'save');
    this._game.connect();

    if(this._users.size === 8) {
      this._isFull = true;
      this._tables.nowComplete(this._id, this);
    }

    this.prepareCheckPlayers();
    return true;
  }

  _oldTables(user, action) {
    try {
      let tables, count, tid;

      tables = user.tables;
      count = tables.length;

      if(action === 'save') {
        while(count--) {
          tid = tables[count];

          if( !this._oldTablesList[tid] ) {
            this._oldTablesList[tid] = 1;
          } else {
            this._oldTablesList[tid]++;
          }
        }
      } else {
        while(count--) {
          tid = tables[count];
          if( this._oldTablesList[tid] ) {
            this._oldTablesList[tid]--;
            if( this._oldTablesList[tid] === 0) delete this._oldTablesList[tid];
          }
        }
      }

      //console.log(this._oldTablesList)
    }catch(e) {
      console.log(e);
    }
  }

  /**
   * Определяет игрока на место за столом
   * @param {User|Bot} user - игрок
   * @private
   */
  _putToSeat(user) {
    const seat = this._emptySeat();

    this._seats[seat] = user.getId();
    user.putToSeat(seat);
  }

  /**
   * Убирает игрока с места за столом
   * @param {User|Bot} user - игрок
   * @param {=boolean} merge - режим объедниения столов
   * @private
   */
  _outOfSeat(user, merge) {
    const seat = user.getSeat();

    if(seat !== null) {
      this._seats[seat] = null;
      user.outSeat();
    }

    if(!merge) {
      user.clearKissed();
      user.clearGifted();
    }
  }

  /**
   * Возвращет индекс первого подходящего пустого места за столом
   * @return {number} - индекс места
   * @private
   */
  _emptySeat() {
    for(let i = 0, length = this._seats.length; i < length; i++) {
      if(this._seats[i] === null) return i;
    }
  }

  /**
   * Добавляет роботов на стол, что бы заполнить места до заданного лимита
   * @param {string} gender
   * @param {number} limit
   * @private
   */
  _createRobotsToLimit(gender, limit){
    let count;

    for(count = this._groups[gender].size; count < limit; count++){
      this._createRobot(gender);
    }
  }

  /**
   * Добавляет на стол робота указанного пола
   * @param {string} gender
   * @private
   */
  _createRobot(gender) {
    let bot, bid;

    bot = this._userList.addBot(gender, this._bots[gender]);
    bid = bot.getId();

    this._bots.special = bid;
    this._bots[gender].set(bid, bid);
    this._groups[gender].set(bid, bot);

    this._players.set(bid, bot);
    this._putToSeat(bot);

    bot.stageTable(this._id);
    bot.say = this._message;

    this._game.connect();
    this.chat.greetingsMessage(bot);
    this.prepareCheckPlayers();

    //global.log.info('Бот создан:', bot.getName());
  }

  /**
   * Убирает пользователя с игрового стола
   * @param {User} user - пользователь
   * @param {=boolean} merge - объединяются ли столы
   */
  userExit(user, merge) {
    const uid = user.getId();

    if(!merge) user.stageLobby();

    user._rotateReceived = false;
    this._groups[user.getGender()].delete(uid);
    this._users.delete(uid);
    this._players.delete(uid);
    //this._oldTables(user, 'delete');
    this._outOfSeat(user, merge);
    this._game.disconnect(uid);

    this._full = false;
    this._tables.nowIncomplete(this._id, this);

    this._chat.cleanup(uid);
    this.cleanupTable();

    //global.log.info(user.getName(), 'Покинул стол ' + this._id);

    if(!merge) {
      //this._tables.findMergeTable(this);
      this.prepareCheckPlayers();
    }
  }

  /**
   * Убирает бота с игрового стола
   * @param {string} bid - id бота
   */
  botExit(bid) {
    try {
      const bot = this._userList.get(bid);
      if(!bot) return false;

      const gender = bot.getGender();

      this._groups[gender].delete(bid);
      this._bots[gender].delete(bid);
      this._players.delete(bid);
      this._outOfSeat(bot);
      this._game.disconnect(bid);
      this._chat.cleanup(bid);
      //console.log('Бот ' + bot.getName(), 'покинул стол ' + this._id);

      this._userList.removeBot(bot);

      this.prepareCheckPlayers();
      return true;
    } catch(e) {
      return false;
    }
  }

  /**
   * Контролирует запуск отложенной проверки на добавление бота
   * перезапускает проверку ее если уже запущена и убирает если игроков 0
   */
  prepareCheckPlayers() {
    if(this.isLock()) return;
    if(this.isReadyToPlay) return;

    let players, timeout;

    const intervals = [
      1000,
      common.randomNumber(30, 70) * 100,
      common.randomNumber(50, 70) * 100,
      common.randomNumber(50, 120) * 100,
      common.randomNumber(20, 40) * 100,
      common.randomNumber(15, 35) * 100,
      common.randomNumber(10, 30) * 100,
      common.randomNumber(20, 25) * 100,
      common.randomNumber(30, 40) * 100
    ];

    // const intervals = [
    //   1000,
    //   common.randomNumber(80, 120) * 100,
    //   common.randomNumber(60, 120) * 100,
    //   common.randomNumber(40, 120) * 100,
    //   common.randomNumber(50, 150) * 100,
    //   common.randomNumber(20, 80) * 100,
    //   common.randomNumber(70, 100) * 100
    // ];

    players = this._players.size;
    timeout = intervals[players];

    if(this._checkPlayerTimeout) clearTimeout(this._checkPlayerTimeout);
    if(players === 0) return;

    this._checkPlayerTimeout = setTimeout( () => {
      this._checkPlayersForCreateBot();
    }, timeout);
  }

  /**
   * Проверяет количество мужчин и женщин за столом
   * и добавляет одного бота туда где меньше численность до "запуска" игры
   * @private
   */
  _checkPlayersForCreateBot() {
    if(this.isLock()) return;

    const males = this._groups.male.size;
    const females = this._groups.female.size;

    if(males > females) {
      if(females < 2) {
        this._checkPlayerTimeout = null;
        this._createRobot('female');
      }
    } else {
      if(males < 2) {
        this._checkPlayerTimeout = null;
        this._createRobot('male');
      }
    }
  }

  /**
   * Готовит стол к удалению если на нем не осталось живых игроков
   * удалет стол из списка, останавлиает игру, убирает с него ботов
   */
  cleanupTable() {
    const bots = this.isEmpty();
    if(bots) {
      this._tables.remove(this._id);
      this.game.stop();

      for(const bid of bots) this.botExit(bid);
      this._userList.removeBots(bots);
    }
  }

  clearFromBots() {
    const clear = (bid, timeout) => {
      return new Promise( (resolve) => {
        setTimeout(() => {
          const result = this.botExit(bid);
          if(result) this.app.sendPlayers(this._id);
          resolve(result);
        }, timeout);
      });
    };

    return new Promise((resolve) => {
      const promises = [];
      let delay = 0;

      this._bots.male.forEach((bot, bid) => {
        delay += common.randomNumber(2, 6) * 1000;
        promises.push(clear(bid, delay));
      });

      this._bots.female.forEach((bot, bid) => {
        delay += common.randomNumber(2, 6) * 1000;
        promises.push(clear(bid, delay));
      });

      Promise.all(promises).then(values => {
        let count = values.length;

        while(count--) if(!values[count]) resolve(false);
        resolve(true);
      });
    });
  }

  /**
   * Позволяте узнать неполная ли эта группа сейчас
   * @param {string} gender - группа, пол
   * @return {boolean} - true если в группе есть места
   */
  isGroupIncomplete(gender) {
    return 4 - this._groups[gender].size > 0;
  }

  /**
   * Возаращет свежие данные обо всех игроках за столом в "сжатом" виде
   * @return {[]}
   */
  getPlayers() {
    let user;
    const result = [];

    this._seats.forEach((uid, index) => {
      try {
        user = this._userList.get(uid);
        if(user) user = user.getInfo();

        result[index] = user ? user : null;
      } catch(e) {
        global.log.warn('[Бутылка] Не найден пользователь при сборе данных об игроках', uid);
        result[index] = null;
      }
    });

    return result;
  }

  /**
   * Возаращет есть ли пользователь за столом
   * @return Boolean
   */
  isUserAtTable(id) {
    let user;

    if(this._seats.length === 0) return false;

    this._seats.forEach((uid, index) => {
      try {
        user = this._userList.get(uid);
        if(user) user = user.getInfo();
        if (user && user.id == id) return true;
      } catch(e) {
        global.log.warn('[Бутылка] Не найден пользователь при сборе данных об игроках', uid);
      }
    });

    return false;
  }

  /**
   * Определяет есть ли за столом пользователи
   * @return {boolean|IterableIterator} - false если пользователи есть, {список ботов} если игроков нет
   */
  isEmpty() {
    if(this._users.size === 0) {
      return this._players.keys();
    }

    return false;
  }

  /**
   * Увеличивает счетчик раундов у всех игроков за столом
   */
  roundsUpdate() {
    const
      countBots = this.countBots(),
      countUsers = this.countUsers();

    if(countUsers <= countBots) {
      this._needMerge++;
    } else {
      this._needMerge = 0;
    }

    if(this._needMerge >= this._limitForMerge) {
      const timeout = common.randomNumber(10, 30) * 100;
      setTimeout(() => this._tables.findMergeTable(this), timeout);
    }

    this._players.forEach((player) => {
      try {
        if(player) player.roundUp();
      } catch(e) {
        console.warn('Не удалось обновить счетчик раундов', e);
      }
    });
  }
}

module.exports = Table;