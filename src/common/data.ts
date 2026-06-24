import { worksImage, TILDA_IMAGES } from './tilda-images';

// ─────────────────────────────────────────────────────────────
// data.jsx — единый источник правды для каталога M.Bez.
// 22 работы (20 с фото · 1 без фото MN-03 · 2 круглых-тондо) · 4 серии.
//
// Структура image:
//   image: { thumb: 'path-600.jpg', large: 'path-1600.jpg', full: 'path-2400.jpg' }
// Если image нет — рендерится placeholder-градиент из art.palette.
// ─────────────────────────────────────────────────────────────

const SERIES = [
  {
    id: 'monochrome',
    title: 'Монохромная серия',
    subtitle: 'Форма без цвета',
    years: '2024–2025',
    count: 6,
    description:
      'Морские волны и горные пейзажи в чёрно-белом решении. ' +
      'Опыт работы с формой и ритмом без цвета как самостоятельная художественная задача.',
    palette: ['#a89888', '#3a3835'],
    color: '#4a4a4a',
  },
  {
    id: 'streets',
    title: 'Улицы мира',
    subtitle: 'Дневник путешествий',
    years: '2023–2024',
    count: 8,
    description:
      'Городские пейзажи Греции, Португалии, Франции, Камбоджи, Вьетнама. ' +
      'Каждая работа написана по мотивам личной поездки — ' +
      'по живым впечатлениям от места, его света и атмосферы.',
    palette: ['#dad4c4', '#5e4d3d'],
    color: '#4d3826',
  },
  {
    id: 'silence',
    title: 'Тихая сила',
    subtitle: 'Природа без громкости',
    years: '2023–2025',
    count: 6,
    description:
      'Ботанический реализм и пейзажи, в которых природа пишется как сила, ' +
      'не нуждающаяся в громкости. Зелёная волна, осенний лес, кувшинки на тёмной воде.',
    palette: ['#7ca058', '#1c2818'],
    color: '#1d3324',
  },
  {
    id: 'tondi',
    title: 'Тондо',
    subtitle: 'Круглый формат',
    years: '2021–2022',
    count: 2,
    description:
      'Картины в круглом формате — традиция эпохи Возрождения, ' +
      'переосмысленная в современной живописи. ' +
      'Каждое тондо — самостоятельный мир в идеальном круге.',
    palette: ['#7a99a8', '#324858'],
    color: '#3a4a5a',
  },
];

const SUBJECTS = [
  { id: 'all',       label: 'Все работы' },
  { id: 'sea',       label: 'Море и волны' },
  { id: 'mountain',  label: 'Горы' },
  { id: 'city',      label: 'Города' },
  { id: 'botanical', label: 'Сады и ботаника' },
  { id: 'landscape', label: 'Пейзажи' },
];

const CATEGORIES = SUBJECTS;

const img = (slug) => ({
  thumb: worksImage(slug, 'thumb'),
  large: worksImage(slug, 'large'),
  full:  worksImage(slug, 'full'),
});

const ARTWORKS = [
  // ─── МОНОХРОМНАЯ СЕРИЯ ─────────────────────────────────────
  {
    id: 'MN-01', title: 'Wave sepia', subtitle: 'Волна в сепии',
    series: 'monochrome', subject: 'sea', cat: 'sea',
    year: 2024, w: 100, h: 60,
    medium: 'Холст, масло, на подрамнике',
    style: 'Современный реализм',
    framing: 'Без рамы, на подрамнике',
    price: 100000, status: 'available',
    description:
      'Монохромная волна в момент наивысшего напряжения — секунда до падения. ' +
      'Палитра сепии убирает всё лишнее, оставляя только силу и форму.',
    palette: ['#a89888', '#5e4d3d'],
    image: img('mn-01'),
    featured: true,
  },
  {
    id: 'MN-02', title: 'Вершина',
    series: 'monochrome', subject: 'mountain', cat: 'mountain',
    year: 2024, w: 30, h: 30,
    medium: 'Холст на картоне, масло',
    style: 'Современный реализм',
    framing: 'Без рамы',
    price: 25000, status: 'available',
    description:
      'Острый пик уходит в светлые облака. Форма без цвета — только свет, тень и вертикаль.',
    palette: ['#b8b6ad', '#3a3835'],
    image: img('mn-02'),
  },
  {
    id: 'MN-03', title: 'Шторм',
    series: 'monochrome', subject: 'mountain', cat: 'mountain',
    year: 2024, w: 30, h: 30,
    medium: 'Холст на картоне, масло',
    style: 'Современный реализм',
    framing: 'Без рамы',
    price: 25000, status: 'available',
    description:
      'Вершина в буре — гора как живое существо, борющееся со стихией. ' +
      'Динамика передана через движение кисти.',
    palette: ['#7a7a73', '#2d2d28'],
    hidden: true, // Sprint 9: своего фото нет (на live дублировалось 422 = Freedom) → скрыта до фото от Милы
    // ⚠ фото пока нет — placeholder
  },
  {
    id: 'MN-04', title: 'Перевал',
    series: 'monochrome', subject: 'mountain', cat: 'mountain',
    year: 2025, w: 30, h: 30,
    medium: 'Холст на картоне, масло',
    style: 'Современный реализм',
    framing: 'Без рамы',
    price: 25000, status: 'available',
    description:
      'Горный пейзаж с долиной — панорама снега и леса в серебряном свете. ' +
      'Самая тихая из трёх работ серии.',
    palette: ['#a0a59a', '#3a4038'],
    image: img('mn-04'),
  },
  {
    id: 'MN-05', title: 'Камни на берегу',
    series: 'monochrome', subject: 'sea', cat: 'sea',
    year: 2025, w: 30, h: 40,
    medium: 'Холст, масло, на подрамнике',
    style: 'Современный реализм',
    framing: 'Без рамы, на подрамнике',
    price: 62000, status: 'available',
    description:
      'Морская пена омывает камни — натюрморт о движении и покое. ' +
      'Детальная проработка текстуры камней и пены.',
    palette: ['#c4b8a0', '#6a5f4d'],
    image: img('mn-05'),
  },
  {
    id: 'MN-06', title: 'Shell', subtitle: 'Ракушка',
    series: 'monochrome', subject: 'sea', cat: 'sea',
    year: 2025, w: 24, h: 30,
    medium: 'Холст, масло, на подрамнике',
    style: 'Современный реализм',
    framing: 'Без рамы, на подрамнике',
    price: 15000, status: 'available',
    description:
      'Ракушка на мокром песке — натюрморт о времени и море. ' +
      'Каждая деталь текстуры написана с натуры.',
    palette: ['#c5b196', '#7a6649'],
    image: img('mn-06'),
  },

  // ─── УЛИЦЫ МИРА ────────────────────────────────────────────
  {
    id: 'ST-01', title: 'Греция. Полдень',
    series: 'streets', subject: 'city', cat: 'city',
    year: 2023, w: 18, h: 24,
    medium: 'Холст, масло, на подрамнике',
    style: 'Городской реализм',
    framing: 'Без рамы, на подрамнике',
    price: 15000, status: 'available',
    description:
      'Белые стены, синяя дверь, горшки с геранью — полдень в греческом переулке. ' +
      'Написана по мотивам личной поездки.',
    palette: ['#e8e1cf', '#3a4a8c'],
    image: img('st-01'),
  },
  {
    id: 'ST-02', title: 'Некуда спешить',
    series: 'streets', subject: 'city', cat: 'city',
    year: 2023, w: 18, h: 24,
    medium: 'Холст, масло, на подрамнике',
    style: 'Городской реализм',
    framing: 'Без рамы, на подрамнике',
    price: 15000, status: 'available',
    description:
      'Фонарь, ступени, цветы в горшках — переулок, ' +
      'по которому хочется пройти снова и снова. Греция, написана с натуры.',
    palette: ['#d8d2c2', '#4a3826'],
    image: img('st-02'),
  },
  {
    id: 'ST-03', title: 'Франция. Лаванда',
    series: 'streets', subject: 'botanical', cat: 'botanical',
    year: 2024, w: 15, h: 15,
    medium: 'Холст на картоне, масло',
    style: 'Импрессионизм',
    framing: 'Без рамы',
    price: 28000, status: 'available',
    description:
      'Лавандовое поле Прованса крупным планом — аромат, ' +
      'который можно почти почувствовать.',
    palette: ['#9d92b8', '#3d4a6e'],
    image: img('st-03'),
  },
  {
    id: 'ST-04', title: 'Франция. Le Bouquineur', subtitle: 'Книжная лавка в Париже',
    series: 'streets', subject: 'city', cat: 'city',
    year: 2024, w: 15, h: 15,
    medium: 'Холст на картоне, масло',
    style: 'Городской реализм',
    framing: 'Без рамы',
    price: 6000, status: 'available',
    description:
      'Книжная лавка в Париже — стопки книг, голубые ставни, каштан над крышей. ' +
      'Место, где время замедляется.',
    palette: ['#a8b3a5', '#4a5d4d'],
    image: img('st-04'),
  },
  {
    id: 'ST-05', title: 'Ангкор-Ват', subtitle: 'Камбоджа',
    series: 'streets', subject: 'city', cat: 'city',
    year: 2024, w: 100, h: 80,
    medium: 'Холст, масло, на подрамнике',
    style: 'Архитектурный реализм',
    framing: 'Без рамы, на подрамнике',
    price: 130000, status: 'available',
    description:
      'Храм, который смотрит на тебя сотнями каменных лиц. ' +
      'Написан по впечатлениям от поездки — воздух Камбоджи, ' +
      'тяжёлый и горячий, до сих пор ощущается в этой работе.',
    palette: ['#bca58a', '#5e4530'],
    image: img('st-05'),
    featured: true,
  },
  {
    id: 'ST-06', title: 'Рисовое поле', subtitle: 'Вьетнам',
    series: 'streets', subject: 'landscape', cat: 'landscape',
    year: 2023, w: 40, h: 50,
    medium: 'Холст, масло, на подрамнике',
    style: 'Пейзаж, реализм',
    framing: 'Без рамы, на подрамнике',
    price: 30000, status: 'available',
    description:
      'Бесконечная перспектива рисовых полей Вьетнама — ' +
      'тропинка уходит в горизонт между зелёными рядами.',
    palette: ['#9aae7d', '#3d5328'],
    image: img('st-06'),
  },
  {
    id: 'ST-07', title: 'Крыши старого города',
    series: 'streets', subject: 'city', cat: 'city',
    year: 2023, w: 25, h: 70,
    medium: 'Холст, масло, на подрамнике',
    style: 'Архитектурный реализм',
    framing: 'Без рамы, на подрамнике',
    price: 45000, status: 'available',
    description:
      'Панорама черепичных крыш европейского старого города — ' +
      'купола, шпили, трубы.',
    palette: ['#c89878', '#6a3d2a'],
    image: img('st-07'),
  },
  // ── НОВАЯ работа ST-08 ──
  {
    id: 'ST-08', title: 'Обидуш', subtitle: 'Португалия, переулок',
    series: 'streets', subject: 'city', cat: 'city',
    year: 2024, w: 30, h: 30,                     // ⚠ размер уточнить у Mila
    medium: 'Холст, масло, на подрамнике',
    style: 'Городской реализм',
    framing: 'Без рамы, на подрамнике',
    price: 15000, status: 'available',            // bizar: «греческая» группа (decisions §1)
    description:
      'Старый португальский Обидуш — белый переулок ' +
      'с синим низом стен, ступенями и фонарём. ' +
      'На заднем плане — крепостная стена средневекового города.',
    palette: ['#d8d2c0', '#3a4a8c'],
    image: img('st-08'),
  },

  // ─── ТИХАЯ СИЛА ────────────────────────────────────────────
  {
    id: 'TS-01', title: 'Freedom', subtitle: 'Свобода',
    series: 'silence', subject: 'sea', cat: 'sea',
    year: 2024, w: 70, h: 50,
    medium: 'Холст, масло, на подрамнике',
    style: 'Современный реализм',
    framing: 'Без рамы, на подрамнике',
    price: 65000, status: 'available',
    description:
      'Зелёная волна в полном движении — свобода как физическое ощущение. ' +
      'Работа о том моменте, когда море говорит громче всего.',
    palette: ['#7ea098', '#2a3a36'],
    image: img('ts-01'),
    featured: true,
  },
  {
    id: 'TS-02', title: 'Зеркало леса',
    series: 'silence', subject: 'landscape', cat: 'landscape',
    year: 2024, w: 50, h: 90,
    medium: 'Холст, масло, на подрамнике',
    style: 'Пейзаж, реализм',
    framing: 'Без рамы, на подрамнике',
    price: 60000, status: 'available',
    description:
      'Осенний лес отражается в тёмной воде — горизонтальная композиция, ' +
      'тёплая палитра. Момент между последним теплом и первым снегом.',
    palette: ['#a86a3a', '#3a2218'],
    image: img('ts-02'),
  },
  {
    id: 'TS-03', title: 'Waterlilies', subtitle: 'Кувшинки',
    series: 'silence', subject: 'botanical', cat: 'botanical',
    year: 2025, w: 50, h: 50,
    medium: 'Холст, масло, на подрамнике',
    style: 'Ботанический реализм',
    framing: 'Без рамы, на подрамнике',
    price: 40000, status: 'available',
    description:
      'Кувшинки на тёмной воде — вечный сюжет, написанный заново. ' +
      'Каждый цветок — отдельная история света.',
    palette: ['#8ca06d', '#2a3a1c'],
    image: img('ts-03'),
  },
  {
    id: 'TS-04', title: 'Тропические листья',
    series: 'silence', subject: 'botanical', cat: 'botanical',
    year: 2023, w: 40, h: 30,
    medium: 'Холст, масло, на подрамнике',
    style: 'Ботанический реализм',
    framing: 'Без рамы, на подрамнике',
    price: 50000, status: 'available',
    description:
      'Тропические листья с каплями воды — гиперреалистичная детализация ' +
      'на тёмном фоне. Ощущение влажного тепла.',
    palette: ['#7c9a5a', '#1a2818'],
    image: img('ts-04'),
  },
  {
    id: 'TS-05', title: 'Дождь пошёл',
    series: 'silence', subject: 'botanical', cat: 'botanical',
    year: 2023, w: 18, h: 24,
    medium: 'Холст, масло, на подрамнике',
    style: 'Ботанический реализм',
    framing: 'Без рамы, на подрамнике',
    price: 10000, status: 'available',
    description:
      'Зелёные листья в каплях дождя на тёмном фоне — момент после ливня. ' +
      'Свет играет на каждой капле.',
    palette: ['#7c9a5a', '#1a1c14'],
    image: img('ts-05'),
  },
  {
    id: 'TS-06', title: 'Бамбук',
    series: 'silence', subject: 'botanical', cat: 'botanical',
    year: 2023, w: 18, h: 24,
    medium: 'Холст, масло, на подрамнике',
    style: 'Ботанический реализм',
    framing: 'Без рамы, на подрамнике',
    price: 10000, status: 'available',
    description:
      'Молодые побеги бамбука на тёмном фоне — символ роста и спокойной силы. ' +
      'Тонкая детализация стволов и листьев.',
    palette: ['#a8c878', '#1a1c14'],
    image: img('ts-06'),
  },

  // ─── ТОНДО (новая серия) ───────────────────────────────────
  {
    id: 'TD-01', title: 'Sands', subtitle: 'Дюны',
    series: 'tondi', subject: 'sea', cat: 'sea',
    year: 2021, w: 40, h: 40,                     // ⚠ диаметр уточнить
    medium: 'Холст на круглом подрамнике, масло',
    style: 'Современный реализм',
    framing: 'Круглый формат · без рамы',
    price: 17000, status: 'available',            // ⚠ цена уточнить
    description:
      'Берег моря с тростником — приглушённая палитра северного света. ' +
      'Дюны, песок, отступающая волна и небо. ' +
      'Круглый формат добавляет работе ощущение «портала».',
    palette: ['#cdc1a2', '#5a7a8c'],
    image: img('td-01'),
    shape: 'round',
  },
  {
    id: 'TD-02', title: 'Hibiscus', subtitle: 'Гибискус',
    series: 'tondi', subject: 'botanical', cat: 'botanical',
    year: 2022, w: 50, h: 50,                     // ⚠ диаметр уточнить
    medium: 'Холст на круглом подрамнике, масло',
    style: 'Современный реализм',
    framing: 'Круглый формат · без рамы',
    price: 45000, status: 'available',
    description:
      'Цветок гибискуса плывёт по бирюзовой воде — ' +
      'игра света на ряби, лепестки, отражения. ' +
      'Работа о моменте безмятежности на тропической воде.',
    palette: ['#7ec0c8', '#1a4858'],
    image: img('td-02'),
    shape: 'round',
    featured: true,
  },
];

// ─── helpers ─────────────────────────────────────────────────
const formatPrice = (p) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(p);

const seriesById  = (id) => SERIES.find((s) => s.id === id);
const catById     = (id) => CATEGORIES.find((c) => c.id === id);
const subjectById = (id) => SUBJECTS.find((s) => s.id === id);
const artworkById = (id) => ARTWORKS.find((a) => a.id === id);

const featuredArtworks = () => ARTWORKS.filter((a) => a.featured);
const availableCount   = () => ARTWORKS.filter((a) => a.status === 'available' && !a.hidden).length;
const visibleArtworks  = () => ARTWORKS.filter((a) => !a.hidden); // Sprint 9: исключает скрытые (MN-03 без фото)

const imageOf = (art, size = 'large') => {
  if (!art) return null;
  const ov = TILDA_IMAGES[art.id];
  if (ov && (ov[size] || ov.large || ov.full || ov.thumb)) {
    return ov[size] || ov.large || ov.full || ov.thumb;
  }
  if (!art.image) return null;
  return art.image[size] || art.image.large || art.image.full || art.image.thumb || null;
};

// ─────────────────────────────────────────────────────────────
const ABOUT = {
  name: 'Mila Bezú',
  alias: 'Мила Бэзу',
  full: 'Mila Bezú · Мила Бэзу',
  city: 'Москва',
  studio: 'Студия — Москва · по записи',

  tagline: 'Живопись маслом — для тех, кто понимает, как картина живёт в пространстве.',

  short: [
    'Художник-живописец из Москвы. 15 лет практики масляной живописи. ' +
    'Образование в области дизайна интерьера определяет особый подход — ' +
    'каждая работа создаётся с пониманием того, как она будет жить в реальном пространстве.',

    'Серии «Улицы мира», «Тихая сила», монохромное направление и круглые тондо — ' +
    'пейзажи и натюрморты, написанные по мотивам собственных путешествий и творческих исследований.',
  ],

  bio: [
    'Художник-живописец из Москвы. Более 15 лет практики масляной живописи.',

    'Образование в области дизайна интерьера определяет особый подход к работе. ' +
    'Это не «вторая профессия» — это профессиональное понимание пространства, ' +
    'цвета и композиции в контексте реальной среды. Каждая работа создаётся ' +
    'с мыслью о том, как она будет жить в комнате — рядом с каким светом, ' +
    'какой мебелью, какими стенами.',

    'Творческая практика основана на авторских путешествиях. ' +
    'Каждая серия рождается из непосредственного контакта с местом — ' +
    'его светом, архитектурой, повседневной атмосферой.',

    'Серия «Улицы мира» — городские пейзажи Греции, Португалии, Франции, Камбоджи, Вьетнама, ' +
    'написанные по живым впечатлениям. Серия «Монохромная» — морские волны и ' +
    'горные пейзажи в чёрно-белом решении: опыт работы с формой и ритмом без цвета ' +
    'как самостоятельная художественная задача. Серия «Тихая сила» — ботанический ' +
    'реализм и пейзажи, в которых природа пишется как сила, не нуждающаяся в громкости. ' +
    'Серия «Тондо» — круглые работы, отдельный диалог с традицией эпохи Возрождения.',

    'Каждая работа — в единственном экземпляре. С авторской подписью и фирменным ' +
    'сертификатом подлинности. К работе прилагается открытка из страны или места, ' +
    'вдохновившего серию, с личным посланием художника.',

    'Параллельно развивается монохромное направление — продолжение исследования ' +
    'формы, света и ритма как основных выразительных средств живописи.',
  ],

  studio_note:
    'Студия — Москва. Картины пишутся на заказ от 4 до 10 недель: ' +
    'после знакомства с пространством, для которого предназначена работа.',

  ritual: [
    { icon: '◆', label: 'Авторская подпись',     note: 'Лицевая сторона работы' },
    { icon: '◇', label: 'Фирменный сертификат',   note: 'С номером и датой создания' },
    { icon: '◆', label: 'Стильная упаковка',      note: 'Зелёная коробка M.Bez с золотом' },
    { icon: '◇', label: 'Открытка из страны',     note: 'С личным посланием художника' },
  ],

  contacts: {
    email:     'milabezu.art@gmail.com',
    phone:     '+7 916 764 10 39',
    instagram: 'm.bezu_art',
    telegram:  'mbezu_art',
    vk:        'mbezu_art',
  },

  // ── Юридические реквизиты ──
  legal: {
    type: 'ИП',
    full_name: 'Клевер Людмила Александровна',
    name_short: 'ИП Клевер Л.А.',
    inn: '772273980162',
    ogrnip: '314774633901575',
    address: '111250, РФ, г. Москва, ул. Лефортовский Вал, д. 11, корп. 2, кв. 202',
    bank: 'ФИЛИАЛ «ЦЕНТРАЛЬНЫЙ» БАНКА ВТБ (ПАО) г. МОСКВА',
    bik: '044525411',
    rs: '40802810800000028094',
    ks: '30101810145250000411',
    // Дата редакции документов
    docs_updated: '13 мая 2026',
    site: 'mbezu.ru',
  },
};

export { CATEGORIES, SUBJECTS, SERIES, ARTWORKS, ABOUT, formatPrice, seriesById, catById, subjectById, artworkById, featuredArtworks, visibleArtworks, availableCount, imageOf };
