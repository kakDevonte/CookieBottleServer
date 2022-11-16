import InputHandler from "./ih.js";

class CheckBoxInputHandler extends InputHandler{
  constructor(inputNode, wrapper){
    super(inputNode, wrapper);
    this._inputType = 'checkbox';

    if(this._$input && this._$wrapper) this._init();
    return this;
  }

  _init(){
    this._onInput = this._onInput.bind(this);
    this._$input.bind('click', this._onInput);
    this._onInput();
  }

  _onInput(){
    this._inputValue = this._input.checked;
    if(this._inputValue) this.correctValue();
  }

  setInputValue(value){
    this._input.checked = !!value;
    this._inputValue = this._input.checked;
    return this;
  }

  getInputValue(){
    return this._inputValue;
  }
}

export default CheckBoxInputHandler;