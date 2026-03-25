/* Jornal AJL — filtro da página Todas as Notícias */
(() => {
  const input = document.getElementById('newsSearch');
  const grid = document.getElementById('newsGrid');
  const pills = document.querySelectorAll('[data-filter]');
  if (!input || !grid) return;

  const cards = Array.from(grid.querySelectorAll('[data-title]'));
  let currentFilter = 'Tudo';

  const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const apply = () => {
    const q = normalize(input.value.trim());
    cards.forEach(card => {
      const title = normalize(card.getAttribute('data-title'));
      const excerpt = normalize(card.getAttribute('data-excerpt'));
      const cat = card.getAttribute('data-cat') || 'Tudo';

      const okFilter = (currentFilter === 'Tudo') || (cat === currentFilter);
      const okQuery = !q || title.includes(q) || excerpt.includes(q);

      card.style.display = (okFilter && okQuery) ? '' : 'none';
    });
  };

  input.addEventListener('input', apply);

  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(x => x.classList.remove('is-active'));
      p.classList.add('is-active');
      currentFilter = p.getAttribute('data-filter') || 'Tudo';
      apply();
    });
  });

  // prefill query from URL (?q=)
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) input.value = q;
  apply();
})();