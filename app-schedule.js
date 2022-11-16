const
  cron = require('cron'),
  db = require('./src/helpers/dbRequests');

cron.job('0 0 1 * * *', async () => {
  try {
    await db.resetRatings();
  } catch(e) {
    global.log.debug('Cron ошибка: Чистка рейтинга');
  }
}).start();

cron.job('5 21 13 * * *', () => {
  console.log('cron - test');
}).start();

module.exports = cron;