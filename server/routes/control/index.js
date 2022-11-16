const
  router = require('express').Router(),
  render = require('./../../helpers/render'),
  date = require('../../helpers/date'),
  Bottle = global.Bottle,

  User = require('./../../models/user').User;

let sendData;

///////////////////////////////////////// Routes

router.get('/control/', function (req, res, next){
  sendData = {};
  sendData.errors = [];

  if(req.query.section) {
    switch(req.query.section) {
      case 'sockets':
        sendData = sockets();
        break;

      case 'reload-table':
        sendData = reloadTable(req.query.tid);
        break;


      case 'state-info':
        sendData = stateInfo(req.query.tid);
        break;
    }
  }else {
    sendData = index();
  }

  renderPage(req, res, next);
});

///////////////////////////////////////// Functions

function renderPage(req, res){
  sendData.typePage = 'control';
  sendData.user = req.User;
  sendData.title = "Главная";

  render(res, 'index', sendData);
}

function stateInfo(tid) {
  const table = Bottle.table(tid);
  let data = {};

  if(table) {
    try {
      data.states =  table._game._stateHistory.join('<br/>');
    }catch(e) {
      console.log(e);
      data.states =  'Fail show info';
    }
  } else {
    data.states =  'No table!';
  }

  return data;
}


function reloadTable(tid) {
  const table = Bottle.table(tid);
  let data = {};

  if(table) {
    try {
      table.game.nextRound('admin - reload');
      data.reloadResult =  'Reload ' + tid + ' complete!';
    }catch(e) {
      console.log(e);
      data.reloadResult =  'Reload ' + tid + ' fail!';
    }
  } else {
    data.reloadResult =  'No table!';
  }

  return data;
}

function sockets(){
  let data = {sockets: []};
  let sid, socket, rooms, user, connect, uid, created;

  const connects = Bottle._io;

  for(sid in connects.sockets) {
    socket = connects.sockets[sid];
    rooms = '';
    user = '';
    uid = '';
    created = '';

    Object.keys(socket.rooms).forEach((room) => {
      try {
        rooms += room + ', ';

        if(room.indexOf('user') !== -1) {
          user = Bottle.user(room.split('_')[1]);
          user = user ? user.getStage() : null;
        }
      } catch(e) {
        console.log('Не смог сформировать список комнат');
      }
    });

    connect = Bottle._connects.getConnect(sid);
    if(connect) {
      uid = connect.uid;
      created = date.normalize(connect.created, true);
    }

    data.sockets.push({
      id: sid,
      connected: socket.connected,
      rooms: rooms,
      user: user,
      connectInfo: uid + ', ' + created
    });
  }

  return data;
}

function index() {
  let data = {tablesList: []};
  let sockets = 0;
  let realUsers = 0;

  Bottle._usersList._users.forEach((user) => {
    try {
      if(user && user.user) {
        sockets += user.user._sockets.size;
      }
    }catch(e) {
      console.log('Не собрать сокеты', user, e);
    }
  });

  Bottle._tablesList._list.forEach((table) => {
    table = table.table;
    realUsers += table._users.size;

    data.tablesList.push({
      id: table._id,
      round: table._game._round,
      players: [table._users.size, table._players.size],
      state: table._game._state
    });
  });

  data.countConnects = Bottle._connects._list.size;
  data.countTables = Bottle._tablesList._list.size;
  data.countPlayers = Bottle._usersList._users.size;
  data.countUsers = Bottle._usersList._users.size - Bottle._usersList._countRobots;
  data.countUsersOnTables = realUsers;

  return data;
}


module.exports = router;