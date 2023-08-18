const
    router = require('express').Router(),
    render = require('./../helpers/render'),
    requests = require('./../../src/helpers/serverRequests'),
    qs = require('querystring'),
    md5 = require('md5');
const db = require("../../src/helpers/dbRequests");
const verifyLaunchParams = require('../../src/helpers/verifyLaunchParams');
const { Token } = require("../../server/models/token");
const jwt = require('jsonwebtoken');

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

// router.post('/pay', function (req, res){
//   const input = qs.parse(req.body);
// });

router.get('/token', async (req, res) => {
  let auth;
  console.log(req.headers.authorization);
  if(req.headers.authorization){
    auth = verifyLaunchParams(req.headers.authorization, process.env.SECRET_KEY);
    console.log(auth);
  }
   if(!auth) {
     return res.status(401).send({ error: "not authorized :(" });
   }

  const header = qs.parse(req.headers.authorization);
  const jwtToken = jwt.sign({ id: header.vk_user_id }, process.env.SECRET_KEY);
  try {
    let oldToken = await Token.findOne({ id: 'random_' + header.vk_user_id });
    if(oldToken) {
      return res.json({message: "ok!", token: oldToken.token});
    }

    const token = new Token({id: 'random_'+ header.vk_user_id, token: jwtToken});
    console.log(token);
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
  // ��������� ������

  user = await db.getUser('random_'+ data.user_id);
  console.log("USER 1 == ", user);
  // �������� �������
  // ��� ������� calcSignature() ������� ����.
  if (calcSignature(data) == data.sig) {
    if(!user) {
      responseData = { // ������ �������
        error: {
          error_code: 20,
          error_msg: '������������ ���������� � ����������� �������',
          critical: true
        }
      }
    } else {
      // ������������ ������
      switch (data.notification_type) {
        case "get_item":
        case "get_item_test":
          responseData = await handleGetItem(data);
          break;
        case "order_status_change":
        case "order_status_change_test":
          responseData = await handleOrderStatusChange(data);
          break;
      }
    }
  } else {
    responseData = { // ������ �������
      error: {
        error_code: 20,
        error_msg: '������������ ���������� � ����������� �������',
        critical: true
      }
    }
  }

  // ���������� �����
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

  console.log(responseData)
  return responseData;
}

// Обработчик уведомления order_status_change
async function handleOrderStatusChange(params) {

  let responseData;

  switch(params.status) {
    case 'chargeable':
      const order = await db.getOrder(params.order_id);
      const user = await db.getUser('random_'+ order.user_id);
      if(!order) {
        return responseData = {
          error: {
            error_code: 100,
            error_msg: '�������� ��������� ��� ������ chargeable.',
            critical: true
          }};
      }

      console.log("user = ", user);
      await db.userBuyCookie({id: 'random_'+ order.user_id, count: user.cookies + order.count});
      // ������������� ����� � ����������
      // ...
      const bottle = global.Bottle;
      bottle._connects.toUser('random_'+ order.user_id, 'add-cookie', { count: order.count });
      bottle._buyCookies({uid: 'random_'+ order.user_id, count: order.count});
      // ��������� ���������� � ������ � ����������
      // ...

      // ��������� �����
      let appOrder = order.id; // ������������� ������ � ����������

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

  return responseData;
}

// Служебная функция для декодирования строк
// из формата PHP URL-encoded
function PHPUrlDecode(str){
  return decodeURIComponent(
      str.replace(/%21/g, '!')
          .replace(/%27/g, '\'')
          .replace(/%28/g, '(')
          .replace(/%29/g, ')')
          .replace(/%2A/g, '*')
          .replace(/%7E/g, '~')
          .replace(/\+/g, '%20'));
}
module.exports = router;