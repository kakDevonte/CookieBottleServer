const
  router = require('express').Router(),
  render = require('./../helpers/render'),
  User = require('./../models/user').User;

var sendData;

router.post('/registration/', (req, res, next)=>{
  var data;

  data = req.body;
  sendData = {};

  if(data.registration){
    User.findOne({login: data.login}, (err, user)=>{
      if(user){
        sendData.errors = "Такой пользоватлеь уже сущетсвует";
        sendData.login = data.login;
        sendData.name = data.name;
        sendData.password = data.password;
        sendData.passwordRetry = data.passwordRetry;

        next();
      }else{
        user = new User({
          login: data.login,
          name: data.name,
          password: data.password
        });

        user.save((err)=>{
          if(err) throw err;

          sendData.registrationSuccess = true;
          sendData.login = user.login;
          next();
        });
      }
    });
  }else{
    sendData.errors = "Нет данных";
    next();
  }
});

router.post('/registration/', (req, res)=>{
  sendData.title = "Регистрация";

  render(res, 'registration', sendData);
});

router.get('/registration/', (req, res)=>{
  sendData = {};
  sendData.title = "Регистрация";

  render(res, 'registration', sendData);
});

module.exports = router;