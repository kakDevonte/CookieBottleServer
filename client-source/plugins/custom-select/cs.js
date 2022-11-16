import './cs.less';
/**
 * @param selector {String} - селектор узла где располагается селект
 * @param options {=Object} - Объект для хранения полученных со сраницы данных
 * @constructor
 */
function CustomSelect(selector, options){
  this._$container = $(selector).addClass('custom-select');
  this._options = options ? options : {};
  this._opened = false;
  this._error = null;
  this._item = {
    key: null,
    node: null
  };

  this._hashedList = {};

  if(!options.list) options.list = [];

  this._render();
  this._setup();
}

CustomSelect.prototype = {
  _render: function(){
    this._$container.html(createHTML(this._options));
  },

  _setup: function(){
    var that = this;

    this._options.list.forEach(function(item){
      that._hashedList[item.key] = item;
    });

    this._$wrapper = $(this._$container[0].parentNode);
    this._$input = this._$container.find('.select-input');
    this._$layerClosing = this._$container.find('.layer-closing');
    this._$placeholder = this._$input.find('span');

    if(this._options.selected) this.selectItem(this._options.selected);
    this._bind();
  },

  open: function(){
    this.correctItemSelected();
    this._$container.addClass('opened');
    this._opened = true;
  },

  close: function(){
    this._$container.removeClass('opened');
    this._opened = false;
  },

  _bind: function(){
    this._eventHandler = this._eventHandler.bind(this);
    this._$container.on('click', this._eventHandler);
  },

  _eventHandler: function(event){
    var target = event.target.parentNode;

    if(event.target === this._$input[0] || target === this._$input[0] || event.target === this._$layerClosing[0]){
      this._toggle();
    }else{
      if(event.target.getAttribute('data-type') === 'item'){
        this.selectItem(event.target);
      }
      if(target.getAttribute('data-type') === 'item'){
        this.selectItem(target);
      }
    }
  },

  selectItem: function(key){
    var node, item;

    if(typeof key === 'number') key = key + '';
    if(typeof key === "string"){
      node = this._$container.find('[data-type="item"][data-key="' +key+ '"]');
      node = node[0];
    }else if(!node) node = key;
    if(!node) return false;

    this._item.node = node;
    this._item.key = node.getAttribute('data-key');

    item = this._hashedList[this._item.key];
    this._item.value = item.result ? item.result : item.value;

    if(typeof item.value === "string"){
      this._$placeholder.text(item.value);
    }else{
      this._$placeholder.text(item.value[0]);
    }

    if(this._opened) this.close();
    if(this._options.callback) this._options.callback(this._item);

    this._$container.find('.item.active').removeClass('active');
    $(this._item.node).addClass('active');
  },

  _toggle: function(){
    if(this._opened){
      this.close();
    }else{
      this.open();
    }
  },

  getSelectedItem: function(){
    return this._item;
  },

  wrongItemSelected: function(){
    if(!this._error){
      this._$wrapper.addClass('error');
      this._error = true;
    }
  },

  correctItemSelected: function(){
    if(this._error){
      this._$wrapper.removeClass('error');
      this._error = false;
    }
  },

  validateValue(){
    if(this._item.key !== null){
      this.correctItemSelected();
      return this._item;
    }
    this.wrongItemSelected();
    return null;
  }
};

function createHTML(options){
  var result, list, placeholder, content;

  list = options.list;
  placeholder = options.placeholder ? options.placeholder : "Текст не задан";
  result = '';

  list.forEach(function(item){
    if(typeof item.value !== 'string'){
      content = '';
      item.value.forEach(function(value){
        content += '<div>' + value + '</div>';
      });
    }else{
      content = item.value;
    }

    result += '<li class="item" data-key="' + item.key + '" data-type="item">' + content + '</li><li class="separator"></li>';
  });

  if(result !== '') result = '<div class="layer-closing"></div><ul class="select-items">' + result + '</ul>';
  result = '<div class="select-input"><span>' + placeholder + '</span><i class="icon icon-chevron-down"></i></div>' + result;
  return result;
}

export default CustomSelect;