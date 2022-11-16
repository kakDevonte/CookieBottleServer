import './wh.less';
import Common from './../common.js';

class WindowHandler {
  constructor(){
    this.$shadowLayer = WindowHandler._createShadowLayer();

    this.closeAllWindows = this.closeAllWindows.bind(this);
    this.$shadowLayer.bind('click', this.closeAllWindows);
    this._$body = $(document.body);
  }

  static _createShadowLayer(){
    let layer;

    layer = $('#shadow-layer');
    if(layer[0]) return layer;

    layer = $('<div id="shadow-layer" title="Клик закроет это окно" data-controlled="true">');
    document.body.appendChild(layer[0]);
    return layer;
  }

  _isControlled(){
    return this.$shadowLayer.attr('data-controlled') === "true";
  }

  _isOpened(){
    return this.$shadowLayer.hasClass('opened');
  }

  _openShadowLayer(){
    if(!this._isOpened()){
      this.$shadowLayer.addClass('opened');
    }
  }

  _closeShadowLayer(){
    if(this._isOpened()){
      this.$shadowLayer.removeClass('opened');
    }
  }

  _disableBodyScroll(){
    if(!this._$body.hasClass('no-scroll'))
      this._$body.addClass('no-scroll');
  }

  _enableBodyScroll(){
    if(this._$body.hasClass('no-scroll'))
      this._$body.removeClass('no-scroll');
  }

  _toggleWindow(window, action){
    window = Common.checkNode(window);

    if(action === "open"){
      this._disableBodyScroll();
      this._openShadowLayer();
      if(!window.hasClass('opened'))
        window.addClass('opened');
    }else{
      if(window.hasClass('opened'))
        window.removeClass('opened');
      this._closeShadowLayer();
      this._enableBodyScroll();
    }
  }

  closeAllWindows(){
    const that = this;
    let windows;

    if(this._isControlled()){
      $('div[class*="-window"].opened').each(function(){
        windows = true;
        that.close(this);
      });

      if(!windows) that._closeShadowLayer();
    }
  }

  /**
   *
   * @param window {string|jQuery|HTMLAllCollection} - открываемое окно
   */
  open(window){
    this._toggleWindow(window, 'open');
  }

  /**
   *
   * @param window {string|jQuery|HTMLAllCollection} - закрываемое окно
   */
  close(window){
    this._toggleWindow(window, "close");
  }

  /**
   *
   * @param window {string|jQuery|HTMLAllCollection} - переключаемое окно
   */
  toggle(window){
    if(this._isOpened()){
      this._toggleWindow(window, 'close');
    }else{
      this._toggleWindow(window, 'open');
    }
  }

  disableControl(){
    this.$shadowLayer
      .attr('data-controlled', 'false')
      .attr('title', '');
  }

  enableControl(){
    this.$shadowLayer
      .attr('data-controlled', 'true')
      .attr('title', 'Клик закроет это окно');
  }
}

export default new WindowHandler();