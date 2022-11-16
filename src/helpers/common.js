class Common {
  static randomFromArray(array) {
    return array[ Common.randomNumber(0, array.length - 1) ];
  }
  static randomNumber(min, max) {
    const rnd = Math.random() + '';
    const d = [
      Math.round(Math.random() * 14) + 2,
      Math.round(Math.random() * 10) + 2,
      Math.round(Math.random() * 8) + 2
    ];
    const random = Number('0.' + rnd[d[0]] + rnd[d[1]] + rnd[d[2]]);
    const result = Math.floor(random * (max - min + 1)) + min;

    if(isNaN(result)) return Common.randomNumber(min, max);
    return result;
  }

  static rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Возращает случайное число (от мин до макс), только из массива 2-х чисел
   * @param { [number, number] } array - [min, max]
   * @return {number|0}
   */
  static chance(array) {
    if(array instanceof Array) {
      if(typeof array[0] !== "number") return 0;
      if(typeof array[1] !== "number") return 0;

      return Common.randomNumber(array[0], array[1]);
    }

    console.error('array - не массив!');
    return 0;
  }

  static rid() {
    const id = Math.random().toString(36);
    return id[2] + id[3] + id[4] + id[5] + id[6] + id[7];
  }

  /**
   * Перемешивает масив случайнм образом
   * @param array - исходный массив
   * @return {*[]} - новый перемешанный массив
   */
  static shuffleArray(array) {
    let i, temp, index, result;

    result = [].concat(array);
    i = result.length;

    while(i--) {
      index = Common.randomNumber(0, i);
      temp = result[index];
      result[index] = result[i];
      result[i] = temp;
    }

    return result;
  }

  static initSayModule(from, to) {
    const result = {
      from: {
        user: null,
        name: '',
        gender: ''
      },
      to: {
        user: null,
        name: '',
        gender: ''
      }
    };

    if(from) {
      result.from.user = from;
      result.from.name = from.getName();
      result.from.gender = from.getGender();
    }

    if(to) {
      result.to.user = to;
      result.to.name = to.getName();
      result.to.gender = to.getGender();
    }

    return result;
  }

  /**
   * @param number {number} количество
   * @param titles {[string, ...]} - ['час', 'часа', 'часов']
   * @returns {string}
   */
  static wordEnding(number, titles){
    const cases = [2, 0, 1, 1, 1, 2];
    return number + ' ' + titles[
      (number % 100 > 4 && number % 100 < 20) ?
        2 :
        cases[(number % 10 < 5) ? number % 10 : 5]
      ];
  }

  static wordEndingOther(count, titles) {
    if(count === 1) return count + ' ' + titles[0];
    return count + ' ' + titles[1];
  }

  /**
   * Генерируем шифрованный id
   * @param {number|string} uid - id игрока
   * @return {string}
   */
  static convertUID(uid) {
    if(isNaN(uid)) return uid.slice(0, 10);

    let i, count, offset, n, result = '';

    uid = uid + '';

    for(i = 0, count = uid.length; i < count; i++) {
      offset = 97;
      if(i % 2 === 0) offset = 110;
      if(i % 3 === 0) offset = 105;

      n = Number(uid[i]);
      if(isNaN(n)) n = 0;

      result += String.fromCharCode(n + offset);
    }

    return result;
  }

  /**
   * Проверка шифрованного ключа
   * @param {Date} date
   * @param {string} key - пришедший ключ
   * @return {boolean}
   */
  static checkSecretKey(date, key) {
    let i, length, string, result = '';

    string = '' + date.getTime();
    string = string.substring(2, string.length - 4);

    for(i = 0, length = string.length; i < length; i++) {
      let offset = 97;

      if(i !== 0) {
        if(i % 2 === 0) offset += 10;
        if(i % 5 === 0) offset += 5;
        if(i % 7 === 0) offset += 3;
      }

      result += String.fromCharCode(Number(string[i]) + offset);
    }

    return result === key;
  }
}

module.exports = Common;