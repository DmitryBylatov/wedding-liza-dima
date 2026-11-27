/* ========== Блок 1 — обратный отсчёт ========== */

// Дата и время начала торжества. При необходимости поменяй время здесь.
const WEDDING_DATE = new Date('2027-07-19T16:00:00');

const units = {
  days: document.querySelector('[data-unit="days"]'),
  hours: document.querySelector('[data-unit="hours"]'),
  minutes: document.querySelector('[data-unit="minutes"]'),
  seconds: document.querySelector('[data-unit="seconds"]'),
};

const pad = (value) => String(value).padStart(2, '0');

function updateCountdown() {
  const diff = WEDDING_DATE.getTime() - Date.now();

  if (diff <= 0) {
    units.days.textContent = '00';
    units.hours.textContent = '00';
    units.minutes.textContent = '00';
    units.seconds.textContent = '00';
    clearInterval(timerId);
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  units.days.textContent = pad(Math.floor(totalSeconds / 86400));
  units.hours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
  units.minutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
  units.seconds.textContent = pad(totalSeconds % 60);
}

const timerId = setInterval(updateCountdown, 1000);
updateCountdown();

/* Кнопка на первом экране ведёт к форме подтверждения */
const rsvpButton = document.getElementById('rsvpButton');
rsvpButton.addEventListener('click', () => {
  document.getElementById('rsvp')?.scrollIntoView({ behavior: 'smooth' });
});

/* Liquid Glass: единый эффект для всех «окон» сайта */
document.querySelectorAll(
  '.countdown, .nav-card, .timeline__card, .venue__card, .rsvp-form, .gallery-card, .calendar-button, .faq-item'
).forEach((element) => element.classList.add('liquid-glass'));

/* Подсказка «листайте вниз» есть только на первом экране —
   в разметке она задана вручную и никуда больше не добавляется. */

/* ========== Кнопка «Добавить в календарь» ========== */
const calendarButton = document.getElementById('calendarButton');

calendarButton?.addEventListener('click', () => {
  const escape = (value) => String(value).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const event = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dima and Liza//Wedding//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:wedding-dima-liza-20270719@example.com',
    'DTSTAMP:20270101T000000Z',
    'DTSTART:20270719T160000',
    'DTEND:20270720T000000',
    'SUMMARY:Свадьба Дмитрия и Елизаветы',
    `DESCRIPTION:${escape('Сбор гостей в 16:00, церемония росписи в 17:30, банкет в 19:00.')}`,
    `LOCATION:${escape(venue?.dataset.address || 'Усадьба')}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Завтра свадьба Дмитрия и Елизаветы',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([event], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'svadba-dima-liza.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* ========== Навигация: карточки ждут свои блоки ==========
   Пока раздела с нужным id нет, карточка приглушена и не кликается.
   Как только блок появится, она станет активной сама. */
document.querySelectorAll('.nav-card[href^="#"]').forEach((card) => {
  const targetId = card.getAttribute('href').slice(1);
  const target = document.getElementById(targetId);

  if (!target) {
    card.classList.add('is-coming');
    card.setAttribute('aria-disabled', 'true');
    return;
  }

  /* Нажатие с подсветкой в цвете того блока, куда ведёт карточка */
  card.addEventListener('click', (event) => {
    event.preventDefault();

    const rect = card.getBoundingClientRect();
    card.style.setProperty('--press-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--press-y', `${event.clientY - rect.top}px`);
    card.classList.remove('is-pressed');
    void card.offsetWidth;
    card.classList.add('is-pressed');

    /* Ждём, пока гость досмотрит «шипение» целиком, и только потом ведём
       его в нужный блок. При reduced-motion анимации нет — ждать нечего. */
    const wait = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700;

    setTimeout(() => {
      card.classList.remove('is-pressed');
      target.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', `#${targetId}`);
    }, wait);
  });
});

/* ========== «Шипучая» кнопка (эффект #9 из подборки CSS-кнопок) ==========
   По нажатию из кнопки разлетаются частицы — как пузырьки в оригинальном
   Fizzy Button. Работает и мышью, и касанием, и с клавиатуры. */
const FIZZ_COLORS = ['#fff9f4', '#d9b89c', '#f2c9a0', '#9ad5ff', '#c9a8dd', '#8f5bff', '#2aabee'];

document.querySelectorAll('.fizzy').forEach((element) => {
  element.addEventListener('click', () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    element.querySelector('.fizz')?.remove();

    /* У карточек навигации частицы окрашиваем в цвет их блока */
    const navAccent = element.classList.contains('nav-card')
      ? getComputedStyle(element).getPropertyValue('--nav-accent').trim()
      : '';
    const colors = navAccent
      ? [navAccent, '#fff9f4', navAccent, '#ffffff']
      : FIZZ_COLORS;

    const layer = document.createElement('span');
    layer.className = 'fizz';
    layer.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < 40; i += 1) {
      const spot = document.createElement('span');
      const angle = (i / 40) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const distance = 34 + Math.random() * 70;

      spot.className = 'fizz__spot';
      spot.textContent = '♥';
      spot.style.setProperty('--fz-left', `${8 + Math.random() * 84}%`);
      spot.style.setProperty('--fz-top', `${15 + Math.random() * 70}%`);
      spot.style.setProperty('--fz-x', `${Math.cos(angle) * distance}px`);
      spot.style.setProperty('--fz-y', `${Math.sin(angle) * distance}px`);
      spot.style.setProperty('--fz-size', `${10 + Math.random() * 6}px`);
      spot.style.setProperty('--fz-delay', `${Math.random() * 0.18}s`);
      spot.style.setProperty('--fz-scale', `${0.6 + Math.random() * 0.9}`);
      spot.style.setProperty('--fz-color', colors[i % colors.length]);
      layer.appendChild(spot);
    }

    element.appendChild(layer);
    element.classList.remove('is-fizzing');
    void element.offsetWidth;
    element.classList.add('is-fizzing');

    setTimeout(() => {
      layer.remove();
      element.classList.remove('is-fizzing');
    }, 1400);
  });
});

/* ========== Блок 5 — карта и маршрут ==========
  Все данные берутся из атрибутов <section id="venue">:
  data-name, data-address, data-lat, data-lon. */
const venue = document.getElementById('venue');

if (venue) {
  const { name, address, lat, lon } = venue.dataset;

  venue.querySelector('[data-venue-name]').textContent = name;
  venue.querySelector('[data-venue-address]').textContent = address;

  document.getElementById('venueMap').src =
    `https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=15&pt=${lon}%2C${lat}%2Cpm2rdm`;

  document.getElementById('routeLink').href =
    `https://yandex.ru/maps/?rtext=~${lat}%2C${lon}&rtt=auto`;

  document.getElementById('taxiLink').href =
    `https://taxi.yandex.ru/order?to=${lat},${lon}`;
}

/* ========== Блок 7 — ссылки на Яндекс Диск ==========
   Адреса берутся из data-disk-* у секции #gallery. */
const gallery = document.getElementById('gallery');

if (gallery) {
  const diskLinks = {
    wedding: gallery.dataset.diskWedding,
    childhood: gallery.dataset.diskChildhood,
    upload: gallery.dataset.diskUpload,
  };

  gallery.querySelectorAll('[data-disk-link]').forEach((card) => {
    const url = diskLinks[card.dataset.diskLink];
    if (url) card.href = url;
  });
}

/* ========== Блок 6 — форма → мессенджеры ==========
   Никаких ботов и токенов: гость сам отправляет готовое сообщение.
   Если вставить свои ссылки, текст откроется сразу в вашем чате. */
const TELEGRAM_USERNAME = 'dmitru_fairy'; // без @ — получатель анкеты

// Номер, к которому привязан аккаунт MAX. Используется как fallback,
// чтобы гость мог найти вас через поиск внутри приложения.
const MAX_PHONE = '89966878304';

// Ссылка на ваш профиль/чат в MAX. Возьмите её в MAX:
// Профиль → «Поделиться» → «Копировать ссылку». Если вставить сюда ссылку,
// кнопка откроет сразу ваш чат, а не просто приложение.
const MAX_PROFILE_URL = '';

const rsvpForm = document.getElementById('rsvpForm');
const rsvpStatus = document.getElementById('rsvpStatus');

function setRsvpStatus(message, kind) {
  rsvpStatus.textContent = message;
  rsvpStatus.classList.remove('is-success', 'is-error');
  if (kind) rsvpStatus.classList.add(`is-${kind}`);
}

function openExternal(url) {
  // Через <a> надёжнее: window.open с noopener возвращает null даже при успехе
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function copyText(text) {
  // Синхронно, прямо внутри обработчика клика: так браузер разрешает
  // копировать даже на телефоне и в file://-превью.
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch (error) {
    copied = false;
  }

  textarea.remove();
  return copied;
}

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = new FormData(rsvpForm);
  const name = (data.get('name') || '').trim();
  const attending = data.get('attending') || '';
  const companions = data.get('companions') || '';
  const allergens = (data.get('allergens') || '').trim();
  const preferences = (data.get('preferences') || '').trim();

  if (!name || !attending) {
    setRsvpStatus('Пожалуйста, укажите имя и ответ о присутствии.', 'error');
    return;
  }

  const message = [
    '💌 Ответ на приглашение — Дмитрий & Елизавета',
    '',
    `Имя: ${name}`,
    `Присутствие: ${attending}`,
    `С кем: ${companions || 'не указано'}`,
    `Аллергены: ${allergens || 'не указаны'}`,
    `Вкусовые предпочтения: ${preferences || 'не указаны'}`,
    '',
    `Отправлено: ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n');

  const messenger = event.submitter?.value || 'telegram';

  if (messenger === 'telegram') {
    /* Прямая ссылка на личный чат: t.me/<логин>?text=...
       Открывается сразу диалог с вами, а анкета уже лежит в поле ввода.
       На всякий случай текст ещё и копируется в буфер. */
    const copied = copyText(message);
    const url = TELEGRAM_USERNAME
      ? `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`
      : `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(message)}`;

    openExternal(url);
    setRsvpStatus(
      copied
        ? 'Открыли личный чат: анкета уже в поле ввода и скопирована — осталось нажать «Отправить».'
        : 'Открыли личный чат с готовым текстом — нажмите «Отправить».',
      'success'
    );
    return;
  }

  // MAX: кладём анкету в буфер, затем пытаемся открыть именно приложение
  // через системную схему max://. Если приложения нет — открываем сайт.
  const copied = copyText(message);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  if (MAX_PROFILE_URL) {
    openExternal(MAX_PROFILE_URL);
  } else if (isMobile) {
    try {
      window.location.href = 'max://';
    } catch (error) {
      openExternal('max://');
    }

    setTimeout(() => {
      if (document.visibilityState === 'visible') openExternal('https://max.ru/');
    }, 900);
  } else {
    openExternal('https://max.ru/');
  }

  const phoneHint = MAX_PROFILE_URL
    ? ''
    : ` Если чат не открылся, найдите меня в MAX по номеру ${MAX_PHONE}.`;

  setRsvpStatus(
    copied
      ? `Анкета скопирована — вставьте её в чат MAX и отправьте.${phoneHint}`
      : `Открыли MAX. Скопируйте текст анкеты из формы и отправьте.${phoneHint}`,
    'success'
  );
});
