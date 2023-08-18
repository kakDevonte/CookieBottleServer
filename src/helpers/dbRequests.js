const {Player, Info} = require('../../server/models/player');
const { Report } = require('../../server/models/report');
const Rating = require('../../server/models/rating');
const {Order} = require("../../server/models/order");
const { use } = require("express/lib/router");
const { Token } = require("../../server/models/token");
const getWeek = require('../../server/helpers/date').getWeek;

const models = {
  day: Rating.DayRating,
  week: Rating.WeekRating,
  month: Rating.MonthRating
};

const getSecondsToTomorrow = () => {
  const
    now = new Date(),
    tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    diff = tomorrow - now;

  return Math.round(diff / 1000);
};

/**
 * По периоду подготавливает данные, модель и параметры поиска
 * @param period
 * @return {{search: *, Model: *}}
 */
const ratingWorkData = (period) => {
  const now = new Date();
  const Model = models[period];
  const search = {};

  switch(period) {
    case 'day':
      search.day = now.getDate();
      break;

    case 'week':
      search.week = getWeek();
      break;

    case 'month':
      search.month = now.getMonth() + 1;
      break;
  }

  return {Model, search}
};

class dbRequests {
  /**
   * Заносит или обновляет данные игрока при заходе в игру
   * @param user
   * @param guest
   * @return {Promise<null|*>}
   */
  static async userEnter(user, guest) {
    try {
      const id = user.platform + guest.id;
      let player, info;

      player = await Player.findOne( {id: id} );

      if(player) {
        await player.gameEnter();
      } else {
        player = new Player({
          id: id,
          uid: guest.id,
          platform: user.platform
        });

        await player.save();
      }

      info = await Info.findOne( {player: id} );

      if(info) {
        info.checkUpdate(guest);
      } else {
        info = new Info({
          player: id,
          uid: guest.id,
          platform: user.platform,
          gender: user.gender,
          photo: user.photo,
          name: user.name,
          fullName: user.fullName,
          bdate: guest.bdate,
          timezone: guest.timezone,
          city: guest.city ? guest.city.title : '-'
        });

        await info.save();
      }

      return player;
    } catch(e) {
      console.log('user Enter', e);
      return null;
    }
  }

  /**
   * Записывает печеньки
   * @param info
   * @return {Promise<void>}
   */
  static async userBuyCookie(info) {
    const cheaters = {
      //'vk180312929': true
    };

    // Player.createdAt();
    const result = await Player.findOneAndUpdate(
      {uid: info.id},
      {cookies: info.count})

    if(!result) global.log.error('Не смог добавить печеньки в базу: id ' + info.id, info);
    if(cheaters[info.id]) return;
  }

  /**
   * Получение юзера
   * @param uid
   * @return {Promise<void>}
   */
  static async getUser(uid) {
    try {
      const player = await Player.findOne({uid: uid})
      const info = await Info.findOne({uid: uid})

      if (!player) global.log.error('Не смог получить пользователя: id ' + info.id, info);

      const result = {
        uid: player.uid,
        fullName: info.fullName,
        photo: info.photo,
        kissCounter:  player.kisses,
        giveGiftCount: player.gifts.receive,
        cookies: player.cookies,
      };
      return result;
    }
     catch (e) {
      console.log('user Enter', e);
      return null;
    }
  }

  /**
   * Записывает что пользователю больше 18
   * @param info
   * @return {Promise<void>}
   */
  static async userSetAdult(info) {
    const cheaters = {
      //'vk180312929': true
    };

    const result = await Player.findOneAndUpdate(
      {uid: info.id},
      {adult: true, isDelete: false})

    if(!result) global.log.error('Не смог обновить пользователя: id ' + info.id, info);
    if(cheaters[info.id]) return;

    return result;
  }

  /**
   * Удаление пользователя
   * @param info
   * @return {Promise<void>}
   */
  static async deleteUser(info) {
    const cheaters = {
      //'vk180312929': true
    };

    const player = await Player.findOneAndUpdate(
      {uid: info.id},{isDelete: true, kisses: 0, gifts: {send: 0, receive: 0}, enters: {count: 0}});

    // const playerInfo = await Info.deleteOne(
    //   {uid: info.id})

    if(!player) global.log.error('Не смог удалить пользователя: id ' + info.id, info);
    if(cheaters[info.id]) return;
  }

  /**
   * Добавление репорта
   * @param info
   * @return {Promise<void>}
   */
  static async addReport(info) {
      const { name, id, text, date, cause } = info;
      const report = new Report({
        name: name,
        id: id,
        text: text,
        date: date,
        cause: cause
      });
      await report.save();
    if(!report) global.log.error('Не смог добавить репорт от пользователя пользователя');
    //if(cheaters[info.id]) return;
  }

  /**
   * Добавление заказа
   * @param info
   * @return {Promise<void>}
   */
  static async addOrder(info) {
      const { user_id, payment_id, price, count } = info;
      const order = new Order({
        id: user_id + payment_id,
        user_id: user_id,
        payment_id: payment_id,
        price: price,
        count: count,
      });
      await order.save();
    if(!order) global.log.error('Не смог добавить заказ');
    //if(cheaters[info.id]) return;
  }

  /**
   * Получение заказа
   * @param payment_id
   * @return {Promise<void>}
   */
  static async getOrder(payment_id) {
    try {
      const order = await Order.findOne({payment_id: payment_id})
      if (!order) global.log.error('Не смог получить заказ: id ' + payment_id);
      return order;
    } catch (e) {
      console.log('user Enter', e);
      return null;
    }
  }

  /**
   * Записывает поцелуи
   * @param info
   * @return {Promise<void>}
   */
  static async userExit(info) {
    // if(info.id === 'vk224001505')
    //   console.log(info)

    const cheaters = {
      //'vk180312929': true
    };

    if(info.sessionKisses !== 0) {
      const result = await Player.findOneAndUpdate(
        {id: info.id},
        {kisses: info.kisses, gifts: info.gifts, rotates: info.rotates}
      );

      if(!result) global.log.error('Не смог добавить поцелуи в базу: id' + info.id, info);
    }

    if(cheaters[info.id]) return;
    if(info.sessionKisses === 0 && info.sessionGifts === 0) return;

    await pushToRating('day', info);
    await pushToRating('week', info);
    await pushToRating('month', info);
  }

  /**
   * Очищает все записи в рейтинге, которые не соотвествуют текущему периоду
   * @return {Promise<void|boolean>}
   */
  static async resetRatings() {
    const now = new Date(), results = {};

    results.day = await Rating.DayRating.deleteMany( {day: {$ne: now.getDate()} } );
    results.week = await Rating.WeekRating.deleteMany( {week: {$ne: getWeek()} } );
    results.month = await Rating.MonthRating.deleteMany( {month: {$ne: now.getMonth() + 1} } );

    global.log.debug('Чистка рейтинга', results);
    //setTimeout(dbRequests.resetRatings, 43200000);
    return true;
  }

  /**
   * Очищает все записи в рейтинге, по удаленному пользователю
   * @return {Promise<void|boolean>}
   */
  static async resetRatingsById(id) {
    console.log(id);
    const results = {};
    results.day = await Rating.DayRating.deleteMany( {player: id} );
    results.week = await Rating.WeekRating.deleteMany( {player: id} );
    results.month = await Rating.MonthRating.deleteMany( {player: id} );
    console.log(results);

    global.log.debug('Чистка рейтинга', results);
    //setTimeout(dbRequests.resetRatings, 43200000);
    return true;
  }

  /**
   * Получаем рейтинг по текущему периоду
   * @param {{period, type}} data
   * @param player
   * @param myRatingInfo
   * @return {Promise<{period, my, items}>}
   */
  static async getRating(data, player, myRatingInfo) {
    try {
      const {Model, search} = ratingWorkData(data.period);
      const sort = {}; sort[data.type] = -1;
      const result = {
        period: data.period,
        items: [],
        my: myRatingInfo
      };

      let rating, info, count, i, p, n, item;
      let
        limit = 20,
        indexes = {},
        searchInfo = {player: {$in: []}},
        searchPlayer = {id: {$in: []}};

      rating = await Model
        .find(search, {_id: 0, __v: 0})
        .sort(sort)
        .limit(1000)
        .lean();

      if(!(rating instanceof Array)) return error(rating);

      for(i = 0; i < limit; i++) {
        item = rating[i];
        if(!item) break;

        item.position = i + 1;

        result.items.push(item);

        searchInfo.player.$in.push(item.player);
        searchPlayer.id.$in.push(item.player);
        indexes[item.player] = i;
      }

      count = rating.length;
      while(count--) {
        if(rating[count].player === player) {
          result.my.position = count + 1;
          result.my.kisses = rating[count].kisses;
          result.my.gifts = rating[count].gifts;
          break;
        }
      }


      if(isNaN(result.my.position)) {
        search.player = player;
        rating = await Model.findOne(search, {_id: 0, __v: 0}).lean();
        if(rating) {
          result.my.kisses = rating.kisses;
          result.my.gifts = rating.gifts;
        }
      }

      info = await Info.find(searchInfo).lean();
      const players = await Player.find(searchPlayer).lean();

      if(!(info instanceof Array)) return error(info);

      count = info.length;
      while(count--) {
        i = info[count];
        p = players[count];
        n = indexes[i.player];

        result.items[n].id = i.uid;
        result.items[n].kissCounter = p.kisses;
        result.items[n].giftsCounter = p.gifts.receive;
        result.items[n].platform = i.platform;
        result.items[n].name = i.name;
        result.items[n].fullName = i.fullName;
        result.items[n].photo = i.photo;
      }

      return result;
    } catch(e) {
      return error(e);
    }

    function error(e) {
      global.log.error('Не смог получить рейтинг', period, player, e);
      return null;
    }
  }
}

async function pushToRating(period, info) {
  const {Model, search} = ratingWorkData(period);
  let rating;

  search.player = info.id;
  rating = await Model.findOne(search);

  if(rating) {
    rating.kisses += info.sessionKisses;
    rating.gifts += info.sessionGifts;
  } else {
    search.kisses = info.sessionKisses;
    search.gifts = info.sessionGifts;
    rating = new Model(search);
  }

  await rating.save();
}

module.exports = dbRequests;