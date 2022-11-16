const
  router = require('express').Router(),
  render = require('./../helpers/render'),
  User = require('./../models/user').User;

var sendData;

router.post('/login/', (req, res, next)=>{
  var data;

  sendData = {};
  data = req.body;

  if(data.logged){
    if(data.login !== "" && data.password !== ""){
      User.findOne({login: data.login}, (err, user)=>{
        if(user){
          if(user.checkPassword(data.password)){
            req.session.user = {
              name: data.login,
              _id: user._id,
              views: 0
            };

            res.redirect('/control/');
          }else{
            sendData.errors = "Неправильный логин или пароль";
            next();
          }
        }else{
          sendData.errors = "Неправильный логин или пароль";
          next();
        }
      });
    }else{
      sendData.errors = "Поля должны быть заполнены";
      next();
    }
  }else{
    sendData.errors = "Нет данных";
    next();
  }
});

router.post('/login/', (req, res)=>{
  sendData.title = "Войти";
  render(res, 'login', sendData);
});

router.get('/login/', function (req, res) {
  sendData = {};
  sendData.title = "Войти";
  render(res, 'login', sendData);
});

module.exports = router;