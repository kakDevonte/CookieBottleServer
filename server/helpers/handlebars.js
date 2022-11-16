const Common = require('./common.js');
const date = require('./date.js');
const EXPHBS = require('express-handlebars');

const HBS = {
  viewEngine: null,

  create: function(){
    HBS.viewEngine = EXPHBS.create({
      extname: "hbs",
      defaultLayout: 'layout',
      layoutsDir: process.env.NODE_ENV ===  'production' ? 'public/content/layouts/' :'public/content/layouts/',
      partialsDir: process.env.NODE_ENV === 'production' ? 'client-source/views-compressed/' : 'client-source/views/'
    });

    HBS.registerHelpers(HBS.viewEngine.handlebars);
    return HBS.viewEngine;
  },

  helpers: {
    getNormalDate: date.normalize,
    isNull: Common.isNull,
    inJSON: Common.inJSON,
    formatting: Common.formatting,
    errorsRender: Common.errorsRender,
    convertPhoneNumber: Common.convertPhoneNumber,

    connect: function(a, b, c, d){
      if(typeof c !== 'string') c = '';
      if(typeof d !== 'string') d = '';
      return `${a}${b}${c}${d}`;
    },

    iff: function(a, operator, b, opts) {
      let bool = false;

      switch(operator) {
        case '==':
          bool = a == b;
          break;
        case '>':
          bool = a > b;
          break;
        case '>=':
          bool = a >= b;
          break;
        case '<':
          bool = a < b;
          break;
        case '<=':
          bool = a <= b;
          break;
        case '!=':
          bool = a != b;
          break;

        default:
          throw "Unknown operator " + operator;
      }

      if (bool) {
        return opts.fn(this);
      } else {
        return opts.inverse(this);
      }
    },

    multiple: function(index, max, data, block){
      var i, fragment = "", arr;

      if(!max) return fragment;
      if(!index) data.index = 0;

      for(i = index; i < max; i++){
        if(!data) data = {};
        data.index = i;
        data.max = max;
        fragment += block.fn(data);
      }
      return fragment;
    },

    toPageData: function(key, value){
      return `<script data-name="${key}">if(!window.PageData) window.PageData = {};window.PageData['${key}'] = ${Common.inJSON(value)};document.querySelector('script[data-name="${key}"]').parentNode.removeChild(document.querySelector('script[data-name="${key}"]'));</script>`;
    },

    toPageDataMass: function(name){
      const args = arguments;

      let result = `<script data-name="${name}">if(!window.PageData) window.PageData = {};`;
      let i, length;

      length = args.length - 1;

      for(i = 1; i < length; i = i + 2){
        const key = args[i], data = args[i + 1];

        if(data){
          if(data.name !== 'toPageDataMass')
            result += `window.PageData['${key}'] = ${JSON.stringify(data)};`;
        }
      }
      result += `document.querySelector('script[data-name="${name}"]').parentNode.removeChild(document.querySelector('script[data-name="${name}"]'));</script>`;

      return result;
    },

    exist: function(value, block){
      if(value != null) return block.fn(this);
    },

    inArray: function(value, array, block){
      let i, length;
      for(i = 0, length = array.length; i < length; i++){
        if(array[i] == value) return block.fn(this);
      }
    },

    getStampTypes: function(array, types){
      if(array instanceof Array){
        const max = array.length;
        let i, n, result = '';

        for(i = 0, n = 0; i < max; i++){
          if(types[array[i]]){
            if(i) result += ', ';
            result += types[array[i]];
            n++;
          }
        }

        return `${n} / ${types.count}<div>${result}</div>`;
      }else{
        return `0 / ${types.count}<div></div>`;
      }
    },

    getListStampType: function(types, array){
      let result = '', checked = '';

      if(!(array instanceof Array)) array = false;

      for(let id in types){
        if(id !== 'count'){
          if(array) checked = array.find(el => el === id) ? 'checked ' : '';
          result += `<label><input type="checkbox" name="types" value="${id}" ${checked}/>${types[id]}</label>`;
        }
      }

      return `<div class="list-types">${result}</div>`;
    },

    load: function(path, exphbs){
      if(exphbs.data.exphbs.partials[path]){
        return exphbs.data.exphbs.partials[path](this, exphbs);
      }else{
        console.log(`Partial on path ${path}, not found!`);
        return `<div style="color: red">Partial on path ${path}, not found!</div>`;
      }
    },

    getArticles: function(id, articles, block){
      let i, length, article, result = '';

      id = id + '';
      for(i = 0, length = articles.length; i < length; i++){
        article = articles[i];
        if(!article.hide && article.types.find(type => id === type)){
          result += block.fn(article);
        }
      }
      return result;
    },

    /**
     * @param string {string} Строка для разделения на слова и помещения их в span
     * @param className {=string} имя класса у span
     * @returns {string}
     */
    wordsInSpans: function(string, className){
      let result = '';
      className = typeof className === 'string' ? ` class="${className}"` : "";
      string.split(' ').forEach(function(word){
        if(word !== '') result += `<span${className}>${word}</span> `;
      });
      return result.trim();
    },

    wordEnding: function(count, word){
      switch(word){
        case 'час':
          return Common.declOfNum(count, ['час', 'часа', 'часов']);

        default:
          return count + ' ' + word;
      }
    },

    isSelected: function(key, value) {
      return key === value ? 'selected="selected"' : '';
    },

    isChecked: function(key, value) {
      if(key && value && key[value]) return 'checked="checked"';
      return key === value ? 'checked="checked"' : '';
    },

    keyValue: function(object, key) {
      return object[key] ? object[key] : '';
    },

    notEmpty(object, block) {
      if(!object) return null;
      if(object.length > 0) return block.fn(this);
      if(Object.keys(object).length > 0) return block.fn(this);
    }
  },

  registerHelpers: function(Handlebars){
    let helper;

    for(helper in HBS.helpers){
      Handlebars.registerHelper(helper, HBS.helpers[helper]);
    }
  }
};

module.exports = HBS;