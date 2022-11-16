const gifts = [
  {
    id: '24',
    name: 'Молния Зевса',
    hit: '1',
    cost: '50',
    grade: '4',
    img: 'https://cookieapp.ru/img/gifts/24_Молния_Зевса.png',
    category: 'man, fun'
  },
  {
    id: '25',
    name: 'Кольцо',
    hit: '0',
    cost: '50',
    grade: '4',
    img: 'https://cookieapp.ru/img/gifts/25_Кольцо.png',
    category: 'woman'
  },
  {
    id: '26',
    name: 'Рубиновое сердечко',
    hit: '0',
    cost: '50',
    grade: '4',
    img: 'https://cookieapp.ru/img/gifts/26_Рубиновое_сердечко.png',
    category: 'woman'
  },
  {
    id: '27',
    name: 'Венок победителя',
    hit: '0',
    cost: '50',
    grade: '4',
    img: 'https://cookieapp.ru/img/gifts/27_Венок_победителя.png',
    category: 'man, fun'
  },
  {
    id: '28',
    name: 'Букет',
    hit: '0',
    cost: '50',
    grade: '4',
    img: 'https://cookieapp.ru/img/gifts/28_Букет.png',
    category: 'woman, hot'
  },
  {
    id: '29',
    name: 'Чествование',
    hit: '0',
    cost: '50',
    grade: '4',
    img: 'https://cookieapp.ru/img/gifts/29_Чествование.png',
    category: 'fun'
  },
  {
    id: '21',
    name: 'Котята',
    hit: '1',
    cost: '15',
    grade: '3',
    img: 'https://cookieapp.ru/img/gifts/6_Котята.png',
    category: 'cute, hot'
  },
  {
    id: '22',
    name: 'Овечка',
    hit: '0',
    cost: '15',
    grade: '3',
    img: 'https://cookieapp.ru/img/gifts/17_Овечка.png',
    category: 'cute'
  },
  {
    id: '23',
    name: 'Корона',
    hit: '0',
    cost: '15',
    grade: '3',
    img: 'https://cookieapp.ru/img/gifts/23_Корона.png',
    category: 'hat, fun'
  },
  {
    id: '13',
    name: 'Конверт',
    hit: '1',
    cost: '7',
    grade: '2',
    img: 'https://cookieapp.ru/img/gifts/4_Конверт.png',
    category: 'fun'
  },
  {
    id: '14',
    name: 'Ракушка',
    hit: '0',
    cost: '7',
    grade: '2',
    img: 'https://cookieapp.ru/img/gifts/5_Ракушка.png',
    category: 'fun'
  },
  {
    id: '15',
    name: 'Брофист',
    hit: '0',
    cost: '7',
    grade: '2',
    img: 'https://cookieapp.ru/img/gifts/10_Брофист.png',
    category: 'man'
  },
  {
    id: '16',
    name: 'Машина',
    hit: '0',
    cost: '7',
    grade: '2',
    img: 'https://cookieapp.ru/img/gifts/11_Машина.png',
    category: 'man, woman'
  },
  {
    id: '17',
    name: 'Торт',
    hit: '0',
    cost: '7',
    grade: '2',
    img: 'https://cookieapp.ru/img/gifts/15_Торт.png',
    category: 'fun'
  },
  {
    id: '18',
    name: 'Плётка',
    hit: '0',
    cost: '7',
    grade: '2',
    img: 'https://cookieapp.ru/img/gifts/16_Плётка.png',
    category: 'fun'
  },
  {
    id: '19',
    name: 'Шлем космонавта',
    hit: '0',
    cost: '7',
    grade: '2',
    img: 'https://cookieapp.ru/img/gifts/21_Шлем_космонавта.png',
    category: 'hat, fun'
  },
  {
    id: '20',
    name: 'Кокошник',
    hit: '0',
    cost: '7',
    grade: '2',
    img: 'https://cookieapp.ru/img/gifts/22_Кокошник.png',
    category: 'hat, woman'
  },
  {
    id: '1',
    name: 'Роза',
    hit: '0',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/1_Роза.png',
    category: 'woman, hot'
  },
  {
    id: '2',
    name: 'Сердечко',
    hit: '0',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/2_Сердечко.png',
    category: 'woman'
  },
  {
    id: '3',
    name: 'Коктейль',
    hit: '1',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/7_Коктейль.png',
    category: 'woman'
  },
  {
    id: '4',
    name: 'Виски',
    hit: '0',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/8_Виски.png',
    category: 'man, hot'
  },
  {
    id: '5',
    name: 'Мишка',
    hit: '1',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/9_Мишка.png',
    category: 'cute, woman'
  },
  {
    id: '6',
    name: 'Помидор',
    hit: '0',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/12_Помидор.png',
    category: 'fun'
  },
  {
    id: '7',
    name: 'Очиститель',
    hit: '0',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/13_Очиститель.png',
    category: 'fun'
  },
  {
    id: '8',
    name: 'Шарики',
    hit: '0',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/3_Шарики.png',
    category: 'fun, hot'
  },
  {
    id: '9',
    name: 'Скалка',
    hit: '0',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/14_Скалка.png',
    category: 'fun'
  },
  {
    id: '10',
    name: 'Ковбойская шляпа',
    hit: '0',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/18_Ковбойская_шляпа.png',
    category: 'hat'
  },
  {
    id: '11',
    name: 'Кроличьи ушки',
    hit: '0',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/19_Кроличьи_ушки.png',
    category: 'hat, cute'
  },
  {
    id: '12',
    name: 'Шапка-ушанка',
    hit: '0',
    cost: '2',
    grade: '1',
    img: 'https://cookieapp.ru/img/gifts/20_Шапка-ушанка.png',
    category: 'hat'
  }
];

module.exports = gifts;