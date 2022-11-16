/**
 * Вызывает функцию через указанное количество миллисекунд в контексте ctx с аргументами args.
 * @param {int} timeout
 * @param {Object=} ctx
 * @param {Array=} args
 * @return {Number} Идентификатор таймаута.
 */
Function.prototype.delay = function(timeout, ctx, args){
  var func = this;
  return setTimeout(function(){
    func.apply(ctx || this, args || []);
  }, timeout);
};