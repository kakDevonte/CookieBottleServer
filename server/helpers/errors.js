/**
 * @param e {Error}
 * @param container {Array}
 * @returns {*}
 */
module.exports = function (e, container){
  try{
    let message = "<br>";

    if(e.name === "MongoError"){
      container.push("Ошибка БД: " + e.errmsg);
      return;
    }

    if(e.name === "ValidationError"){
      Object.keys(e.errors).forEach((name) => {
        message += `${e.errors[name].message} Type: ${e.errors[name].name}. <br> `;
      });

      container.push(e._message + ". <br> Ошибка: " + message);
      return;
    }

    if(e.name === "CastError"){
      message = "Ожидалось " + e.kind + " в поле " + e.path;
      container.push("Некорректный тип данных.<br>Ошибка: " + message);
      return;
    }

    throw e;
  }catch(error){
    if(e !== error) console.log(e);
    console.log('------------------ Error: ');
    console.log(error);

    container.push('Что то сломалось! Попробуйте снова, позже.');
  }
};