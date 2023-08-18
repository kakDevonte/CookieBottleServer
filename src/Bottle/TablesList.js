const
  Table = require('./Table'),
  Collection = require('../helpers/Collection');

const common = require('../helpers/common');

class TablesList {
  /**
   *
   * @param {Bottle} app
   */
  constructor(app) {
    this._app = app;
    this._incomplete = new Collection();
    this._complete = new Collection();
    this._list = new Collection();
    this._importantList = new Collection();
    this._usersList = app._usersList;
  }

  get app() { return this._app; }

  /**
   * Переносит стол в список полных столов
   * @param {string} tid
   * @param {Table} table
   */
  nowComplete(tid, table){
    this._incomplete.delete(tid);
    this._complete.set(tid, table);
  }

  /**
   * Переносит стол в список неполных столов
   * @param {string} tid
   * @param {Table} table
   */
  nowIncomplete(tid, table){
    this._complete.delete(tid);
    this._incomplete.set(tid, table);
  }

  /**
   * Добавляет или удаляет стол из списка приоритетных
   * @param {string} tid - id стола
   * @param {=Table} table - без него для удаления
   */
  importantTable(tid, table) {
    if(table) {
      this._importantList.set(tid, table);
    } else {
      this._importantList.delete(tid);
    }
  }

  createTable() {
    const tid = this._generateTableId();
    const table = new Table(tid, this);

    this._list.set(tid, {
      table
    });

    this._incomplete.set(tid, table);

    return table;
  }

  getTable() {
    return this._list;
  }

  _generateTableId() {
    let tid = common.rid();

    while(this._list.has(tid)) {
      tid = common.rid();
    }

    return tid;
  }

  remove(table) {
    let tid = table;

    this.table(tid).lock('delete');

    setTimeout(
      () => {
        if(tid instanceof Table) {
          tid = table.getId();
        }

        this._list.delete(tid);

        this._incomplete.delete(tid);
        this._complete.delete(tid);

        global.log.other('[Бутылка] Стол удален', tid);
      },
      10000
    );
  }

  table(tid) {
    const table = this._list.get(tid);

    if(table) return table.table;
  }

  isUserAtTables(user) {
    for (const _table of this._incomplete.values()) {
      console.log(_table.isUserAtTable(user.getId()));
      if (_table.isUserAtTable(user.getId())) return true;
    }
    return false;
  }

    /**
   * Подбирает подходящий стол игроку или создает новый
   * @param {User|Bot} user
   * @returns {Table}
   */
  getFreeTable(user) {
    let table, gender, exclude;

    gender = user.getGender();
    exclude = user.tables;

    for(const _table of this._incomplete.values()) {
      if(_table.isLock()) continue;
      if(isExcluded(_table, exclude)) continue;
      if(_table.isUserAtTable(user.getId())) continue;

      if(_table.isGroupIncomplete(gender)) {
        table = _table;
        break;
      }
    }
    if(table)

    if(table) return table;
    return this.createTable();

    ////////////////////////////////////////

    /**
     * @param {Table} table
     * @param {Array} list
     * @returns {boolean}
     */
    function isExcluded(table, list) {
      if(!list) return false;

      let length = list.length;

      while(length--) {
        if(table.getId() === list[length]) return true;
      }

      return false;
    }
  }

  findMergeTable(table) {
    const players = {
      all: table.countUsedSeats(),
      male: table.countUsers('male'),
      female: table.countUsers('female')
    };

    let result;

    for(const _table of this._incomplete.values()) {
      if(_table.isLock()) continue;
      if(players.all > _table.countEmptySeats()) continue;
      if(players.male > _table.countEmptySeats('male')) continue;
      if(players.female > _table.countEmptySeats('female')) continue;
      if(_table._id === table._id) continue;

      result = _table;
      break;
    }

    if(result) this._prepareMergeTables(table, result);
  }

  _prepareMergeTables(from, target) {
    try {
      const
        tidOld = from.getId(),
        tidNew = target.getId();

      from.lock('merge');
      target.lock('merge');

     from.clearFromBots().then((result) => {
       if(result) {
         global.log.other('---> Объединяем:', tidOld, ' -> ', tidNew);
         this._merge({table: from, tid: tidOld}, {table: target, tid: tidNew});
       } else {
         this._abortMerge(from, target);
       }
     });
    } catch(e) {
      global.log.error('Неуданчый мерджинг', e);
      this._abortMerge(from, target);
    }
  }

  /**
   * Нужен при отмене объедениения, ошибках и т.п.
   * разблокирует стол, и проверяет стол на добавление ботов
   * @param {Table} from
   * @param {Table} target
   * @private
   */
  _abortMerge(from, target) {
    if(from) {
      from.unlock('merge');
      from.prepareCheckPlayers();
    }
    if(target) {
      target.unlock('merge');
      target.prepareCheckPlayers();
    }
  }

  /**
   * Пересаживает игрока с одного стола на другой
   * @param {{table: <Table>, tid: <string>}} from
   * @param {{table: <Table>, tid: <string>}} target
   */
  _merge(from, target) {
    try{
      //from.table.lock('delete');

      const transfer = from.table.users.take(0, 8);

      transfer.forEach((user) => {
        try {
          if(!user) return;
          const sockets = user.getSockets();

          this.app._connects.leaveRoom(sockets, 'table_' + from.tid);
          from.table.userExit(user, true);

          global.log.other('---> Покинул стол и пересаживается', user.getName(), user.getId());

          target.table.putUser(user);
          user.stageTable(target.tid, true);

          this.app._connects.joinRoom(sockets, 'table_' + target.tid);
          this.app._connects.toTable(target.tid, 'put-table', {uid: user.getId(), tid: target.tid});

          this.app.sendPlayers(target.tid);
          this.app.emitGameData(user.getId(), target.table.game.data, 'user');
          target.table.chat.greetingsMessage(user);

          global.log.other('---> Пересажен:', user.getName(), user.getId());
        } catch(e) {
          if(user) global.log.error('Не смог пересадить кого-то', e);
          global.log.warn('Не смог пересадить кого-то', e);
        }
      });

      target.table.unlock('merge');
      target.table.prepareCheckPlayers();

    } catch(e) {
      this._abortMerge(from.table, target.table);
      global.log.error('Неудачное объединение:', from.tid, target.tid, e);
    }
  }
}

module.exports = TablesList;