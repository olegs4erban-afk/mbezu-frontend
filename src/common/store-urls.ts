// ─────────────────────────────────────────────────────────────
// store-urls.ts — Sprint 8 (3C): map each work id → its NATIVE Tilda Store
// product page (/catalog/tproduct/<uid>-<slug>). The React storefront's
// "open work" navigation routes here so a click lands on the native product
// page with working "В корзину" → cart 706 → native YooKassa checkout.
// (React /painting/<id> is NOT the live buyable page — the native Store is.)
// UIDs scraped from the live catalog after the Sprint-8 product import.
// Sprint 15: 5 товаров переименованы в Store на русские имена витрины —
// slug сменился, Tilda сама поставила 301 со старых адресов (проверено).
// ─────────────────────────────────────────────────────────────
export const STORE_PRODUCT_PATH: Record<string, string> = {
  'CT-01': '/catalog/tproduct/502289101983-severnii-ekspress-poezd-v-zimnem-lesu',
  'CT-02': '/catalog/tproduct/513218439023-vinogradnik-doroga-mezhdu-ryadov',
  'CT-03': '/catalog/tproduct/132390820403-lavandovoe-pole-provans',
  'CT-04': '/catalog/tproduct/671569437803-toskana-kiparisi',
  'CT-05': '/catalog/tproduct/330265491953-balkon-v-tsvetah',
  'CT-06': '/catalog/tproduct/692709424363-lissabon-arka',
  'CT-07': '/catalog/tproduct/637387621793-lavanda-krupnii-plan',
  'CT-08': '/catalog/tproduct/621870105453-al-dente-italiya-kuhonnii-natyurmort',
  'CT-09': '/catalog/tproduct/332299967893-portu-bashnya-klerigush',
  'MI-01': '/catalog/tproduct/583755240663-limoni-na-maiolike',
  'MI-02': '/catalog/tproduct/428320881573-limonnaya-alleya',
  'MI-03': '/catalog/tproduct/484571069943-sinyaya-dver',
  'MI-04': '/catalog/tproduct/207668559623-okno-na-more',
  'MI-05': '/catalog/tproduct/747702701093-doroga-k-moryu',
  'MI-06': '/catalog/tproduct/371365208773-zelyonie-stavni',
  'MI-07': '/catalog/tproduct/468661830033-lodka-u-prichala',
  'MI-08': '/catalog/tproduct/712883435193-limonnoe-derevo',
  'MI-09': '/catalog/tproduct/781999647973-balkon-nad-morem',
  'MI-10': '/catalog/tproduct/263786338693-polosatii-shezlong',
  'MI-11': '/catalog/tproduct/688645969793-buhta',
  'MI-12': '/catalog/tproduct/592075931223-ohristie-stavni',
  'MN-01': '/catalog/tproduct/566542733172-volna-sepiya',
  'MN-02': '/catalog/tproduct/236258469112-vershina',
  'MN-03': '/catalog/tproduct/865381581592-shtorm',
  'MN-04': '/catalog/tproduct/440148681382-pereval',
  'MN-05': '/catalog/tproduct/305599314472-kamni-na-beregu',
  'MN-06': '/catalog/tproduct/395664756972-rakovina',
  'NC-01': '/catalog/tproduct/245112693953-obidush-utro-u-kafe-portugaliya',
  'NC-02': '/catalog/tproduct/990705726063-shmel',
  'NC-03': '/catalog/tproduct/907000665013-pokrova-na-nerli',
  'NC-04': '/catalog/tproduct/717861511053-bungalo-tropicheskii-bereg',
  'NC-05': '/catalog/tproduct/255009936483-gora-na-rassvete',
  'NC-06': '/catalog/tproduct/869796119503-kora',
  'NC-07': '/catalog/tproduct/751217234203-nazare-pelikani-ovalnoe-tondo',
  'NC-08': '/catalog/tproduct/838522590083-nazare-skala-ovalnoe-tondo',
  'PP-01': '/catalog/tproduct/794639734813-podenko-portret-na-zolote',
  'PP-02': '/catalog/tproduct/677178382003-kavaler-portret-na-zolote',
  'PP-03': '/catalog/tproduct/397613053103-korgi-portret-na-zolote',
  'ST-01': '/catalog/tproduct/366083467733-gretsiya-polden',
  'ST-02': '/catalog/tproduct/771318224293-nekuda-speshit',
  'ST-03': '/catalog/tproduct/101992645912-frantsiya-lavanda',
  'ST-04': '/catalog/tproduct/342171097222-frantsiya-bukinist',
  'ST-05': '/catalog/tproduct/763415825502-angkor-vat',
  'ST-06': '/catalog/tproduct/639520387112-risovoe-pole-vetnam',
  'ST-07': '/catalog/tproduct/390394350562-krishi-starogo-goroda',
  'ST-08': '/catalog/tproduct/447936058052-obidush-portugaliya',
  'TD-01': '/catalog/tproduct/362279226602-sands-dyuni',
  'TD-02': '/catalog/tproduct/345114046252-hibiscus-gibiskus',
  'TD-03': '/catalog/tproduct/272044153433-risovie-terrasi-yugo-vostochnaya-aziya',
  'TD-04': '/catalog/tproduct/719069779283-most-v-tumane',
  'TD-05': '/catalog/tproduct/294727464703-gimalai-flagi-ovalnoe-tondo',
  'TS-01': '/catalog/tproduct/263963629773-svoboda',
  'TS-02': '/catalog/tproduct/549982942762-zerkalo-lesa',
  'TS-03': '/catalog/tproduct/939323400042-kuvshinki',
  'TS-04': '/catalog/tproduct/871687829842-tropicheskie-listya',
  'TS-05': '/catalog/tproduct/477039459492-dozhd-poshyol',
  'TS-06': '/catalog/tproduct/314668518282-bambuk',
};

/** Native Store product URL for a work id, or null if unmapped. */
export function storeProductPath(id?: string): string | null {
  if (!id) return null;
  return STORE_PRODUCT_PATH[String(id).toUpperCase()] || null;
}

/**
 * Есть ли у работы страница в нативном Store.
 *
 * Важно: /painting/<id> существует ТОЛЬКО на cdn.mbezu.ru (prerender).
 * На боевом mbezu.ru таких страниц Tilda нет и не планировалось — проверено,
 * /painting/ct-01 отдаёт 404. Поэтому работа, которой ещё нет в Store после
 * CSV-импорта, не должна вести на /painting/<id>: вместо этого карточка
 * открывает Telegram с названием работы (см. askAboutHref).
 */
export function hasStorePage(id?: string): boolean {
  return !!storeProductPath(id);
}
