module.exports = function (data){

  if(global.debug){
    data.DEBUG = JSON.stringify(global.debug);
    global.debug = null;
  }

  return data;
};