module.exports = {
  game: {
    historyLimit: 5,
    sleep: 90000,
    watcher: 120000,
    stateCount: 60
  },
  bot: {
    rounds: [14, 28],
    startChanceGift: [-15, 5],
    chanceKeepPlay: 40,
    decreaseRounds: [1, 3],
    encreaseChanceGift: [1, 5],
    decreaseChanceGift: [10, 30],
    chanceRandomOnBots: 75,
    chanceRandomOnUsers: 25,
    rating: {
      start: 100,
      gender: 12,
      enter: [25, 20],
      roundCountMin: [8, 10],
      roundCountMax: [50, -15],
      kissCountMin: [50, 5],
      kissCountMax: [250, -10],
      cookieCount: [100, 5],
      kiss: 5,
      giftFrom: 2,
      giftTo: 2
    },
    message: {
      chanceAnswerGift: 15,
      chanceGiveGift: 20,
      chanceHello: 25,
      chanceGoodby: 10
    }
  },
  bottle: {

  }
};