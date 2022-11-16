const
  router = require('express').Router(),
  render = require('./../helpers/render'),
  requests = require('./../../src/helpers/serverRequests');

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

module.exports = router;