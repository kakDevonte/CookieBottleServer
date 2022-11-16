class Transfer{
  /**
   * @param req {object} Request
   * @param object {*} {transfer Object}
   * @param key {=string} Key of object
   */
  send(req, object, key){
    if(!req.session.Transfer) req.session.Transfer = {};
    if(!key){
      req.session.Transfer = object;
    }else{
      req.session.Transfer[key] = object;
    }
  }

  receive(req, object){
    if(req.session.Transfer){
      const o = Object.assign(object, req.session.Transfer);
      delete req.session.Transfer;
      return o;
    }
    return object;
  }
}

module.exports = new Transfer();