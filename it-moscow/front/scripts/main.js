const seed = [
 {"id":"demo-1","type":"offer","category":"Книги","title":"Грокаем алгоритмы","course":"Алгоритмы","description":"Бумажная книга с примерами на Python. Могу передать после занятий.","tag":"◫"},
 {"id":"demo-2","type":"request","category":"Конспекты","title":"Конспект по сетям","course":"Компьютерные сети","description":"Ищу материалы по адресации и подсетям для подготовки к зачёту.","tag":"≡"},
 {"id":"demo-3","type":"offer","category":"Материалы","title":"Шаблон для курсового проекта","course":"Веб-разработка","description":"Структура отчёта и чек-лист перед защитой. Подойдёт как основа для своего проекта.","tag":"⌘"},
 {"id":"demo-4","type":"request","category":"Книги","title":"Справочник по базам данных","course":"Базы данных","description":"Нужен учебник с задачами по SQL. Готов обменять на сборник по Python.","tag":"◫"}
];

const storageKey = 'it-moscow.exchange.v1';
const labels = { offer: 'Предложение', request: 'Запрос' };
const icons = { 'Книги': '◫', 'Конспекты': '≡', 'Материалы': '⌘' };
const byId = id => document.getElementById(id);
function loadBoard() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    return { own: Array.isArray(value?.own) ? value.own : [], replies: Array.isArray(value?.replies) ? value.replies : [] };
  } catch {
    return { own: [], replies: [] };
  }
}
const board = loadBoard();
function saveBoard() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(board));
    return true;
  } catch {
    return false;
  }
}
const editor = byId('editor');
const details = byId('details');
const form = byId('publish-form');
const cards = byId('cards');
const tabs = [...document.querySelectorAll('[data-type]')];
let selectedType = '';
let selectedItem = null;
const normalize = text => text.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
function element(tag, text, cls) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
function showResponse(item, stored = true) {
  const replied = board.replies.includes(item.id);
  byId('respond').disabled = replied;
  byId('detail-note').textContent = replied
    ? (stored ? 'Отклик сохранён на этом устройстве.' : 'Отклик сохранён до закрытия страницы.')
    : '';
}
function openDetails(item) {
  selectedItem = item;
  byId('detail-title').textContent = item.title;
  byId('detail-meta').textContent = labels[item.type] + ' · ' + item.category + ' · ' + item.course;
  byId('detail-description').textContent = item.description;
  byId('close-listing').hidden = !item.own;
  byId('respond').hidden = Boolean(item.own);
  showResponse(item);
  details.showModal();
}
function makeCard(item) {
  const card = element('article', '', 'card');
  card.dataset.kind = item.type;
  const badges = element('div', '', 'badges');
  badges.append(element('span', labels[item.type], 'chip ' + item.type), element('span', item.category, 'chip'));
  const more = element('button', 'Подробнее', 'button small');
  more.type = 'button';
  more.setAttribute('aria-label', 'Подробнее: ' + item.title);
  more.addEventListener('click', () => openDetails(item));
  card.append(element('span', icons[item.category], 'card-icon'), element('h3', item.title),
    element('p', item.course, 'meta'), element('p', item.description), badges, element('p', ''), more);
  return card;
}
function openEditor() {
  form.reset();
  clearValidation(form);
  document.querySelector('[data-form-note]').textContent = '';
  editor.showModal();
}
function render() {
  const search = normalize(byId('search').value);
  const category = byId('category').value;
  const found = [...board.own, ...seed].filter(item => !item.closed
    && (!selectedType || item.type === selectedType) && (!category || item.category === category)
    && normalize(item.title + ' ' + item.course).includes(search));
  byId('result').textContent = 'Найдено объявлений: ' + found.length;
  cards.replaceChildren(...found.map(makeCard));
  if (!found.length) {
    const empty = element('div', '', 'empty');
    const button = element('button', 'Оставить запрос', 'button primary');
    button.type = 'button';
    button.addEventListener('click', openEditor);
    empty.append(element('p', 'Ничего не найдено. Попробуй другой запрос или добавь объявление.'), button);
    cards.append(empty);
  }
}
function chooseType(type) {
  selectedType = type;
  tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.type === type)));
}
byId('search').addEventListener('input', render);
byId('category').addEventListener('change', render);
tabs.forEach(tab => tab.addEventListener('click', () => { chooseType(tab.dataset.type); render(); }));
document.querySelectorAll('[data-publish]').forEach(button => button.addEventListener('click', openEditor));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateForm(form)) return;
  const values = new FormData(form);
  const title = values.get('title').trim();
  const course = values.get('course').trim();
  const description = values.get('description').trim();
  if (!title || !course || !description) {
    document.querySelector('[data-form-note]').textContent = 'Заполни название, предмет и описание.';
    return;
  }
  board.own.unshift({ id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2), type: values.get('type'), category: values.get('category'), title, course, description, own: true });
  const stored = saveBoard();
  editor.close();
  chooseType('');
  byId('search').value = '';
  byId('category').value = '';
  render();
  if (!stored) byId('result').textContent += '. Новая запись доступна до закрытия страницы.';
  byId('catalog-title').scrollIntoView({ block: 'start' });
});
byId('respond').addEventListener('click', () => {
  if (!selectedItem || selectedItem.own || board.replies.includes(selectedItem.id)) return;
  board.replies.push(selectedItem.id);
  showResponse(selectedItem, saveBoard());
});
byId('close-listing').addEventListener('click', () => {
  if (!selectedItem?.own) return;
  selectedItem.closed = true;
  const stored = saveBoard();
  details.close();
  render();
  if (!stored) byId('result').textContent += '. Изменение доступно до закрытия страницы.';
});
render();

// Shared validation: trim before checking, inline errors and focus on first invalid field.
const rules = {
  'publish-form': {type: {options: ['request','offer']}, category: {options: Object.keys(icons)}, title: {min: 1,max: 80}, course: {min: 1,max: 55}, description: {min: 1,max: 320}},
  'feedback-form': {name: {min: 2,max: 50}, message: {min: 10,max: 500}}
};
function validationMessage(value, rule) {
  const text = value.trim();
  if (!text) return 'Заполни это поле.';
  if (rule.options && !rule.options.includes(text)) return 'Выбери значение из списка.';
  if (rule.min && text.length < rule.min) return 'Введи не менее ' + rule.min + ' символов.';
  if (rule.max && text.length > rule.max) return 'Не более ' + rule.max + ' символов.';
  return '';
}
function validateField(field, rule) {
  const message = validationMessage(field.value, rule);
  const error = byId(field.getAttribute('aria-describedby'));
  error.textContent = message;
  field.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}
function validateForm(target) {
  let first;
  for (const [name, rule] of Object.entries(rules[target.id])) {
    const field = target.elements.namedItem(name);
    if (!validateField(field, rule) && !first) first = field;
  }
  if (first) first.focus();
  return !first;
}
function clearValidation(target) {
  target.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  target.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; });
}
for (const [id, fields] of Object.entries(rules)) {
  const target = byId(id);
  for (const [name, rule] of Object.entries(fields)) {
    const field = target.elements.namedItem(name);
    const error = element('span', '', 'field-error');
    error.id = id + '-' + name + '-error';
    error.setAttribute('aria-live','polite');
    field.setAttribute('aria-describedby',error.id);
    field.after(error);
    field.addEventListener('blur', () => validateField(field,rule));
    field.addEventListener('input', () => {
      if (field.hasAttribute('aria-invalid')) validateField(field,rule);
    });
    field.addEventListener('change', () => validateField(field,rule));
  }
}
const feedback = byId('feedback-form');
feedback.addEventListener('submit', event => {
  event.preventDefault();
  const note = document.querySelector('[data-feedback-note]');
  note.textContent = '';
  if (!validateForm(feedback)) return;
  const values = new FormData(feedback);
  const entry = {kind: 'question',name: values.get('name').trim(),message: values.get('message').trim(),createdAt: new Date().toISOString()};
  try {
    const old = JSON.parse(localStorage.getItem('it-moscow.feedback.v1') || '[]');
    const entries = Array.isArray(old) ? old : [];
    entries.push(entry);
    localStorage.setItem('it-moscow.feedback.v1',JSON.stringify(entries));
    feedback.reset();
    clearValidation(feedback);
    note.textContent = 'Сообщение сохранено на этом устройстве. Спасибо!';
    note.classList.add('success');
  } catch {
    note.classList.remove('success');
    note.textContent = 'Не удалось сохранить сообщение. Проверь настройки хранилища браузера и попробуй снова. Текст остался в форме.';
  }
});
