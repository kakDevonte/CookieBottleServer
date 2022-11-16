import InputHandler from "./ih.js";
import AutoComplete from "./autoComplete.js";
import Common from "../common";

class TextInputHandler extends InputHandler{
  constructor(inputNode, wrapper, placeHolder){
    super(inputNode, wrapper, placeHolder);
    this._inputType = 'text';
    this._autoComplete = null;

    if(this._$input && this._$wrapper) this._init();
    return this;
  }

  _init(){
    const that = this;

    if(this._$input.hasClass('auto-complete'))
      this._autoComplete = new AutoComplete(this);

    this._patterns = {
      'inn': /\D+/g,
      'ogrn': /\D+/g,
      'number': /[^0-9.]+/g,
      'id': /\D+/g,
      'fio': that._fioHandler,
      'phone': that._phoneHandler,
      'specialization': /[^а-яё0-9 \-()'"]+/gi,
      'address': /[a-z<>$+=%]+/gi,
    };
    this._pattern = this._patterns[this._type];

    if(this._type === 'phone') this._$input.attr('max-length', 24);

    this._onInput = this._onInput.bind(this);
    this._showPlaceHolder = this._showPlaceHolder.bind(this);
    this._hidePlaceHolder = this._hidePlaceHolder.bind(this);
    this.toggleActiveHighlight = this.toggleActiveHighlight.bind(this);

    this._$input.bind('input', this._onInput);
    this._$input.bind('keypress', event => this._keyHandle(event));
    this._$input.bind('focus', () => this._onFocus());
    this._$input.bind('blur',  () => this._onBlur());

    this._createPlaceHolder();
    if(this._input.value !== this._placeHolder) this._onInput();
  }

  _onFocus(){
    if(this._autoComplete) this._autoComplete.openList();
    this.toggleActiveHighlight();
  }

  _onBlur(){
    if(this._autoComplete) this._autoComplete.closeList();
    this.toggleActiveHighlight();
  }

  _createPlaceHolder(){
    if(this._placeHolder){
      if(this._input.value === '' || this._input.value === this._placeHolder){
        this._$input.val(this._placeHolder);
        this._$input.addClass('define');
      }
      this._$input.bind('focus', this._hidePlaceHolder);
      this._$input.bind('blur', this._showPlaceHolder);
    }
  }

  _showPlaceHolder(){
    if(!Common.isFocused(this._input)){
      if(this._input.value === ''){
        this._input.value = this._placeHolder;
        this._$input.addClass('define');
      }
    }
  }

  _hidePlaceHolder(){
    if(Common.isFocused(this._input)){
      if(this._input.value === this._placeHolder){
        this._input.value = '';
        this._$input.removeClass('define');
      }
    }
  }

  _onInput(event){
    let value = this._input.value;

    if(typeof this._pattern === 'function'){
      this._pattern(this._input, event);
    }else{
      value = value.replace(/  +/, ' ');

      if(this._pattern)
        value = value.replace(this._pattern, '');

      this._input.value = value;
      this._inputValue = value;
    }

    this._runCallbacks();
  }

  _keyHandle(event){
    if(this._autoComplete) return;
    if(event.originalEvent.key === "Enter") return this._$input.blur();
  }

  _fioHandler(){
    const pattern =/[^а-яё \-]| (?= )|-(?=-)|^ /ig;
    let value, word, count = 0;

    value = this._input.value.replace(pattern, '');
    value = value.match(/([а-яё\-])+ ?/gi);

    if(value){
      value = [value[0], value[1], value[2]];
      while(count < 3){
        word = value[count];
        value[count] = word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '';
        count++;
      }
      if(value[2][value[2].length - 1] === ' ') value[2] = value[2].slice(0, -1);
      value = value[0] + value[1] + value[2];
    }else{
      value = '';
    }
    this._input.value = value;
    this._inputValue = value;
  }

  _phoneHandler(input, event){
    const focused = Common.isFocused(input);
    let length, string, result, caret;

    if(focused) caret = InputHandler._getCaretPosition(input);

    string = input.value.replace(/\D+/g, '');

    if(string.length > 11){
      string = string[1] === '7' || string[1] === '8' ?
        string.substring(2, 12) :
        string.substring(1, 11);
    }else{
      if(string[0] === '7') string = string.substring(1, 11);
      if(string.length === 11 && string[0] === '8') string = string.substring(1, 11);
    }

    this._inputValue = string;
    length = string.length;

    result = '+7 ';
    if(length) result += "(" + ft(string, 1) + ')';
    if(length > 3) result += " - " + ft(string, 2);
    if(length > 6) result += " - " + ft(string, 3);
    if(length > 8) result += " - " + ft(string, 4);

    input.value = result;
    length = result.length;
    if(length <= 3) caret = {start: 3, end: 3};

    if(focused){
      if(event.originalEvent.inputType === 'deleteContentForward' ||
        event.originalEvent.inputType === 'deleteContentBackward'){
        InputHandler._setCaretPosition(input, caret.start, caret.end);
      }
    }

    function ft(string, group){
      switch(group){
        case 1:
          return n(string[0]) + n(string[1]) + n(string[2]);
        case 2:
          return n(string[3]) + n(string[4]) + n(string[5]);
        case 3:
          return n(string[6]) + n(string[7]);
        case 4:
          return n(string[8]) + n(string[9]);
      }

      function n(symbol){
        return symbol ? symbol : "";
      }
    }
  }

  setInputValue(value, validate){
    this._$input.val(value);
    this._$input.removeClass('define');

    if(validate !== false){
      this._onInput();
    }else{
      this._inputValue = value;
    }

    //this._$input.blur();
    return this;
  }

  getInputValue(){
    return this._inputValue ? this._inputValue : '' ;
  }

  setPlaceHolder(placeHolder){
    if(typeof placeHolder === 'string'){
      this._placeHolder = placeHolder;
      this._createPlaceHolder();
    }

    return this;
  }

  get autoComplete(){
    return this._autoComplete;
  }
}

export default TextInputHandler;