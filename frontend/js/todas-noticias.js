(function(){
  const root = document.getElementById('newsList');
  const qInput = document.getElementById('q');
  const catSel = document.getElementById('cat');
  if(!root || !window.NEWS_DATA) return;

  const isPages = location.pathname.includes('/pages/');
  const HREF_BASE = isPages ? './' : './pages/';
  const IMG_BASE = isPages ? '../IMG/' : './IMG/';

  const imagensTopo = [
  "sao-paulo-x-palmeiras.png"
];

  const params = new URLSearchParams(location.search);
  const initialQ = params.get('q') || '';
  
  if(qInput) qInput.value = initialQ;

  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,''); }

  function render(){
    const q = norm(qInput ? qInput.value.trim() : '');
    const cat = (catSel ? catSel.value : 'Todas');
    const items = window.NEWS_DATA.filter(it=>{
      const okCat = (cat==='Todas') || (it.category===cat);
      if(!okCat) return false;
      if(!q) return true;
      const blob = norm([it.title,it.excerpt,it.author,it.category].join(' '));
      return blob.includes(q);
    });

    root.innerHTML = items.map(it=>{
      const href = HREF_BASE + it.slug;
      const img = IMG_BASE + it.image;
      const classeImg = imagensTopo.includes(it.image) ? "img-topo" : "";
      return `
      <article class="card">
        <a class="media" href="${href}">
          <img src="${img}" class="${classeImg}" alt=""></a>
        <div class="content">
          <div class="kicker">${it.category}</div>
          <h3 class="title"><a href="${href}">${it.title}</a></h3>
          <p class="excerpt">${it.excerpt || ''}</p>
          <div class="meta">
            <span>${it.author ? ('Por ' + it.author) : ''}</span>
          </div>
        </div>
      </article>`;
    }).join('') || `<p class="small" style="color:var(--muted);font-weight:800">Nenhum resultado encontrado.</p>`;
  }

  if(qInput) qInput.addEventListener('input', render);
  if(catSel) catSel.addEventListener('change', render);

  if(qInput){
    qInput.addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){
        const qs = new URLSearchParams(location.search);
        const v = qInput.value.trim();
        if(v) qs.set('q', v); else qs.delete('q');
        history.replaceState({},'', location.pathname + (qs.toString()?('?'+qs.toString()):'') + '#busca');
      }
    });
  }

  render();
})();
