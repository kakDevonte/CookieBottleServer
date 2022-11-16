const User = require('./User');
const common = require('../helpers/common');
const requests = require('../helpers/serverRequests');
const Collection = require('../helpers/Collection');

class Bot extends User {
  constructor(app, info) {
    super(
      {
        bdate: info.bdate,
        first_name: info.first_name,
        id: info.id,
        last_name: info.last_name,
        photo_100: info.photo,
        photo_200: info.photo,
        sex: info.sex,
        timezone: common.randomNumber(1, 5),
        platform: 'bot'
      });

    this.app = app;
    this.table = null;
    this.say = null;

    this._type = 'robot';
    this._template = info.tempalate;

    this._roundLimit = common.chance(global.setups.bot.rounds);
    this._giftChance = common.chance(global.setups.bot.startChanceGift);
    this._giveGifts = [];

    this._timeouts = new Collection();
  }


  get template() { return this._template; }
  get game() {
    if(!this._table) return null;
    return this.app.game(this._table);
  }

  updatePlayers(){
    return this.app.sendPlayers(this._table);
  }

  stageLobby() {
    super.stageLobby();
    this.table = null;
  }

  stageTable(tid) {
    super.stageTable(tid);
    this.table = this.app.table(tid);
    this.updatePlayers();

    this._timeouts.set('say-greetings', setTimeout(
      () => { this.say.greetings(this) },
      common.randomNumber(15, 30) * 1000
    ));
  }

  /**
   * Снимает таймауты поцелуя и вращения печеньки
   */
  clearTimeouts() {
    this._timeouts.forEach( (timeout) => {
      clearTimeout(timeout);
    });
    this._timeouts.clear();
  }

  /**
   * Робот делает поцелуй другово игрока, через случайный интервал времени
   * @param {boolean} active - это активный игрок или целевой
   * @param {number} round - раунд игры, когда был запрос
   */
  kissPlayer(active, round) {
    let kiss, another;
    const game = this.game;

    kiss = true;
    //console.log('Робот', this.getName(), this.getId(), 'целует');

    if(game) {
      another = game.getAnotherPlayer(active)._type;
      if(another === 'robot') kiss = !!common.randomNumber(0, 1);
    }

    this._timeouts.set('kiss', setTimeout(
      () => {
        this.app.receiveKissResult(kiss, {tid: this.getTable(), uid: this._id, round: round}, active, true);
      },
      common.randomNumber(100, 500) * 10
    ));
  }

  /**
   * Робот запускает вращение печеньки, через случайный интервал времени
   */
  rotateRoulette() {
    //console.log('Робот', this.getName(), this.getId(), 'крутит рулетку');

    this._timeouts.set('rotate', setTimeout(
      () => { this.app.startRotateCookie(this.getTable()) },
      common.randomNumber(50, 250) * 10
    ));
  }

  receiveKiss(kiss) {
    this._giftChance += 2;
    super.receiveKiss(kiss);
  }

  receiveGift(gift, user) {
    this._roundLimit += 2;
    this._giftChance += parseInt(gift.cost / 2, 10);

    this._timeouts.set('say-answer-gift', setTimeout(
      () => {
        this.say.answerGift(this, user)
      },
      common.randomNumber(20, 60) * 1000
    ));

    return super.receiveGift(gift, user);
  }

  roundUp() {
    super.roundUp();

    this._keepPlay();
    if(this._roundLimit <= this._roundCounter) return this._leave();
    this.sendGift();
  }

  _keepPlay() {
    if( !this.table.isAllowLeave(this._gender) ) {
      if(common.randomNumber(0, 100) > global.setups.bot.chanceKeepPlay) this._roundLimit++;
      //else console.log(this._name, this._roundLimit - this._roundCounter);
    }else{
      if(this._id !== this.table.specialBot) {
        this._roundLimit -= common.chance(global.setups.bot.decreaseRounds);
      }
    }
  }

  _leave() {
    this.say.goodby(this);

    this._timeouts.set('leave', setTimeout(
      () => {
        this.app.table(this._table).botExit(this._id);
        this.app.sendPlayers(this._table);
      },
      common.randomNumber(10, 50) * 100
    ));
  }

  sendGift() {
    const that = this;
    const chance = common.randomNumber(0, 100) + (this._giveGifts.length * 2);

    if(this._giftChance >= chance) {
      this._timeouts.set('gift', setTimeout(
        giveGift,
        common.randomNumber(10, 100) * 100
      ));

      this._roundLimit += 2;
    } else {
      this._giftChance += common.chance(global.setups.bot.encreaseChanceGift);
    }

    //console.log(this._name, this._roundCounter, this._giftChance, chance);

    function giveGift() {
      const
        table = that.app.table(that._table),
        seats = [].concat(table.seats);

      let user, category, gift, item;

      user = that._selectTargetGift(table, seats);

      if(user) {
        try{
          [gift, category] = that._selectGift(user, that.app._giftsList.categories);

          //console.log(gift.name, category);
          //console.log(that._name, '->', user._name, user._type);

          that.say.giveGift(that, user);

          that._lastGift = gift;
          item = user.receiveGift(gift, that);
          that.app._emitReceivedGift(that._table, user.getId(), item);
          that.app.table(that._table).chat.giftMessage(that, user, gift);
          that._giftChance -= (common.chance(global.setups.bot.decreaseChanceGift) + (gift.cost * 2));
          that._giveGifts.push(that._roundCounter);

          if(common.randomNumber(0, 100) < 10) that._giveGiftCount++;

          //console.log(that._name, that._giveGifts, 'В среднем: ' + (that._roundCounter / that._giveGifts.length).toFixed(1));

          requests.sendGift({id: gift.id, gid: null}, that, user);
        } catch(e) {
         console.log('Робот не смог подарить подарок', e);
        }
      }
    }
  }

  _selectTargetGift(table, seats) {
    const
      that = this,
      countUsers = table.countUsers(),
      countBots = table.countBots();

    let chance, randomChance, uid, max = 0;
    let users = {};

    uid = null;
    chance = common.randomNumber(0, 100);
    randomChance = countBots >= countUsers ? global.setups.bot.chanceRandomOnBots : global.setups.bot.chanceRandomOnUsers;

    // если ботов больше то шанс на рандом выше,
    // проверяем попали ли в рандом
    if(randomChance > chance) {

      // рандомный выбор цели для подарка
      while(uid === null || uid === this._id) {
        uid = common.randomFromArray(seats);
      }

      return this.app.user(uid);
    } else {
      table.players.forEach( (user, uid) => {
        try {
          if(uid === that._id) return;
          let rating = global.setups.bot.rating.start, index;

          rating += user.kissed.length;
          rating += user.gifted.length;

          if(that._gender !== user.getGender()) rating += global.setups.bot.rating.gender;

          if(user.enterCounter && user.enterCounter < global.setups.bot.rating.enterCount) rating += global.setups.bot.rating.enter;

          if(user.roundCounter < global.setups.bot.rating.roundCountMin[0]) rating += global.setups.bot.rating.roundCountMin[1];
          if(user.roundCounter > global.setups.bot.rating.roundCountMax[0]) rating += global.setups.bot.rating.roundCountMax[0];

          if(user.kissCounter < global.setups.bot.rating.kissCountMin[0]) rating += global.setups.bot.rating.kissCountMin[1];
          if(user.kissCounter > global.setups.bot.rating.kissCountMax[0]) rating += global.setups.bot.rating.kissCountMax[1];

          if(user.cookieCounter > global.setups.bot.rating.cookieCount[0]) rating += global.setups.bot.rating.cookieCount[1];

          index = that._kissed.length;
          while(index--) {
            if(that._kissed[index].from === uid) {
              rating += global.setups.bot.rating.kiss;
            }
          }

          index = that._gifted.length;
          while(index--) {
            if(that._gifted[index].uid === uid) {
              rating += Math.round(that.app.gift(that._gifted[index].id).cost / global.setups.bot.rating.giftFrom);
            }
          }

          index = user.gifted.length;
          while(index--) {
            if(user.gifted[index].uid === that._id) {
              rating -= Math.round(that.app.gift(user.gifted[index].id).cost) * global.setups.bot.rating.giftTo;
            }
          }

          users[uid] = rating;
        } catch(e) {
          console.log('Не смог посчитать рейтинг игрока, для подарка');
        }
      });
    }

    for(let id in users) {
      if(users[id] > max) {
        max = users[id];
        uid = id;
      }
    }

    //console.log(this._name, users);
    return this.app.user(uid);
  }

  _selectGift(user, categories) {
    let gender, category, gid, gift;

    category = common.randomFromArray(Object.keys(categories));
    gender = user.getGender();

    if(category === 'man' || category === 'woman') {
      if(category === 'man' && gender === 'female') {
        category = 'woman';
      }
      if(category === 'woman' && gender === 'male') {
        category = 'man';
      }
    } else if(category === 'hot') {
      category = 'fun';
    }

    gid = common.randomFromArray(categories[category]);
    gift = this.app.gift(gid);

    if(user.getType() === 'human') {
      if(/Протухшее яйцо|Какаха|Помидор/.test(gift.name)) {
        return this._selectGift(user, categories);
      }

      if(/Кокошник/.test(gift.name) && gender === 'male') {
        return this._selectGift(user, categories);
      }
    }

    return [gift, category];
  }

  /**
   * Создает инфо для бота, из списка с шаблономи ботов
   * @param {App} app - главный класс
   * @param {string} gender - пол бота (male | female)
   * @param {Collection} excludeList - список ботов со стола
   * @return { {id, first_name, last_name, photo, sex, template} }
   */
  static generateInfo(app, gender, excludeList) {
    const templates = app.bots;
    const template = templates.getTemplate(gender, excludeList);

    let info = {};

    info.id = common.rid();
    info.first_name = template.first_name;
    info.last_name = template.last_name;
    info.bdate = template.bdate;
    info.photo = template.photo_200;
    info.sex = template.sex;
    info.tempalate = template.id;

    return info;
  }

  /**
   * Создает бота заданного пола
   * @param {App} app main server app
   * @param {string} gender  male | female
   * @param {Collection} exclude - список ботов которые уже есть за столом
   * @returns {Bot}
   */
  static generateBot(app, gender, exclude){
    const info = Bot.generateInfo(app, gender, exclude);
    return new Bot(app, info);
  }
}

module.exports = Bot;