const loader = require('axios');
const common = require("./common");

const $url = {
  vk: 'https://phantom.cookieapp.ru/api',
  ok: 'https://phantom.cookieapp.ru/api',
  sber: 'https://phantom.cookieapp.ru/api',
  yandex: 'https://phantom.cookieapp.ru/api',
  mail: 'https://phantom.cookieapp.ru/api',
  gd: 'https://tiny.cookieapp.ru/api',
};

class ServerRequests {

  /**
   * Отправка на сервер данных о подареном подарке
   * @param {{id: <string>, gid: <string>}} gift - данные о подарке
   * @param {User|Bot} from - от кого подарок
   * @param {User|Bot} to - для кого подарок
   * @param {=number} attempt - пробуем повторно;
   */
  static sendGift(gift, from, to, attempt = 0) {
    if(from.template && to.template) return;
    if(from.template && process.env.NODE_ENV === 'development') return;

    try {
      const
        fID = from.template ? from.template : from.getId(),
        tID = to.template ? to.template : to.getId();

      if( /random/.test(fID + tID)) return;

      let url, data;

      data = {
        user_id: fID,
        platform: 'vk',
        recipient_id: tID,
        gift_id: null
      };

      if(gift.gid) {
        url = 'https://phantom.cookieapp.ru/api/gift/send';
        data.gift_id = gift.gid;
      } else {
        if(from.template) {
          url = 'https://phantom.cookieapp.ru/api/bottle/send_gift';
          data.gift_id = gift.id;
        } else {
          url = 'https://phantom.cookieapp.ru/api/gift/buy';
          data.gift_id = gift.id;
        }
      }

      loader.post(url, data).then((response) => {
        try {
          if(response.data.error) global.log.error(response.data);
        } catch(e) {
          global.log.error('Неудачный запрос на отправку подарка', e);
        }
      }).catch( (error) => {
        try {
          const timeout = common.randomNumber(20, 60) * 100;

          if(error.response.status === 502) {
            if(attempt < 2) {
              attempt++;
              setTimeout(ServerRequests.sendGift, timeout, gift, from, to, attempt);
            } else {
              global.log.error('[дарим подарок] Попытки запроса исчерпаны: ' + error.message, error.config.url, error.config.data, error.response.data);
            }
          } else {
            global.log.error('[дарим подарок] Ошибка запроса: ' + error.message, error.config.url, error.config.data, error.response.data);
          }
        }catch(e) {
          global.log.error('Неудачный запрос на отправку подарка', e);
        }
      });
    } catch(e) {
      global.log.error('Неудачный запрос на отправку подарка', e);
    }
  }

  /**
   *
   * @return {Promise<null|*>}
   */
  static async getGiftList() {
    try {
      const
        url = 'https://phantom.cookieapp.ru/api/bottle/all_gifts',
        response = await loader.post(url);

      if(response.data && response.data.length) {
        return response.data;
      } else {
        global.log.warn(response);
      }

      return null;
    } catch(e) {
      global.log.error('Неудачный запрос списка подарков', e.message);
      return null;
    }
  }

  /**
   * Получает данные игрока из базы
   * @param {string} uid
   * @param {=string} platform
   * @return {Promise<null|*>}
   */
  static getUserData(uid, platform = 'vk') {
    console.log("UID = ", uid);

    if(/random/.test(uid)) {
      return {
        inventory: [],
        cookies: 255,
      };
    }

    return new Promise((resolve) => {
      const
        url = $url[platform] + '/bottle/init',
        query = {user_id: uid, platform};

      console.log("url = ", url);
      console.log("query = ", query);
      request(url, 0);

      function request(url, attempt) {
        try {
          const timeout = common.randomNumber(10, 30) * 100;

          loader.post(url, query).then((response) => {
            try {
              if(response.data.success) {
                console.log('init', response.data);
                return resolve(response.data);
              } else {
                global.log.warn('[данные юзера] Пришло что то не то:', response.data);
                return resolve(null);
              }
            } catch(e) {
              global.log.error('Неудачный запрос данных юзера', e);
              return resolve(null);
            }
          }).catch((error) => {
            try {
              if(error.response.status === 502) {
                if(attempt < 2) {
                  attempt++;
                  return setTimeout(request, timeout, url, attempt);
                } else {
                  global.log.error('[данные юзера] Попытки исчерпаны: ' + error.message, 'Ответ:', error.response.data);
                  return resolve(null);
                }
              } else {
                global.log.error('[данные юзера] Ошибка запроса: ' + error.message, 'Ответ:', error.response.data);
                resolve(null);
              }
            }catch(e) {
              resolve(null);
            }
          });
        } catch(e) {
          global.log.error('Неудачный запрос данных юзера', e);
          return resolve(null);
        }
      }
    });
  }

  /**
   * Изменяет количество печенек у игрока
   * @param {number} count
   * @param {string} uid
   * @param {=string} platform
   * @param {=url} url
   * @return {Promise<{}>|{period: *, my: *, items: *}}
   */
  static hardChanger(count, uid, platform = 'vk', url) {
    url = url ? url : $url[platform] + '/bottle/add_hard';

    return new Promise((resolve) => {
      if(process.env.NODE_ENV === 'development') return resolve(true);

      const data = {
        platform: platform,
        user_id: uid,
        col: count
      };

      request(url, 0);

      function request(url, attempt) {
        try {
          const timeout = common.randomNumber(10, 30) * 100;

          loader.post(url, data).then((response) => {
            try {
              if(!response.data) {
                global.log.error('[изменение баланса] Нет данных:', response.data);
                return resolve(null);
              }

              if(response.data.error !== false) {
                if(response.data.error === 'No user') return resolve('no user');

                global.log.error('[изменение баланса] Неудача:', response.data);
                return resolve(null);
              }

              return resolve(true);

            } catch(e) {
              global.log.error('Неудачный запрос изменение баланса', e);
              return resolve(null);
            }
          }).catch((error) => {
            try {
              if(error.response.status === 502) {
                if(attempt < 2) {
                  attempt++;
                  return setTimeout(request, timeout, url, attempt);
                } else {
                  global.log.warn('[изменение баланса] Попытки исчерпаны: ' + error.message, 'Ответ:', error.response.data);
                  return resolve(null);
                }
              } else {
                global.log.error('[изменение баланса] Ошибка запроса: ' + error.message, 'Ответ:', error.response.data);
                resolve(null);
              }
            }catch(e) {
              resolve(null);
            }
          });
        } catch(e) {
          global.log.error('Неудачный запрос изменение баланса', e);
          return resolve(null);
        }
      }
    });
  }

  /**
   * Получает данные для кампании
   * @param {string|number} uid
   * @param {=string} platform
   * @param {=string} url
   * @return {Promise<{}>|{period: *, my: *, items: *}}
   */
  static getCampingData(uid, platform = 'vk', url) {
    url = url ?  url : $url[platform] + '/bottle/quest_data';

    return new Promise((resolve) => {
      if(process.env.NODE_ENV === 'development')
        return resolve({league: 1, maxGameLvl: 1, offlineLevel: 1, profitSec: {num: 1, pow: 2}});

      const data = {
        user_id: uid,
        platform: platform
      };

      request(url, 0);

      function request(url, attempt) {
        try {
          const timeout = common.randomNumber(5, 20) * 100;

          loader.post(url, data).then((response) => {
            try {
              const data = response.data;

              if(!data) {
                global.log.warn('[данные для кампании] Пришло что то не то:', data);
                return resolve(null);
              }

              if(data.error !== false) {
                if(data.error === 'No user' && platform === 'vk') return resolve('no user');

                global.log.warn('[данные для кампании] Ошибка в ответе:', data);
                return resolve(null);
              }

              if(data.league === 0)
                data.league = 1;

              if(data.maxGameLvl === 0)
                data.maxGameLvl = 1;

              if(data.offlineLevel === 0)
                data.offlineLevel = 0;

              if(data.profitSec) {
                // старый бек
                if(data.profitSec.profit || data.profitSec.pow10Profit) {

                  if(data.profitSec.profit === 0 && data.profitSec.pow10profit === 0)
                    data.profitSec.profit = 4;

                  data.profit = {
                    num: data.profitSec.profit * 3600,
                    pow: data.profitSec.pow10Profit
                  }
                } else {
                  // новый бек

                  if(isNaN(data.profitSec.num) || data.profitSec.num === 0)
                    data.profitSec.num = 4;

                  if(isNaN(data.profitSec.pow || data.profitSec.pow === 0))
                    data.profitSec.pow = 0;

                  data.profit = {
                    num: data.profitSec.num * 3600,
                    pow: data.profitSec.pow
                  }
                }
              } else {
                data.profit = {
                  num: 0,
                  pow: 0
                };
              }

              return resolve(response.data);

            } catch(e) {
              global.log.error('Неудачный запрос данных для кампании', e);
              return resolve(null);
            }
          }).catch((error) => {
            try {
              if(error.response.status === 502) {
                if(attempt < 2) {
                  attempt++;
                  return setTimeout(request, timeout, url, attempt);
                } else {
                  global.log.warn('[данные для кампании] Попытки исчерпаны: ' + error.message, 'Ответ:', error.response.data);
                  return resolve(null);
                }
              } else {
                global.log.error('[данные для кампании] Ошибка запроса: ' + error.message, 'Ответ:', error.response.data);
                resolve(null);
              }
            }catch(e) {
              resolve(null);
            }
          });
        } catch(e) {
          global.log.error('Неудачный запрос данных для кампании', e);
          return resolve(null);
        }
      }
    });
  }

  /**
   * Тестовый запрос на адрес, для проверки реакции
   * @param {string} url - адрес
   * @param {string} method -  get | post
   * @param {=object} data - передаваемая информация
   * @param {=number} attempt - попытки
   */
  static testRequest(url, method, data = {}, attempt = 0) {
    const request = loader[method];

    request(url, data).then((response) => {

      console.log('Success request on', url);
      console.log('Response', response.data);

    }).catch( (error) => {
      const timeout = common.randomNumber(20, 60) * 100;

      if(error.response.status === 502) {
        if(attempt < 2) {
          attempt++;
          setTimeout(ServerRequests.testRequest, timeout, url, method, data, attempt);
        } else {
          console.log('Попытки запроса исчерпаны', error.message, error.config.url, error.config.data, error.response.data);
        }
      } else {
        console.log('Ошибка запроса:', error.message, error.config.url, error.config.data, error.response.data);
      }
    });
  }
}

module.exports = ServerRequests;