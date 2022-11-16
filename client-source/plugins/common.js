class Common {
  static getNormalDate(date, fullYear, time, utc, array){
    let options, day, month, year, hour, minute;

    //if(isNaN(date)) return date;
    if(date === 0) return ' - ';
    options = {};

    //date = date * 1000;

    if(time === true){
      options.hour12 = false;
      options.hour = "2-digit";
      options.minute = "2-digit";
    }

    if(utc === true){
      options.timeZone = "UTC";
    }

    date = new Date(date);

    day = date.getDate();
    month = date.getMonth() + 1;
    year = date.getFullYear().toString();

    if(day < 10) day = "0" + day;
    if(month < 10) month = "0" + month;

    if(fullYear !== true){
      year = year.charAt(2) + year.charAt(3);
    }

    if(time === true){
      hour = date.getHours();
      minute = date.getMinutes();

      if(hour < 10) hour = "0" + hour;
      if(minute < 10) minute = "0" + minute;

      return array ? [day, month, year, hour, minute] : `${day}.${month}.${year} ${hour}:${minute}`;
    }
    return array ? [day, month, year] : `${day}.${month}.${year}`;
  }

  static convertPhoneNumber(phone){
    phone = phone.toString();
    return '+7 (' +d(0)+d(1)+d(2) + ') - ' +d(3)+d(4)+d(5) + ' - ' + d(6)+d(7)+ ' -  ' +d(8)+d(9);

    function d(n){
      return phone.charAt(n)
    }
  }

  static every(object, callback){
    var key, index = 0;

    for(key in object){
      if(object.hasOwnProperty(key)){
        callback(object[key], index, key);
        index++;
      }
    }
  }

  static preventEvent(event){
    if (event.preventDefault) { event.preventDefault(); }
    else if (window.event) { window.event.returnValue = false; }
    else { event.returnValue = false; }
  }

  static checkNode(node){
    if(node){
      if(typeof node === 'string'){
        const selector = node;
        node = $(node);
        if(node.length === 0) return console.error(`Элемент "${selector}" не найден!` );
      }

      if(!(node instanceof jQuery)){
        if(node.parentElement){
          node = $(node);
        }else{
          return console.error(`Элемент "${node}" не HTMLElement!` );
        }
      }

      return node;
    }else{
      return console.error(`Элемент "${node}" пуст!`);
    }
  }

  static isFocused(node){
    return node === document.activeElement;
  }

  /**
   * @param {String|Number|jQuery|HTMLElement} target
   * @param {=object} options - {increase: %, decrease: %, offset: px}
   */
  static scrollToElement(target, options){
    if(options == null) options = {};

    const that = this;
    const increase = options.increase ? options.increase : 35;
    const decrease = options.decrease ? options.decrease : 65;
    const minOffset = options.offset ? options.offset : 2.5;

    let maxOffset, direction, distance;

    setTimeout(init, 100);

    function init(){
      let scrollPosition = pageYOffset;

      if(typeof target !== 'number'){
        target = that.checkNode(target);
        target = target[0].getBoundingClientRect();

        if(innerHeight > target.height){
          target = target.top - ((innerHeight - target.height) / 2);
        }else{
          target = target.top;
        }

        if(isNaN(target)) return console.error("Target to scroll - not a number!");
      }else{
        target = target - scrollPosition;
      }

      direction = target >= 0 ? 1 : -1;
      distance = target * direction;

      moveScrollPosition(0, scrollPosition);
    }

    function moveScrollPosition(position, scrollPosition){
      var offset, percent;

      percent = getPercent(position, distance);

      if(percent < increase){
        offset = getOffset(percent);
        maxOffset = offset;
      }else if(percent > decrease){
        percent = 100 - percent;
        offset = getOffset(percent);
      }else{
        offset = maxOffset + 5;
      }

      if(position <= distance){
        position = position + offset;
        scrollPosition = scrollPosition + (offset * direction);
        window.scroll(0, scrollPosition);

        setTimeout(function(){
          moveScrollPosition(position, scrollPosition);
        }, 6);
      }
    }

    function getPercent(current, max){
      return (current / (max / 100));
    }

    function getOffset(p){
      const o = Math.log(p) * 4;
      return o > minOffset ? o : minOffset;
    }
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
}

export default Common;