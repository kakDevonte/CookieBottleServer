const petrovich = require('petrovich');
const common = require('../helpers/common');

const limitMessages = 10;
const limitPersonalMessages = 10;

/*
  male - мужской,
  female - женский,
  androgynous - неопределенный.

Типы имени:
  first - имя,
  last - фамилия,
  middle - отчество.

Падежи:
  nominative - именительный (кто? что?)
  genitive - родительный (кого? чего?)
  dative - дательный (кому? чему?)
  accusative - винительный (кого? что?)
  instrumental - творительный (кем? чем?)
  prepositional - предложный (о ком? о чем?)
 */

/**
 * Игровой чат, принимает сообщения, хранит соообщения стола, и личные соощения
 * инициирует их отправку столу или клиенту, отдает все сообщения
 */
class Chat {
  /**
   * Чат
   * @param {Table} table - игровой стол
   */
  constructor(table) {
    this.table = table;
    this.id = table._id;
    this.app = table.app;

    this._messages = [];
    this._talks = {};
    this._personalMessages = {};
  }

  /**
   *
   * @param {User|Bot} user
   */
  greetingsMessage(user) {
    let message;

    const phrase = common.randomNumber(1, 5);
    const gender = user.getGender();

    switch(phrase) {
      case 1:
        message = `К нам присоединяется ${user.getName()}, попривествуем!`;
        break;

      case 2:
        message = `В игру заходит ${user.getName()}!`;
        break;

      case 3:
        message = `${user.getName()} с нами, поздороваемся!`;
        break;

      case 4:
        message = `И вновь с нами ${user.getName()}!`;
        break;

      case 5:
        message = `К нашему столу примкнул${gender === 'female' ? 'а' : ''} ${user.getName()}!`;
        break;

      default:
        message = '';
    }

    message = {
      id: common.rid() + common.rid(),
      from: {id: 'server-greetings'},
      text: message,
      date: Date.now(),
      to: null,
      notice: false
    };

    this._sendMessage(null, [message]);
  }

  /**
   * Отправляет сообщение в чат о подаренном подарке
   * @param {User|Bot} from
   * @param {User|Bot} to
   * @param {{}} gift
   */
  giftMessage(from, to, gift) {
    let message, toName, special;

    toName = petrovich[to.getGender()].first.dative(to.getName());
    special = gift.cost > 40 ? 'особенный ' : '';
    message = `${from.getName()} дарит ${toName} ${special}подарок - ${gift.name}!`;

    message = {
      id: common.rid() + common.rid(),
      from: {id: 'server-gift'},
      text: message,
      date: Date.now(),
      to: null,
      notice: false
    };

    this._sendMessage(null, [message]);
  }

  messages() {

  }

  /**
   * Возращает разговор игроков, или создает новый
   * @param {string} from - id пользователя
   * @param {string} to - id пользователя
   * @returns {*} - разговор {id, messages, members}
   */
  _getTalk(from, to) {
    let talk, _talk, id;

    talk = this._personalMessages[from];
    _talk = this._personalMessages[to];

    if(!talk) this._personalMessages[from] = {};
    if(!_talk) this._personalMessages[to] = {};

    id = this._personalMessages[from][to];
    if(id) return this._talks[id];

    id = 'tk-' + common.rid();
    while(this._talks[id]) id = 'tk-' + common.rid();

    this._talks[id] = {
      id,
      messages: [],
      members: {}
    };

    talk = this._talks[id];
    talk.members[from] = from;
    talk.members[to] = to;

    this._personalMessages[from][to] = id;
    this._personalMessages[to][from] = id;

    return talk;
  }

  /**
   * @param {string} from - от кого было сообщение
   * @param {string} text - текст сообщения
   * @param {=string} to - кому адресовано, по умолчанию столу
   */
  receiveMessage(from, text, to) {
    try{
      const
        user = this.app.user(from),
        target = this.app.user(to);

      let info = null;

      if(!user) return;
      if(target) info = target.getMessageInfo();

      const message = {
        id: common.rid() + common.rid(),
        from: user.getMessageInfo(),
        text,
        date: Date.now(),
        to: to ? info : null,
        notice: true
      };

      let data;

      if(to) {
        data = this._writePersonalMessage(from, to, message);

        this._sendMessage(from, data);
        this._sendMessage(to, data);
      } else {
        data = this._writeMessage(message);
        this._sendMessage(to, data);
      }
    } catch(e) {
      global.log.error('Нудачное получение сообщения:', from, to, message, e);
    }
  }


  /**
   * Запрос в чат на отправку всех сообщений клиенту
   * @param {=string} personal = id пользователя
   * @return {array} массив сообщений
   */
  requestMessages(personal) {
    let data;

    if(personal) {
      data = this._talks.get(personal);
    } else {
      data = this._messages;
    }

    return data;
  }

  /**
   *
   * @param {string|undefined|null} to - если есть, значит пользователю
   * @param {[]} data - массив сообщений
   * @private
   */
  _sendMessage(to, data) {
    if(to) {
      this.app.emitChatMessage('user', to, data);
    } else {
      to = this.id;
      this.app.emitChatMessage('table', to, data);
    }
  }

  /**
   * @param {{id: string, from:{}, text:string, date:number, to: null|string}} message - обработанное сообщение
   * @returns {[object]} - записанное сообщение в массиве
   * @private
   */
  _writeMessage(message) {
    this._messages.push(message);
    if(this._messages.length > limitMessages) this._messages.shift();

    return [message];
  }

  /**
   * @param {string} from - id пользователя
   * @param {string} to - id пользователя
   * @param {{id: string, from:{}, text:string, date:number, to: null|{}}} message - обработанное сообщение
   * @returns {[object]} - записанное сообщение в массиве
   * @private
   */
  _writePersonalMessage(from, to, message) {
    let talk = this._getTalk(from, to);

    if(talk) {
      talk.messages.push(message);
      if(talk.messages.length > limitPersonalMessages) talk.messages.shift();
    }

    return [message];
  }

  _talkClosed(to, uid) {
    try {
      const user = this.app.user(uid);
      const target = this.app.user(to);

      if(!user) return;
      if(!target) return;

      const data = [{
        id: 'talk-closed',
        from: user.getMessageInfo(),
        text: 'Игрок покинул стол',
        date: Date.now(),
        to: target.getMessageInfo(),
        notice: false
      }];

      this._sendMessage(to, data);
    } catch(e) {
      global.log.error('Неудачное закрытие личного чата:', uid, to, e);
    }
  }

  /**
   * Удаляет личные сообещния пользователя, использовать при его выходе со стола
   * @param uid
   */
  cleanup(uid) {
    const talks = this._personalMessages[uid];

    for(const id in talks) {
      this._talkClosed(id, uid);
      delete this._personalMessages[id][uid];
      delete this._talks[talks[id]];
    }

    delete this._personalMessages[uid];
  }
}

module.exports = Chat;