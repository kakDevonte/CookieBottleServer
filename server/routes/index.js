const
  router = require('express').Router(),
  render = require('./../helpers/render'),
  requests = require('./../../src/helpers/serverRequests'),
  qs = require('querystring'),
  md5 = require('md5');
const jwt = require('jsonwebtoken');
const db = require("../../src/helpers/dbRequests");
const verifyLaunchParams = require('../../src/helpers/verifyLaunchParams');
const { Token } = require("../../server/models/token");
router.post('/', function (req, res){
  if(req.body.userExit){
    req.session.destroy();
  }
  res.redirect('/login/');
});

router.get('/', function (req, res, next) {
  let data;

  data = {
    date: parseInt(Date.now() / 1000)
  };

  data.title = "Главная";
  data.user = req.User;

  // requests.testRequest(
  //   'https://cookieapp.ru/backend/requests/quests/questData.php',
  //   'post',
  //   {user_id: 281254431, platform: "vk"}
  // );

  // requests.testRequest(
  //   'https://cookieapp.ru/backend/requests/quests/addHard.php',
  //   'post',
  //   {user_id: 281254431, platform: "vk", col: 5}
  // );

  render(res,'index', data);
});

router.get('/token', async (req, res) => {
  let auth;
  // console.log(req.headers.authorization);
  if(req.headers.authorization){
    auth = verifyLaunchParams(req.headers.authorization, process.env.SECRET_KEY);
    console.log(auth);
  }

  // if(!auth) {
  //   return res.status(401).send({ error: "not authorized :(" });
  // }

  const header = qs.parse(req.headers.authorization);
  const jwtToken = jwt.sign({ id: header.vk_user_id }, process.env.SECRET_KEY);
  try {
    let oldToken = await Token.findOne({ id: header.vk_user_id });
    if(oldToken) {
      return res.json({message: "ok!", token: oldToken.token});
    }

    const token = new Token({id: header.vk_user_id, token: jwtToken});
    await token.save();
    return res.json({message: "ok!", token: jwtToken});
  } catch (e) {
    return res.status(401).send({ error: "not authorized :(" });
  }
});

router.post('/pay', async (request, response) => {

  let requestData = '';
  let requestParams = {};
  let responseData;
  let user;
  const data = request.body;
  console.log("request.body == ", request.body);


  user = await db.getUser(data.user_id);
  console.log("USER 1 == ", user);
        if (calcSignature(data) == data.sig) {
          if(!user) {
            responseData = { // Ошибка подписи
              error: {
                error_code: 20,
                error_msg: 'Несовпадение переданной и вычисленной подписи',
                critical: true
              }
            }
          } else {
            // Обрабатываем запрос
            console.log("data.notification_type: ", data.notification_type)
            switch (data.notification_type) {
              case "get_item":
                responseData = await handleGetItem(data);
                break;
              case "get_item_test":
                responseData = await handleGetItem(data);
                break;
              case "order_status_change":
                responseData = await handleOrderStatusChange(data);
                break;
              case "order_status_change_test":
                responseData = await handleOrderStatusChange(data);
                break;
            }
          }
        } else {
          responseData = { // Ошибка подписи
            error: {
              error_code: 20,
              error_msg: 'Несовпадение переданной и вычисленной подписи',
              critical: true
            }
          }
        }

        console.log("ОТВЕТ: ", responseData);
        console.log("ОТВЕТ AWAIT: ", await responseData);
        // Отправляем ответ
        //s = JSON.stringify(responseData);
        response.json(responseData);
       // response.
})

// Вычисление подписи
function calcSignature(params) {

  const ACCESS_KEY = process.env.SECRET_KEY; // Ключ доступа приложения
  // const secretKey =

  // Сортируем параметры
  let keys = Object.keys(params);
  keys.sort();

  // Формируем строку из пар 'параметр=значение'
  let str = '';
  keys.map((item) => {
    if (item != "sig") {
      str += item + '=' + params[item];
    }
  });
  str = str + ACCESS_KEY; // Добавляем ключ доступа

  // Вычисляем подпись
  let calculatedSignature = md5(str);

  return calculatedSignature;
}


const saleItems = [
  {
    item_id: 1,
    title: '2000 монет',
    photo_url: '',
    cookie: 2000,
    promotion: 4000,
    count: 6000,
    price: 269
  },{
    item_id: 2,
    title: '500 монет',
    photo_url: '',
    cookie: 500,
    promotion: 1000,
    count: 1500,
    price: 59
  },{
    item_id: 3,
    title: '300 монет',
    photo_url: '',
    cookie: 300,
    promotion: 600,
    count: 900,
    price: 47
  },{
    item_id: 4,
    title: '100 монет',
    photo_url: '',
    cookie: 100,
    promotion: 200,
    count: 300,
    price: 16
  },{
    item_id: 5,
    title: '50 монет',
    photo_url: '',
    cookie: 50,
    promotion: 100,
    count: 150,
    price: 8
  },{
    item_id: 6,
    title: '30 монет',
    photo_url: '',
    cookie: 30,
    promotion: 60,
    count: 90,
    price: 5
  },
]
// Обработчик уведомления get_item
async function handleGetItem(params) {

  let responseData
  // Получаем информацию о товаре
  let item = saleItems[Number(params.item)];

  // Возвращаем ответ
  if (item) {
    responseData = {
      response: item
    };
    await db.addOrder({
      user_id: params.user_id,
      payment_id: params.order_id,
      price: item.price,
      count: item.count,
    })
  } else {
    responseData = {
      error: {
        "error_code": 20,
        "error_msg": "Товара не существует",
        "critical": true
      }};
  }

  return responseData;
}

// Обработчик уведомления order_status_change
async function handleOrderStatusChange(params) {
  let responseData;
  switch(params.status) {
    case 'chargeable':
      const order = await db.getOrder(params.order_id);
      const user = await db.getUser(order.user_id);
      if(!order) {
        return responseData = {
          error: {
            error_code: 100,
            error_msg: 'Передано непонятно что вместо chargeable.',
            critical: true
          }};
      }
      await db.userBuyCookie({id: order.user_id, count: user.cookies + order.count});
      // Предоставляем товар в приложении
      const bottle = global.Bottle;
      bottle._connects.toUser(order.user_id, 'add-cookie', { count: order.count });
      bottle._buyCookies({uid: order.user_id, count: order.count}); // Сохраняем информацию о заказе в приложении
      // Формируем ответ
      let appOrder = order.id; // Идентификатор заказа в приложении
      responseData = {
        response: {
          order_id: params.order_id,
          app_order_id: appOrder
        }};
      break;
    case 'refund':
      // Обрабатываем возврат
      // ...
      break;
    default:
      responseData = {
        error: {
          error_code: 11,
          error_msg: 'Ошибка в структуре данных',
          critical: true
        }};
  }

  console.log("responseData: ", responseData);

  return responseData;
}

module.exports = router;