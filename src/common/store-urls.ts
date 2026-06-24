// ─────────────────────────────────────────────────────────────
// store-urls.ts — Sprint 8 (3C): map each work id → its NATIVE Tilda Store
// product page (/catalog/tproduct/<uid>-<slug>). The React storefront's
// "open work" navigation routes here so a click lands on the native product
// page with working "В корзину" → cart 706 → native YooKassa checkout.
// (React /painting/<id> is NOT the live buyable page — the native Store is.)
// UIDs scraped from the live catalog after the Sprint-8 product import.
// ─────────────────────────────────────────────────────────────
export const STORE_PRODUCT_PATH: Record<string, string> = {
  'MN-01': '/catalog/tproduct/566542733172-wave-sepia',
  'MN-02': '/catalog/tproduct/236258469112-vershina',
  'MN-03': '/catalog/tproduct/865381581592-shtorm',
  'MN-04': '/catalog/tproduct/440148681382-pereval',
  'MN-05': '/catalog/tproduct/305599314472-kamni-na-beregu',
  'MN-06': '/catalog/tproduct/395664756972-shell-rakushka',
  'ST-01': '/catalog/tproduct/366083467733-gretsiya-polden',
  'ST-02': '/catalog/tproduct/771318224293-nekuda-speshit',
  'ST-03': '/catalog/tproduct/101992645912-frantsiya-lavanda',
  'ST-04': '/catalog/tproduct/342171097222-frantsiya-le-bouquineur',
  'ST-05': '/catalog/tproduct/763415825502-angkor-vat',
  'ST-06': '/catalog/tproduct/639520387112-risovoe-pole-vetnam',
  'ST-07': '/catalog/tproduct/390394350562-krishi-starogo-goroda',
  'ST-08': '/catalog/tproduct/447936058052-obidush-portugaliya',
  'TS-01': '/catalog/tproduct/263963629773-freedom-svoboda',
  'TS-02': '/catalog/tproduct/549982942762-zerkalo-lesa',
  'TS-03': '/catalog/tproduct/939323400042-waterlilies-kuvshinki',
  'TS-04': '/catalog/tproduct/871687829842-tropicheskie-listya',
  'TS-05': '/catalog/tproduct/477039459492-dozhd-poshyol',
  'TS-06': '/catalog/tproduct/314668518282-bambuk',
  'TD-01': '/catalog/tproduct/362279226602-sands-dyuni',
  'TD-02': '/catalog/tproduct/345114046252-hibiscus-gibiskus',
};

/** Native Store product URL for a work id, or null if unmapped. */
export function storeProductPath(id?: string): string | null {
  if (!id) return null;
  return STORE_PRODUCT_PATH[String(id).toUpperCase()] || null;
}
