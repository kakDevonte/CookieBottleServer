const Bot = require('slimbot');

class TelegramBot {
  constructor() {
    this._bot = null;
    this._token = process.env.TELEGRAM_BOT_TOKEN;
    this._chat = process.env.TELEGRAM_CHAT_ID;
    this._mode = process.env.NODE_ENV;

    this._socks5proxy = {
      socksHost: '212.83.179.140', //required
      socksPort: '48697', //required
      socksUsername: "", //optional
      socksPassword: ""
    };

    if(this._token && this._chat) {
      this._bot = new Bot(this._token);
    }
  }

  restartMessage(info, version) {
    const message = "Перезапуск сервера! Тип: " + info + ' v.' + version;

    this._send(message);
  }

  errorMessage(message) {
    this._send("Ошибка: " + message);
  }

  _send(message) {
    if(this._mode === "development") return;
    if(!this._bot) return;

    this._bot.sendMessage(
      this._chat,
      message,
      {parse_mode: "HTML"},
      function(err){
        if(err) global.log.error(err);
      });
  }

}

module.exports = new TelegramBot();