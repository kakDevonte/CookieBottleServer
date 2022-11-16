const
  Collection = require('../../helpers/Collection'),
  common = require('../../helpers/common');

const
  giveGift = require('./give-gift'),
  answerGift = require('./answer-gift');
  greetings = require('./greetings');
  goodby = require('./goodby');

/**
 * Класс для общения ботов в чате содерждит методы общения,
 * которые реализуют отправку сообщений в чат, по сложному алгоритму
 * @param {Table} table - стол для которого создается объект класса
 */
class Message {
  constructor(table) {
    this.app = table._app;
    this.chat = table._chat;
    this.game = table._game;
    this.table = table;

    this._messages = new Collection();
    this._phrases = {
      greetings: [],
      goodby: [],
      answerGift: [],
      giveGift: []
    }
  }

  _getPhrase(method, key) {
    if(this._phrases[key].length === 0) {
      this._phrases[key] = generate();
    }
    return method[ this._phrases[key].shift() ];


    function generate() {
      const array = []; let count = method.length;
      while(count--) { array.push(count); }
      return common.shuffleArray(array);
    }
  }

  _message(data, method, key) {
    let result;

    result = this._getPhrase(method, key);
    if(!result) return;
    result = result(data);

    if(this._messages.has(result.id)) return;

    this._messages.set(result.id, result.message);
    if(this._messages.size > 10) this._messages.remove(0, 1);

    if(data.from.user) {
      this.chat.receiveMessage(data.from.user.getId(), result.message);
    }
  }

  greetings(from) {
    const data = common.initSayModule(from);
    const chance = common.randomNumber(0, 100);

    if(chance >  global.setups.bot.message.chanceHello) return;
    this._message(data, greetings, 'greetings');
  }

  goodby(from) {
    const data = common.initSayModule(from);
    const chance = common.randomNumber(0, 100);

    if(chance >  global.setups.bot.message.chanceGoodby) return;
    this._message(data, goodby, 'goodby');
  }

  giveGift(from, to) {
    const data = common.initSayModule(from, to);
    const chance = common.randomNumber(0, 100);

    if(chance >  global.setups.bot.message.chanceGiveGift) return;
    if(data.from.user && data.to.user)
      this._message(data, giveGift, 'giveGift');
  }

  answerGift(from, to) {
    const data = common.initSayModule(from, to);
    const chance = common.randomNumber(0, 100);

    if(chance >  global.setups.bot.message.chanceAnswerGift) return;
    if(data.from.user && data.to.user)
      this._message(data, answerGift, 'answerGift');
  }
}

module.exports = Message;