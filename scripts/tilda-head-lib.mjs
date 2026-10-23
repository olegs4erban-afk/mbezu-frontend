// ─────────────────────────────────────────────────────────────
// tilda-head-lib.mjs — сборка head-кода сайта в Tilda без браузера и без сессии.
//
// patchHead(src) берёт текущий head-код (снимок из админки или из MCP get_head_code)
// и возвращает исправленный. Его вызывают:
//   • scripts/tilda-head-code.mjs  — старый путь через сессию Tilda (Playwright);
//   • scripts/tilda-head-build.mjs — офлайн: файл → файл, для записи через MCP.
// Один источник правды: правки head-кода — только здесь, иначе следующий
// --apply откатит то, что залито вручную или через MCP.
// ─────────────────────────────────────────────────────────────

export const DEAD = ['@babel/standalone', '@google/model-viewer', 'react-dom@18', 'react@18'];

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
  // Аудит 21.10 (P1): все /tproduct/ размечались InStock, включая проданные портреты
  // PP-01…03 (data.ts: status 'sold' + commission true — примеры услуги «портрет на заказ»).
  // Наличие берём из works.json (поля status/commission, их пишет gen-works-json):
  // sold/commission → MadeToOrder (как в ItemList каталога, seo.ts), иначе InStock.
  // Нет записи о работе в works.json → InStock, как раньше.
  function workAvailability(me){
    if(me&&(me.status==='sold'||me.status==='commission'||me.commission===true))return 'https://schema.org/MadeToOrder';
    return 'https://schema.org/InStock';
  }
  function productLd(){
    if(location.pathname.indexOf('/tproduct/')<0)return;
    if(document.getElementById('mbezu-product-ld'))return;
    loadWorks(function(list){
      try{
        if(document.getElementById('mbezu-product-ld'))return;
        var name=(document.querySelector('[itemprop="name"]')||document.querySelector('h1')||{}).textContent||'';
        var priceEl=document.querySelector('[itemprop="price"]');
        var price=priceEl?(priceEl.content||priceEl.textContent||'').replace(/[^0-9.]/g,''):'';
        var img=(document.querySelector('meta[property="og:image"]')||{}).content||'';
        var descr=(document.querySelector('meta[name="description"]')||{}).content||'';
        if(!name||!price)return;
        var ld={'@context':'https://schema.org','@type':'Product',name:name.trim(),image:[img],description:descr,
          brand:{'@type':'Brand',name:'Mila Bezú'},
          offers:{'@type':'Offer',price:price,priceCurrency:'RUB',availability:workAvailability(findWork(list)),url:location.origin+location.pathname,itemCondition:'https://schema.org/NewCondition'}};
        var s=document.createElement('script');s.type='application/ld+json';s.id='mbezu-product-ld';
        s.textContent=JSON.stringify(ld);document.head.appendChild(s);
      }catch(e){}
    });
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
  // 21.10: ?v=3 — в works.json добавлены status/commission (наличие для Product JSON-LD).
  // Очередь колбэков: productLd и productSeries просят файл одновременно — один XHR на страницу;
  // при ошибке сети/парсинга колбэки получают [] (Product JSON-LD всё равно выйдет, как раньше — InStock),
  // WORKS не кэшируется, следующий вызов повторит запрос.
  var WORKS=null,WQ=null;
  function loadWorks(cb){
    if(WORKS){cb(WORKS);return;}
    if(WQ){WQ.push(cb);return;}
    WQ=[cb];
    var x=new XMLHttpRequest();x.open('GET','https://cdn.mbezu.ru/works.json?v=3',true);
    function flush(list){var q=WQ||[];WQ=null;for(var i=0;i<q.length;i++){try{q[i](list);}catch(e){}}}
    x.onload=function(){var l=null;try{l=JSON.parse(x.responseText);}catch(e){}if(l&&l.length){WORKS=l;flush(WORKS);}else{flush([]);}};
    x.onerror=function(){flush([]);};
    x.send();
  }
  function findWork(list){
    for(var i=0;i<list.length;i++){if(location.pathname.indexOf(list[i].url)===0)return list[i];}
    return null;
  }
  function fmtPrice(n){var t=String(n),o='';while(t.length>3){o=' '+t.slice(-3)+o;t=t.slice(0,-3);}return t+o+' ₽';}
  function dimsOf(w){return w.shape==='round'?('⌀ '+w.w+' см'):(w.w+'×'+w.h+' см');}
  function esc(s){return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');}
  function productSeries(){
    if(location.pathname.indexOf('/tproduct/')<0||document.getElementById('mbezu-crumbs'))return;
    var host=document.querySelector('.t-store__prod-snippet__container')||document.querySelector('.t-store');if(!host)return;
    loadWorks(function(list){
      var me=findWork(list);
      if(!me||document.getElementById('mbezu-crumbs'))return;
      var cr=document.createElement('nav');cr.id='mbezu-crumbs';cr.setAttribute('aria-label','Хлебные крошки');
      // Sprint 16: у серий mini/pets страниц Tilda нет — /catalog/<slug> отдаёт 403.
      // Адрес серии приходит готовым из works.json (seriesUrl), с фолбэком на ?series=.
      var sUrl=me.seriesUrl||('/catalog?series='+me.series);
      var parts=[['/','MBezu'],['/catalog','Каталог'],[sUrl,me.seriesTitle]];
      // 24.10 (версия 2): видимые крошки обычным текстом — «Главная / Каталог / Серия / Работа» (стили — в product-buy);
      // в BreadcrumbList корень по-прежнему «MBezu», как в seo.ts витрины.
      var vis=['Главная','Каталог',me.seriesTitle];
      for(var k=0;k<parts.length;k++){var a=document.createElement('a');a.href=parts[k][0];a.textContent=vis[k];cr.appendChild(a);var sp=document.createElement('span');sp.className=k===parts.length-1?'sep sep-last':'sep';sp.setAttribute('aria-hidden','true');sp.textContent='/';cr.appendChild(sp);}
      var cur=document.createElement('span');cur.className='cur';cur.setAttribute('aria-current','page');cur.textContent=me.title;cr.appendChild(cur);
      host.insertBefore(cr,host.firstChild);
      if(!document.getElementById('mbezu-ld-crumbs')){var ld=document.createElement('script');ld.type='application/ld+json';ld.id='mbezu-ld-crumbs';var items=[];for(var q=0;q<parts.length;q++){items.push({'@type':'ListItem','position':q+1,'name':parts[q][1],'item':'https://mbezu.ru'+parts[q][0]});}items.push({'@type':'ListItem','position':parts.length+1,'name':me.title,'item':'https://mbezu.ru'+me.url});ld.text=JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':items});document.head.appendChild(ld);}
      // 24.10: сначала свободные работы серии, потом проданные; у проданных вместо цены — «продана»
      var same=[],rest=[];for(var j=0;j<list.length;j++){var x=list[j];if(x.series===me.series&&x.id!==me.id){if(x.status==='available'&&!x.commission)same.push(x);else rest.push(x);}}
      same=same.concat(rest);
      if(!same.length||document.getElementById('mbezu-related'))return;
      same=same.slice(0,4);
      var sec=document.createElement('section');sec.id='mbezu-related';
      sec.style.cssText='max-width:1180px;margin:0 auto;padding:40px 20px 56px;font-family:Inter Tight,system-ui,sans-serif;color:#2a2520';
      sec.innerHTML='<div style="font:500 14px/1.4 Inter Tight,system-ui,sans-serif;color:#6f5c2b;margin-bottom:8px">Ещё из серии</div><h2 style="margin:0 0 22px;font-size:clamp(26px,3vw,40px);font-weight:500;letter-spacing:-.02em">'+esc(me.seriesTitle)+'</h2>';
      var grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:22px';
      for(var m=0;m<same.length;m++){var w=same[m];var a2=document.createElement('a');a2.href=w.url;a2.style.cssText='text-decoration:none;color:inherit;display:block';
        var free=w.status==='available'&&!w.commission;
        a2.innerHTML='<img src="'+w.img+'" alt="'+esc(w.title+' — картина маслом, '+dimsOf(w))+'" loading="lazy" style="width:100%;aspect-ratio:1/1;object-fit:contain;display:block;background:#ede5d6;border-radius:12px;transition:transform .5s"><div style="margin-top:10px;font-size:16px;font-weight:500">'+esc(w.title)+'</div><div style="font-size:13px;color:#6b5d4a">'+dimsOf(w)+' · '+(free?fmtPrice(w.price):'продана')+'</div>';
        grid.appendChild(a2);}
      sec.appendChild(grid);
      var more=document.createElement('a');more.href=sUrl;more.textContent='Вся серия «'+me.seriesTitle+'» →';
      more.style.cssText='display:inline-flex;align-items:center;min-height:44px;margin-top:22px;padding:0 20px;border:1px solid #6f5c2b;border-radius:999px;color:#6f5c2b;text-decoration:none;font-size:14px';
      sec.appendChild(more);
      var nav=document.getElementById('mbezu-prod-nav');var host2=document.getElementById('allrecords')||document.body;
      if(nav&&nav.parentNode===host2)host2.insertBefore(sec,nav);else host2.appendChild(sec);
    });
  }
  // 02.09 P1: Tilda не подставляет служебную страницу-шапку на страницы товара — строим шапку JS.
  // 24.10 (версия 2): та же шапка, что у витрины (chrome.tsx TopBar): логотип, меню обычным текстом,
  // телефон, Telegram, тёмная «Корзина»; на телефоне — иконки и меню-бургер. Стили — статикой в product-buy.
  var PH='+7 916 764-10-39',PH_HREF='tel:+79167641039',TG='https://t.me/+79167641039';
  function goal(g,p){try{if(typeof window.ym==='function'){var o={};o[g]=p||true;window.ym(111308276,'reachGoal',g,p);window.ym(111308276,'params',{mbezu:o});}}catch(e){}}
  function cartCount(){try{var t=JSON.parse(localStorage.getItem('tcart')||'{}');return t&&t.products&&t.products.length?t.products.length:0;}catch(e){return 0;}}
  function productHeader(){
    if(location.pathname.indexOf('/tproduct/')<0||document.getElementById('mbezu-prod-header'))return;
    var host=document.getElementById('allrecords');if(!host)return;
    var L=[['/catalog','Каталог'],['/commission','На заказ'],['/podarok','В подарок'],['/journal','Журнал'],['/about','Художник']];
    var nav='';for(var i=0;i<L.length;i++)nav+='<a href="'+L[i][0]+'">'+L[i][1]+'</a>';
    var icCart='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l1.2 13H4.8L6 7z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>';
    var icPhone='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2.1z"/></svg>';
    var h=document.createElement('header');h.id='mbezu-prod-header';
    h.innerHTML='<div class="mbz-in"><a href="/" class="mbz-logo" aria-label="MBezu — на главную">MBezu</a>'+
      '<nav class="mbz-nav" aria-label="Основная навигация">'+nav+'</nav>'+
      '<div class="mbz-act"><a href="'+PH_HREF+'" class="mbz-phone" data-g="phone_click">'+PH+'</a>'+
      '<a href="'+TG+'" target="_blank" rel="noopener" class="mbz-tg" data-g="tg_click">Telegram</a>'+
      '<a href="'+PH_HREF+'" class="mbz-ib mbz-phone-i" aria-label="Позвонить: '+PH+'" data-g="phone_click">'+icPhone+'</a>'+
      '<a href="/cart" id="mbezu-prod-cart" class="mbz-cart" aria-label="Корзина"><span class="mbz-cart-i">'+icCart+'<span class="mbz-badge" hidden></span></span><span class="mbz-cart-l">Корзина</span></a>'+
      '<button type="button" class="mbz-ib mbz-menu-btn" aria-label="Открыть меню" aria-expanded="false" aria-controls="mbz-menu"><span class="mbz-burger" aria-hidden="true"><i></i><i></i><i></i></span></button></div></div>'+
      '<nav id="mbz-menu" class="mbz-menu" aria-label="Меню" hidden>'+nav+
      '<div class="mbz-menu-c"><a href="'+PH_HREF+'" data-g="phone_click">'+PH+'</a><a href="'+TG+'" target="_blank" rel="noopener" data-g="tg_click">Telegram</a></div></nav>';
    host.insertBefore(h,host.firstChild);host.style.paddingTop='0px';
    var c=document.getElementById('mbezu-prod-cart');
    if(c)c.addEventListener('click',function(e){goal('cart_open',{place:'product-header'});if(typeof window.tcart__openCart!=='function')return;if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0)return;e.preventDefault();window.tcart__openCart();});
    h.addEventListener('click',function(e){var t=e.target;while(t&&t!==h&&!(t.getAttribute&&t.getAttribute('data-g')))t=t.parentNode;if(t&&t!==h)goal(t.getAttribute('data-g'),{place:'product-header'});});
    var btn=h.querySelector('.mbz-menu-btn'),menu=document.getElementById('mbz-menu'),bur=h.querySelector('.mbz-burger');
    function setOpen(on){if(!btn||!menu)return;if(on)menu.removeAttribute('hidden');else menu.setAttribute('hidden','');btn.setAttribute('aria-expanded',on?'true':'false');btn.setAttribute('aria-label',on?'Закрыть меню':'Открыть меню');if(bur)bur.className=on?'mbz-burger is-open':'mbz-burger';}
    if(btn)btn.addEventListener('click',function(){setOpen(menu.hasAttribute('hidden'));});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false);});
    window.addEventListener('resize',function(){if(window.innerWidth>900)setOpen(false);});
    var badge=h.querySelector('.mbz-badge');
    function upd(){if(!badge)return;var n=cartCount();if(n){badge.textContent=String(n);badge.removeAttribute('hidden');if(c)c.setAttribute('aria-label','Корзина: '+n);}else{badge.setAttribute('hidden','');if(c)c.setAttribute('aria-label','Корзина');}}
    upd();setInterval(upd,1500);window.addEventListener('storage',upd);
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
// ВАЖНО: редактор head-кода Tilda вырезает обратные слэши — inline-скрипты здесь без regex-экранирования (allowlist вместо regex).
// 1) preconnect к CDN витрины + preload четырёх шрифтов первого экрана и style.css — шрифты приходят до первой отрисовки,
//    крупный H1 не перерисовывается; 2) тег Метрики (вебвизор+clickmap) вставляем после load + 2 с — очередь ym() копит события.
const PRE_MARK = 'MBezu · perf-preload';
const PRE_END = '<!-- /MBezu · perf-preload -->';
const PRE_SNIPPET = `
<!-- ${PRE_MARK} · Lighthouse: шрифты и CSS витрины до первой отрисовки (03.09) -->
<script>(function(){try{var p=location.pathname;while(p.length>1&&p.charAt(p.length-1)==='/')p=p.slice(0,-1);if(!p)p='/';var app=['/','/catalog','/catalog/monohromnaya','/catalog/ulitsy-mira','/catalog/tihaya-sila','/catalog/tondo','/about','/commission','/legal'];if(app.indexOf(p)>=0){document.documentElement.className+=' mbezu-app';document.documentElement.setAttribute('data-mbezu','app');}if(p.indexOf('/tproduct/')>=0){document.documentElement.className+=' mbezu-prod';document.documentElement.setAttribute('data-mbezu','prod');}}catch(e){}})();</script>
<style>html.mbezu-app .mbezu-chrome,html[data-mbezu=app] .mbezu-chrome,html.mbezu-app .t706__carticon,html[data-mbezu=app] .t706__carticon{display:none!important}html.mbezu-prod #allrecords,html[data-mbezu=prod] #allrecords{padding-top:65px}html.mbezu-prod .t-store__prod-popup__slider .t-slds__container,html[data-mbezu=prod] .t-store__prod-popup__slider .t-slds__container{aspect-ratio:1/1}@media (max-width:900px){html.mbezu-prod #allrecords,html[data-mbezu=prod] #allrecords{padding-top:61px}}</style>
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

// 21.10 (152-ФЗ, аудит): «Только необходимые» в cookie-плашке — тег Метрики не грузим (ключ mbezu_cookie_ok = necessary).
const MC_MARK = 'mbezuCookieDeclined';
function metrikaConsent(out) {
  if (out.includes(MC_MARK)) return out;
  const key = 'function mbzGo(){';
  const a = out.indexOf(key); if (a < 0) return out;
  const guard = key + 'if(window.' + MC_MARK + ')return;try{if(localStorage.getItem("mbezu_cookie_ok")==="necessary")return;}catch(e){}';
  return out.slice(0, a) + guard + out.slice(a + key.length);
}

// 03.09 (152-ФЗ): уведомление о cookie/Метрике на всех страницах — фиксированная плашка снизу, согласие в localStorage.
// Без обратных слэшей и regex (редактор head Tilda вырезает слэши).
const CK_MARK = 'MBezu · cookie-notice';
const CK_END = '<!-- /MBezu · cookie-notice -->';
const CK_SNIPPET = `
<!-- ${CK_MARK} · 152-ФЗ: уведомление об использовании cookie и Яндекс Метрики (03.09; 21.10 — компактно, «Принять» / «Только необходимые»; 24.10 — над таб-баром витрины до 900 px) -->
<style>#mbezu-ck{position:fixed;left:16px;right:16px;bottom:16px;z-index:99990;max-width:640px;margin:0 auto;background:#2a2520;color:#efe7d8;border-radius:12px;padding:10px 12px 10px 14px;box-shadow:0 12px 40px rgba(0,0,0,.28);font:13px/1.4 Inter Tight,system-ui,-apple-system,sans-serif;display:flex;gap:10px;align-items:center;flex-wrap:wrap}#mbezu-ck p{margin:0;flex:1 1 220px}#mbezu-ck a{color:#e0c77e;text-decoration:underline;text-underline-offset:3px}#mbezu-ck .b{display:flex;gap:8px;flex:0 0 auto}#mbezu-ck button{min-height:36px;padding:0 14px;border:0;border-radius:999px;background:#c9ad63;color:#2a2520;font:600 13px/1 Inter Tight,system-ui,sans-serif;cursor:pointer}#mbezu-ck button.n{background:transparent;color:#efe7d8;border:1px solid rgba(239,231,216,.45)}#mbezu-ck button:focus-visible{outline:2px solid #efe7d8;outline-offset:2px}@media (max-width:600px){#mbezu-ck{left:8px;right:8px;bottom:8px;padding:10px 12px;font-size:12.5px}}@media (max-width:900px){html.mbezu-app #mbezu-ck,html[data-mbezu=app] #mbezu-ck{bottom:calc(72px + env(safe-area-inset-bottom))}}</style>
<script>(function(){try{var K='mbezu_cookie_ok';var ok=null;try{ok=localStorage.getItem(K);}catch(e){}if(ok)return;function show(){if(document.getElementById('mbezu-ck'))return;var d=document.createElement('div');d.id='mbezu-ck';d.setAttribute('role','region');d.setAttribute('aria-label','Уведомление о cookie');d.innerHTML='<p>Используем cookie и Яндекс Метрику для работы сайта и статистики — <a href="/legal?section=privacy">подробнее</a>.</p><div class="b"><button type="button" class="n" data-v="necessary">Только необходимые</button><button type="button" data-v="ok">Принять</button></div>';d.addEventListener('click',function(ev){var t=ev.target;while(t&&t!==d&&t.tagName!=='BUTTON')t=t.parentNode;if(!t||t===d)return;var v=t.getAttribute('data-v')==='necessary'?'necessary':String(Date.now());try{localStorage.setItem(K,v);}catch(e){}if(v==='necessary'){window.mbezuCookieDeclined=true;}d.parentNode.removeChild(d);});document.body.appendChild(d);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show);else show();}catch(e){}})();</script>
${CK_END}`;
// 21.10 (UX-аудит, P0 № 12): страница товара Tilda на мобильном — компактная шапка (без 50 px пустоты
// над ней), условия у цены (размер, единственный экземпляр, сертификат, ссылки на доставку/возврат),
// CTA «Заказать такой портрет» у проданных образцов PP-01…03 вместо серой «Нет в наличии»,
// липкая панель «цена · Купить», когда нативная кнопка ушла с экрана. Факты — из works.json.
const PB_MARK = 'MBezu · product-buy';
const PB_END = '<!-- /MBezu · product-buy -->';
const PB_SNIPPET = `
<!-- ${PB_MARK} · аудит 21.10: условия у цены, CTA для проданных образцов, мобильная панель «Купить»; 24.10 — шапка и крошки как в версии 2 -->
<style>
/* 24.10: шрифт витрины на страницах товара — /e/style.css там не грузится, а preload шрифтов стоит на всех страницах */
@font-face{font-family:'Inter Tight';font-style:italic;font-weight:300 500;font-display:swap;src:url(https://cdn.mbezu.ru/fonts/InterTight-italic-cyr-0.woff2) format('woff2');unicode-range:U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116}
@font-face{font-family:'Inter Tight';font-style:italic;font-weight:300 500;font-display:swap;src:url(https://cdn.mbezu.ru/fonts/InterTight-italic-lat-1.woff2) format('woff2');unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD}
@font-face{font-family:'Inter Tight';font-style:normal;font-weight:200 600;font-display:swap;src:url(https://cdn.mbezu.ru/fonts/InterTight-normal-cyr-2.woff2) format('woff2');unicode-range:U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116}
@font-face{font-family:'Inter Tight';font-style:normal;font-weight:200 600;font-display:swap;src:url(https://cdn.mbezu.ru/fonts/InterTight-normal-lat-3.woff2) format('woff2');unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD}
@font-face{font-family:'Inter Tight Fallback';font-style:normal;src:local('Arial');size-adjust:99.2%;ascent-override:97.7%;descent-override:24.3%;line-gap-override:0%}
@font-face{font-family:'Inter Tight Fallback';font-style:italic;src:local('Arial Italic'),local('Arial');size-adjust:102.2%;ascent-override:94.8%;descent-override:23.6%;line-gap-override:0%}
/* 24.10: шапка товара — как у витрины (версия 2) */
#mbezu-prod-header{position:relative;z-index:50;background:#ede5d6;color:#2a2520;border-bottom:1px solid rgba(42,37,32,.12);font-family:'Inter Tight','Inter Tight Fallback',system-ui,-apple-system,sans-serif}
#mbezu-prod-header a{color:#2a2520;text-decoration:none}
#mbezu-prod-header .mbz-in{box-sizing:border-box;max-width:1480px;margin:0 auto;height:64px;padding:0 clamp(16px,3vw,40px);display:flex;align-items:center;gap:clamp(16px,2.4vw,36px)}
#mbezu-prod-header .mbz-logo{display:inline-flex;align-items:center;min-height:44px;font-size:26px;font-style:italic;font-weight:500;letter-spacing:-.02em;line-height:1}
#mbezu-prod-header .mbz-nav{display:flex;align-items:center;gap:clamp(14px,1.8vw,28px)}
#mbezu-prod-header .mbz-nav a{display:inline-flex;align-items:center;min-height:44px;font-size:15px;font-weight:500;border-bottom:1px solid transparent;transition:border-color .2s}
#mbezu-prod-header .mbz-nav a:hover{border-bottom-color:currentColor}
#mbezu-prod-header .mbz-act{margin-left:auto;display:flex;align-items:center;gap:clamp(8px,1vw,16px)}
#mbezu-prod-header .mbz-phone{display:inline-flex;align-items:center;min-height:44px;font-size:15px;font-weight:500;white-space:nowrap}
#mbezu-prod-header .mbz-tg{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1px solid #2a2520;border-radius:999px;font-size:15px;font-weight:500;transition:background-color .2s,color .2s}
#mbezu-prod-header .mbz-tg:hover{background:#2a2520;color:#f5efe2}
#mbezu-prod-header .mbz-cart{position:relative;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border-radius:999px;background:#2a2520;color:#f5efe2;font-size:15px;font-weight:500;transition:background-color .2s}
#mbezu-prod-header .mbz-cart:hover{background:#000}
#mbezu-prod-header .mbz-cart-i{position:relative;display:inline-grid;place-items:center;line-height:0}
#mbezu-prod-header .mbz-badge{position:absolute;top:-7px;right:-9px;box-sizing:border-box;min-width:17px;height:17px;padding:0 4px;background:#bfa45e;color:#2a2520;border-radius:999px;font-size:11px;font-weight:700;display:inline-grid;place-items:center;line-height:1}
#mbezu-prod-header .mbz-badge[hidden]{display:none}
#mbezu-prod-header .mbz-ib{width:44px;height:44px;display:none;place-items:center;background:transparent;border:0;padding:0;border-radius:999px;color:#2a2520;cursor:pointer}
#mbezu-prod-header .mbz-burger{position:relative;display:block;width:21px;height:15px}
#mbezu-prod-header .mbz-burger i{position:absolute;left:0;right:0;height:1.6px;border-radius:2px;background:currentColor;transition:transform .3s,opacity .3s}
#mbezu-prod-header .mbz-burger i:nth-child(1){top:0}
#mbezu-prod-header .mbz-burger i:nth-child(2){top:6.7px}
#mbezu-prod-header .mbz-burger i:nth-child(3){top:13.4px}
#mbezu-prod-header .mbz-burger.is-open i:nth-child(1){transform:translateY(6.7px) rotate(45deg)}
#mbezu-prod-header .mbz-burger.is-open i:nth-child(2){opacity:0}
#mbezu-prod-header .mbz-burger.is-open i:nth-child(3){transform:translateY(-6.7px) rotate(-45deg)}
#mbezu-prod-header .mbz-menu{border-top:1px solid rgba(42,37,32,.12);padding:4px 16px 18px}
#mbezu-prod-header .mbz-menu[hidden]{display:none}
#mbezu-prod-header .mbz-menu>a{display:flex;align-items:center;min-height:52px;border-bottom:1px solid rgba(42,37,32,.12);font-size:17px;font-weight:500}
#mbezu-prod-header .mbz-menu-c{display:flex;gap:10px;margin-top:16px}
#mbezu-prod-header .mbz-menu-c a{flex:1 1 0;display:inline-flex;align-items:center;justify-content:center;min-height:48px;border:1px solid rgba(42,37,32,.35);border-radius:14px;font-size:15px;font-weight:500}
#mbezu-prod-header a:focus-visible,#mbezu-prod-header button:focus-visible{outline:2px solid #6f5c2b;outline-offset:2px}
@media (max-width:1100px){#mbezu-prod-header .mbz-phone{display:none}#mbezu-prod-header .mbz-phone-i{display:inline-grid}}
@media (max-width:900px){#mbezu-prod-header .mbz-in{height:60px;gap:8px}#mbezu-prod-header .mbz-logo{font-size:23px}#mbezu-prod-header .mbz-nav,#mbezu-prod-header .mbz-tg{display:none}#mbezu-prod-header .mbz-menu-btn{display:inline-grid}#mbezu-prod-header .mbz-act{gap:2px}#mbezu-prod-header .mbz-cart{background:transparent;color:#2a2520;padding:0;width:44px;justify-content:center}#mbezu-prod-header .mbz-cart:hover{background:transparent}#mbezu-prod-header .mbz-cart-l{display:none}#mbezu-prod-header .mbz-badge{background:#6f5c2b;color:#ede5d6}}
@media (min-width:901px){#mbezu-prod-header .mbz-menu{display:none!important}}
/* «Ещё работы» и крестик Tilda налезали на логотип и «Корзину» — путь назад дают шапка и крошки */
html[data-mbezu=prod] .t-store__prod-snippet__container .t-store__prod-popup__close-txt-wr,html[data-mbezu=prod] .t-store__prod-snippet__container .t-popup__close{display:none!important}
html[data-mbezu=prod] .t-store__prod-snippet__container{padding-top:0!important;padding-bottom:40px!important}
/* крошки — обычным текстом, как в версии 2 */
#mbezu-crumbs{box-sizing:border-box;max-width:1180px;margin:0 auto;padding:18px 20px 6px;display:flex;flex-wrap:wrap;align-items:center;gap:0 8px;font:14px/1.4 'Inter Tight','Inter Tight Fallback',system-ui,-apple-system,sans-serif;color:#6b5d4a}
#mbezu-crumbs a{display:inline-flex;align-items:center;min-height:36px;color:#6b5d4a;text-decoration:none}
#mbezu-crumbs a:hover{color:#6f5c2b;text-decoration:underline;text-underline-offset:3px}
#mbezu-crumbs .sep{color:#b3a583}
#mbezu-crumbs .cur{color:#2a2520}
#mbezu-buybar{display:none;position:fixed;left:0;right:0;bottom:0;z-index:99980;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:#f5efe2;border-top:1px solid rgba(42,37,32,.12);box-shadow:0 -8px 24px -16px rgba(42,37,32,.4);font-family:Inter Tight,system-ui,sans-serif;transform:translateY(110%);transition:transform .25s}
#mbezu-buybar.is-on{transform:none}
#mbezu-buybar .p{font-size:18px;font-weight:600;color:#2a2520;line-height:1.2}
#mbezu-buybar .s{font-size:12px;color:#6b5d4a}
#mbezu-buybar a,#mbezu-buybar button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border:0;border-radius:999px;background:#6f5c2b;color:#ede5d6;font:600 15px/1 Inter Tight,system-ui,sans-serif;text-decoration:none;cursor:pointer;white-space:nowrap}
.mbezu-facts{margin:12px 0 4px;font:14px/1.5 Inter Tight,system-ui,sans-serif;color:#2a2520}
.mbezu-facts a{color:#6f5c2b;text-decoration:underline;text-underline-offset:3px}
.mbezu-facts .l{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:8px;font-size:13px;color:#6b5d4a}
.mbezu-cta{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 24px;border-radius:999px;background:#6f5c2b;color:#ede5d6!important;font:600 15px/1 Inter Tight,system-ui,sans-serif;text-decoration:none!important;margin-top:14px}
@media (max-width:760px){
  #mbezu-crumbs{padding:4px 16px 4px;font-size:13px}
  #mbezu-crumbs .cur,#mbezu-crumbs .sep-last{display:none}
  html[data-mbezu=prod] .t706__carticon{bottom:88px!important}
  #mbezu-buybar{display:flex}
  body.mbezu-buybar-on #mbezu-ck{bottom:calc(84px + env(safe-area-inset-bottom))!important}
}
</style>
<script>
(function(){
  if(location.pathname.indexOf('/tproduct/')<0)return;
  function fmt(n){var t=String(n),o='';while(t.length>3){o=' '+t.slice(-3)+o;t=t.slice(0,-3);}return t+o+' ₽';}
  function dims(w){return w.shape==='round'?('⌀ '+w.w+' см'):(w.w+'×'+w.h+' см');}
  function load(cb){
    var x=new XMLHttpRequest();x.open('GET','https://cdn.mbezu.ru/works.json?v=3',true);
    x.onload=function(){var l=null;try{l=JSON.parse(x.responseText);}catch(e){}cb(l&&l.length?l:[]);};
    x.onerror=function(){cb([]);};x.send();
  }
  // Продано/на заказ: по works.json (status/commission) или по нативной кнопке Tilda (t-store__prod-popup__btn_disabled при qty 0)
  function state(me){
    var btn=document.querySelector('.t-store__prod-popup__btn');
    var soldNative=!!btn&&btn.className.indexOf('btn_disabled')>=0;
    var sold=soldNative||(!!me&&(me.status==='sold'||me.status==='commission'||me.commission===true));
    var pet=!!me&&(me.series==='pets'||me.commission===true);
    return {sold:sold,pet:pet};
  }
  function facts(me,st){
    if(document.getElementById('mbezu-facts'))return;
    var btnW=document.querySelector('.t-store__prod-popup__btn-wrapper');if(!btnW)return;
    var d=document.createElement('div');d.id='mbezu-facts';d.className='mbezu-facts';
    var ref=me?'?ref='+encodeURIComponent(me.id):'';
    if(st.sold&&st.pet){
      d.innerHTML='<div>Работа продана — это пример портрета на заказ'+(me?': '+dims(me)+', масло и поталь':'')+'.</div>'+
        '<a class="mbezu-cta" href="/commission'+ref+'">Заказать такой портрет</a>'+
        '<div class="l"><a href="/commission">Как проходит заказ</a><a href="/legal?section=delivery">Доставка и оплата</a></div>';
      btnW.style.display='none';
    }else if(st.sold){
      d.innerHTML='<div>Работа продана'+(me?' ('+dims(me)+', масло)':'')+'. Похожую можно написать на заказ.</div>'+
        '<a class="mbezu-cta" href="/commission'+ref+'">Заказать похожую</a>'+
        '<div class="l"><a href="/catalog">Работы в наличии</a><a href="/legal?section=delivery">Доставка и оплата</a></div>';
      btnW.style.display='none';
    }else{
      d.innerHTML='<div>'+(me?dims(me)+' · ':'')+'масло · оригинал в единственном экземпляре · сертификат подлинности</div>'+
        '<div class="l"><a href="/legal?section=delivery">Доставка и оплата</a><a href="/legal?section=returns">Возврат</a><a href="/about">Посмотреть в мастерской</a></div>';
    }
    btnW.parentNode.insertBefore(d,btnW.nextSibling);
  }
  function buybar(me,st){
    if(document.getElementById('mbezu-buybar'))return;
    var btnW=document.querySelector('.t-store__prod-popup__btn-wrapper');
    var priceEl=document.querySelector('.t-store__prod-popup__price-wrapper');
    var price=me?fmt(me.price):(priceEl?priceEl.textContent.trim():'');
    var ref=me?'?ref='+encodeURIComponent(me.id):'';
    var bar=document.createElement('div');bar.id='mbezu-buybar';
    var sub=st.sold?(st.pet?'продано · пример портрета на заказ':'продано'):(me?dims(me)+' · в наличии':'в наличии');
    var info='<div><div class="p">'+price+'</div><div class="s">'+sub+'</div></div>';
    if(st.sold){bar.innerHTML=info+'<a href="/commission'+ref+'">'+(st.pet?'Заказать портрет':'Заказать похожую')+'</a>';}
    else{bar.innerHTML=info+'<button type="button">Купить</button>';
      bar.querySelector('button').addEventListener('click',function(){var b=document.querySelector('.t-store__prod-popup__btn');if(b){b.click();}});}
    document.body.appendChild(bar);
    var ref2=st.sold?document.getElementById('mbezu-facts'):btnW;
    function show(on){bar.className=on?'is-on':'';if(on)document.body.classList.add('mbezu-buybar-on');else document.body.classList.remove('mbezu-buybar-on');}
    if(!ref2){show(true);return;}
    // по scroll, не IntersectionObserver: панель видна, пока нативная кнопка/CTA вне экрана
    function check(){var r=ref2.getBoundingClientRect();show(r.bottom<0||r.top>window.innerHeight);}
    var tk=false;function onS(){if(tk)return;tk=true;setTimeout(function(){tk=false;check();},120);}
    window.addEventListener('scroll',onS,{passive:true});window.addEventListener('resize',onS);check();
  }
  var done=false,tries=0;
  function run(){
    if(done)return;
    if(!document.querySelector('.t-store__prod-popup__btn-wrapper')){if(tries++<20)setTimeout(run,500);return;}
    done=true;
    load(function(list){var me=null;for(var i=0;i<list.length;i++){if(location.pathname.indexOf(list[i].url)===0){me=list[i];break;}}var st=state(me);try{facts(me,st);}catch(e){}try{buybar(me,st);}catch(e){}});
  }
  if(document.readyState!=='loading')run();else document.addEventListener('DOMContentLoaded',run);
})();
</script>
${PB_END}`;
function productBuy(out) {
  const NL = String.fromCharCode(10);
  if (out.includes(PB_MARK)) { const a = out.indexOf('<!-- ' + PB_MARK); const b = out.indexOf(PB_END, a); if (a >= 0 && b > a) return out.slice(0, a) + PB_SNIPPET.trim() + out.slice(b + PB_END.length); return out; }
  return out.trimEnd() + NL + PB_SNIPPET.trim() + NL;
}
const CRT_MARK = 'MBezu · cart-ru';
const CRT_END = '<!-- /MBezu · cart-ru -->';
const CRT_SNIPPET = `
<!-- ${CRT_MARK} · корзина Tilda: заголовок «Payment method» не переводится настройками — правим текстом (04.09) -->
<script>(function(){try{function fix(){var els=document.querySelectorAll('.t-input-group_pm .t-input-title');for(var i=0;i<els.length;i++){if(els[i].textContent.indexOf('Payment method')>=0){els[i].textContent='Способ оплаты';}}}var n=0;var t=setInterval(function(){fix();n++;if(n>90){clearInterval(t);}},1000);document.addEventListener('click',function(){setTimeout(fix,400);setTimeout(fix,1500);},true);}catch(e){}})();</script>
${CRT_END}`;
function cartRu(out) {
  const NL = String.fromCharCode(10);
  if (out.includes(CRT_MARK)) { const a = out.indexOf('<!-- ' + CRT_MARK); const b = out.indexOf(CRT_END, a); if (a >= 0 && b > a) return (out.slice(0, a) + out.slice(b + CRT_END.length)).trimEnd() + NL; return out; }
  return out; // 04.09: не вставляем — Tilda сама показывает «Способ оплаты» в живом DOM; английский только в статике
}
function cookieNotice(out) {
  const NL = String.fromCharCode(10);
  if (out.includes(CK_MARK)) { const a = out.indexOf('<!-- ' + CK_MARK); const b = out.indexOf(CK_END, a); if (a >= 0 && b > a) return out.slice(0, a) + CK_SNIPPET.trim() + out.slice(b + CK_END.length); return out; }
  return out.trimEnd() + NL + CK_SNIPPET.trim() + NL;
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
    o = o.replace('"legalName": "ИП Клевер Людмила Александровна",', '"legalName": "ИП Клевер Людмила Александровна",' + NLC + '  "sameAs": ["https://t.me/+79167641039", "https://vk.com/mbezu_art"],');
  }
  // 24.10 (версия 2): Instagram из sameAs Person и Organization убран — как в подвале и в разметке витрины
  // (seo.ts, organizationLd): ссылки на сервисы Meta в РФ — лишний риск, аудитория — VK и Telegram.
  o = o.split('    "https://instagram.com/m.bezu_art",' + NLC).join('');
  o = o.split('"https://instagram.com/m.bezu_art", ').join('');
  const pI = o.indexOf('"@type": "Person"');
  if (pI >= 0) { const key = '"url": "https://mbezu.ru"'; const uI = o.indexOf(key, pI); if (uI >= 0 && (orgI < 0 || uI < orgI)) o = o.slice(0, uI) + '"url": "https://mbezu.ru/about"' + o.slice(uI + key.length); }
  return o;
}
const NLC = String.fromCharCode(10);
function patchHead(src) {
  let out = src;
  const removed = [];
  // 20.09: у аккаунта нет @username — t.me/mbezu_art отдавал «пользователь
  // не существует». Везде (JSON-LD sameAs, ссылки) ставим номерную ссылку.
  out = out.split('https://t.me/mbezu_art').join('https://t.me/+79167641039');
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
  out = metrikaConsent(out);
  out = cookieNotice(out);
  out = cartRu(out);
  out = productBuy(out);
  return { out, removed, brandFixed, typeFixed, ruAdded, rcvAdded };
}


export { patchHead };
