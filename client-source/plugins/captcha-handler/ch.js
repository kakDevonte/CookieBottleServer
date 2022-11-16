import './ch.less';
import Common from './../common.js';

class CaptchaHandler {
  constructor(capthca, url, callback){
    this._$captcha = Common.checkNode(capthca);
    this._response = null;
    this._enabled = false;
    this._callback = typeof callback === 'function' ? callback : null;
    this._url = typeof url === 'string' ? url : null;
    this._$nodes = {
      content: null,
      box: null,
      animate: null
    };

    if(this._$captcha && this._url) return this._init();
    console.error('Неверная инициализация капчи');
  }

  _init(){
    const that = this;
    this._$content = this._$captcha.find('.content');

    if(!this._$content.length){
      this._$captcha.html(CaptchaHandler.generateContent());
      this._$content = this._$captcha.find('.content');
    }

    this._$nodes.content = this._$captcha.find('.content');
    this._$nodes.box = this._$captcha.find('.box');
    this._$nodes.animate = this._$captcha.find('.animate');

    this._animation = {
      start: function(){
        that._$nodes.animate.removeClass('hide');
        that._$nodes.animate.addClass('start');
      },
      cycle: function(){
        that._$nodes.animate.removeClass('start');
        that._$nodes.animate.addClass('cycle');
      },
      end: function(){
        that._$nodes.animate.removeClass('cycle');
        that._$nodes.animate.addClass('end');
      },
      shortEnd: function(){
        that._$nodes.animate.removeClass('start');
        that._$nodes.animate.addClass('end');

        if(that._response === null){
          setTimeout(that.setToError, 550);
        }
      }
    };

    this.setToError = this.setToError.bind(this);
    this._clickHandler = this._clickHandler.bind(this);
    this._$nodes.box.bind('click', this._clickHandler);
  }

  _clickHandler(){
    const that = this;

    if(!that._enabled) return;

    this._response = null;
    this._$captcha.removeClass('error');

    this._animation.start();
    setTimeout(this._animation.shortEnd, 2100);

    $.ajax(this._url, {method: 'POST', data: {captcha: true}})
      .done(function(data, status){
      if(status === "success") that._response = data;
      if(that._callback) return that._callback(that._response);
    });
  }

  activate(){
    if(this._enabled) return this;
    this._enabled = true;
    this._$captcha.addClass('enabled');
    return this;
  }

  deactivate(){
    if(this._enabled){
      this._enabled = false;
      this._$captcha.removeClass('enabled');
    }
    return this;
  }

  setCallback(callback){
    if(typeof callback === 'function') this._callback = callback;
  }

  setToError(){
    this._$captcha.addClass('error');
    this._$nodes.animate.attr('class', 'animate hide');
  }

  getResponse(){
    if(this._response === null){
      this.setToError();
    }
    return this._response;
  }

  validateValue(){
    return this.getResponse();
  }

  static generateContent(){
    return `
      <div class="content">
        <div class="box"></div>
        <div class="animate hide"></div>
        <div class="text">Я не робот</div>
        <div class="logo"></div>
        <span class="info">
          <a target="_blank" href="https://policies.google.com/privacy">Конфеденциальность</a>
        </span>
        <span class="terms">
          <a target="_blank" href="https://policies.google.com/terms">Условия использования</a>
        </span>
      </div>`;
  }

  static security(string, min, max){
    var length, array, group, position, key, index, offset, offset2;

    array = string + "";
    key = randomNumber(min, max);
    length = offset = offset2 = array.length;
    string = randomNumber(key + length * offset2 + 7);

    while(length--){
      position = length % key;
      group = new Array(key);
      index = group.length;
      while(index--){
        group[index] = position === index ? charCode(Number(array[length])) : randomNumber(charCode());
      }
      string += group.join('');
    }

    return string;

    function charCode(index){
      return !isNaN(index) ? randomNumber(offset * offset2 + index + key) : (randomNumber(0, 1) ? randomNumber(65, 90) : randomNumber(97, 122));
    }

    function randomNumber(min, max){
      return (!max) ? String.fromCharCode(min) : Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }
}

export default CaptchaHandler;