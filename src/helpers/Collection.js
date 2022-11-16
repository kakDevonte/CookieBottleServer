/**
 * Класс расширяющий Map с дополнительными методами для работы с индексами коллекции
 * remove() take() extract()
 */
class Collection extends Map {
  /**
   * @param iterable
   * @returns {Collection}
   */
  constructor(iterable) {
    super(iterable);
    return this;
  }

  /**
   * Удаляет элементы коллекции по индексу
   * @param start {number} - начальный индекс
   * @param count {=number} - количество удаляемых элементов (по умолчанию 1)
   * @returns {number} - количество удаленных элементов
   */
  remove(start, count = 1) {
    let
      key,
      i = 0,
      deleted = 0;

    for(key of super.keys()) {
      if(i === start) {
        super.delete(key);

        deleted++;
        start++;
        count--;

        if(count === 0) return deleted;
      }
      i++;
    }

    return deleted;
  }

  /**
   * Возвращает элементы из коллекции по индексу
   * @param start {number} - начальный индекс
   * @param count {=number} - количество нужных элементов (по умолчанию 1)
   * @param extract {=boolean} - используйте extract()
   * @returns {[]} - массив требуемых элементов
   */
  take(start, count = 1, extract = false) {
    let
      key,
      i = 0,
      elements = [];

    for(key of super.keys()) {
      if(i === start) {
        elements.push( super.get(key) );
        if(extract) super.delete(key);

        start++;
        count--;

        if(count === 0) return elements;
      }
      i++;
    }

    return elements;
  }

  /**
   * Получает один элемент из коллекции
   * @param index - искомый индекс
   * @returns {User|Bot}
   */
  takeOne(index){
    return this.take(index, 1)[0];
  }

  /**
   * Извлекает элементы из коллекции по индексу, изменяя коллекцию
   * @param start {number} - начальный индекс
   * @param count {=number} - количество нужных элементов (по умолчанию 1)
   * @returns {[]} - массив извлеченных элементов
   */
  extract(start, count = 1) {
    return this.take(start, count, true);
  }

  /**
   * Находит один елемент в коллекции и возвращает его или null
   * @param value {*}
   * @param key {string}
   * @returns {[item, index]}
   */
  findOne(value, key) {
    let index, item;

    if(key) {
      for([index, item] of this.entries()) {
        if(item && item[key] === value) return [item, index];
      }
    } else {
      for([index, item] of this.entries()) {
        if(item === value) return [item, index];
      }
    }

    return [null, null];
  }
}

module.exports = Collection;