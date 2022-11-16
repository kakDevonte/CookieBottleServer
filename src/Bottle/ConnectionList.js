const
  Collection = require('../helpers/Collection'),
  Table = require('./Table'),
  User = require('./User');

class ConnectionList {
  /**
   * @param app {Bottle}
   */
  constructor(app) {
    this._app = app;
    this._io = app.io;
    this._list = new Collection();
    this._userList = app._usersList;
    this._tableList = app._tablesList;
  }

  get app() {
    return this._app;
  }

  /**
   * Возаращает сокет по id
   * @param sid - id сокета
   * @return {Socket | tls.TLSSocket}
   */
  getSocket(sid) {
    const connect = this._list.get(sid);

    if(connect) return connect.socket;
    return null;
  }

  /**
   *  Возаращает запись о соединении
   * @param sid - id сокета
   * @return {{socket, uid}}
   */
  getConnect(sid) {
    return this._list.get(sid);
  }

  /**
   * @param socket {Socket}
   */
  add(socket) {
    this._list.set(socket.id, {
      socket: socket,
      uid: null,
      created: Date.now()
    });
  }

  /**
   * @param sid {string} socket id
   * @param uid {string} user id
   */
  applyUID(sid, uid) {
    const connect = this._list.get(sid);
    if(connect) connect.uid = uid;
  }

  /**
   * @param sid {string} Socket.id
   */
  remove(sid) {
    const user = this.getUser(sid);

    if(user && user.removeSocket(sid)) {
      const tid = user.getTable();

      if(tid) {
        const table = this._tableList.table(tid);

        if(table) {
          table.userExit(user);
          this._app.sendPlayers(tid);
        }
      }

      this._userList.remove(user.getId());
    }

    this._list.delete(sid);
    //global.log.info('Сокет отключен! SID:', sid);
  }

  getUser(sid) {
    const socket = this._list.get(sid);

    if(socket && socket.uid) return this._userList.get(socket.uid);
    return null;
  }

  getUID(sid) {
    const socket = this._list.get(sid);

    if(!socket) return;
    return socket.uid;
  }

  count() {
    return this._list.size;
  }

  log(message) {
    const sid = this._list.keys().next().value;

    this._io.to(sid).emit('console', message);
  }

  to(sid, event, message) {
    this._io.to(sid).emit(event, message);
  }

  /**
   * @param {User|string} user
   * @param {string} event
   * @param message
   */
  toUser(user, event, message) {
    if(user instanceof User) user = user.getId();
    if(!user) return;

    this._io.to('user_' + user).emit(event, message);
  }

  /**
   * @param {Table|string} table
   * @param {string} event
   * @param message
   */
  toTable(table, event, message) {
    if(table instanceof Table) table = table.getId();
    if(!table) return;

    this._io.to('table_' + table).emit(event, message);
  }

  /**
   * @param {[]|Set|Map} list
   * @param {string} room
   */
  leaveRoom(list, room) {
    this._room('leave', list, room);
  }

  /**
   * @param {[]|Set|Map} list
   * @param {string} room
   */
  joinRoom(list, room) {
    this._room('join', list, room);
  }

  _room (action, sockets, room) {
    sockets.forEach((sid) => {
      const connect = this._list.get(sid);
      if(!connect) return;

      if(action === 'join') connect.socket.join(room);
      if(action === 'leave') connect.socket.leave(room);
    });
  }
}

module.exports = ConnectionList;