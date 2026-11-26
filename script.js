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

/* ========== Подсказка «листайте вниз» в каждом блоке ==========
   Достаточно добавить новый <section id="..."> — ссылка появится сама,
   за исключением последнего блока. Если в блоке уже есть .scroll-hint,
   он остаётся как есть (так сделано в первом блоке). */
const screens = document.querySelectorAll('section[id]');

screens.forEach((section, index) => {
  const nextSection = screens[index + 1];
  if (!nextSection || section.querySelector('.scroll-hint')) return;

  const hint = document.createElement('a');
  hint.className = 'scroll-hint';
  hint.href = `#${nextSection.id}`;
  hint.setAttribute('aria-label', 'Листайте ниже');
  hint.innerHTML = '<span>листайте вниз</span><span class="scroll-hint__arrow" aria-hidden="true"></span>';
  section.appendChild(hint);
});

/* ========== Навигация: карточки ждут свои блоки ==========
   Пока раздела с нужным id нет, карточка приглушена и не кликается.
   Как только блок появится, она станет активной сама. */
document.querySelectorAll('.nav-card[href^="#"]').forEach((card) => {
  const targetId = card.getAttribute('href').slice(1);
  if (!document.getElementById(targetId)) {
    card.classList.add('is-coming');
    card.setAttribute('aria-disabled', 'true');
  }
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
const TELEGRAM_USERNAME = 'dmitru_fairy'; // без @ — открываем чат сразу с вами

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
  const allergens = (data.get('allergens') || '').trim();
  const preferences = (data.get('preferences') || '').trim();

  if (!name || !attending) {
    setRsvpStatus('Пожалуйста, укажите имя и ответ о присутствии.', 'error');
    return;
  }

  const message = [
    '💌 Ответ на приглашение — Елизавета & Дмитрий',
    '',
    `Имя: ${name}`,
    `Присутствие: ${attending}`,
    `Аллергены: ${allergens || 'не указаны'}`,
    `Вкусовые предпочтения: ${preferences || 'не указаны'}`,
    '',
    `Отправлено: ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n');

  const messenger = event.submitter?.value || 'telegram';

  if (messenger === 'telegram') {
    const url = TELEGRAM_USERNAME
      ? `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`
      : `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(message)}`;

    openExternal(url);
    setRsvpStatus('Открыли Telegram с готовым текстом — осталось нажать «Отправить».', 'success');
    return;
  }

  // MAX: сначала кладём анкету в буфер (пока есть жест пользователя),
  // затем открываем приложение/веб-версию. Браузер не может сам вставить
  // текст в поле другого приложения — поэтому остаётся одно нажатие «Вставить».
  const copied = copyText(message);
  openExternal(MAX_PROFILE_URL || 'https://max.ru/');

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
