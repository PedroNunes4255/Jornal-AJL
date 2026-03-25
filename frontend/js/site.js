(function(){
  const isPages = location.pathname.includes('/pages/');
  const BASE = isPages ? '..' : '.';

  function fmtDateISO(iso){
    try{
      const [y,m,d] = iso.split('-').map(n=>parseInt(n,10));
      const dt = new Date(y, (m||1)-1, d||1);
      return dt.toLocaleDateString('pt-BR');
    }catch(e){ return iso; }
  }

  function todayLong(){
    const dt = new Date();
    return dt.toLocaleDateString('pt-BR', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  }

  const lastMeta = document.querySelector('meta[name="last-updated"]');
  const lastUpdatedISO = (lastMeta && lastMeta.getAttribute('content')) ? lastMeta.getAttribute('content') : null;
  const lastUpdatedText = lastUpdatedISO ? fmtDateISO(lastUpdatedISO) : new Date().toLocaleDateString('pt-BR');

  const headerEl = document.getElementById('siteHeader');
  const footerEl = document.getElementById('siteFooter');

  const navItems = [
    {label:'Início', href:`${BASE}/index.html`},
    {label:'Notícias', href:`${BASE}/pages/todas-noticias.html`},
    {label:'Comunicados', href:`${BASE}/pages/comunicados.html`},
    {label:'Eventos', href:`${BASE}/pages/eventos.html`},
    {label:'Tempo', href:`${BASE}/pages/tempo.html`},
    {label:'Atualizações', href:`${BASE}/pages/atualizacoes.html`},
  ];

  function isActive(href){
    const norm = (u)=>u.replace(/\/+/g,'/').replace(/\/index\.html$/, '/');
    try{
      const here = norm(location.pathname);
      const target = new URL(href, location.origin).pathname;
      return norm(here) === norm(target);
    }catch(e){ return false; }
  }

  function headerHTML(){
    const navLinks = navItems.map(i=>`<a class="${isActive(i.href)?'active':''}" href="${i.href}">${i.label}</a>`).join('');
    const drawerLinks = navItems.map(i=>`<a href="${i.href}">${i.label}</a>`).join('');
    return `
      <header class="site-header">
        <div class="top-strip">
          <div class="container">
            <span class="dot"></span>
            <strong>Jornal AJL</strong>
            <span class="grow"></span>
            <span class="small" id="todayLong">${todayLong()}</span>
            <span class="small">•</span>
            <span class="small">Atualizado em <span data-last-updated>${lastUpdatedText}</span></span>
          </div>
        </div>

        <div class="masthead">
          <div class="container">
            <a class="logo" href="${BASE}/index.html" aria-label="Ir para a página inicial">
              <span class="logo-badge">AJL</span>
              <span>
                <span class="name">Jornal AJL</span>
                <span class="tagline">Escola Estadual Prof. Antônio José Leite</span>
              </span>
            </a>

            <div class="header-actions">
              <label class="search" aria-label="Pesquisar notícias">
                <span aria-hidden="true">🔎</span>
                <input id="globalSearch" type="search" placeholder="Pesquisar notícias..." />
              </label>

              <button class="menu-toggle" id="menuToggle" aria-label="Abrir menu">
                <span class="icon-bars"><span></span></span>
              </button>
            </div>
          </div>
        </div>

        <nav class="nav">
          <div class="container">
            ${navLinks}
          </div>
        </nav>

        <div class="nav-drawer" id="navDrawer" aria-hidden="true">
          <div class="panel" role="dialog" aria-modal="true" aria-label="Menu">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
              <h3 style="margin:0">Menu</h3>
              <button class="btn btn-ghost" id="closeDrawer" aria-label="Fechar menu">✕</button>
            </div>
            <div style="margin-top:10px">
              ${drawerLinks}
              <a href="${BASE}/pages/todas-noticias.html#busca" style="border-style:dashed">Pesquisar</a>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  function footerHTML(){
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <div class="title">Jornal AJL</div>
              <div class="small">Projeto escolar • Conteúdo produzido por alunos</div>
              <div style="margin-top:10px" class="badge">Última atualização: <span data-last-updated>${lastUpdatedText}</span></div>
            </div>
            <div>
              <div class="title">Seções</div>
              <div class="small" style="display:grid;gap:8px;margin-top:10px">
                ${navItems.slice(0,5).map(i=>`<a href="${i.href}">${i.label}</a>`).join('')}
              </div>
            </div>
            <div>
              <div class="title">Contato</div>
              <div class="small" style="margin-top:10px">
                Sugestões/avisos: procure o Grêmio ou a coordenação do Jornal AJL na escola.
              </div>
            </div>
          </div>
          <div class="small" style="margin-top:14px;opacity:.9">© <span id="yearNow"></span> Jornal AJL</div>
        </div>
      </footer>
      <button id="backToTop" aria-label="Voltar ao topo">↑</button>
    `;
  }

  if(headerEl) headerEl.innerHTML = headerHTML();
  if(footerEl) footerEl.innerHTML = footerHTML();

  // Search: redirect to todas-noticias with query
  function goSearch(q){
    if(!q) return;
    const url = `${BASE}/pages/todas-noticias.html?q=${encodeURIComponent(q)}#busca`;
    location.href = url;
  }
  const searchInput = document.getElementById('globalSearch');
  if(searchInput){
    searchInput.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        e.preventDefault();
        goSearch(searchInput.value.trim());
      }
    });
  }

  // Drawer
  const drawer = document.getElementById('navDrawer');
  const openBtn = document.getElementById('menuToggle');
  const closeBtn = document.getElementById('closeDrawer');

  function openDrawer(){
    if(!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer(){
    if(!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  if(openBtn) openBtn.addEventListener('click', openDrawer);
  if(closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if(drawer){
    drawer.addEventListener('click', (e)=>{
      if(e.target === drawer) closeDrawer();
    });
  }
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeDrawer();
  });

  // Footer year
  const y = document.getElementById('yearNow');
  if(y) y.textContent = String(new Date().getFullYear());

  // back to top
  const btt = document.getElementById('backToTop');
  if(btt){
    const onScroll = ()=>{
      if(window.scrollY > 650) btt.classList.add('show');
      else btt.classList.remove('show');
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
    btt.addEventListener('click', ()=>window.scrollTo({top:0, behavior:'smooth'}));
  }

  // Fill last-updated placeholders
  document.querySelectorAll('[data-last-updated]').forEach(el=>{ el.textContent = lastUpdatedText; });
})();
