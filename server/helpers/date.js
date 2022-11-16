class date {
  /**
   * Возвращет нормальное нормальную строку даты и времени
   * @param {number} date - время в ms от Date.now()
   * @param {=} time - true, добавлет время, only - только время
   * @param {=boolean} fullYear - полный год
   * @param {=boolean} array - вернуть данные в масиве
   * @param {=number} offset - сдвиг по времени (в часах)
   * @returns {string|array}
   */
  static normalize(date, time, fullYear, array, offset = 25200000) {
    let day, month, year, hour, minute;

    if(isNaN(date)) return date;
    if(date === 0) return ' - ';


    if(offset < 30 || offset < -30) offset = offset * 3600000;
    date = new Date(date + offset);

    day = date.getUTCDate();
    month = date.getUTCMonth() + 1;
    year = date.getUTCFullYear().toString();

    if(day < 10) day = "0" + day;
    if(month < 10) month = "0" + month;

    if(fullYear !== true) {
      year = year.charAt(2) + year.charAt(3);
    }

    if(time) {
      hour = date.getUTCHours();
      minute = date.getUTCMinutes();

      if(hour < 10) hour = "0" + hour;
      if(minute < 10) minute = "0" + minute;

      if(time === 'only') {
        return array ? [hour, minute] : `${hour}:${minute}`;
      } else {
        return array ? [hour, minute] : `${day}.${month}.${year} ${hour}:${minute}`;
      }
    }
    return array ? [day, month, year] : `${day}.${month}.${year}`;
  }

  /**
   * Возаращет разницу в времени, от переданного
   * @param {number} from - прошлое время, в мс
   * @returns {number}
   */
  static passed(from) {
    if(typeof from !== 'number') return -1;
    return new Date().getTime() - from;
  }

  static getWeek() {
    const
      msDay = 86400000,
      msWeek = 604800000,
      now = new Date(),
      year = new Date().getFullYear(),
      start = new Date(year, 0, 1),
      firstWeek = (8 - start.getDay()) * msDay;

    let week;

    week = now.getTime() - start.getTime() - firstWeek;
    week = 1 + (week / msWeek);
    week = Math.ceil(week);

    return week;
  }
}

module.exports = date;