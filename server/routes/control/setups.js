const
  router = require('express').Router(),
  render = require('./../../helpers/render'),
  Transfer = require('./../../helpers/transfer.js'),

  Setup = require('./../../models/setup').Setup;

let sendData;

///////////////////////////////////////// Routes


router.post('/control/setups/', async function (req, res){
  const data = req.body;
  let setup;
  sendData = {};

  if(data.save && data.section) {
    setup = pathToSetup(data.section);
    sendData.errors = await updateSetup(setup, data);
  }

  Transfer.send(req, sendData);
  res.redirect('/control/setups/');
});

router.get('/control/setups/', function (req, res, next){
  sendData = {errors: []};
  sendData = Transfer.receive(req, sendData);

  renderPage(req, res, next);
});

///////////////////////////////////////// Functions

function renderPage(req, res){
  sendData.typePage = "control";
  sendData.user = req.User;
  sendData.title = "Установки";

  sendData.setups = {
    game: global.setups.game,
    bottle: global.setups.bottle,
    bot: global.setups.bot
  };

  render(res, 'setups', sendData);
}

function pathToSetup(section) {
  section = section.split('.');

  let
    i = 0,
    length = section.length,
    setup = global.setups;


  for(i; i < length; i++) {
    setup = setup[section[i]];
  }

  return setup;
}


async function updateSetup(setup, data) {
  let write, res, errors = [];
  let v0, v1, value;

  for(let key in setup) {
    value = data[key];
    if(!value) continue;

    if(value instanceof Array) {
      v0 = Number(value[0]);
      v1 = Number(value[1]);

      if(isNaN(v0) || isNaN(v1)) {
        errors.push(`Поля ${key} могут содержать только числа`);
        continue;
      }

      value = [v0, v1];
    } else {
      value = Number(value);

      if(isNaN(value)) {
        errors.push(`Поле ${key} может содержать только число`);
        continue;
      }
    }

    if(setup[key] === value) continue;
    setup[key] = value;
    write = true;
  }

  if(write) {
    res = await Setup.updateOne({_id: global.setups._id}, global.setups);
    if(!res.ok) errors.push(res);
  }

  return errors;
}




module.exports = router;