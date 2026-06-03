import React from 'react';
import { Breadcrumbs, Eyebrow } from '../common/atoms';
import { ABOUT } from '../common/data';

// ─────────────────────────────────────────────────────────────
// page-legal.jsx — юридическая информация.
// 5 разделов в табах: Оферта · Политика ПД · Доставка · Возврат · Реквизиты.
//
// ⚠ Тексты — рабочий шаблон, юридически грамотный, но
// перед публикацией ОБЯЗАТЕЛЬНО показать юристу.
// Особо проверить раздел «Возврат» — для произведений искусства
// действуют исключения по ст. 26.1 ЗоЗПП.
// ─────────────────────────────────────────────────────────────

const LEGAL_TABS = [
  { id: 'offer',      label: 'Оферта' },
  { id: 'privacy',    label: 'Политика ПД' },
  { id: 'delivery',   label: 'Доставка и оплата' },
  { id: 'returns',    label: 'Возврат и обмен' },
  { id: 'requisites', label: 'Реквизиты' },
];

// ── Утилита для оформления параграфа договора ───────────────
function Clause({ n, title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h3 style={{
        margin: '0 0 16px', display: 'flex', gap: 16, alignItems: 'baseline',
        fontFamily: 'var(--display)', fontSize: 20, fontWeight: 500, letterSpacing: '-.01em',
      }}>
        <span className="mono" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>{n}</span>
        <span>{title}</span>
      </h3>
      <div style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </section>
  );
}

// ═══════ 1. ОФЕРТА ═══════════════════════════════════════════
function OfferSection() {
  const L = ABOUT.legal;
  return (
    <div>
      <header style={{ marginBottom: 56 }}>
        <Eyebrow accent>Договор · публичная оферта</Eyebrow>
        <h2 className="display" style={{
          margin: '20px 0 16px', fontSize: 'clamp(36px, 4.4vw, 60px)',
          fontWeight: 500, lineHeight: 1, letterSpacing: '-.025em',
        }}>
          Публичная <span className="italic" style={{ color: 'var(--accent)' }}>оферта</span>
        </h2>
        <div className="cat-no">Редакция от {L.docs_updated}</div>
      </header>

      <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)', marginBottom: 40 }}>
        Настоящий документ является публичной офертой (предложением) <strong style={{ color: 'var(--ink)' }}>{L.name_short}</strong>{' '}
        (ИНН {L.inn}, ОГРНИП {L.ogrnip}), далее — «Продавец», адресованной
        неограниченному кругу физических и юридических лиц, далее — «Покупатель», заключить договор купли-продажи
        произведений изобразительного искусства, представленных на сайте <strong style={{ color: 'var(--ink)' }}>{L.site}</strong>,
        на условиях, изложенных ниже. Совершая заказ через сайт, Покупатель подтверждает полное согласие с условиями
        настоящей оферты (ст. 437, 438 ГК РФ).
      </p>

      <Clause n="1." title="Предмет договора">
        <p>1.1. Продавец обязуется передать в собственность Покупателя оригинальное произведение
        изобразительного искусства (далее — «Работа»), а Покупатель — принять Работу и оплатить её стоимость.</p>
        <p>1.2. Каждая Работа является <strong>оригинальным произведением, существующим в единственном экземпляре</strong>,
        с авторской подписью художника и фирменным сертификатом подлинности.</p>
        <p>1.3. Описание, размер, техника исполнения, цена и иные характеристики каждой Работы указаны
        на соответствующей странице сайта.</p>
        <p>1.4. Право собственности на Работу переходит к Покупателю с момента передачи Работы
        и полной оплаты её стоимости. <strong>Исключительные авторские права</strong> на Работу
        (в том числе право на воспроизведение, тиражирование) сохраняются за автором —
        Mila Bezú (Клевер Людмила Александровна) — в соответствии со ст. 1255 ГК РФ.</p>
      </Clause>

      <Clause n="2." title="Порядок оформления заказа">
        <p>2.1. Покупатель оформляет заказ через корзину сайта, указывая Ф.И.О., контактный телефон, email,
        адрес доставки и выбирая способ оплаты и доставки.</p>
        <p>2.2. Заказ считается подтверждённым после оплаты Покупателем стоимости Работы.</p>
        <p>2.3. На каждый заказ присваивается уникальный номер вида <span className="mono">MB-ГГГГ-XXXX</span>,
        который направляется Покупателю на email.</p>
        <p>2.4. Заказ на изготовление Работы по индивидуальному заказу (commission) оформляется отдельно
        через форму на странице «На заказ» с подписанием отдельного договора. Условия настоящей оферты
        к индивидуальному заказу применяются в части, не противоречащей такому отдельному договору.</p>
      </Clause>

      <Clause n="3." title="Цена и порядок оплаты">
        <p>3.1. Цена Работы указана на сайте в российских рублях и включает все применимые налоги. Стоимость доставки
        рассчитывается отдельно при оформлении заказа.</p>
        <p>3.2. Оплата производится одним из способов, указанных на сайте: банковской картой, через Систему
        быстрых платежей (СБП) или безналичным переводом на расчётный счёт Продавца (для юридических лиц).</p>
        <p>3.3. Расчёты осуществляются через платёжный сервис ЮKassa (ООО НКО «ЮMoney»). Чек (БСО)
        о приёме оплаты направляется Покупателю в соответствии с 54-ФЗ.</p>
        <p>3.4. По индивидуальному заказу (commission) применяется предоплата 50% после согласования эскиза.
        Оставшиеся 50% — перед отгрузкой готовой Работы.</p>
      </Clause>

      <Clause n="4." title="Сроки и порядок доставки">
        <p>4.1. Работы, имеющиеся в наличии, отгружаются в течение 3–5 рабочих дней с момента оплаты.</p>
        <p>4.2. Работы по индивидуальному заказу изготавливаются от 4 до 10 недель — срок согласуется
        в момент подписания договора.</p>
        <p>4.3. Способы доставки и их стоимость указаны на странице «Доставка и оплата».</p>
        <p>4.4. Риск случайной гибели или повреждения Работы переходит к Покупателю с момента передачи
        Работы Покупателю или указанному им лицу (для самовывоза) или перевозчику (для отправки).</p>
      </Clause>

      <Clause n="5." title="Возврат и обмен">
        <p>5.1. <strong>Важно:</strong> произведение изобразительного искусства в единственном экземпляре
        является <strong>товаром с индивидуально-определёнными свойствами</strong> в смысле п. 4 ст. 26.1
        Закона РФ «О защите прав потребителей». Такой товар надлежащего качества <strong>возврату и обмену не подлежит</strong>.</p>
        <p>5.2. Возврат Работы возможен только в следующих случаях:</p>
        <p style={{ paddingLeft: 24 }}>а) Работа имеет недостатки (повреждения, не соответствующие описанию на сайте);</p>
        <p style={{ paddingLeft: 24 }}>б) Работа не была передана Покупателю в согласованный срок;</p>
        <p style={{ paddingLeft: 24 }}>в) Продавец нарушил условия настоящей оферты в части описания, размера
        или иных существенных характеристик Работы.</p>
        <p>5.3. В случаях по п. 5.2 Покупатель имеет право в течение 7 дней с момента получения Работы
        предъявить требование о возврате уплаченной суммы или о замене Работы.</p>
        <p>5.4. Возврат денежных средств осуществляется в течение 10 рабочих дней с момента получения Продавцом
        возвращённой Работы и проверки её состояния.</p>
        <p>5.5. Расходы на обратную доставку при возврате по п. 5.2 несёт Продавец. В иных случаях — Покупатель.</p>
      </Clause>

      <Clause n="6." title="Ответственность сторон">
        <p>6.1. Стороны несут ответственность за неисполнение или ненадлежащее исполнение обязательств
        в соответствии с законодательством РФ.</p>
        <p>6.2. Продавец не несёт ответственности за задержки доставки, вызванные действиями перевозчика
        или обстоятельствами непреодолимой силы.</p>
        <p>6.3. Покупатель несёт ответственность за достоверность предоставленных при оформлении заказа данных.</p>
      </Clause>

      <Clause n="7." title="Заключительные положения">
        <p>7.1. Все споры решаются путём переговоров. При недостижении согласия — в судебном порядке
        в соответствии с законодательством РФ.</p>
        <p>7.2. Продавец вправе изменить условия оферты в одностороннем порядке, разместив новую редакцию на сайте.
        Изменения вступают в силу с момента публикации.</p>
        <p>7.3. К отношениям сторон применяется законодательство Российской Федерации.</p>
        <p>7.4. Признание любого положения оферты недействительным не влечёт недействительности остальных положений.</p>
      </Clause>

      <Clause n="8." title="Реквизиты Продавца">
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>
          <strong>{L.full_name}</strong><br/>
          ИНН: {L.inn}<br/>
          ОГРНИП: {L.ogrnip}<br/>
          Адрес: {L.address}<br/>
          E-mail: {ABOUT.contacts.email}<br/>
          Сайт: {L.site}
        </p>
      </Clause>
    </div>
  );
}

// ═══════ 2. ПОЛИТИКА ПД ═════════════════════════════════════
function PrivacySection() {
  const L = ABOUT.legal;
  return (
    <div>
      <header style={{ marginBottom: 56 }}>
        <Eyebrow accent>152-ФЗ · защита данных</Eyebrow>
        <h2 className="display" style={{
          margin: '20px 0 16px', fontSize: 'clamp(36px, 4.4vw, 60px)',
          fontWeight: 500, lineHeight: 1, letterSpacing: '-.025em',
        }}>
          Политика обработки<br/><span className="italic" style={{ color: 'var(--accent)' }}>персональных данных</span>
        </h2>
        <div className="cat-no">Редакция от {L.docs_updated}</div>
      </header>

      <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)', marginBottom: 40 }}>
        Настоящая Политика разработана в соответствии с Федеральным законом № 152-ФЗ
        «О персональных данных» и определяет порядок обработки персональных данных Пользователей
        сайта <strong style={{ color: 'var(--ink)' }}>{L.site}</strong>.
        Оператор персональных данных — <strong style={{ color: 'var(--ink)' }}>{L.name_short}</strong> (ИНН {L.inn}).
      </p>

      <Clause n="1." title="Общие положения">
        <p>1.1. Пользователь, оставляя свои персональные данные на сайте, выражает согласие на их обработку
        Оператором в соответствии с настоящей Политикой.</p>
        <p>1.2. Оператор обеспечивает конфиденциальность и безопасность персональных данных в соответствии
        с требованиями законодательства РФ.</p>
      </Clause>

      <Clause n="2." title="Какие данные мы обрабатываем">
        <p>2.1. Персональные данные, которые Пользователь предоставляет добровольно:</p>
        <p style={{ paddingLeft: 24 }}>— Фамилия, имя, отчество;</p>
        <p style={{ paddingLeft: 24 }}>— Номер телефона;</p>
        <p style={{ paddingLeft: 24 }}>— Адрес электронной почты;</p>
        <p style={{ paddingLeft: 24 }}>— Адрес доставки;</p>
        <p style={{ paddingLeft: 24 }}>— Иная информация, которую Пользователь сообщает в формах заказа и брифа.</p>
        <p>2.2. Технические данные, собираемые автоматически: IP-адрес, информация о браузере и устройстве,
        данные cookie-файлов, информация о действиях на сайте (через системы аналитики Яндекс.Метрика, Google Analytics
        и аналогичные).</p>
      </Clause>

      <Clause n="3." title="Цели обработки">
        <p>3.1. Оформление и выполнение заказа.</p>
        <p>3.2. Связь с Пользователем по вопросам заказа.</p>
        <p>3.3. Доставка Работы Покупателю.</p>
        <p>3.4. Информирование о новых работах и закрытых продажах (только при отдельном согласии Пользователя
        в форме подписки).</p>
        <p>3.5. Улучшение работы сайта, анализ статистики посещений.</p>
        <p>3.6. Выполнение требований законодательства РФ (включая 54-ФЗ — выдача фискальных чеков).</p>
      </Clause>

      <Clause n="4." title="Правовые основания обработки">
        <p>4.1. Согласие Пользователя, выраженное активным действием (отметкой в форме, оформлением заказа).</p>
        <p>4.2. Договор купли-продажи (публичная оферта) — для целей исполнения обязательств перед Покупателем.</p>
        <p>4.3. Законодательство РФ — для целей налогового учёта и выдачи фискальных документов.</p>
      </Clause>

      <Clause n="5." title="Передача данных третьим лицам">
        <p>Оператор передаёт минимально необходимые данные следующим контрагентам исключительно для выполнения заказа:</p>
        <p style={{ paddingLeft: 24 }}>— Платёжный сервис <strong>ЮKassa</strong> (ООО НКО «ЮMoney») — для приёма платежей;</p>
        <p style={{ paddingLeft: 24 }}>— Службы доставки (<strong>СДЭК</strong> и иные арт-логистические компании) — для отправки Работы;</p>
        <p style={{ paddingLeft: 24 }}>— Хостинг-провайдер <strong>Tilda Publishing</strong> — для технического функционирования сайта.</p>
        <p>Передача данных третьим лицам в иных целях не производится без отдельного согласия Пользователя.</p>
      </Clause>

      <Clause n="6." title="Сроки хранения">
        <p>6.1. Персональные данные, связанные с заказом, хранятся в течение 3 лет с момента выполнения заказа
        (срок исковой давности по ГК РФ) и далее уничтожаются.</p>
        <p>6.2. Данные подписчиков рассылки хранятся до момента отписки или отзыва согласия.</p>
        <p>6.3. Технические данные (cookie, IP) хранятся не более 12 месяцев.</p>
      </Clause>

      <Clause n="7." title="Права Пользователя">
        <p>Пользователь вправе:</p>
        <p style={{ paddingLeft: 24 }}>— получать информацию о наличии у Оператора своих персональных данных;</p>
        <p style={{ paddingLeft: 24 }}>— требовать уточнения, блокирования или уничтожения своих данных;</p>
        <p style={{ paddingLeft: 24 }}>— отозвать согласие на обработку данных, направив запрос на {ABOUT.contacts.email};</p>
        <p style={{ paddingLeft: 24 }}>— обжаловать действия Оператора в Роскомнадзоре.</p>
      </Clause>

      <Clause n="8." title="Меры защиты">
        <p>Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных
        от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования,
        распространения, а также от иных неправомерных действий.</p>
      </Clause>

      <Clause n="9." title="Контакты оператора">
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>
          {L.full_name}<br/>
          ИНН: {L.inn}<br/>
          E-mail для запросов: {ABOUT.contacts.email}<br/>
          Адрес: {L.address}
        </p>
      </Clause>
    </div>
  );
}

// ═══════ 3. ДОСТАВКА И ОПЛАТА ═══════════════════════════════
function DeliverySection() {
  return (
    <div>
      <header style={{ marginBottom: 56 }}>
        <Eyebrow accent>Доставка картин по РФ</Eyebrow>
        <h2 className="display" style={{
          margin: '20px 0 16px', fontSize: 'clamp(36px, 4.4vw, 60px)',
          fontWeight: 500, lineHeight: 1, letterSpacing: '-.025em',
        }}>
          Доставка <span className="italic" style={{ color: 'var(--accent)' }}>и оплата</span>
        </h2>
      </header>

      <Clause n="01" title="Способы доставки">
        <p>Работы отправляются в фирменной упаковке Mila Bezú — зелёная коробка с золотым логотипом MB,
        бархатный мешочек и тубус для безопасной транспортировки.</p>
        <div style={{
          marginTop: 16, padding: 24, background: 'var(--bg-card)',
          borderRadius: 'var(--r-md)', border: '1px solid var(--rule-soft)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h4 style={{ margin: 0, fontFamily: 'var(--display)', fontWeight: 500, fontSize: 16, color: 'var(--ink)' }}>СДЭК</h4>
              <p style={{ margin: '6px 0', fontSize: 13.5 }}>5–7 рабочих дней по РФ · от 4 500 ₽</p>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)' }}>До пункта выдачи или курьером до двери</p>
            </div>
            <div>
              <h4 style={{ margin: 0, fontFamily: 'var(--display)', fontWeight: 500, fontSize: 16, color: 'var(--ink)' }}>Арт-логистика</h4>
              <p style={{ margin: '6px 0', fontSize: 13.5 }}>7–10 рабочих дней · от 9 000 ₽</p>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)' }}>Специализированная перевозка с дополнительной упаковкой и страховкой. Рекомендуется для крупных работ от 50×70 см.</p>
            </div>
            <div>
              <h4 style={{ margin: 0, fontFamily: 'var(--display)', fontWeight: 500, fontSize: 16, color: 'var(--ink)' }}>Самовывоз</h4>
              <p style={{ margin: '6px 0', fontSize: 13.5 }}>Москва · бесплатно</p>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)' }}>Из студии в районе Лефортово, по предварительной записи</p>
            </div>
          </div>
        </div>
      </Clause>

      <Clause n="02" title="Сроки">
        <p>Работы, имеющиеся в наличии, отправляются в течение 3–5 рабочих дней с момента оплаты.</p>
        <p>Работы на заказ (commission) — от 4 до 10 недель в зависимости от размера и сложности.
        Точный срок согласуется при подписании договора.</p>
      </Clause>

      <Clause n="03" title="Способы оплаты">
        <p>На сайте принимаются следующие способы оплаты:</p>
        <p style={{ paddingLeft: 24 }}>— Банковские карты Visa, Mastercard, МИР (через ЮKassa);</p>
        <p style={{ paddingLeft: 24 }}>— Система быстрых платежей (СБП);</p>
        <p style={{ paddingLeft: 24 }}>— Безналичный перевод по счёту (для юридических лиц).</p>
        <p>Все платежи проходят через защищённый сервис ЮKassa с фискализацией согласно 54-ФЗ.
        Чек направляется на email Покупателя автоматически.</p>
      </Clause>

      <Clause n="04" title="Международная доставка">
        <p>Доставка за пределы РФ обсуждается индивидуально — напишите на {ABOUT.contacts.email}{' '}
        или в <a href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener"
        style={{ color: 'var(--accent)' }}>Telegram</a> с указанием страны и города.</p>
      </Clause>

      <Clause n="05" title="Страхование при доставке">
        <p>Все отправления страхуются на полную стоимость Работы. В случае повреждения при перевозке
        — компенсация в полном объёме, новая отправка идентичной Работы невозможна
        (каждая работа в единственном экземпляре).</p>
      </Clause>
    </div>
  );
}

// ═══════ 4. ВОЗВРАТ И ОБМЕН ═════════════════════════════════
function ReturnsSection() {
  return (
    <div>
      <header style={{ marginBottom: 56 }}>
        <Eyebrow accent>Особенности возврата произведений искусства</Eyebrow>
        <h2 className="display" style={{
          margin: '20px 0 16px', fontSize: 'clamp(36px, 4.4vw, 60px)',
          fontWeight: 500, lineHeight: 1, letterSpacing: '-.025em',
        }}>
          Возврат <span className="italic" style={{ color: 'var(--accent)' }}>и обмен</span>
        </h2>
      </header>

      {/* Важное предупреждение */}
      <div style={{
        padding: 28, background: 'var(--bg-card)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--r-lg)', marginBottom: 40,
      }}>
        <Eyebrow accent>Важно знать до покупки</Eyebrow>
        <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--ink)' }}>
          Каждая работа Mila Bezú — <strong>оригинал в единственном экземпляре</strong>.
          По закону РФ это товар с индивидуально-определёнными свойствами,
          и <strong>возврат надлежащего качества не предусмотрен</strong> (п. 4 ст. 26.1 ЗоЗПП).
          Возврат возможен только при наличии недостатков.
        </p>
      </div>

      <Clause n="01" title="Возврат возможен при следующих условиях">
        <p><strong>1.1.</strong> Работа имеет недостатки, не оговорённые в описании на сайте:
        повреждения красочного слоя, деформация холста, отсутствие подписи или сертификата,
        несоответствие фактических размеров заявленным более чем на 1 см.</p>
        <p><strong>1.2.</strong> Работа не была доставлена в согласованный срок без уведомления Покупателя.</p>
        <p><strong>1.3.</strong> Работа отличается от описанной на сайте по существенным характеристикам
        (серия, сюжет, размер, материалы).</p>
      </Clause>

      <Clause n="02" title="Возврат невозможен">
        <p><strong>2.1.</strong> Работа не понравилась визуально, не подошла по цвету / стилю / размеру
        к интерьеру — это субъективное несоответствие, а не недостаток.</p>
        <p><strong>2.2.</strong> Покупатель передумал после получения Работы (по причинам, не связанным с её качеством).</p>
        <p><strong>2.3.</strong> Работа была повреждена Покупателем после получения.</p>
      </Clause>

      <Clause n="03" title="Как оформить возврат">
        <p><strong>3.1.</strong> В течение 7 дней с момента получения Работы направьте письмо
        на <a href={`mailto:${ABOUT.contacts.email}`} style={{ color: 'var(--accent)' }}>{ABOUT.contacts.email}</a> с темой
        «Возврат · MB-XXXX-XXXX», описанием недостатка и фотографиями.</p>
        <p><strong>3.2.</strong> В течение 3 рабочих дней мы согласуем порядок возврата: способ отправки
        и адрес для возврата.</p>
        <p><strong>3.3.</strong> Работа должна быть возвращена в оригинальной упаковке с сертификатом
        и всеми сопроводительными документами.</p>
        <p><strong>3.4.</strong> После получения Работы и проверки её состояния (3–5 рабочих дней)
        возврат денежных средств осуществляется в течение 10 рабочих дней на тот же платёжный инструмент,
        с которого была произведена оплата.</p>
      </Clause>

      <Clause n="04" title="Расходы на обратную доставку">
        <p>Если возврат связан с недостатком Работы или ошибкой Продавца — обратную доставку
        оплачивает Продавец. В иных согласованных случаях — Покупатель.</p>
      </Clause>

      <Clause n="05" title="Особые случаи · работы на заказ">
        <p>Работы, изготовленные по индивидуальному заказу (commission), возврату не подлежат
        в соответствии со ст. 26.1 ЗоЗПП. Условия по commission регулируются отдельным договором,
        подписываемым перед началом работы.</p>
      </Clause>

      <Clause n="06" title="Спорные ситуации">
        <p>Перед обращением в суд стороны обязуются попытаться разрешить спор путём переговоров.
        Mila всегда готова обсудить ситуацию лично — напишите в{' '}
        <a href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener"
        style={{ color: 'var(--accent)' }}>Telegram</a> или по email.</p>
      </Clause>
    </div>
  );
}

// ═══════ 5. РЕКВИЗИТЫ ═══════════════════════════════════════
function RequisitesSection() {
  const L = ABOUT.legal;
  return (
    <div>
      <header style={{ marginBottom: 56 }}>
        <Eyebrow accent>Для договоров и счетов</Eyebrow>
        <h2 className="display" style={{
          margin: '20px 0 16px', fontSize: 'clamp(36px, 4.4vw, 60px)',
          fontWeight: 500, lineHeight: 1, letterSpacing: '-.025em',
        }}>
          Реквизиты <span className="italic" style={{ color: 'var(--accent)' }}>организации</span>
        </h2>
      </header>

      <div style={{
        padding: 40, background: 'var(--bg-card)',
        borderRadius: 'var(--r-lg)', border: '1px solid var(--rule-soft)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <Eyebrow accent>Индивидуальный предприниматель</Eyebrow>
        <h3 className="display" style={{
          margin: '14px 0 32px', fontSize: 32, fontWeight: 500, letterSpacing: '-.02em',
        }}>{L.full_name}</h3>

        <dl style={{
          display: 'grid', gridTemplateColumns: '180px 1fr',
          gap: '18px 24px', margin: 0,
          fontFamily: 'var(--mono)', fontSize: 14,
        }} className="resp-stack-2">
          <dt className="cat-no">ИНН</dt>
          <dd style={{ margin: 0, color: 'var(--ink)' }}>{L.inn}</dd>

          <dt className="cat-no">ОГРНИП</dt>
          <dd style={{ margin: 0, color: 'var(--ink)' }}>{L.ogrnip}</dd>

          <dt className="cat-no">Адрес</dt>
          <dd style={{ margin: 0, color: 'var(--ink)' }}>{L.address}</dd>

          <dt className="cat-no" style={{ alignSelf: 'start' }}>Банк</dt>
          <dd style={{ margin: 0, color: 'var(--ink)' }}>{L.bank}</dd>

          <dt className="cat-no">БИК</dt>
          <dd style={{ margin: 0, color: 'var(--ink)' }}>{L.bik}</dd>

          <dt className="cat-no">Расчётный счёт</dt>
          <dd style={{ margin: 0, color: 'var(--ink)' }}>{L.rs}</dd>

          <dt className="cat-no">Корр. счёт</dt>
          <dd style={{ margin: 0, color: 'var(--ink)' }}>{L.ks}</dd>
        </dl>

        <div className="rule-soft" style={{ margin: '32px 0' }} />

        <dl style={{
          display: 'grid', gridTemplateColumns: '180px 1fr',
          gap: '18px 24px', margin: 0,
          fontFamily: 'var(--mono)', fontSize: 14,
        }} className="resp-stack-2">
          <dt className="cat-no">E-mail</dt>
          <dd style={{ margin: 0, color: 'var(--ink)' }}>
            <a href={`mailto:${ABOUT.contacts.email}`} className="uh" style={{ color: 'var(--accent)' }}>{ABOUT.contacts.email}</a>
          </dd>

          <dt className="cat-no">Телефон</dt>
          <dd style={{ margin: 0, color: 'var(--ink)' }}>{ABOUT.contacts.phone}</dd>

          <dt className="cat-no">Сайт</dt>
          <dd style={{ margin: 0, color: 'var(--ink)' }}>{L.site}</dd>
        </dl>
      </div>

      <p style={{ marginTop: 32, fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
        Полные реквизиты для оформления счёта на оплату или договора — направляются по запросу
        на <a href={`mailto:${ABOUT.contacts.email}`} style={{ color: 'var(--accent)' }}>{ABOUT.contacts.email}</a>.
      </p>
    </div>
  );
}

// ═══════ Основная страница ═════════════════════════════════
function LegalPage({ go, section }) {
  const [tab, setTab] = React.useState(
    LEGAL_TABS.find((t) => t.id === section) ? section : 'offer'
  );

  return (
    <div className="fade-in resp-pad" style={{ padding: '36px 40px 80px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <Breadcrumbs items={[
          { label: 'M.BEZ', onClick: () => go('home') },
          { label: 'Юридическая информация' },
        ]} />

        <div className="resp-stack" style={{
          marginTop: 36,
          display: 'grid', gridTemplateColumns: '260px 1fr',
          gap: 60, alignItems: 'start',
        }}>
          {/* Левая колонка — навигация по табам */}
          <aside style={{ position: 'sticky', top: 100, alignSelf: 'start' }} className="resp-static">
            <Eyebrow accent>Документы</Eyebrow>
            <nav style={{
              marginTop: 20, display: 'flex', flexDirection: 'column', gap: 4,
            }} className="resp-flex-col">
              {LEGAL_TABS.map((t) => (
                <button key={t.id} onClick={() => {
                  setTab(t.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} style={{
                  textAlign: 'left', padding: '14px 18px',
                  background: tab === t.id ? 'var(--ink)' : 'transparent',
                  color: tab === t.id ? 'var(--bg)' : 'var(--ink)',
                  border: '1px solid ' + (tab === t.id ? 'var(--ink)' : 'var(--rule-soft)'),
                  borderRadius: 'var(--r-md)', cursor: 'pointer',
                  fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
                  letterSpacing: '-.005em', transition: 'all .2s',
                }}>{t.label}</button>
              ))}
            </nav>

            <div style={{ marginTop: 28, padding: 20, background: 'var(--bg-soft)', borderRadius: 'var(--r-md)' }}>
              <div className="cat-no" style={{ marginBottom: 10 }}>Вопросы по документам</div>
              <a href={`mailto:${ABOUT.contacts.email}`} className="uh"
                 style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 13.5, display: 'block' }}>
                {ABOUT.contacts.email}
              </a>
              <a href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener" className="uh"
                 style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 13.5, display: 'block', marginTop: 6 }}>
                @{ABOUT.contacts.telegram}
              </a>
            </div>
          </aside>

          {/* Правая колонка — контент таба */}
          <div className="fade-in" key={tab}>
            {tab === 'offer'      && <OfferSection />}
            {tab === 'privacy'    && <PrivacySection />}
            {tab === 'delivery'   && <DeliverySection />}
            {tab === 'returns'    && <ReturnsSection />}
            {tab === 'requisites' && <RequisitesSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

export { LegalPage };
export default LegalPage;
