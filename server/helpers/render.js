const Path = require('path');
const clientLayout = Path.join(__dirname + '/../../client/layouts/');

/**
 * @param res - Response от Router
 * @param path - Путь к файлу шаблона
 * @param data - передаваемая информация в req.body
 * @param status {=number} - статус код
 * @returns {Promise<>}
 */
module.exports = function(res, path, data, status){
  return new Promise(function(resolve){
    let side = "client", _path;

    status = status ? status : 200;

    if(data.typePage === "control"){
      side = "control";
    }

    _path = path.split('/');
    if(_path.length === 1){
      //        side  directory  file
      path = `${side}/${path}/${path}.hbs`;
      data.layout = `${side}-${_path[0]}`;
    }else{
      //        side  directory + file
      path = `${side}/${path}.hbs`;
      data.layout = `${side}-${_path[1]}`;
    }

    if(process.env.NODE_ENV === 'production'){
      res.status(status).render(path, data);
      resolve();
    }else{
      res.render(path, data, function(err, html){
        if(err) return console.error(path, err);
        html = html.replace(/  +|\r\n/g, '');
        res.status(status).send(html);
        resolve();
      });
    }
    }
  );
};