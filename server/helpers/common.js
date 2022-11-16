module.exports = {
  isNull: function(key, result){
    if(key != null){
      return key;
    }else{
      return result;
    }
  },

  inJSON: function(object, r, t){
    return JSON.stringify(object);
  },

  formatting: function(string){
    return string.replace(/\r\n/g, '<br/>');
  },

  errorsRender: function(errors){
    if(!errors) return null;
    if(typeof errors === 'string') return errors;
    if(!errors.length) return null;
    return errors.join('<br>');
  },

  convertPhoneNumber: function(phone){
    if(!phone) return;
    phone = phone.toString();
    if(phone.length !== 10) return;
    return '+7 (' +d(0)+d(1)+d(2) + ') - ' +d(3)+d(4)+d(5) + ' - ' + d(6)+d(7)+ ' -  ' +d(8)+d(9);

    function d(n){
      return phone.charAt(n)
    }
  },

  declOfNum: function (number, titles){
    const cases = [2, 0, 1, 1, 1, 2];
    return number + ' ' +  titles[
      (number % 100 > 4 && number % 100 < 20) ?
        2 :
        cases[(number % 10 < 5) ? number % 10 : 5]
      ];
  }
};