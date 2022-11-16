const
  petrovich = require('petrovich');

function answer() {
  return [ m1, m2, m3, m4 ];

  function m1(data) {
    return {
      id: 'answerGift-1',
      message: `${data.to.name}, большое спасибо!`
    };
  }

  function m2(data) {
    let answer = {
      id: 'answerGift-2',
      message: ''
    };

    if(data.from.gender === 'female') {
      if(data.to.gender === 'male') {
        answer.message = data.to.name + ", вы замечательный";
      } else {
        answer.message = data.to.name + ", ты супер!";
      }
    } else {
      if(data.to.gender === 'male') {
        answer.message = data.to.name + ", ты крут, это тебе!";
      } else {
        answer.message = data.to.name + ", ты замечательная.";
      }
    }

    return answer;
  }

  function m3(data) {
    let answer = {
      id: 'answerGift-3',
      message: ''
    };

    if(data.to.gender === 'male') {
      answer.message =  "Ништяк!";
    } else {
      answer.message =  "Восхитительно!";
    }
    return answer;
  }

  function m4(data) {
    return {
      id: 'answerGift-4',
      message: data.to.name + ', шикарно, спасибо!'
    };
  }
}

module.exports = answer();