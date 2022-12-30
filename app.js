require('dotenv').config();

const _version = '1.0064';

const Setup = require('./server/models/setup').Setup;
const Logger = require('./src/helpers/logger'); global.log = new Logger();
//const telegramBot = require('./src/helpers/TelegramBot'); global.log.connectTelegramBot(telegramBot);
const terminate = require('./src/helpers/terminate');

const ioOptions = {
  pingInterval: process.env.SOCKET_INTERVAL ? Number(process.env.SOCKET_INTERVAL) : 25000,
  pingTimeout: process.env.SOCKET_TIMEOUT ? Number(process.env.SOCKET_TIMEOUT) : 5000,
};

const ACCESS = {
  domains: {
    'http://localhost:10888': true,
  },
  tokens: { 'AekbLiKhLab': true }
};

const
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),

  render = require('./server/helpers/render'),
  authControl = require('./server/helpers/auth'),
  Store = require('connect-mongo')(session),
  express = require('express'),

  app = express(),
  server = createServer(),
  io = require('socket.io')(server, ioOptions),

  Bottle = require('./src/Bottle/Bottle');

////////////////////////////////////////////////////////////////////////////   view engine

const viewEngine = require('./server/helpers/handlebars').create();

app.engine('hbs', viewEngine.engine);

if(process.env.NODE_ENV === 'production'){
  app.set('views', 'client-source/views-compressed');
}else{
  app.set('views', 'client-source/views');
}

app.set('view engine', 'hbs');
app.disable('view cache');

/////////////////////////////////////////////////////////////////////////////// Process Exit

const exitHandler = terminate(server, {
  coredump: false,
  timeout: 5000
});

process.on('uncaughtException', exitHandler(1, 'Unexpected Error'));
process.on('unhandledRejection', exitHandler(1, 'Unhandled Promise'));
process.on('SIGTERM', exitHandler(0, 'SIGTERM'));
process.on('SIGINT', exitHandler(0, 'SIGINT'));
process.on('SIGQUIT', exitHandler(0, 'SIGQUIT'));

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

main();

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function main() {
  const settings = require('./src/helpers/settings');
  let setups = await Setup.findOne({}, {__v: 0}).lean();

  if(!setups) {
    await new Setup(settings).save();
    setups = settings;
  }

  sockets();

  global.setups = setups;
  global.Bottle = new Bottle(io);

  ////////////////////////////////////////////////

  const sessionOptions = session({
    name: 'session',
    secret: 'cookie-server-project',
    resave: false,
    saveUninitialized: true,
    store: new Store({mongooseConnection: require('mongoose').connection}),
    cookie: {maxAge: 60 * 60 * 1000, secure: false}
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Set-Cookie, X-XSRF-TOKEN, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    // если домен есть в списке разрешенных и это не GET (у GET нет ориджин)
    if( ACCESS.domains[req.headers.origin] ) {
      setCorsHeaders(req, res);

      if(req.method === 'OPTIONS')
        return res.status(200).send();

      return next();
    }

    // еслив это гет пускаем
    if(req.method === 'GET') {
      setCorsHeaders(req, res);
      return next();
    }

    // если это префлай
    if(req.method === 'OPTIONS') {

      // смотрим шлется ли авторизационный заголовок
      if(/authorization/i.test(req.headers['access-control-request-headers']) ) {
        setCorsHeaders(req, res);

        return res.status(200).send();
      }

      // если авторизации нет, то смотри что нужен запрос POST
      if(req.headers['access-control-request-method'] === 'POST' || req.headers['access-control-request-method'] === 'post') {
        setCorsHeaders(req, res);

        return res.status(200).send();
      }

      // если ничего не подошло - блочим
      return res.status(403).send();
    }

    // если POST
    // определяем безымянные айфоны по токену, (фронт должен прислать)
    if( ACCESS.tokens[ req.headers.authorization ] ) {
      setCorsHeaders(req, res);

      return next();
    }

    // если это запрос с самого сайта, пускаем
    if(req.headers.origin && req.headers.origin.indexOf(req.headers.host)) return next();

    // если таки не нашли ключ проверяем по юзер-агенту (временно)
    if(/iPhone.+AppleWebKit/i.test(req.headers['user-agent'])) {
      setCorsHeaders(req, res);

      return next();
    }

    if(req.headers['x-unity-version'] && /UnityPlayer/i.test(req.headers['user-agent'])) {
      setCorsHeaders(req, res, true);

      return next();
    }

    // если ничего не нашли - блочим
    return res.status(403).send();
  });

  app.use(sessionOptions);
  app.use('/public', express.static('public'));
  app.use(authControl);

  const routes = [
    require('./server/routes/index.js'),
    require('./server/routes/login.js'),
    require('./server/routes/registration.js'),

    require('./server/routes/control/index.js'),
    require('./server/routes/control/setups.js')
  ];

  routes.forEach((route) => {
    app.use('/', route);
  });

  app.use(function(req, res){
    render(res, '404', {title: "Страница не найдена!"}, 404);
  });

  ////////////////////////////////////////////////

  const port = process.argv[2] === 'test-server' ? 8888 : process.env.PORT;
  const serverType = process.argv[2] ? process.argv[2] : 'production-server';

  server.listen(port, () => {
    //telegramBot.restartMessage(serverType, _version);
    global.log.other('Запуск сервера на порту: ' + port + ' Версия: ' + _version + ' :: ' + serverType);
  });

  // запускаем задачи по крону
  require('./app-schedule');
}

/**
 * Ставит разрешающие заголовки для CORS
 * @param req
 * @param res
 * @param all
 */
function setCorsHeaders(req, res, all) {
  if(all || req.headers.origin === undefined) res.setHeader('Access-Control-Allow-Origin', '*');
  else res.setHeader('Access-Control-Allow-Origin', req.headers.origin);


  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Max-Age', 300);
}


function sockets() {
  const types = {
    'bottle-game': 1
  };

  io.on('connection', (socket) => {
    const sid = socket.id;

    try {
      if(!types[socket.handshake.query.type]) {
        io.to(sid).emit('error-occurred', ['Ошибка подключения']);
        socket.disconnect(true);
      }

      socket.on('disconnect', () => {
        console.log('global disconnect', sid);
      });
    } catch(e) {
      socket.disconnect(true);
    }
  });
}
///////////////////////////////////////////////////////////////////////////////

function createServer() {
  let server, protocol;

  if(process.platform === 'win32') {
    protocol = require('http');
    server = protocol.createServer(app);
  } else {
    const fs = require("fs");
    const options = {
      key: fs.readFileSync(process.env.KEY),
      cert: fs.readFileSync(process.env.CERT)
    };

    protocol = require('https');
    server = protocol.createServer(options, app);
  }

  return server;
}

///////////////////////////////////////////////////////////////////////////////