const db = require('../helpers/dbRequests');

const
  Collection = require('../helpers/Collection'),
  User = require('./User'),
  Bot = require('./Bot'),
  requests = require('../helpers/serverRequests');

class UsersList {
  /**
   * Хранит список подключенных к игре пользователей и взаимодействует с ними
   * @param app {App};
   */
  constructor(app) {
    this._app = app;
    this._countRobots = 0;
    this._users = new Collection();
    this._inLobby = {
      male: new Collection(),
      female: new Collection()
    };

    this._lobbyWatcherId = null;
  }

  get app() {
    return this._app;
  }

  /**
   * @param uid {string} user id
   */
  get(uid) {
    const user = this._users.get(uid);
    return user ? user.user : null;
  }

  /**
   * Создает нового игрока из данных полученных от VK, или же возвращает существующего
   * @param {string} sid - socket id
   * @param guest {{
   *    bdate: string,
        first_name: string,
        id: string,
        last_name: string,
        photo_100: string,
        photo_200: string,
        sex: number,
        timezone: number
     }} - данные из вКонтакте
   */
  addUser(sid, guest, token) {
    let exist, user;

    try {
        user = this._users.get(guest.id);

      if(user){
        user = user.user;
        exist = true;
      } else {
        user = new User(guest);
        exist = false;

        if(user.incorrect) {
          throw new Error('Данные не приняты');
        }

        this._users.set(guest.id, {
          user: user
        });
      }

      user.addSocket(sid);
      user.setToken(token);

      return {exist, user};
    }catch(e) {
      global.log.warn(e);
      return {exist: null, user: null, errors: user.incorrect};
    }
  }

  addBot(gender, exclude) {
    let
      bot = Bot.generateBot(this._app, gender, exclude),
      uid = bot.getId();

    while(this._users.has(uid)) {
      bot = Bot.generateBot(this._app, gender, exclude);
      uid = bot.getId();
    }

    db.userEnter(bot.infoDB, this._app._bots.getInfo(bot.template)).then((player) => {
      bot._kissCounter = player.kisses;
    });

    this._users.set(uid, {
      user: bot
    });

    this._countRobots++;
    return bot;
  }

  _comeToLobby(uid) {
    const
      user = this._users.get(uid).user,
      gender = user.getGender();

    this._inLobby[gender].set(uid, user);
    user.stageLobby();
  }

  removeBots(list) {
    let count = 0;

    if(!list.next){
      list = [list];
    }

    for(const uid of list) {
      if(this.removeBot(uid)) {
        count++;
        this._countRobots--;
      }
    }

    return count;
  }

  removeBot(bot) {
    if(typeof bot === 'string')
      bot = this.get(bot);

    const exitInfo = bot.exitInfo;

    if(bot instanceof Bot) {
      bot.clearTimeouts();
      this._users.delete(bot.getId());
      this._countRobots--;
      //console.log('Бот удален:', bot.getName());
      db.userExit(exitInfo);

      return true;
    }
  }

  remove(uid) {
    const user = this.get(uid);
    const exitInfo = user.exitInfo;

    //this._outFromLobby(uid);
    //this._removeFromUsers(uid);
    this._users.delete(uid);

    db.userExit(exitInfo);
    //requests.sendKisses(uid, exitInfo.platform, exitInfo.kisses);

    //console.log('Пользователь удален из списка!');
  }

  _outFromLobby(uid) {
    const user = this._users.get(uid).user;

    if(user) return this._inLobby[user.getGender()].delete(uid);
  }

  _removeFromUsers(uid) {
    return this._users.delete(uid);
  }
}

module.exports = UsersList;