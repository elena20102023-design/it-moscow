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
