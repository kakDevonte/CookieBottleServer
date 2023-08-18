/**
 * Класс для хранения данных игрока для игры
 */
class Player {
  constructor(current) {
    this._uid = null;
    this._type = null;
    this._seat = null;
    this._kiss = null;
    this._gender = null;
    this._autoKiss = false;
    this._autoTurn = false;
    this._emittedKiss = false;
    this._rotateReceived = false;
    this._active = current;
  }

  set type(type){
    this._type = type;
  }
  set uid(uid){
    this._uid = uid;
  }
  set kiss(result){
    this._kiss = result;
  }
  set gender(gender){
    this._gender = gender;
  }
  set autoKiss(auto){
    this._autoKiss = auto;
  }

  set autoTurn(auto){
    this._autoTurn = auto;
  }

  set seat (seat) {
    this._seat = seat;
  }

  set active(active) {
    this._active = active;
  }

  set active(active) {
    this._active = active;
  }

  set emittedKiss(flag) {
    this._emittedKiss = flag;
  }

  set rotateReceived(flag) {
    this._rotateReceived = flag;
  }

  get rotateReceived() {
    return this._rotateReceived;
  }
  get type(){
    return this._type;
  }
  get emittedKiss(){
    return this._emittedKiss;
  }
  get uid(){
    return this._uid;
  }
  get gender() {
    return this._gender;
  }
  get kiss(){
    return this._kiss;
  }
  get autoKiss(){
    return this._autoKiss;
  }

  get autoTurn(){
    return this._autoTurn;
  }

  get seat() {
    return this._seat;
  }

  get active() {
    return this._active;
  }

  /**
   * Возвращет упакованные данные для записи в историю
   * @returns {*[]} - [uid, type, kiss, autoTurn, autoKiss, resultEmitted, active]
   */
  get() {
    return [
      this._uid,
      this._type,
      this._seat,
      this._kiss,
      this._autoTurn,
      this._autoKiss,
      this._active,
      this._emittedKiss,
      this._rotateReceived
    ];
  }

  /**
   * Обнуляет данные игрока
   */
  reset() {
    this._uid = null;
    this._type = null;
    this._seat = null;
    this._kiss = null;
    this._gender = null;
    this._autoKiss = false;
    this._autoTurn = false;
    this._emittedKiss = false;
    this._rotateReceived = false;
  }
}

module.exports = Player;