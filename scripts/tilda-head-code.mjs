// ─────────────────────────────────────────────────────────────
// tilda-head-code.mjs — правка head-кода сайта в Tilda.
//
// Где лежит (нашёл перебором, Sprint 15):
//   Настройки сайта → «Вставка кода» → кнопка «Редактировать код»
//   → модалка с редактором Ace; значение — в textarea[name="headcode"].
//   Хешем #tab=… вкладки НЕ переключаются, нужен клик по кнопке.
//
// Что чиним (аудит, направления 7 и 8):
//   • 4 скрипта с unpkg.com на 4,1 МБ на КАЖДОЙ странице, включая нативный
//     товар и корзину: @babel/standalone 3064 КБ, model-viewer 913 КБ,
//     react-dom + react UMD 140 КБ. Проверено curl'ом по 7 страницам:
//     type="text/babel" — 0, <model-viewer> — 0, window.React — 0.
//     Никто их не использует.
//   • og:site_name и Organization.name = «M.Bez» → «MBezu».
//   • свой og:type — дубль тильдовского, убираем.
//
//   node scripts/tilda-head-code.mjs          — показать план, ничего не писать
//   node scripts/tilda-head-code.mjs --apply  — записать и сверить
// ─────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs';
import { withSession, PROJECTID, pace } from './tilda-session.mjs';

const APPLY = process.argv.includes('--apply');
const DEAD = ['@babel/standalone', '@google/model-viewer', 'react-dom@18', 'react@18'];

// ── Русификация Store на лету ────────────────────────────────
// Поля блоков 776 (каталог) и 706 (корзина) программно недоступны: панель
// «Контент» не отдаёт полей ни через edrec__editRecordContent, ни живым кликом,
// а эндпоинты записи отвечают 404 (проверено трижды). Строки при этом видит
// покупатель в момент оплаты — «Your Name», «CHECKOUT», «BUY NOW».
// Поэтому подменяем их в браузере из head-кода, который нам подконтролен.
// ВАЖНО: роботу без JS английский текст по-прежнему виден — verify-live
// продолжит это ловить, и правильно: настоящее лечение — поля блоков руками.
// ── Приёмники заявок: атрибуты и скрытие ────────────────────
// Формы A/B вставлены блоками BF201N на главной и /commission (+пара на
// служебной Header). Транспорт ищет [data-mbezu-lead]/[data-mbezu-notify];
// вешаем атрибуты ПО СИГНАТУРЕ полей (lead_ref+notes → A, lead_ref без notes → B)
// — так снипет не зависит от rec-id и работает на любой странице.
const RCV_MARK = 'MBezu · lead-receivers';
const RCV_SNIPPET = `
<!-- ${RCV_MARK} · скрытые формы-приёмники (Sprint 15 Ф0) -->
<style>[data-mbezu-lead],[data-mbezu-notify]{position:absolute!important;left:-9999px!important;height:1px!important;overflow:hidden!important}</style>
<script>
(function(){
  function wire(){
    try{
      var inputs=document.querySelectorAll('input[name="lead_ref"]');
      for(var i=0;i<inputs.length;i++){
        var form=inputs[i].closest('form');if(!form)continue;
        var wrap=form.closest('[id^="rec"]')||form;
        var isA=!!form.querySelector('[name="notes"]');
        if(isA){wrap.setAttribute('data-mbezu-lead','');}
        else{wrap.setAttribute('data-mbezu-notify','');}
      }
    }catch(e){}
  }
  if(document.readyState!=='loading')wire();
  document.addEventListener('DOMContentLoaded',wire);
  window.addEventListener('load',wire);
})();
</script>`;

const MARK = 'MBezu · ru-store';
const RU_SNIPPET = `
<!-- ${MARK} · подмена английских строк Store (Sprint 15) -->
<script>
(function(){
  var MAP={'Your Name':'Имя','Your Email':'Email','Your Phone':'Телефон',
    'Your Comment':'Комментарий','Checkout':'Оформить заказ','CHECKOUT':'ОФОРМИТЬ ЗАКАЗ',
    'BUY NOW':'Купить','Buy now':'Купить','More products':'Все работы',
    'Load more':'Показать ещё','Total':'Итого','Sold out':'Продана'};
  function fix(root){
    if(!root||root.nodeType!==1&&root.nodeType!==9)return;
    var f=root.querySelectorAll?root.querySelectorAll('input,textarea'):[];
    for(var i=0;i<f.length;i++){var p=f[i].getAttribute('placeholder');if(p&&MAP[p])f[i].setAttribute('placeholder',MAP[p]);}
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null,false),n,l=[];
    while(n=w.nextNode())l.push(n);
    for(var j=0;j<l.length;j++){var s=l[j].nodeValue,k=s&&s.trim();if(k&&MAP[k])l[j].nodeValue=s.replace(k,MAP[k]);}
  }
  function run(){try{fix(document.body);}catch(e){}}
  if(document.readyState!=='loading')run();
  document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('load',run);
  document.addEventListener('DOMContentLoaded',function(){
    try{
      var t,mo=new MutationObserver(function(){clearTimeout(t);t=setTimeout(run,60);});
      mo.observe(document.body,{childList:true,subtree:true});
    }catch(e){}
  });
})();
</script>`;

function patchHead(src) {
  let out = src;
  const removed = [];
  for (const needle of DEAD) {
    const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`[ \\t]*<script\\b[^>]*src="[^"]*${esc}[^"]*"[^>]*>\\s*</script>[ \\t]*\\r?\\n?`, 'gi');
    const before = out;
    out = out.replace(re, '');
    if (out !== before) removed.push(needle);
  }
  const b0 = out;
  out = out.replace(/(<meta[^>]+property="og:site_name"[^>]+content=")M\.Bez(")/i, '$1MBezu$2');
  out = out.replace(/("name"\s*:\s*")M\.Bez(")/g, '$1MBezu$2');
  const brandFixed = out !== b0;

  const t0 = out;
  out = out.replace(/[ \t]*<meta[^>]+property="og:type"[^>]*>[ \t]*\r?\n?/i, '');
  const typeFixed = out !== t0;

  // Русификатор Store — дописываем один раз, по метке.
  const ruAdded = !out.includes(MARK);
  if (ruAdded) out = out.trimEnd() + '\n' + RU_SNIPPET + '\n';

  const rcvAdded = !out.includes(RCV_MARK);
  if (rcvAdded) out = out.trimEnd() + String.fromCharCode(10) + RCV_SNIPPET + String.fromCharCode(10);

  return { out, removed, brandFixed, typeFixed, ruAdded, rcvAdded };
}

const openEditor = async (page) => {
  await page.goto(`https://tilda.ru/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((e) => (e.innerText || '').trim() === 'Вставка кода');
    if (!b) throw new Error('вкладка «Вставка кода» не найдена');
    b.click();
  });
  await page.waitForTimeout(4000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button,a')].filter((e) => /редактировать код/i.test(e.innerText || ''))[0];
    if (!b) throw new Error('кнопка «Редактировать код» не найдена');
    b.click();
  });
  await page.waitForTimeout(5000);
  return page.evaluate(() => (document.querySelector('textarea[name="headcode"]') || {}).value || '');
};

await withSession(async ({ page }) => {
  const src = await openEditor(page);
  if (!src) { console.log('  ✗ поле headcode пустое или не найдено — ничего не делаю'); return; }

  mkdirSync('backup', { recursive: true });
  writeFileSync('backup/tilda-head-before.html', src, 'utf8');
  console.log(`  снимок исходника: backup/tilda-head-before.html (${src.length} симв.)`);

  const { out, removed, brandFixed, typeFixed, ruAdded } = patchHead(src);
  console.log('\n  план правки:');
  console.log('    убрать скриптов:', removed.length ? removed.join(', ') : 'ни одного');
  console.log('    M.Bez → MBezu  :', brandFixed ? 'да' : 'не найдено');
  console.log('    свой og:type   :', typeFixed ? 'убрать' : 'не найден');
  console.log('    русификатор Store:', ruAdded ? 'дописать' : 'уже стоит');
  console.log(`    длина: ${src.length} → ${out.length} симв.`);

  if (!APPLY) { console.log('\n  прогон без записи. Применить: node scripts/tilda-head-code.mjs --apply'); return; }
  if (out === src) { console.log('\n  нечего менять — выхожу.'); return; }

  await pace();
  // Пишем ЧЕРЕЗ Ace: у редактора своя модель, правка скрытой textarea в неё не попадёт.
  const written = await page.evaluate((v) => {
    const ta = document.querySelector('textarea[name="headcode"]');
    const host = document.querySelector('.ace_editor');
    let viaAce = false;
    if (window.ace && host) {
      try { window.ace.edit(host).setValue(v, -1); viaAce = true; } catch { /* упадём на textarea */ }
    }
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, v);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return { viaAce, taLen: ta ? ta.value.length : -1 };
  }, out);
  console.log('\n  записано в редактор:', JSON.stringify(written));

  await pace();
  // Кнопка «Сохранить» — точное совпадение текста; в Tilda встречается латинская C.
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')]
      .filter((e) => e.offsetParent !== null)
      .find((e) => /^(Сохранить|Cохранить)$/.test((e.innerText || '').trim()));
    if (!b) return false;
    b.click();
    return true;
  });
  console.log('  «Сохранить» нажата:', clicked);
  await page.waitForTimeout(7000);

  // Сверка №1 — перечитать поле, открыв редактор заново.
  const after = await openEditor(page);
  const stillDead = DEAD.filter((d) => after.includes(d));
  console.log('\n  сверка в админке:');
  console.log('    длина:', after.length);
  console.log('    мёртвые скрипты остались:', stillDead.length ? stillDead.join(', ') : 'нет');
  console.log('    og:site_name = M.Bez:', /og:site_name[^>]*M\.Bez/.test(after) ? 'ДА — не записалось' : 'нет');

  const ok = after.length > 0 && stillDead.length === 0 && !/og:site_name[^>]*M\.Bez/.test(after);
  console.log(ok ? '\n  ✓ записано и сверено в админке' : '\n  ✗ правка не подтвердилась — исходник в backup/tilda-head-before.html');
});
