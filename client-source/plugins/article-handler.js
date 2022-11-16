import Common from "./common.js";
import wh from "./window-handler/wh.js";

class ArticlesHandler{
  constructor(window, holder, size){
    this._$window = Common.checkNode(window);
    this._current = 0;
    this._count = 0;
    this._error = false;
    this._size = size;
    this._callback = null;
    this._navLeft = null;
    this._navRight = null;
    this._container = null;
    this._$articles = null;
    this._$pagination = null;
    this._$buttons = null;
    this._$images = null;
    this._$titles = null;

    this._holder = {
      container: null,
      elem: null,
      image: null,
      title: null
    };

    this._selected = {
      id: null,
      price : 0,
      name: '',
      image: ''
    };

    this.connect(holder);
    this._init();
  }

  _init(){
    this._navLeft = this._$window.find('nav.left')[0];
    this._navRight = this._$window.find('nav.right')[0];
    this._$buttons = this._$window.find('input.button');
    this._container = this._$window.find('.articles')[0];
    this._$articles = this._$window.find('article');
    this._$images = this._$window.find('.image');
    this._$titles = this._$window.find('.articles header');
    this._count = this._$articles.length;

    this._createDots();
    this._clickHandler();
  }

  _clickHandler(){
    const that = this;

    this._$window.bind('click', function(event){
      let element = event.target;

      if(that._navLeft === element) that.moveLeft();
      if(that._navRight === element) that.moveRight();
      if(that._$buttons[that._current] === element) that.selectArticle();
    });
  }

  _createDots(){
    let n = this._count;
    let content = '';

    while(n--){
      if(content === ''){
        content += '<li class="active"></li>';
      }else{
        content += '<li></li>';
      }
    }

    this._$window.find('ul.pagination').html(content);
    this._$pagination = this._$window.find('li');
  }

  _toggleDots(){
    this._dotOff();
    setTimeout(() => this._dotOn(), 300);
  }

  _dotOn(){
    this._$pagination[this._current].className = 'active';
  }
  _dotOff(){
    this._$pagination[this._current].className = '';
  }

  connect(element){
    this._holder.elem = Common.checkNode(element);
    this._holder.container = this._holder.elem.parent();
    this._holder.image = this._holder.elem.find('.image');
    this._holder.title = this._holder.elem.find('.title');

    this._holder.elem.bind('click', ()=> this.open());
  }

  open(){
    this.correctValue();
    wh.open(this._$window);
    if(isNaN(this._size)) this._size = this._container.parentNode.getBoundingClientRect().width;
  }

  selectArticle(article, remote){
    article = article != null ? this._idToCurrent(article) : this._current;
    if(article === null) return console.error('Не могу найти и выбрать article!');

    const id = this._$buttons[article].getAttribute('data-id');
    const name = this._$titles[article].textContent;
    const image = this._$images[article].getAttribute('style');
    const price = $(this._$articles[article]).find('.price span').text();

    this._selected.id = id;
    this._selected.name = name;
    this._selected.image = image.match(/.+image: url\("(.+)"\).+/)[1];
    this._selected.price = price ? Number(price.split(' ')[0]) : 0;

    this._holder.image.attr('style', image);
    this._holder.title.html(this._selected.name);

    if(remote) this.moveTo(article);
    if(this._callback) this._callback(this);
    wh.close(this._$window);

    return this.getSelected();
  }

  _idToCurrent(article){
    if(typeof article === "number") return article;
    let length = this._$buttons.length;

    while(length--){
      if(this._$buttons[length].getAttribute('data-id') === article)
        return length;
    }
    return null;
  }

  getSelected(){
    return this._selected;
  }

  moveLeft(){
    this._toggleDots();
    this._current--;
    if(this._current === -1) this._current = this._count - 1;
    this._container.setAttribute('style', `left: ${-1 * this._current * this._size}px;`);
  }

  moveRight(){
    this._toggleDots();
    this._current++;
    if(this._current === this._count) this._current = 0;
    this._container.setAttribute('style', `left: ${-1 * this._current * this._size}px;`);
  }

  moveTo(current){
    if(this._size)
      this._toggleDots();
      this._current = current;
      this._container.setAttribute('style', `left: ${-1 * this._current * this._size}px;`);
  }

  onSelectArticle(callback){
    this._callback = typeof callback === 'function' ? callback : null;
  }

  validateValue(){
    if(this._selected.id === null){
      this.wrongValue();
      return null;
    }else{
      return this.getSelected();
    }
  }

  wrongValue(){
    if(!this._error){
      this._holder.container.addClass('error');
      this._error = true;
    }
  }

  correctValue(){
    if(this._error){
      this._holder.container.removeClass('error');
      this._error = false;
    }
  }
}

export default ArticlesHandler;