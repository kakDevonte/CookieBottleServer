const
  mongoose = require('.././helpers/mongoose.js'),
  Schema = mongoose.Schema;

const schema = new Schema({
  game: {
    historyLimit: { type: Number, default: 5 },
    sleep: { type: Number, default: 90000 },
    watcher: { type: Number, default: 120000 },
    stateCount: { type: Number, default: 60}
  },
  bottle: {
    test: {
      type: String,
      default: 'Test'
    }
  },
  bot: {
    rounds: [ {type: Number, default: 14}, {type: Number, default: 28} ],
    startChanceGift: [{type: Number, default: -15}, {type: Number, default: 5}],
    chanceKeepPlay: {type: Number, default: 40},
    decreaseRounds: [ {type: Number, default: 1}, {type: Number, default: 3} ],
    encreaseChanceGift: [ {type: Number, default: 1}, {type: Number, default: 5} ],
    decreaseChanceGift: [ {type: Number, default: 10}, {type: Number, default: 30} ],
    chanceRandomOnBots: {type: Number, default: 75},
    chanceRandomOnUsers: {type: Number, default: 25},
    rating: {
      start: {type: Number, default: 100},
      gender: {type: Number, default: 12},
      enter: [ {type: Number, default: 25}, {type: Number, default: 20} ],
      roundCountMin: [ {type: Number, default: 8}, {type: Number, default: 10} ],
      roundCountMax: [{type: Number, default: 50}, {type: Number, default: -15}],
      kissCountMin: [{type: Number, default: 50}, {type: Number, default: 5}],
      kissCountMax: [{type: Number, default: 250}, {type: Number, default: -10}],
      cookieCount: [{type: Number, default: 100}, {type: Number, default: 5}],
      kiss: {type: Number, default: 5},
      giftFrom: {type: Number, default: 2},
      giftTo: {type: Number, default: 2}
    },
    message: {
      chanceAnswerGift: {type: Number, default: 15},
      chanceGiveGift: {type: Number, default: 20},
      chanceHello: {type: Number, default: 25},
      chanceGoodby: {type: Number, default: 10}
    }
  }
});

exports.Setup = mongoose.model('Setup', schema);

