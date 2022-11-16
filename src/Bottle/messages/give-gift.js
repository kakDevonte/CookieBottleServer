const
  petrovich = require('petrovich');

function give() {
  return [m1, m2, m3, m4];

  function m1(data) {
    return {
      id: 'giveGift-1',
      message: `${data.to.name}, это вам.`
    };
  }

  function m2(data) {
    let answer = {
      id: 'giveGift-2',
      message: ''
    };

    if(data.to.gender === 'male') {
      answer.message = data.to.name + ", вы замечательный";
    } else {
      answer.message = data.to.name + ", вы замечательная";
    }

    return answer;
  }

  function m3(data) {
    let answer = {
      id: 'giveGift-3',
      message: ''
    };

    if(data.to.gender === 'male') {
      answer.message =  "Держи бро!";
    } else {
      answer.message =  "Прими этот подарок :)";
    }

    return answer;
  }

  function m4(data) {
    return {
      id: 'giveGift-4',
      message: data.to.name + ', лови!'
    };
  }
}

module.exports = give();