import TextInputHandler from "./input-handler/text";
import CheckBoxInputHandler from "./input-handler/checkbox";
import Common from "./common";

const inputController = function(inputNode, wrapper, placeHolder){
  inputNode = Common.checkNode(inputNode);

  const classes = {
    'text': TextInputHandler,
    'checkbox': CheckBoxInputHandler,
    'button': 'ignore',
    'hidden': 'ignore',
    'submit': 'ignore'
  };
  const type = inputNode.attr('type');

  if(!classes[type]) return console.error(`Нет класса ${type}`);
  if(classes[type] === 'ignore') return null;

  return new class InputController extends classes[type]{
    constructor(inputNode, wrapper, placeHolder){
      super(inputNode, wrapper, placeHolder);
      this._correct = true;
      this._equals = [];
    }

    /**
     * @param {=function}callback
     * @returns {*}
     */
    validateValue(callback){
      switch(this._type){
        case 'id':
          return this._checkResult(
            this.minLength(1).isCorrect()
          );

        case 'address':
          return this._checkResult(
            this.minLength(10).maxLength(100).isCorrect()
          );

        case 'phone':
          return this._checkResult(
            this.equalLength(10).isCorrect()
          );

        case 'inn':
          return this._checkResult(
            this.equalLength(10).equalLength(12).isCorrect()
          );

        case 'ogrn':
          return this._checkResult(
            this.equalLength(13).isCorrect()
          );

        case 'fio':
          return this._checkResult(
            this.checkName(3)
          );

        case 'terms':
          return this._checkResult(
            this.identically(true).isCorrect()
          );

        default:
          if(typeof callback === 'function'){
            return this._checkResult(
              callback.apply(this)
            );
          }
      }
    }

    _checkResult(result){
      if(result){
        this.correctValue();
        return this.getInputValue();
      }
      this.wrongValue();
      return null;
    }

    /**
     * @param v
     * @returns {InputController}
     */
    identically(v){
      if(v !== this._inputValue)
        this._correct = false;
      return this;
    }

    /**
     * @param {number} n
     * @returns {InputController}
     */
    minLength(n){
      if(isNaN(n) || n > this._inputValue.length)
        this._correct = false;
      return this;
    }


    /**
     * @param {number} n
     * @returns {InputController}
     */
    maxLength(n){
      if(isNaN(n) || n < this._inputValue.length)
        this._correct = false;
      return this;
    }

    /**
     * @param {number} v
     * @returns {InputController}
     */
    equalLength(v){
      this._equals.push(!isNaN(v) && v === this._inputValue.length);
      return this;
    }

    /**
     * @param v
     * @returns {InputController}
     */
    equalValue(v){
      this._equals.push(v === this._inputValue);
      return this;
    }

    isCorrect(){
      const result = this._correct && this._getEqualsResult();
      this._correct = true;
      return result;
    }

    _getEqualsResult(){
      let i = 0, max = this._equals.length;

      if(max === 0) return true;
      while(i < max){
        if(this._equals[i]){
          this._equals = [];
          return true;
        }
        i++;
      }

      this._equals = [];
      return false;
    }

    checkName(countWords){
      if(countWords === 1) return /^[а-яё\-]+$/i.test(this._inputValue);
      if(countWords === 2) return /^[а-яё\-]+ [а-яё\-]+$/i.test(this._inputValue);
      if(countWords === 3) return /^[а-яё\-]+ [а-яё\-]+ [а-яё\-]+$/i.test(this._inputValue);
    }
  }(inputNode, wrapper, placeHolder);
};

export default inputController;