import './ih.less';

import Common from './../common.js';

class InputHandler {
  constructor(inputNode, wrapper, placeHolder){
    this._$input = Common.checkNode(inputNode);
    this._type = null;
    this._placeHolder = placeHolder ? placeHolder : null;
    this._input = null;
    this._inputValue = null;
    this._active = null;
    this._error = null;
    this._callback = {};

    if(wrapper){
      this._$wrapper = Common.checkNode(wrapper);
    }else{
      if(this._$input){
        wrapper = this._$input[0].parentNode;
        if(/wrap/.test(wrapper.className)){
          this._$wrapper = $(wrapper);
        }else{
          this._$wrapper = this._$input;
        }
      }
    }

    this._input = this._$input[0];
    this._type = this._$input.attr('data-type');

    return this;
  }

  _runCallbacks(){
    const that = this;

    Object.keys(this._callback).forEach(function(name){
      that._callback[name].f.apply(null, that._callback[name].args);
    });
  }

  static _getCaretPosition(ctrl){
    // IE < 9 Support
    if (document.selection) {
      //ctrl.focus();
      var range = document.selection.createRange();
      var rangelen = range.text.length;
      range.moveStart('character', -ctrl.value.length);
      var start = range.text.length - rangelen;
      return {
        'start': start,
        'end': start + rangelen
      };
    } // IE >=9 and other browsers
    else if (ctrl.selectionStart || ctrl.selectionStart === '0') {
      return {
        'start': ctrl.selectionStart,
        'end': ctrl.selectionEnd
      };
    } else {
      return {
        'start': 0,
        'end': 0
      };
    }
  }

  static _setCaretPosition(ctrl, start, end){
    // IE >= 9 and other browsers
    if (ctrl.setSelectionRange){
      //ctrl.focus();
      ctrl.setSelectionRange(start, end);
    }
    // IE < 9
    else if (ctrl.createTextRange) {
      var range = ctrl.createTextRange();
      range.collapse(true);
      range.moveEnd('character', end);
      range.moveStart('character', start);
      range.select();
    }
  }

  toggleActiveHighlight(){
    if(this._active){
      this._$wrapper.removeClass('active');
      this._active = false;
    }else{
      this.correctValue();
      this._$wrapper.addClass('active');
      this._active = true;
    }

    return this;
  }

  wrongValue(){
    if(!this._error){
      this._$wrapper.addClass('error');
      this._error = true;
    }
  }

  correctValue(){
    if(this._error){
      this._$wrapper.removeClass('error');
      this._error = false;
    }
  }

  toggleErrorHighlight(){
    if(this._error){
      this._$wrapper.removeClass('error');
      this._error = false;
    }else{
      this._$wrapper.addClass('error');
      this._error = true;
    }

    return this;
  }

  /**
   * @param {function} callback
   * @param {=object} args
   * @param {=string} name - имя передаваемой функции
   */
  onInput(callback, args, name){
    if(typeof callback === 'function'){

      if(callback.name !== '') name = callback.name;
      if(!name) name = 'default';

      args = args instanceof Array ? args : [];
      args.push(this);

      this._callback[name] = {
        f: callback,
        args: args
      };

      if(this._input.value !== this._placeHolder) callback.apply(null, args);
    }

    return this;
  }

  deleteCallback(name){
    if(!name) name = 'default';
    delete this._callback[name];
    return this;
  }
}

export default InputHandler;