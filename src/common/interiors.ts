// ─────────────────────────────────────────────────────────────
// interiors.ts — реальные кадры работ на стене.
//
// Зачем: главный вопрос покупателя картины — «как это будет выглядеть у меня».
// До этого на сайте были только три обобщённые комнаты (gostinaya/kabinet/spalnya)
// и схематичный ScaleBlock на карточке. Здесь — конкретные работы в конкретных
// интерьерах: их показываем и на карточке работы, и общей галереей на главной.
//
// Файлы: public/assets/interior/<name>{,@960,@480}.webp → cdn.mbezu.ru.
// ─────────────────────────────────────────────────────────────

export const INTERIOR_BASE = 'https://cdn.mbezu.ru/assets/interior';

export interface InteriorShot {
  /** имя файла без расширения и суффикса размера */
  file: string;
  /** alt/подпись — описывает комнату, а не работу (работу называет карточка) */
  caption: string;
  /** id работы, если кадр про конкретную работу */
  art?: string;
}

/**
 * Реальная ширина интерьерных файлов. Кадры вертикальные (1047×1280 и 960×1280),
 * поэтому ограничение по длинной стороне даёт ширину 393/785/1047, а не 480/960/1400.
 * Пересчитать после замены файлов: тот же приём, что в scripts/gen-card-widths.py.
 */
const W: Record<string, [number, number, number]> = {
  'ct-01-holst': [393, 785, 1047],
  'ct-01-kabinet': [393, 785, 1047],
  'ct-01-koridor': [393, 785, 1047],
  'ct-01-prihozhaya': [393, 785, 1047],
  'gostinaya': [480, 960, 1600],
  'kabinet': [480, 960, 1600],
  'mn-01-gostinaya': [393, 785, 1047],
  'spalnya': [480, 960, 1600],
  'stena-lestnica': [360, 720, 960],
  'td-02-stena': [393, 785, 1047],
};

/** src + srcSet для <img> по имени файла — с честными дескрипторами. */
export function interiorSrc(file: string) {
  const w = W[file];
  const src = `${INTERIOR_BASE}/${file}.webp`;
  if (!w) return { src };
  return {
    src,
    srcSet: `${INTERIOR_BASE}/${file}@480.webp ${w[0]}w, ${INTERIOR_BASE}/${file}@960.webp ${w[1]}w, ${src} ${w[2]}w`,
  };
}

/** Все кадры «работа на стене» — в порядке показа в галерее. */
export const INTERIOR_SHOTS: InteriorShot[] = [
  { file: 'ct-01-kabinet',    art: 'CT-01', caption: 'Кабинет со светлой стеной: вертикаль 60×80 над рабочим столом' },
  { file: 'ct-01-prihozhaya', art: 'CT-01', caption: 'Тёмно-синяя стена в прихожей — холодный фон усиливает красный акцент' },
  { file: 'ct-01-koridor',    art: 'CT-01', caption: 'Коридор с реечными панелями и подсветкой: работа как конец перспективы' },
  { file: 'ct-01-holst',      art: 'CT-01', caption: 'Галерейный подрамник, вид в три четверти — картина приезжает готовой к подвесу' },
  { file: 'mn-01-gostinaya',  art: 'MN-01', caption: 'Гостиная со стеллажом: горизонталь 100×60 держит стену рядом с книгами' },
  { file: 'td-02-stena',      art: 'TD-02', caption: 'Круглое тондо над деревянной панелью — круг смягчает прямые линии комнаты' },
  { file: 'stena-lestnica',                 caption: 'Лестничный пролёт: группа из трёх работ разного размера на одной стене' },
];

/** Кадры конкретной работы (для блока «В интерьере» на карточке). */
export function interiorsFor(artId?: string): InteriorShot[] {
  if (!artId) return [];
  const id = String(artId).toUpperCase();
  return INTERIOR_SHOTS.filter((s) => s.art === id);
}
