const requests = require('../helpers/serverRequests');
const db = require('../helpers/dbRequests');

const
  common = require('../helpers/common'),
  User = require('./User'),
  Bot = require('./Bot'),
  UsersList = require('./UsersList'),
  ConnectionList = require('./ConnectionList'),
  TablesList = require('./TablesList'),
  GiftsList = require('./GiftsList'),
  TemplateBotList = require('../res/bots');

class Bottle {
  constructor(io) {
    this._io = io.of('/bottle/');
    this._bots = new TemplateBotList();

    this._usersList = new UsersList(this);
    this._tablesList = new TablesList(this);
    this._giftsList = new GiftsList(this);

    this._connects = new ConnectionList(this);

    this._giftsList.loadFromDB().then(() => {
      db.resetRatings();
      this._bindSockets();
      this._janitor();
    });
  }

  get io(){ return this._io; }
  get bots() { return this._bots; }

  isSocket(socket) {
    return socket.constructor && socket.constructor.name === 'Socket';
  }

  table(id) {
    return this._tablesList.table(id);
  }

  user(id){
    return this._usersList.get(id);
  }

  gift(id) {
    return this._giftsList.gift(id);
  }

  game(id) {
    try {
      return this._tablesList.table(id).game;
    } catch(e) {
      global.log.warn('[Бутылка] Игра не получена', id);
      return null;
    }
  }

  /**
   * Зацикленный метод для отключения мертвых, ошибочных подлючений.
   * @private
   */
  _janitor() {
    const connects = this._io.sockets;
    let sid, socket, connect, user, time = Date.now();

    for(sid in connects) {
      socket = connects[sid];
      connect = this._connects.getConnect(sid);

      if(Object.keys(socket.rooms).length === 1) {
        if(connect) {
          if(connect.uid === null && time - connect.created > 30000) {
            this.closeApp(socket);
          }
        } else {
          this.closeApp(socket);
        }
      } else {
        if(connect) {
          user = this.user(connect.uid);

          if( user && user.isOffline(time) ) {
            this.closeApp(socket);
          }
        }
      }
    }

    setTimeout(() => this._janitor(), 60000);
  }

  _bindSockets() {
    this._io.on('connection', (socket) => {
      const sid = socket.id;

      this._connects.add(socket);
      this._connects.to(sid, 'request-info');

      global.log.info(`[Бутылка] Сокет подключен: ${socket.id} |`, `Всего: ${this._connects.count()}`);

      /////////////////////////////////////////////////

      socket.on('close-roulette', () => {
        this.closeApp(socket);
      });

      /////////////////////////////////////////////////

      socket.on('user-info', (guest) => {
        guest.platform = 'vk';
        this._receiveUserInfo(guest, socket);
      });

      /////////////////////////////////////////////////

      socket.on('check-balance', (uid) => {
        this._checkBalance(uid + '');
      });

      /////////////////////////////////////////////////

      socket.on('in-tutorial', () => {
        this._inTutorial(socket.id);
      });

      socket.on('in-lobby', (tid) => {
        if(tid) return this._changeTable(tid, sid);

        setTimeout(() => this._seatToTable(sid), 1250);
      });

      /////////////////////////////////////////////////

      socket.on('in-table', (tid) => {
        this._playerSeatToTable(sid, tid);
      });

      /////////////////////////////////////////////////

      socket.on('player-rotated-roulette', (tid) => {
        this.startRotateCookie(tid);
      });

      /////////////////////////////////////////////////

      socket.on('receive-kiss-result', (response) => {
        this._processKissResponse(response);
      });

      /////////////////////////////////////////////////

      socket.on('user-message', ({from, text, to}) => {
        this._processReceiveUserMessage(from, text, to);
      });

      /////////////////////////////////////////////////

      socket.on('send-gift', (response) => {
        this._processingGiftSending(response);
      });

      /////////////////////////////////////////////////


      socket.on('request-ratings', (data) => {
        this._processingRatingRequest(sid, data);
      });

      /////////////////////////////////////////////////

      socket.on('disconnect', () => {
        this._disconnect(socket)
      });

      /////////////////////////////////////////////////
    });
  }

  async _checkBalance(uid) {
    try {
      const user = this.user(uid);

      if(!user) return;

      const result = await user.checkUpdateCookieCounter();

      if(result === false) return;

      this._emitEvent('update-cookies', 'user', uid, {count: result});
    } catch(e) {}
  }

  async _receiveUserInfo(guest, socket) {
    try {
      const
        sid = socket.id,
        uid = guest.id,
        {exist, user, errors} = this._usersList.addUser(sid, guest);

      if(user) {
        this._connects.applyUID(sid, uid);
        this._connects.joinRoom(user.getSockets(), 'user_' + uid);

        if(exist) {
          const tid = user.getTable();

          this._connects.joinRoom(user.getSockets(), 'table_' + tid);
          this._connects.to(sid, 'put-table', {uid, tid});
        } else {
          //user.enterCounter
          if( await user.loadFromDB(guest) ) {
            this._connects.toUser(user, 'connect-success', user.enterCounter);
          } else {
            this._emitError(socket,
              [
                'Неудачная попытка получения',
                'ваших данных с сервера игры',
              ]
            );

          }
        }

        this._emitUserData(user);
        this.emitGiftsData(sid, this._giftsList.gifts);
      } else {
        this._emitError(socket, errors);
      }
    }catch(e) {

      global.log.warn('[Бутылка] Ошибка получения данных от клиента', e);
      this._emitError(
        socket,
        [
          'Неудачная попытка получения',
          'ваших данных с сервера игры',
        ]
      );

    }
  }

  /**
   * Меняет игроку стейт на туторал
   * @param sid
   * @private
   */
  _inTutorial(sid) {
    try {
      this._connects.getUser(sid).stageTutorial();
    }catch(e) {
      global.log.warn('[Бутылка] Не смог перевести в stage: туторал.');
    }
  }

  /**
   * Запускает смену стола у игрока
   * @param {string} tid - прошлый стол
   * @param {string} sid - id socket
   * @private
   */
  _changeTable(tid, sid) {
    try{
      const user = this._connects.getUser(sid);
      const table = this.table(tid);

      this._connects.leaveRoom(user.getSockets(), 'table_' + tid);
      table.userExit(user);
      this._emitCurrentStage(user);

      this.sendPlayers(tid);
      setTimeout(() => this._seatToTable(sid), 2000);
    } catch(e) {

      global.log.warn('[Бутылка] Неудачная смена стола', tid, sid, e);
      this._emitError(
        sid,
        [
          'Неудачная смена стола ',
          'пожалуйста, вернитесь',
          'назад и попробуйте снова',
        ]
      );

    }
  }

  /**
   * Запускает посадку за стол игрока
   * @param {string} sid - id socket
   * @private
   */
  _seatToTable(sid) {
    try {
      let user, uid;

      user = this._connects.getUser(sid);
      if(!user) return;

      uid = user.getId();
      user.stageLobby();

      const
        table = this._tablesList.getFreeTable(user),
        tid = table.getId();

      this.emitGameData(uid, table.game.data, 'user');
      //global.log.info('[Бутылка] Стол выбран', tid);

      try {
        if(table.putUser(user)) {
          user.stageTable(tid);

          this._connects.joinRoom(user.getSockets(), 'table_' + tid);
          this._connects.toTable(tid, 'put-table', {uid, tid});

          table.chat.greetingsMessage(user);
          //global.log.info(`[Бутылка] Пользователь ${user.getName()}, подключился к столу ${tid} (${uid})`);
        } else {
          setTimeout(() => {
            this._seatToTable(sid);
          }, 3000);
        }
      }catch(e) {
        global.log.error('[Бутылка] Нудачная посадка за стол', sid, e);
        setTimeout(() => {
          this._seatToTable(sid);
        }, 3000);
      }
    }catch(e) {

      global.log.error('[Бутылка] Что то не так при поиске стола и посадке', sid, e);
      this._emitError(
        sid,
        [
          'Неудачная попытка посадки ',
          'за стол подалуйста, вернитесь',
          'назад и попробуйте снова',
        ]
      );

    }
  }

  /**
   * Отправка личных данных пользователю
   * @param {User|string} user
   * @private
   */
  _emitUserData(user) {
    try {
      if(typeof user === 'string') {
        user = this.user(user);
      }

      this._connects.toUser(user, 'personal-data', user.getPersonalInfo());
    } catch(e) {
      global.log.error('[Бутылка] Отправка личных данных', e);
    }
  }

  /**
   * Отправка данных игроку который успешно сел за стол.
   * @param {string} sid - id socket
   * @param {string} tid - id стола
   */
  _playerSeatToTable(sid, tid) {
    const table = this.table(tid);

    if(table){
      this.emitChatMessage(null, sid, table.chat.requestMessages());
      this.sendPlayers(tid);
      this.emitGameData(sid, table.game.data);
    }
  }

  /**
   * Зпускает вращение печеньки
   * @param tid
   */
  startRotateCookie(tid){
    const table = this.table(tid);

    if(table){
      table.game.rotateRoulette(false);
      //console.log('Запуск вращение рулетки, стол:', tid);
    }
  }

  /**
   * Обрабатыват сообщение от юезра
   * @param {string} from - юзер id
   * @param {string} text - сообщение
   * @param {string|null} to - user id или null
   * @private
   */
  _processReceiveUserMessage(from, text, to){
    try {
      const user = this.user(from);

      if(!user) return;
      const table = this.table(user.getTable());

      if(!table) return;
      const chat = table.chat;

      if(!chat) return;
      chat.receiveMessage(from, text, to);
    } catch(e) {
      global.log.error('[Бутылка] Обработка принятого сообщения пользователя', from, to, e);
    }
  }

  /**
   * Принимает ответ от клиента с результатом поцелуя
   * @param {{kiss, uid, tid, round, active, auto}} data - {boolean, string, string, number, boolean, boolean}
   */
  _processKissResponse(data) {
    try{
      let {kiss, uid, tid, round, active, auto} = data;
      let user;

      if(!this.table(tid)) return;
      if(typeof round != "number") return;
      if(typeof active !== 'boolean') return;
      if(typeof kiss !== 'boolean') kiss = false;
      if(typeof auto !== 'boolean') auto = true;

      this.receiveKissResult(kiss, {tid, uid, round}, active, auto);

      if(typeof uid !== 'string') return;
      user = this.user(uid);

      if(user && user.getType() === 'human') {
        //user.resetAFK();
        this._connects.toUser(uid, 'received-kiss', {active, kiss});
      }
    } catch(e) {
      global.log.warn('[Бутылка] Обработка принятого поцелуя', e);
    }
  }


  /**
   * Обработка данных на отправку подарка игроку
   * @param {{tid: string, from: string, to: string, gid: number, buy: boolean, category: string}} data
   * @private
   */
  _processingGiftSending(data){
    try {
      let {tid, from, to, gid, buy, category} = data;

      if(typeof tid !== 'string') return;
      if(typeof from !== 'string') return;
      if(typeof to !== 'string') return;
      if(typeof gid !== 'string') return;
      if(typeof buy !== 'boolean') return;
      if(typeof category !== 'string') return;

      let table, userFrom, userTo, gift, result, item;

      table = this.table(tid); if(!table) return;
      userFrom = this.user(from); if(!userFrom) return;
      userTo = this.user(to); if(!userTo) return;
      gift = this.gift(gid); if(!gift) return;

      if(buy) {
        result = userFrom.spendCookies(gift.cost) ? {id: gift.id, gid: null} : null;
      } else {
        result = userFrom.spendGiftFromInventory(gift.id);
      }

      if(result) {
        item = userTo.receiveGift(gift, userFrom);
        this._emitUserData(from);
        this._emitReceivedGift(tid, to, item);
        table.chat.giftMessage(userFrom, userTo, gift);

        requests.sendGift(result, userFrom, userTo);
      } else {
        global.log.warn('[Бутылка] Неудачное дарение подарка.');
      }

    }catch(e) {
      global.log.error('[Бутылка] Обработка отправленного подарка', e);
    }
  }

  /**
   * Обработка запроса на получение рейтинга
   * @param {string} sid
   * @param {{period, type}|string} data
   * @returns {Promise<void>}
   * @private
   */
  async _processingRatingRequest(sid, data) {
    const error = (reason) => {
      if(reason) console.log('Rating Request Error:', reason);
      this._connects.to(sid, 'receive-rating-data', 'error');
    };

    try {
      if(!data) return error('data');
      if(typeof data === 'string' && /day|week|month/.test(data)) data = {type: 'kisses', period: data };
      if(!data.type || !data.period) return error('type || period');
      if( !(/kisses|gifts/.test(data.type)) ) return error('type');
      if( !(/day|week|month/.test(data.period)) ) return error('period');

      const uid = this._connects.getUID(sid);

      if(!uid) return error();

      const user = this.user(uid);

      if(!user) return error();

      const player = user.platform + user.getId();
      const info = user.getRatingInfo();

      if(!info) return  error();

      const result = await db.getRating(data, player, info);

      if(!result) return error();

      this._connects.to(sid, 'receive-rating-data', result);
    }catch(e) {
      global.log.warn('[Бутылка] Не удалось получить рейтинг', e);
      error();
    }
  }

  /**
   * Отправка дданых об игроках за столом
   * @param tid {string} id стола
   */
  sendPlayers(tid) {
    try{
      const table = this.table(tid);
      const data = {
        tid,
        players: table.getPlayers(),
        groups: {
          male: table.getMaleCount(),
          female: table.getFemaleCount(),
        }
      };

      //console.log('Update players: game stage:', table.game.state, 'Стол', tid);

      this._connects.toTable(tid, 'update-players', data);
    }catch(e) {
      global.log.warn("[Бутылка] Отправка игроков", e);
    }
  }

  /**
   * Отправляет игроку событие о том что можно крутить печеньку
   * @param user {User|Bot|string}
   */
  emitAllowRotate(user) {
    try {
      if(user) {
        if(user.getType() === 'human') {
          this._connects.toUser(user.getId(), 'allow-start-rotate');
          return true;
        } else {
          user.rotateRoulette();
          return true;
        }
      }
    }catch(e) {
      console.log('Не могу сообщить о вращении!');
      return false;
    }
    return false;
  }

  /**
   * Отправляет событие на стол о том, что надо вращать печеньку
   * @param tid {string} id стола
   * @param seat {number} index места цели за столом
   */
  emitStartRotate(tid, seat) {
    this._connects.toTable(tid, 'start-rotate', seat);
  }

  /**
   * Отправка клиенту запрос на поцелуй (открывывая окно поцелуя)
   * @param player {Player}
   * @param round {number}
   */
  emitKissRequest(player, round) {
    try{
      if(player.type === 'human') {
        this._connects.toUser(player.uid, 'kiss-request', round);
      } else {
        this.user(player.uid).kissPlayer(player.active, round);
      }
      return true;
    }catch(e) {
      return false;
    }
  }

  /**
   * Отправляет клиенту полученный результат поцелуя от другого игрока (бот, пользователь)
   * @param player {Player} game._currentPlayer
   * @param target {Player} game._targetPlayer
   */
  emitReceivedKiss(player, target) {
    if(target.type === 'human') {
      //console.log('Отправляем результат поцелуя к id:', target.uid);

      this._connects.toUser(target.uid, 'received-kiss', {active: player.active, kiss: player.kiss});
    }
  }

  /**
   * Записываем и отправляем резульатты успешного поцелуя активного игрока
   * @param {string} tid  - id стола
   * @param {string} uid  - id игрока
   * @param {object} kiss - {from, type, date}
   */
  emitSuccessKiss(tid, uid, kiss) {
    try {
      const user = this.user(uid);
      if(!user) return;

      user.receiveKiss(kiss);
      this._connects.toTable(tid, 'update-kiss-data', {uid, kissed: user.kissed, counter: user.kissCounter});
    } catch(e) {
      global.log.error('[Бутылка] Добавлем поцелуй', e);
    }
  }

  /**
   * Отправляет резульаты общего поцелуя клиентам
   * @param tid
   * @param result
   */
  emitRoundResult(tid, result){
    this._connects.toTable(tid, 'round-result', result);
  }

  /**
   * Получает результат поцелуя от клиента
   * @param kiss {boolean} - поцелуй true | false
   * @param info {{tid, uid, round}} - id стола, id игрока, раунд поцелуя
   * @param active {boolean} - активный ли игрок или цель
   * @param auto {=boolean} - автоматический ли поцелуй
   */
  receiveKissResult(kiss, info, active, auto) {
    const table = this.table(info.tid);

    if(table) {
      //console.log('Получен поцелуй от', active ? 'active' : 'target', kiss);
      table.game.receiveKiss({active, kiss, tid: info.tid, uid: info.uid, round: info.round, auto});
    }
  }

  /**
   * Отправляет сокету данные о текущем состоянии приложения
   * @param {User|string} user - user } user.id
   */
  _emitCurrentStage(user){
    try{
      this._connects.toUser(user, 'current-stage', user.getStage());
    } catch(e) {
      global.log.error("[Бутылка] Отправка состояния:", e);
    }
  }

  /**
   * Отправляет сокету данные о текущем состоянии игры
   * @param {string} id - socket.id или user.id или table.id
   * @param {object} data - Game Data
   * @param {=string} type - (user, table)
   */
  emitGameData(id, data, type) {
    this._emitEvent('game-data', type, id, data);
  }

  /**
   * Отправляет сокету данные о текущем состоянии игры
   * @param {string} id - socket.id или user.id или table.id
   * @param {object} data - Game Data
   * @param {=string} type - (user, table)
   */
  emitGiftsData(id, data, type) {
    this._emitEvent('gifts-data', type, id, data);
  }

  /**
   * Выполянет отправку на стол, полученного игроком подарка
   * @param {string} tid - id стола
   * @param {string} to - id игрока получившего подарок
   * @param {object} item - подарок, объект который возращет User при получении подарка
   * @private
   */
  _emitReceivedGift(tid, to, item) {
    this._connects.toTable(tid, 'receive-gift', {uid: to, gift: item} );
  }

  /**
   * Отсылает сообщение в чат
   * @param {string} type - 'user' | 'table'
   * @param {string} to -  id пользователя или стола
   * @param {[object, object, ...]} data - массив с объектами сообщений
   */
  emitChatMessage(type, to, data) {
    this._emitEvent('chat-message', type, to, data);
  }

  /**
   * Отправляем событие на клиента
   * @param {string} event - событие
   * @param {string} type - тип, кому шлем, игрок, стол или просто комуто
   * @param {string} id - id того куда шлем
   * @param {*} data - сообщение
   * @private
   */
  _emitEvent(event, type, id, data) {
    switch(type) {
      case 'user':
        return this._connects.toUser(id, event, data);

      case 'table':
        return this._connects.toTable(id, event, data);

      default:
        this._connects.to(id, event, data);
    }
  }

  /**
   * Отправляет клиенту ссобщение об ошибке и отключает его
   * @param socket
   * @param {array} message
   */
  _emitError(socket, message) {
    try {
      if(typeof socket === 'string') {
        socket = this._connects.getSocket(socket);
      }

      if(!socket) return;

      this._emitEvent(
        'error-occurred',
        'socket',
        socket.id,
        message
      );

      setTimeout(() => this._disconnect(socket),1000);
    } catch(e) {

    }
  }

  /**
   *
   * @param {Socket|User} object
   */
  closeApp(object) {
    if( this.isSocket(object) ) {
      object.disconnect(true);
    } else {
      try {
        if(object instanceof User) {
          const sids = Array.from(object.getSockets());

          sids.forEach((sid) => {
            const socket = this._connects.getSocket(sid);
            if(socket) socket.disconnect(true);
          });
        }
      } catch(e) {
        global.warn('Не смог отключить!', object);
      }
    }
  }

  _disconnect(socket){
    if(!socket) return;
    this._connects.remove(socket.id);
    global.log.info(`[Бутылка] Сокет отключен: ${socket.id} |`, `Всего: ${this._connects.count()}`);
  }
}

module.exports = Bottle;