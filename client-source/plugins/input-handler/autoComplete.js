class AutoComplete {
  /**
   * @param {TextInputHandler} TextInputHandler
   */
  constructor(TextInputHandler){
    this._handler = TextInputHandler;
    this._$container = null;
    this._$items = null;
    this._list = [];
    this._item = -1;

    this._createContainer();
    this._createList([]);
    this._clickHandler();
    this._buttonHandler();

    return this;
  }

  _createContainer(){
    this._$container = $('<ul class="auto-complete-container">');
    this._handler._$input.parent().append(this._$container);
    this._setPosAndSize();
  }

  _setPosAndSize(){
    const size = this._handler._input.getBoundingClientRect();
    if(size.width && size.height){
      this._$container.attr('style', `width: ${size.width}px; top: ${size.height + this._handler._input.offsetTop}px;`);
    }
  }

  _clickHandler(){
    const that = this;

    this._$container.bind('mousedown', function(event){
      const item = $(event.target);
      if(item.hasClass('item')) that.selectItem(item);
    });
  }

  _buttonHandler(){
    const that = this;

    this._handler._$input.bind('keydown', function(event){
      switch(event.originalEvent.key){
        case "ArrowUp":
          event.preventDefault();
          that.switchItem('prev');
          break;

        case "ArrowDown":
          event.preventDefault();
          that.switchItem('next');
          break;

        case "Enter":
          that.selectItem();
          break;

        default: return;
      }
    });
  }

  _switch(key){
    this._$item.removeClass('active');
    this._item = key ? this._item + 1 : this._item -1;
    this._$item.addClass('active');
  }

  get _$item(){
    return $(this._$items[this._item]);
  }

  _createList(list){
    let code = '', i = 0, length = list.length;

    this._list = list;
    for(i; i < length; i++) code += `<li class="item">${list[i]}</li><li></li>`;
    this._$container.html(code);
    this._$items = this._$container.find('.item');

    return this;
  }

  switchItem(element){
    if(element === "next"){
      if((this._item + 1) === this._$items.length) return this;
      this._switch(true);
    }else if(element === "prev"){
      if((this._item - 1) === -1) return this;
      this._switch(false);
    }

    return this;
  }

  selectItem(item){
    let $item = item ? item : this._$item;

    if($item.length) this._handler.setInputValue($item.text());
    this.closeList();
    this._handler._$input.blur();
    return this;
  }

  updateList(list){
    if(list instanceof Array){
      let i, length = list.length;

      if(length !== this._list.length) return this._createList(list);
      for(i = 0; i < length; i++){
        if(list[i] !== this._list[i]) return this._createList(list);
      }
    }
    return this;
  }

  openList(){
    if(!this._$container.attr('style'))
      this._setPosAndSize();

    this._$item.removeClass('active');
    this._item = -1;
    this._$container.addClass('active');
    return this;
  }

  closeList(){
    this._$container.removeClass('active');
    return this;
  }
}

export default AutoComplete;