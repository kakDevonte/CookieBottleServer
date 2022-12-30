const requests = require('../helpers/serverRequests.js');
const db = require('../helpers/dbRequests');

const Collection = require('../helpers/Collection');
const common = require('../helpers/common');

const limitTablesHistory = 2;

/**
 * Создает нового игрока из данных полученных от VK
 * @param vkUserData {{
 *      bdate: string,
        first_name: string,
        id: string,
        last_name: string,
        photo_100: string,
        photo_200: string,
        sex: number,
        timezone: number
        platform: string
     }}
 */

class User {
  constructor(vkUserData) {
    this._incorrect = User._validate(vkUserData);
    this._init(vkUserData);

    this._afk = 0;
    this._kissed = [];
    this._gifted = [];
    this._sockets = new Set();
    this._table = null;
    this._seat = null;

    this._type = 'human';
    this._template = null;

    this._giveGiftCount = 0;
    this._initKissses = 0;
    this._enterCounter = 0;
    this._kissCounter = 0;
    this._cookieCounter = 0;
    this._giftsCounter = {send: 0, receive: 0};
    this._rotatesCounter = {all: 0, manual: 0};
    this._inventory = new Collection();
    this._messages = [];

    this._oldTables = [];

    this._stage = {
      previous: null,
      current: 'connected',
      updated: Date.now(),
    };

    this._roundCounter = 0;
  }

  static _validate(data) {
    const errors = [];

    if(typeof data.id !== 'string') errors.push('Некорректный ID');
    if(typeof data.first_name !== 'string') errors.push('Некорректное имя');
    if(typeof data.last_name !== 'string') errors.push('Некорректная фамилия');
    if(typeof data.sex !== 'number') {
      if(typeof data.sex === 'string') {
        if(!(data.sex === 'male' || data.sex === 'female'))
          errors.push('Некорректный пол');
      } else {
        errors.push('Некорректный пол');
      }
    } else {
      if(!(data.sex === 1 || data.sex === 2))  errors.push('Неверный пол');
    }

    if(typeof  data.platform !== 'string') errors.push('Неизвестная платформа');

    if(errors.length) {
      global.log.warn('Неверные данные пользователя', 'ID: ' + data.id, errors);
      return errors;
    }

    return  false;
  }

  _init(data){
    const genders = {2: 'male', 1: 'female', male: 'male', female: 'female'};

    this._id = data.id;
    this._name = data.first_name;
    this._fullName = data.first_name + ' ' + data.last_name;
    this._lastName = data.last_name;
    this._gender = genders[data.sex];
    this._photo = data.photo_200;
    this._platform = data.platform;
  }

  get infoDB() {
    return {
      id: this._id,
      name: this._name,
      fullName: this._fullName,
      photo: this._photo,
      gender: this._gender,
      template: this._template,
      platform: this._platform
    }
  }

  getInfo() {
    return {
      id: this._id,
      name: this._name,
      fullName: this._fullName,
      photo: this._photo,
      gender: this._gender,
      kissed: this._kissed,
      gifted: this._gifted,
      seat: this._seat,
      type: this._type,
      kissCounter:  this._kissCounter,
      giftsCounter: this._giftsCounter.receive,
      template: this._template
    }
  }

  getPersonalInfo() {
    return {
      enterCounter: this._enterCounter,
      cookieCounter: this._cookieCounter,
      giftsCounter: this._giftsCounter,
      rotatesCounter: this._rotatesCounter,
      kissCounter: this._kissCounter,
      inventory: this.inventory,
      messages: this._messages
    }
  }

  get inventory() {
    return this._inventory.take(0, this._inventory.size);
  }

  getRatingInfo() {
    return {
      id: this._id,
      name: this._name,
      fullName: this._fullName,
      photo: this._photo,
      kisses: 0,
      gifts: 0,
      position: '>1000'
    }
  }

  getMessageInfo() {
    return {
      id: this._id,
      name: this._name,
      fullName: this._fullName,
      photo: this._photo,
      gender: this._gender,
      seat: this._seat
    }
  }

  get exitInfo() {
    let id, sKisses, chance;

    if(this._type === "human") {
      id = this._platform + this._id;
      sKisses = this.sessionKisses;
    } else {
      id = this._platform + this._template;
      chance = common.randomNumber(1, 100);
      sKisses = chance < 20 ? 1 : 0;
      //sKisses = Math.round(this.sessionKisses / 30);
    }

    return {
      id: id,
      kisses: this._kissCounter,
      gifts: this._giftsCounter,
      rotates: this._rotatesCounter,
      sessionGifts: this._giveGiftCount,
      sessionKisses: sKisses,
      platform: this._platform
    }
  }

  get kissed() { return this._kissed; }
  get gifted() { return this._gifted; }
  get kissCounter() { return this._kissCounter; }
  get sessionKisses() { return this._kissCounter - this._initKissses};
  get sessionGiveGifts() { return this._giveGiftCount};
  get incorrect() { return this._incorrect; }
  get enterCounter() { return this._enterCounter; }
  get platform() { return this._platform; }

  /**
   * Возвращает список посещенных столов
   * @returns {[]|Array}
   */
  get tables(){
    return this._oldTables;
  }

  get stageTime() {
    return (Date.now() - this._stage.updated) / 1000;
  }

  get roundCounter() {
    return this._roundCounter;
  }

  /**
   * Проверяет оффлайн ли юзер
   * @param {number} time - текущее время для проверки
   * @returns {boolean}
   */
  isOffline(time) {
    if(this._stage.current === 'table') return false;
    if(this._stage.current === 'tutorial') return time - this._stage.updated > 1800000;
    return time - this._stage.updated > 300000;
  }

  resetAFK() {
    this._afk = 0;
  }

  updateAFK() {
    this._afk++;
    return this._afk;
  }

  addSocket(id) {
    this._sockets.add(id);
  }

  removeSocket(id) {
    this._sockets.delete(id);
    return this._sockets.size === 0;
  }

  getSockets() { return this._sockets; }

  getId() {return this._id;}
  getName() {return this._name;}
  getFullName() {return this._fullName;}
  getPhoto() {return this._photo;}
  getGender() {return this._gender;}
  getType() {return this._type;}
  getStage() {return this._stage;}
  getTable() {return this._table;}
  getSeat() {return this._seat;}

  _updateStage(stage) {
    this._stage.previous = this._stage.current;
    this._stage.current = stage;
    this._stage.updated = Date.now();
  }

  stageLobby() {
    if(this._stage.current === 'lobby') return;

    this._saveOldTable();
    this._table = null;
    this._updateStage('lobby');
  }

  stageTable(tid, merge) {
    if(this._stage.current === 'table' && !merge) return;

    this._table = tid;
    this._updateStage('table');
  }

  stageTutorial() {
    if(this._stage.current === 'tutorial') return;

    this._table = null;
    this._updateStage('tutorial');
  }

  _saveOldTable() {
    if(this._table) {
      this._oldTables.push(this._table);
      if(this._oldTables.length > limitTablesHistory) this._oldTables.shift();
    }
  }

  get cookieCounter() {
    return this._cookieCounter;
  }

  addCookies(count) {
    checkCookieCount(count, 'добавление');
    this._cookieCounter = this._cookieCounter + count;
  }

  spendCookies(count) {
    checkCookieCount(count, 'списание');

    if(this._cookieCounter - count < 0) {
      return false;
    } else {
      this._cookieCounter = this._cookieCounter - count;
      this._giveGiftCount++;
      this._giftsCounter.send++;
      return true;
    }
  }

  getGifts() {
    return this._gifted;
  }

  receiveGift(gift, user) {
    const item = {
      id: gift.id,
      uid: user.getId(),
      name: user.getName(),
      photo: user.getPhoto(),
      date: Date.now()
    };

    this._gifted.push(item);
    this._giftsCounter.receive++;

    return item;
  }

  getKisses(filter) {
    return this._kissed.filter(filter);
  }

  receiveKiss(kiss) {
    this._kissCounter++;
    this._kissed.push(kiss);
  }

  spendGiftFromInventory(id) {
    let item, gid;

    item = this._inventory.get(id);

    if(item) {
      gid = item.gids.shift();
      item.count = item.gids.length;
      this._giveGiftCount++;
      this._giftsCounter.send++;

      if(item.count === 0) this._inventory.delete(id);

      return {id, gid};
    }

    return null;
  }

  getCountGifts() {
    return this._gifted.length;
  }

  getCountKisses() {
    return this._kissed.length;
  }

  putToSeat(index){
    this._roundCounter = 0;
    this._seat = index;
  }

  outSeat() {
    this._seat = null;
  }

  clearKissed() {
    this._kissed = [];
    // здесь можно упаковать историю поцелуев
    // и хранить на сервере
  }

  rotateUp(auto) {
    try {
      if(!auto) this._rotatesCounter.manual++;
      this._rotatesCounter.all++;
    }catch(e) {
      return null;
    }
  }

  clearGifted() {
    this._gifted = [];
  }

  roundUp() {
    this._roundCounter++;
  }

  roundReset() {
    this._roundCounter = 0;
  }

  async checkUpdateCookieCounter() {
    const data = await requests.getUserData(this._id);

    if(!data) return false;
    if(this._cookieCounter === Number(data.cookie)) return false;

    this._cookieCounter = Number(data.cookie);

    return this._cookieCounter;
  }

  async loadFromDB(guest) {
    const data = await requests.getUserData(this._id);
    const player = await db.userEnter(this.infoDB, guest);

    if(data && player) {
      let inventory = new Collection(), gift;

      data.inventory.forEach( (item) => {
        const
          id  = item.id  + '',
          gid = item.relation_id + '';

        gift = inventory.get(id);
        if(!gift) gift = {id, count: 0, gids: []};

        gift.gids.push(gid);
        gift.count++;

        inventory.set(id, gift);
      });

      this._cookieCounter = data.cookies;
      this._inventory = inventory;
      this._enterCounter = player.enters.count;
      this._giftsCounter = player.gifts;
      this._rotatesCounter = player.rotates;

      this._kissCounter = player.kisses;
      this._initKissses = player.kisses;

      //this._messages = response.messages;
      //this._gifts = response.gifts;

      return true;
    }
  };
}

function checkCookieCount(count, action) {
  count = Number(count);
  if( isNaN(count) ) return global.log.warn('Печеньки не валидны', action);
  return count;
}

module.exports = User;