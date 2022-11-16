const Collection = require('../helpers/Collection');
const requests = require('../helpers/serverRequests');

class GiftsList {
  constructor(app){
    this.app = app;
    this._list = new Collection();
    this._categories = {};
  }

  /**
   * Вовращает коллекцию подарков
   * @return {Collection}
   */
  get all() {
    return this._list;
  }

  /**
   * Возарщает объект, список категорий с массивами id подарков
   * @return {{}|*}
   */
  get categories () { return this._categories};

  /**
   * Возвращет весь сисок подарков в виде объекта
   * @return {object} - объект со всеми подарками
   */
  get gifts() {
    const gifts = {};

    this._list.forEach((value, key) => {
      gifts[key] = value;
    });

    return gifts;
  }

  /**
   * Возращает подарок по id
   * @param gid - id подарка
   * @return {{}} - объект подарка
   */
  gift(gid){
    return this._list.get(gid);
  }

  /**
   * Загрузка всех подарков с сервера
   * @return {Promise<void>}
   */
  async loadFromDB() {
    const that = this;
    let gifts;

    gifts = await requests.getGiftList();
    if(!gifts) gifts = require('../res/gifts');

    for(const id in gifts) {
      const gift = {
        id: gifts[id].id + '',
        name: gifts[id].name,
        hit: gifts[id].hit,
        cost: gifts[id].cost,
        grade: gifts[id].grade,
        image: gifts[id].img,
        category: gifts[id].category.split(', ')
      };

      this._list.set(gift.id, gift);

      gift.category.forEach((name) => {
        if(!that._categories[name]) that._categories[name] = [];
        that._categories[name].push(gift.id);
      });
    }
  }

  /**
   * Эмуляция работы серера
   * @return {Promise<unknown>}
   * @private
   */
  __db() {
    return new Promise((resolve) => {
      setTimeout( () => {
        const gifts = {
          1: {
            id: 1,
            name: "Роза",
            hit: 0,
            cost: 2,
            grade: 1,
            image: 'https://cookieapp.ru/img/gifts/1_%D0%A0%D0%BE%D0%B7%D0%B0.png',
            category: ['hot', 'woman']
          },
          4: {
            id: 4,
            name: "Виски",
            hit: 1,
            cost: 2,
            grade: 1,
            image: 'https://cookieapp.ru/img/gifts/8_%D0%92%D0%B8%D1%81%D0%BA%D0%B8.png',
            category: ['man']
          },
          18: {
            id: 18,
            name: "Плетка",
            hit: 1,
            cost: 7,
            grade: 2,
            image: 'https://cookieapp.ru/img/gifts/16_%D0%9F%D0%BB%D1%91%D1%82%D0%BA%D0%B0.png',
            category: ['hot', 'fun']
          }
        };

        resolve(gifts);
      }, 100);
    });
  }
}

module.exports = GiftsList;