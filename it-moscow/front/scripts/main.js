const filters = [...document.querySelectorAll('[data-filter]')];
const programs = [...document.querySelectorAll('[data-category]')];
const status = document.querySelector('#filter-status');

for (const button of filters) {
  button.addEventListener('click', () => {
    for (const filter of filters) {
      filter.setAttribute('aria-pressed', String(filter === button));
    }
    let shown = 0;
    for (const program of programs) {
      program.hidden = button !== filters[0] && program.dataset.category !== button.dataset.filter;
      if (!program.hidden) shown++;
    }
    if (status) status.textContent = 'Показано специальностей: ' + shown;
  });
}
