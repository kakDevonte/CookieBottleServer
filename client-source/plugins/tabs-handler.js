import Common from "./common";

class TabsHandler{
  constructor(wrapper){
    wrapper = Common.checkNode(wrapper);
    if(!wrapper) return;

    this._$tabs = wrapper.find('.tabs');
    this._$buttons = this._$tabs.find('.tab');
    this._active = null;
    this._tabs = {};

    this._init(wrapper);
    this._clickHandler();
  }

  _init(wrapper){
    const that = this;

    this._$buttons.each(function(){
      const button = $(this);
      const id = this.getAttribute('data-tab');

      if(id){
        if(this.classList.contains('active')) that._active = id;

        that._tabs[id] = {
          button: button,
          content: wrapper.find(`[data-content="${id}"]`)
        }
      }
    });
  }

  _clickHandler(){
    const that = this;

    this._$tabs.bind('click', function(event){
      const button = event.target.parentNode;

      if(button.classList.contains('tab')){
        const id = button.getAttribute('data-tab');
        if(that._active !== id) that.setActiveTab(id);
      }
    });
  }

  _getIdFromNumber(n){
    const button = this._$buttons[n];
    if(button) return this.setActiveTab(button.getAttribute('data-tab'));
  }

  /**
   * @param id {Number|String}  Number - порядковый номер кнопки, String - id кнопки
   * @returns {TabsHandler}
   */
  setActiveTab(id){
    if(typeof id === "number") return this._getIdFromNumber(id);
    if(this._tabs[id]){
      this._tabs[this._active].button.removeClass('active');
      this._tabs[this._active].content.removeClass('active');
      this._tabs[id].button.addClass('active');
      this._tabs[id].content.addClass('active');
      this._active = id;
    }
    return this;
  }

  /**
   * @returns {{id: string, button: jQuery, content: jQuery}}
   */
  getActiveTab(){
    return {
      id: this._active,
      button: this._tabs[this._active].button,
      content: this._tabs[this._active].content
    };
  }
}

export default TabsHandler;