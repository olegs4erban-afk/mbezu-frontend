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
<style>[data-mbezu-lead],[data-mbezu-notify],.t-rec:has(input[name="lead_ref"]){position:absolute!important;left:-9999px!important;height:1px!important;overflow:hidden!important}</style>
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
        wrap.setAttribute('aria-hidden','true');
        var ctl=wrap.querySelectorAll('input,textarea,button,select,a');for(var j=0;j<ctl.length;j++)ctl[j].setAttribute('tabindex','-1');
      }
    }catch(e){}
  }
  if(document.readyState!=='loading')wire();
  document.addEventListener('DOMContentLoaded',wire);
  window.addEventListener('load',wire);
})();
</script>`;

// ── Страницы товара: Product JSON-LD из микроданных + золото AA в корзине ──
// (аудит 3.13: инлайн #a08a4e в попапе корзины не перекрасить чистым CSS;
//  мелочь 8: JSON-LD Product строим из уже существующих itemprop-микроданных)
const PROD_MARK = 'MBezu · product-extras';
const PROD_SNIPPET = `
<!-- ${PROD_MARK} (Sprint 15) -->
<script>
(function(){
  function goldFix(root){
    try{
      var els=(root||document).querySelectorAll('.t706 *,.t-store *');
      for(var i=0;i<els.length;i++){
        var cs=getComputedStyle(els[i]);
        if(cs.color==='rgb(160, 138, 78)')els[i].style.color='#6f5c2b';
        if(cs.backgroundColor==='rgb(160, 138, 78)')els[i].style.backgroundColor='#6f5c2b';
      }
    }catch(e){}
  }
  function productLd(){
    try{
      if(location.pathname.indexOf('/tproduct/')<0)return;
      if(document.getElementById('mbezu-product-ld'))return;
      var name=(document.querySelector('[itemprop="name"]')||document.querySelector('h1')||{}).textContent||'';
      var priceEl=document.querySelector('[itemprop="price"]');
      var price=priceEl?(priceEl.content||priceEl.textContent||'').replace(/[^0-9.]/g,''):'';
      var img=(document.querySelector('meta[property="og:image"]')||{}).content||'';
      var descr=(document.querySelector('meta[name="description"]')||{}).content||'';
      if(!name||!price)return;
      var ld={'@context':'https://schema.org','@type':'Product',name:name.trim(),image:[img],description:descr,
        brand:{'@type':'Brand',name:'Mila Bezú'},
        offers:{'@type':'Offer',price:price,priceCurrency:'RUB',availability:'https://schema.org/InStock',url:location.origin+location.pathname,itemCondition:'https://schema.org/NewCondition'}};
      var s=document.createElement('script');s.type='application/ld+json';s.id='mbezu-product-ld';
      s.textContent=JSON.stringify(ld);document.head.appendChild(s);
    }catch(e){}
  }
  function productNav(){
    if(location.pathname.indexOf('/tproduct/')<0||document.getElementById('mbezu-prod-nav'))return;
    var lab=document.querySelector('.t-tildalabel');var host=document.getElementById('allrecords')||document.body;
    var nav=document.createElement('nav');nav.id='mbezu-prod-nav';nav.setAttribute('aria-label','Навигация по сайту');
    nav.style.cssText='padding:28px 20px 36px;background:#ede5d6;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;font-family:Inter Tight,system-ui,sans-serif';
    var L=[['/','Главная'],['/catalog','Каталог'],['/commission','На заказ'],['/podarok','В подарок'],['/journal','Журнал']];
    for(var i=0;i<L.length;i++){var a=document.createElement('a');a.href=L[i][0];a.textContent=L[i][1];
      a.style.cssText='display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border:1px solid #6f5c2b;border-radius:999px;color:#6f5c2b;text-decoration:none;font-size:14px';nav.appendChild(a);}
    if(lab&&lab.parentNode===host)host.insertBefore(nav,lab);else host.appendChild(nav);
  }
  function galleryHint(){
    if(location.pathname.indexOf('/tproduct/')<0||document.getElementById('mbezu-gal-hint'))return;
    var sl=document.querySelector('.t-store .t-slds')||document.querySelector('.t776 .t-slds');if(!sl)return;
    var items=[].slice.call(sl.querySelectorAll('.t-slds__item')).filter(function(x){return !/t-slds__item_loop/.test(x.className);});
    var n=items.length;if(n<2)return;
    var hint=document.createElement('div');hint.id='mbezu-gal-hint';
    hint.style.cssText='position:absolute;left:12px;bottom:12px;z-index:5;font:12px/1.4 Inter Tight,system-ui,sans-serif;color:#2a2520;background:rgba(237,229,214,.88);padding:4px 10px;border-radius:999px;letter-spacing:.04em;pointer-events:none';
    function upd(){var act=sl.querySelector('.t-slds__item_active');var idx=act?items.indexOf(act)+1:1;if(idx<1)idx=1;hint.textContent='Фото '+idx+' из '+n+' · листайте';}
    upd();var box=sl.querySelector('.t-slds__container')||sl;if(getComputedStyle(box).position==='static')box.style.position='relative';box.appendChild(hint);
    try{new MutationObserver(function(){upd();}).observe(sl,{attributes:true,subtree:true,attributeFilter:['class']});}catch(e){}
  }
  // 02.09 P1: страница товара как часть витрины — крошки с серией и «Ещё из серии» из /works.json
  var WORKS=null;
  function loadWorks(cb){
    if(WORKS){cb(WORKS);return;}
    var x=new XMLHttpRequest();x.open('GET','https://cdn.mbezu.ru/works.json?v=2',true);
    x.onload=function(){try{WORKS=JSON.parse(x.responseText);cb(WORKS);}catch(e){}};x.send();
  }
  function fmtPrice(n){var t=String(n),o='';while(t.length>3){o=' '+t.slice(-3)+o;t=t.slice(0,-3);}return t+o+' ₽';}
  function productSeries(){
    if(location.pathname.indexOf('/tproduct/')<0||document.getElementById('mbezu-crumbs'))return;
    var host=document.querySelector('.t-store__prod-snippet__container')||document.querySelector('.t-store');if(!host)return;
    loadWorks(function(list){
      var me=null;for(var i=0;i<list.length;i++){if(location.pathname.indexOf(list[i].url)===0){me=list[i];break;}}
      if(!me||document.getElementById('mbezu-crumbs'))return;
      var cr=document.createElement('nav');cr.id='mbezu-crumbs';cr.setAttribute('aria-label','Хлебные крошки');
      cr.style.cssText='max-width:1180px;margin:0 auto;padding:18px 20px 0;font:12px/1.4 JetBrains Mono,ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#67583f;display:flex;flex-wrap:wrap;gap:10px;align-items:center';
      var parts=[['/','MBezu'],['/catalog','Каталог'],['/catalog/'+me.seriesSlug,me.seriesTitle]];
      for(var k=0;k<parts.length;k++){var a=document.createElement('a');a.href=parts[k][0];a.textContent=parts[k][1];a.style.cssText='color:#67583f;text-decoration:none;padding:10px 0';cr.appendChild(a);var sp=document.createElement('span');sp.textContent='/';cr.appendChild(sp);}
      var cur=document.createElement('span');cur.textContent=me.title;cur.style.color='#2a2520';cr.appendChild(cur);
      host.insertBefore(cr,host.firstChild);
      var same=[];for(var j=0;j<list.length;j++){if(list[j].series===me.series&&list[j].id!==me.id)same.push(list[j]);}
      if(!same.length||document.getElementById('mbezu-related'))return;
      same=same.slice(0,4);
      var sec=document.createElement('section');sec.id='mbezu-related';
      sec.style.cssText='max-width:1180px;margin:0 auto;padding:40px 20px 56px;font-family:Inter Tight,system-ui,sans-serif;color:#2a2520';
      sec.innerHTML='<div style="font:500 10.5px/1.4 JetBrains Mono,ui-monospace,monospace;letter-spacing:.22em;text-transform:uppercase;color:#6f5c2b;margin-bottom:12px">Ещё из серии</div><h2 style="margin:0 0 22px;font-size:clamp(26px,3vw,40px);font-weight:500;letter-spacing:-.02em">'+me.seriesTitle+'</h2>';
      var grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:22px';
      for(var m=0;m<same.length;m++){var w=same[m];var a2=document.createElement('a');a2.href=w.url;a2.style.cssText='text-decoration:none;color:inherit;display:block';
        a2.innerHTML='<img src="'+w.img+'" alt="'+w.title+'" loading="lazy" style="width:100%;aspect-ratio:1/1;object-fit:contain;display:block;background:#ede5d6;border-radius:12px;transition:transform .5s"><div style="margin-top:10px;font-size:16px;font-weight:500">'+w.title+'</div><div style="font-size:13px;color:#6b5d4a">'+w.w+'×'+w.h+' см · '+fmtPrice(w.price)+'</div>';
        grid.appendChild(a2);}
      sec.appendChild(grid);
      var more=document.createElement('a');more.href='/catalog/'+me.seriesSlug;more.textContent='Вся серия «'+me.seriesTitle+'» →';
      more.style.cssText='display:inline-flex;align-items:center;min-height:44px;margin-top:22px;padding:0 20px;border:1px solid #6f5c2b;border-radius:999px;color:#6f5c2b;text-decoration:none;font-size:14px';
      sec.appendChild(more);
      var nav=document.getElementById('mbezu-prod-nav');var host2=document.getElementById('allrecords')||document.body;
      if(nav&&nav.parentNode===host2)host2.insertBefore(sec,nav);else host2.appendChild(sec);
    });
  }
  // 02.09 P1: Tilda не подставляет служебную страницу-шапку на страницы товара — строим компактную шапку JS
  function productHeader(){
    if(location.pathname.indexOf('/tproduct/')<0||document.getElementById('mbezu-prod-header'))return;
    var host=document.getElementById('allrecords');if(!host)return;
    var h=document.createElement('header');h.id='mbezu-prod-header';
    h.style.cssText='background:#ede5d6;color:#2a2520;border-bottom:1px solid rgba(42,37,32,.1);font-family:Inter Tight,system-ui,sans-serif';
    var L=[['/catalog','Каталог'],['/commission','На заказ'],['/podarok','В подарок'],['/journal','Журнал'],['/about','Художник']];
    var nav='';for(var i=0;i<L.length;i++)nav+='<a href="'+L[i][0]+'" style="color:inherit;text-decoration:none;padding:10px 0;font-size:13px;letter-spacing:.1em;text-transform:uppercase;font-weight:500">'+L[i][1]+'</a>';
    h.innerHTML='<div style="max-width:1480px;margin:0 auto;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px">'+
      '<a href="/" style="font-size:26px;font-weight:500;font-style:italic;letter-spacing:-.02em;color:inherit;text-decoration:none;padding:8px 0">MBezu</a>'+
      '<nav aria-label="Основная навигация" class="mbezu-prod-nav-links" style="display:flex;gap:26px">'+nav+'</nav>'+
      '<a href="/cart" id="mbezu-prod-cart" style="display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border:1px solid #6f5c2b;border-radius:999px;color:#6f5c2b;text-decoration:none;font-size:13px;letter-spacing:.1em;text-transform:uppercase;font-weight:500">Корзина</a></div>';
    host.insertBefore(h,host.firstChild);host.style.paddingTop='0px';
    var c=document.getElementById('mbezu-prod-cart');if(c)c.addEventListener('click',function(e){if(typeof tcart__openCart==='function'){e.preventDefault();tcart__openCart();}});
    if(!document.getElementById('mbezu-prod-header-css')){var st=document.createElement('style');st.id='mbezu-prod-header-css';st.textContent='@media (max-width:760px){.mbezu-prod-nav-links{display:none!important}}';document.head.appendChild(st);}
  }
  function appMark(){try{if(document.getElementById('root'))document.body.classList.add('mbezu-app');}catch(e){}}
  function run(){goldFix();productLd();try{productNav();}catch(e){}try{galleryHint();}catch(e){}try{productSeries();}catch(e){}try{productHeader();}catch(e){}appMark();}
  if(document.readyState!=='loading')run();
  document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('load',run);
  document.addEventListener('DOMContentLoaded',function(){
    try{var t2,mo=new MutationObserver(function(){clearTimeout(t2);t2=setTimeout(function(){goldFix();try{galleryHint();}catch(e){}try{productSeries();}catch(e){}},120);});
    mo.observe(document.body,{childList:true,subtree:true});}catch(e){}
  });
})();
</script>`;

// ── Корзина: sticky-кнопка на мобильном, доверие, пустая корзина ──
// (аудит 3.14: «ОФОРМИТЬ ЗАКАЗ» на 375 за экраном — после наших полей форма
//  стала длиннее; 3.15: ноль доверия в момент оплаты; мелочь 9: пустая корзина
//  показывала полную форму с активной кнопкой)
const CART_MARK = 'MBezu · cart-extras';
const CART_SNIPPET = `
<!-- ${CART_MARK} (Sprint 15) -->
<style>
@media (max-width: 640px) {
  /* 3.14: sticky/fixed ломаются transform-предками попапа Tilda — оставляем
     нативный скролл с запасом снизу; кнопка достижима одним свайпом. */
  .t706__orderform{padding-bottom:40px}
}
.mbezu-trust{font-size:12.5px;color:#6b5d4a;text-align:center;margin:10px 0 0;line-height:1.5}
/* мелочь 14: у кнопки покупки не было ховера вовсе */
.t-store button:hover,.t-store a.t-btn:hover,.t706__submit button:hover{opacity:.85;transition:opacity .2s}
</style>
<script>
(function(){
  function cartExtras(){
    try{
      var win=document.querySelector('.t706__cartwin');
      if(!win||getComputedStyle(win).display==='none')return;
      var hasItems=!!win.querySelector('.t706__product');
      var form=win.querySelector('form');
      if(form){form.style.display=hasItems?'':'none';}
      var subm=win.querySelector('.t-form__submit');
      if(hasItems&&subm&&!win.querySelector('.mbezu-trust')){
        var p=document.createElement('p');
        p.className='mbezu-trust';
        p.textContent='Сертификат подлинности · Оплата онлайн (ЮKassa) · Бережная доставка СДЭК по РФ';
        subm.appendChild(p);
      }
    }catch(e){}
  }
  document.addEventListener('DOMContentLoaded',function(){
    try{
      var t3,mo=new MutationObserver(function(){clearTimeout(t3);t3=setTimeout(cartExtras,150);});
      mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
    }catch(e){}
  });
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

const JRN_MARK = 'MBezu · journal-extras';
const JRN_SNIPPET = `
<!-- ${JRN_MARK} · h1 и Article-разметка на страницах статей /tpost/ (Sprint 15) -->
<script>
(function(){
  function up(){
    if(location.pathname.indexOf('/tpost/')!==0)return;
    var s=document.querySelector('span[data-style="post_title_typo"] .js-cms-text-container')
      ||document.querySelector('span[data-style="post_title_typo"]');
    if(s&&!document.querySelector('h1')){
      var h=document.createElement('h1');
      h.style.cssText='margin:0;font:inherit;letter-spacing:inherit;display:inline';
      while(s.firstChild)h.appendChild(s.firstChild);
      s.appendChild(h);
    }
    // моб. аудит: «назад» вела на главную; читатель из поиска не попадал в /journal
    var bb=document.querySelector('.js-cms-page-back-button');
    if(bb&&bb.getAttribute('href')!=='/journal')bb.setAttribute('href','/journal');
    var tt=document.querySelector('.t-cms__page-header__title');
    if(tt&&!tt.querySelector('a')){tt.innerHTML='<a href="/journal" style="color:inherit;text-decoration:none">'+tt.textContent+'</a>';}
    // мини-навигация витрины под статьёй (страницы потока живут без TopBar/подвала)
    if(!document.getElementById('mbezu-post-nav')){
      var host=document.querySelector('.t-cms__page-container')||document.querySelector('.t-cms__page')||null;
      if(host){
        var nav=document.createElement('nav');nav.id='mbezu-post-nav';
        nav.setAttribute('aria-label','Навигация по сайту');
        nav.style.cssText='max-width:760px;margin:48px auto 24px;padding:24px 20px;border-top:1px solid rgba(42,37,32,.14);display:flex;flex-wrap:wrap;gap:10px;justify-content:center;font-family:Inter Tight,system-ui,sans-serif';
        var L=[['/journal','Все статьи'],['/catalog','Каталог картин'],['/commission','Картина на заказ'],['/podarok','Картина в подарок'],['/about','О художнике']];
        for(var i=0;i<L.length;i++){var a=document.createElement('a');a.href=L[i][0];a.textContent=L[i][1];
          a.style.cssText='display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border:1px solid #6f5c2b;border-radius:999px;color:#6f5c2b;text-decoration:none;font-size:14px;letter-spacing:.02em';nav.appendChild(a);}
        host.appendChild(nav);
      }
    }
    if(!document.getElementById('mbezu-article-ld')){
      var og=function(p){var m=document.querySelector('meta[property="'+p+'"]');return m?m.getAttribute('content'):'';};
      var ld={'@context':'https://schema.org','@type':'Article',
        headline:(og('og:title')||document.title).split(' | ')[0],
        image:og('og:image')||undefined,
        inLanguage:'ru',
        mainEntityOfPage:og('og:url')||location.href,
        author:{'@type':'Person',name:'Mila Bez\\u00fa',url:'https://mbezu.ru/about'}};
      var sc=document.createElement('script');
      sc.type='application/ld+json';sc.id='mbezu-article-ld';
      sc.textContent=JSON.stringify(ld);
      document.head.appendChild(sc);
    }
  }
  if(document.readyState!=='loading')up();
  document.addEventListener('DOMContentLoaded',up);
  window.addEventListener('load',up);
})();
</script>`;

const MOB_MARK = 'MBezu · mobile-polish';
const MOB_SNIPPET = `
<!-- ${MOB_MARK} · мобильный аудит Sprint 15: нативные блоки Tilda -->
<style>
@media (max-width:960px){
  .t776 .t-slds__bullet_wrapper{display:block!important}
  .t776 .t-slds__bullet{padding:8px 6px}
}
.t706 .t-checkbox__indicator{width:22px!important;height:22px!important}
.t706 .t-checkbox__control{min-height:44px;display:flex;align-items:center}
/* аудит r2: у уникальной работы нет количества — +/− скрыты; кнопка и ошибки в акценте AA */
.t706__product-plus,.t706__product-minus{display:none!important}
.t706__product-del{padding:12px;margin:-12px;box-sizing:content-box}
.t706 .t-submit,.t706__cartwin-bottom .t-submit{background-color:#6f5c2b!important;border-color:#6f5c2b!important}
.t706 .t-submit:hover{background-color:#57471f!important}
.t706 .t-input-error,.t706 .t-form__errorbox-text{color:#8a2a1f!important;font-size:13.5px}
.t706__carticon-counter{background-color:#6f5c2b!important}
/* 02.09: плавающая корзина Tilda рисовалась пустым белым кругом — обводка иконки в акценте, фон карточный;
   на страницах витрины (есть шапка с корзиной) — скрыта, на нативных (товар, статьи) — остаётся */
.t706__carticon-wrapper{background-color:#f5efe2!important;box-shadow:0 8px 24px -12px rgba(42,37,32,.35)!important}
.t706__carticon-img path,.t706__carticon-img circle,.t706__carticon-img line{stroke:#6f5c2b!important}
.t706__carticon-text{color:#2a2520!important}
body.mbezu-app .t706__carticon{display:none!important}
body.mbezu-app .mbezu-chrome{display:none!important}
#mbezu-related a:hover img{transform:scale(1.05)}
/* страница товара — тот же тон, что у витрины */
body.t-body:has(.t-store__prod-snippet__container),.t-store__prod-snippet__container,.t-store .t-slds__container,.t-store__prod-popup__slider{background:#ede5d6!important}
.t-store .t-name,.t-store .t-descr,.t-store .t-text,.t-store .t-btn,.t-store__prod-popup__btn{font-family:'Inter Tight',system-ui,-apple-system,sans-serif!important}
.t-store .t-btn,.t-store__prod-popup__btn{background-color:#6f5c2b!important;color:#ede5d6!important;border-radius:999px!important}
.t2823 .t-uptitle_xs,.t-cms__page .t-uptitle_xs,.t-cms__page .t-uptitle_sm{font-size:12px!important}
@media (min-width:961px){#mbezu-gal-hint{display:none}}
</style>`;

const FAV_MARK = 'MBezu · favicon';
const FAV_SNIPPET = `
<!-- ${FAV_MARK} · Вебмастер: favicon SVG / 120×120 (Sprint 15) -->
<link rel="icon" type="image/svg+xml" href="https://cdn.mbezu.ru/favicon.svg">
<link rel="icon" type="image/png" sizes="120x120" href="https://cdn.mbezu.ru/favicon-120.png">
<link rel="apple-touch-icon" sizes="180x180" href="https://cdn.mbezu.ru/favicon-180.png">
<link rel="icon" type="image/png" sizes="512x512" href="https://cdn.mbezu.ru/favicon-512.png">`;

// 03.09 перф (Lighthouse mobile, холодная загрузка: perf 24–27, CLS 1.0 — «Web font loaded», TBT ~1 c — tag.js Метрики).
// 1) preconnect к CDN витрины + preload четырёх шрифтов первого экрана и style.css — шрифты приходят до первой отрисовки,
//    крупный H1 не перерисовывается; 2) тег Метрики (вебвизор+clickmap) вставляем после load + 2 с — очередь ym() копит события.
const PRE_MARK = 'MBezu · perf-preload';
const PRE_END = '<!-- /MBezu · perf-preload -->';
const PRE_SNIPPET = `
<!-- ${PRE_MARK} · Lighthouse: шрифты и CSS витрины до первой отрисовки (03.09) -->
<script>(function(){try{var p=location.pathname.replace(/\/+$/,'')||'/';if(/^(\/|\/catalog|\/catalog\/(monohromnaya|ulitsy-mira|tihaya-sila|tondo)|\/about|\/commission|\/legal)$/.test(p)){document.documentElement.className+=' mbezu-app';document.documentElement.setAttribute('data-mbezu','app');}if(p.indexOf('/tproduct/')>=0){document.documentElement.className+=' mbezu-prod';document.documentElement.setAttribute('data-mbezu','prod');}}catch(e){}})();</script>
<style>html.mbezu-app .mbezu-chrome,html[data-mbezu=app] .mbezu-chrome,html.mbezu-app .t706__carticon,html[data-mbezu=app] .t706__carticon{display:none!important}html.mbezu-prod #allrecords,html[data-mbezu=prod] #allrecords{padding-top:89px}html.mbezu-prod .t-store__prod-popup__slider .t-slds__container,html[data-mbezu=prod] .t-store__prod-popup__slider .t-slds__container{aspect-ratio:1/1}</style>
<link rel="preconnect" href="https://cdn.mbezu.ru" crossorigin>
<link rel="preconnect" href="https://cdn.mbezu.ru">
<link rel="preload" as="style" href="https://cdn.mbezu.ru/e/style.css">
<link rel="preload" as="font" type="font/woff2" crossorigin href="https://cdn.mbezu.ru/fonts/InterTight-normal-cyr-2.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="https://cdn.mbezu.ru/fonts/InterTight-italic-cyr-0.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="https://cdn.mbezu.ru/fonts/InterTight-normal-lat-3.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="https://cdn.mbezu.ru/fonts/JetBrainsMono-normal-cyr-4.woff2">
${PRE_END}`;
function perfPreload(out) {
  const NL = String.fromCharCode(10);
  if (out.includes(PRE_MARK)) {
    const a = out.indexOf('<!-- ' + PRE_MARK); const b = out.indexOf(PRE_END, a);
    if (a >= 0 && b > a) return out.slice(0, a) + PRE_SNIPPET.trim() + out.slice(b + PRE_END.length);
    return out;
  }
  return PRE_SNIPPET.trim() + NL + out;
}
const PM_MARK = 'MBezu · perf-metrika';
function perfMetrika(out) {
  if (out.includes(PM_MARK)) return out;
  const head = 'for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}';
  const tail = 'k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)';
  const a = out.indexOf(head); if (a < 0) return out;
  const b = out.indexOf(tail, a); if (b < 0) return out;
  const body = out.slice(a, b + tail.length);
  const repl = 'function mbzGo(){' + body + '}' +
    ' /* ' + PM_MARK + ': тег после load + 2 с (03.09) */' +
    ' if(document.readyState==="complete"){setTimeout(mbzGo,2000);}else{window.addEventListener("load",function(){setTimeout(mbzGo,2000);});}';
  return out.slice(0, a) + repl + out.slice(b + tail.length);
}

// Аудит r2 (SEO): Organization.logo вёл на 404, в адресе была квартира, у Organization не было sameAs,
// Person.url указывал на главную. Правим JSON прямо в head-коде.
function ldFix(out) {
  let o = out;
  o = o.split('"logo": "https://mbezu.ru/logo.png"').join('"logo": "https://cdn.mbezu.ru/favicon-512.png"');
  const si = o.indexOf('"streetAddress"');
  if (si >= 0) { const ls = o.lastIndexOf(NLC, si); const le = o.indexOf(NLC, si); if (ls >= 0 && le > ls) o = o.slice(0, ls) + o.slice(le); }
  const orgI = o.indexOf('"@type": "Organization"');
  if (orgI >= 0 && o.indexOf('"sameAs"', orgI) < 0) {
    o = o.replace('"legalName": "ИП Клевер Людмила Александровна",', '"legalName": "ИП Клевер Людмила Александровна",' + NLC + '  "sameAs": ["https://instagram.com/m.bezu_art", "https://t.me/mbezu_art", "https://vk.com/mbezu_art"],');
  }
  const pI = o.indexOf('"@type": "Person"');
  if (pI >= 0) { const key = '"url": "https://mbezu.ru"'; const uI = o.indexOf(key, pI); if (uI >= 0 && (orgI < 0 || uI < orgI)) o = o.slice(0, uI) + '"url": "https://mbezu.ru/about"' + o.slice(uI + key.length); }
  return o;
}
const NLC = String.fromCharCode(10);
function patchHead(src) {
  let out = src;
  const removed = [];
  // Sprint 15 (3.19): Google Fonts блокировал критический путь до 4 с —
  // шрифты теперь self-host в нашем бандле (cdn.mbezu.ru/fonts/*).
  const gf = out;
  out = out.replace(/[ 	]*<link[^>]*(fonts[.]googleapis|fonts[.]gstatic)[^>]*>/gi, '');
  if (out !== gf) removed.push('google-fonts');
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

  // существующий блок product-extras заменяем целиком (иначе правки не доезжают)
  if (out.includes(PROD_MARK)) {
    const startIdx = out.indexOf('<!-- ' + PROD_MARK);
    const endIdx = out.indexOf('</script>', startIdx);
    if (startIdx >= 0 && endIdx > startIdx) {
      out = out.slice(0, startIdx) + PROD_SNIPPET.trim() + out.slice(endIdx + '</script>'.length);
    }
  }
  if (out.includes(CART_MARK)) {
    const cs = out.indexOf('<!-- ' + CART_MARK);
    const ce = out.indexOf('</script>', cs);
    if (cs >= 0 && ce > cs) out = out.slice(0, cs) + CART_SNIPPET.trim() + out.slice(ce + 9);
  }
  const cartAdded = !out.includes(CART_MARK);
  if (cartAdded) out = out.trimEnd() + String.fromCharCode(10) + CART_SNIPPET + String.fromCharCode(10);

  // мелочь 20: старый бренд в head-комментарии
  out = out.replace('<!-- M.Bez · HEAD · v1.0 -->', '<!-- MBezu · HEAD · v1.1 -->');

  const prodAdded = !out.includes(PROD_MARK);
  if (prodAdded) out = out.trimEnd() + String.fromCharCode(10) + PROD_SNIPPET + String.fromCharCode(10);

  if (out.includes(RCV_MARK)) {
    const ra = out.indexOf('<!-- ' + RCV_MARK); const re0 = out.indexOf('</script>', ra);
    if (ra >= 0 && re0 > ra) out = out.slice(0, ra) + RCV_SNIPPET.trim() + out.slice(re0 + 9);
  }
  const rcvAdded = !out.includes(RCV_MARK);
  if (rcvAdded) out = out.trimEnd() + String.fromCharCode(10) + RCV_SNIPPET + String.fromCharCode(10);

  if (out.includes(JRN_MARK)) {
    const js = out.indexOf('<!-- ' + JRN_MARK);
    const je = out.indexOf('</script>', js);
    if (js >= 0 && je > js) out = out.slice(0, js) + JRN_SNIPPET.trim() + out.slice(je + 9);
  } else {
    out = out.trimEnd() + String.fromCharCode(10) + JRN_SNIPPET + String.fromCharCode(10);
  }

  if (out.includes(MOB_MARK)) {
    const ms = out.indexOf('<!-- ' + MOB_MARK);
    const me = out.indexOf('</style>', ms);
    if (ms >= 0 && me > ms) out = out.slice(0, ms) + MOB_SNIPPET.trim() + out.slice(me + 8);
  } else {
    out = out.trimEnd() + String.fromCharCode(10) + MOB_SNIPPET + String.fromCharCode(10);
  }

  if (out.includes(FAV_MARK)) {
    const fs0 = out.indexOf('<!-- ' + FAV_MARK);
    const fe = out.indexOf('sizes="512x512"', fs0);
    const fe2 = fe > 0 ? out.indexOf('>', fe) + 1 : -1;
    if (fs0 >= 0 && fe2 > fs0) out = out.slice(0, fs0) + FAV_SNIPPET.trim() + out.slice(fe2);
  } else {
    // фавикон — В НАЧАЛО head-кода, до скриптов
    out = FAV_SNIPPET.trim() + String.fromCharCode(10) + out;
  }

  out = ldFix(out);
  out = perfPreload(out);
  out = perfMetrika(out);
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
