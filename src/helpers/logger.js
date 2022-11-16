const fs = require('fs');
const Path = require('path');
const Collection = require('./Collection');

class Logger{
  constructor() {
    this._logs = {
      error: new Collection(),
      warn: new Collection(),
      info: new Collection(),
      debug: new Collection(),
      other: new Collection(),
    };

    this._max = {
      error: 5,
      warn: 25,
      info: 1000,
      debug: 250,
      other: 1000,
    };

    this._bot = null;

    this._config = {
      debug: process.env.LOGS_DEBUG !== 'true',
      info: process.env.LOGS_INFO !== 'true',
      other: process.env.LOGS_OTHER !== 'true',
      warn: process.env.LOGS_WARN !== 'true'
    };
  }

  /**
   * Позволяет использовать бота для отправки сообщений
   * @param {TelegramBot} bot
   */
  connectTelegramBot(bot) {
    this._bot = bot;
  }

  /**
   * Путь к лог файлу
   * @param {string} name - имя лог файла
   * @return {string}
   */
  static path(name) {
    return Path.join(__dirname, '../../logs/' + name + '.log');
  }

  /**
   * Обработчки события для сохранения лога
   * @param {string} event - тип события
   * @param {array} args - массив данных
   * @private
   */
  _event(event, args) {
    const date = new Date(Date.now()).toLocaleString();
    let result, i, length, o, text;

    result = '[' + date + '] - ';

    for(i = 0, length = args.length; i < length; i++) {
      o = args[i];

      if(o instanceof Error) {
        text = o.message + '\n' + o.stack + '\n\n';
      } else {
        if(typeof o === 'object') {
          text = this._convertObjectToText(o);
        } else {
          text = o + ' ';
        }
      }

      result += text;
    }

    this._write(event, date, result);
  }

  _convertObjectToText(o) {
    if(o.status && o.headers && o.config) {
      try {
        return `status: ${o.status}
        statusText: ${o.statusText}
        headers: ${o.headers}
        url: ${o.config.url}
        method: ${o.config.method}
        r-data: ${o.config.data}
        data: ${o.data}`;
      }catch(e) {
        this.warn('Собираем данные запроса', e);
      }
    } else {
      try {
        return JSON.stringify(o) + ' ';
      }catch(e) {
        console.warn('Конвертация ошибки в JSON', e);
      }
    }
  }

  /**
   * Записывает событие в колекцию, при достижении лимта перезаписывает лог файл, очищая коллекцию
   * @param {string} type - тип лога
   * @param {*} key - ключ для коллекции
   * @param {string} data - то, что сохраняем
   * @private
   */
  _write(type, key, data) {
    const log = this._logs[type];
    let text;

    log.set(key, data);

    if(log.size > this._max[type]) {
      text = [...log.values()];

      fs.writeFileSync(Logger.path(type), text.join('\n'));
      log.clear();
    }
  }

  /**
   * Сохраняет логи в файл
   * @param type
   * @private
   */
  _save(type) {
    let text = [...this._logs[type].values()];
    let file = '';

    if(type === 'error') file = fs.readFileSync(Logger.path(type), 'utf-8');

    text = file + text.join('\n');
    fs.writeFileSync(Logger.path(type), text);
  }

  /**
   * Перезаписывает все логи
   */
  save() {
    this._save('error');
    this._save('debug');
    this._save('warn');
    this._save('info');
    this._save('other');
  }

  error() {
    const args = [...arguments];

    console.error.apply(null, args);
    this._event('error', args);
    if(this._bot) this._bot.errorMessage(arguments[0]);
  }

  debug() {
    if(this._config.debug) return;
    const args = [...arguments];

    console.debug.apply(null, args);
    this._event('debug', args);
  }

  info() {
    if(this._config.info) return;
    const args = [...arguments];

    console.info.apply(null, args);
    this._event('info', args);
  }

  warn() {
    if(this._config.warn) return;
    const args = [...arguments];

    console.warn.apply(null, args);
    this._event('warn', args);
  }

  other() {
    if(this._config.other) return;
    const args = [...arguments];

    console.log.apply(null, args);
    this._event('other', args);
  }
}

module.exports = Logger;
