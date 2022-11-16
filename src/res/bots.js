const
  fs = require('fs'),
  path = require('path'),
  Collection = require('../helpers/Collection'),
  common = require('../helpers/common');

class TemplatesBot{
  constructor() {
    this._list = {
      male: [],
      female: []
    };

    this._templates = new Collection();
    this._maleQueue = new Collection();
    this._femaleQueue = new Collection();

    this._init();
  }

  _init() {
    const
      that = this,
      text = fs.readFileSync(path.join(__dirname, 'bots.csv'), 'utf-8').split('\r\n');

    let
      genders = [0, 'female', 'male'],
      keys = [];

    text.forEach((string, index) => {
      let gender = '', bot = {};
      string = string.split(';');

      if(index === 0) {
        keys = string;
      } else {
        if(string[0] === '') return;

        keys.forEach((key, n) => {
          if(key === 'sex') {
            string[n] = Number(string[n]);
            gender = genders[string[n]];
          }
          bot[key] = string[n];
        });

        that._list[gender].push(bot.id);
        that._templates.set(bot.id, bot);
      }
    });
  }

  _createQueue(gender) {
    const
      that = this,
      queue = gender === 'male' ? this._maleQueue : this._femaleQueue;

    common.shuffleArray(this._list[gender]).forEach((id) => {
      queue.set(id, that._templates.get(id));
    });
  }

  /**
   * Возвращет информацию по боту
   * @param id - оригинаьный id бота
   * @return {{id, first_name, last_name, sex, bdate, photo_200}}
   */
  getInfo(id) {
    return this._templates.get(id);
  }

  /**
   *
   * @param {String} gender
   * @param {=Collection} exclude
   * @return {*}
   */
  getTemplate(gender, exclude) {
    const queue = gender === 'male' ? this._maleQueue : this._femaleQueue;
    let template, res = true;

    if(queue.size === 0) this._createQueue(gender);
    if(!exclude) return queue.extract(0, 1)[0];

    while(res) {
      if(queue.size === 0) this._createQueue(gender);
      template = queue.extract(0, 1)[0];
      [res] = exclude.findOne(template.id, 'template');
    }

    return template;
  }
}

module.exports = TemplatesBot;