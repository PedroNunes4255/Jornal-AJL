/* Jornal AJL — JS base (sem Firebase, sem curtidas/visitas)
   - injeta header/footer em todas as páginas
   - menu mobile
   - data da edição + última atualização
*/
(() => {
  const isInPages = window.location.pathname.includes('/pages/');
  const homeHref = isInPages ? '../index.html' : './index.html';
  const pageHref = (file) => isInPages ? `./${file}` : `./pages/${file}`;

  const fmtDateBR = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
  };

  const todayBR = () => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  };

  const lastUpdatedISO = () => document.querySelector('meta[name="last-updated"]')?.getAttribute('content') || '';
  const lastUpdatedBR = () => fmtDateBR(lastUpdatedISO());

  const headerMount = document.getElementById('siteHeader');
  const footerMount = document.getElementById('siteFooter');

  const navItems = [
    { href: homeHref, label: 'Início' },
    { href: pageHref('todas-noticias.html'), label: 'Notícias' },
    { href: pageHref('comunicados.html'), label: 'Comunicados' },
    { href: pageHref('eventos.html'), label: 'Eventos' },
    { href: pageHref('tempo.html'), label: 'Tempo' },
    { href: pageHref('atualizacoes.html'), label: 'Atualizações' },
  ];

  const makeNavLinks = (active = '') => navItems.map(it => {
    const isActive = active && active === it.label;
    return `<a href="${it.href}" class="${isActive ? 'is-active' : ''}">${it.label}</a>`;
  }).join('');

  const guessActive = () => {
    const p = window.location.pathname.toLowerCase();
    if (p.endsWith('/index.html') || p.endsWith('/') && !p.includes('/pages/')) return 'Início';
    if (p.includes('todas-noticias')) return 'Notícias';
    if (p.includes('comunicados')) return 'Comunicados';
    if (p.includes('eventos')) return 'Eventos';
    if (p.includes('tempo')) return 'Tempo';
    if (p.includes('atualizacoes')) return 'Atualizações';
    return '';
  };

  const active = guessActive();
  const updated = lastUpdatedBR();

  if (headerMount) {
    headerMount.innerHTML = `
      <header class="site-header" data-open="false">
        <div class="topbar">
          <div class="container">
            <div class="topbar-row">
              <div class="school">Escola Estadual Professor Antônio José Leite • Jornal Escolar</div>
              <div class="right">
                <span class="pill" title="Edição do dia">${todayBR()}</span>
                ${updated ? `<span class="pill" title="Última atualização desta página">Atualizado em: ${updated}</span>` : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="masthead">
          <div class="container">
            <div class="row">
              <div class="brand">
                <a href="${homeHref}" aria-label="Ir para a página inicial">Café com José Leite</a>
                <div class="tagline">Notícias, cultura e eventos da escola — simples, leve e direto.</div>
              </div>

              <div class="header-actions">
                <button class="menu-toggle" id="menuToggle" aria-label="Abrir menu">
                  <span></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="navbar">
          <div class="container">
            <div class="nav-row">
              <nav class="nav" aria-label="Navegação principal">
                ${makeNavLinks(active)}
              </nav>

              <div class="nav-extra">
                <div class="search" aria-label="Pesquisa (atalho para Notícias)">
                  <input id="headerSearch" type="search" placeholder="Pesquisar no jornal…" autocomplete="off" />
                </div>
              </div>

              <div class="mobile-drawer" id="mobileDrawer">
                <div class="search">
                  <input id="headerSearchMobile" type="search" placeholder="Pesquisar no jornal…" autocomplete="off" />
                </div>
                <nav class="nav" aria-label="Navegação principal (mobile)">
                  ${makeNavLinks(active)}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  if (footerMount) {
    const year = new Date().getFullYear();
    footerMount.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <h3>Café com José Leite</h3>
              <div class="note">
                Jornal escolar da EE Prof. Antônio José Leite. Conteúdo produzido por alunos e colaboradores.
                ${updated ? `<br><strong>Última atualização desta página:</strong> ${updated}.` : ''}
              </div>
              <div class="note" style="margin-top:10px;">© ${year} • Projeto escolar (site estático, hospedado no Netlify).</div>
            </div>

            <div>
              <h3>Atalhos</h3>
              <div class="note">
                <a href="${pageHref('todas-noticias.html')}">Todas as notícias</a><br>
                <a href="${pageHref('atualizacoes.html')}">Atualizações do site</a><br>
                <a href="${pageHref('tempo.html')}">Página do tempo</a>
              </div>

              <div style="margin-top:12px;">
                <button class="backtotop" id="backToTop" type="button">↑ Voltar ao topo</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // Mobile menu toggle
  const headerEl = document.querySelector('.site-header');
  const toggleBtn = document.getElementById('menuToggle');
  const drawer = document.getElementById('mobileDrawer');

  const setOpen = (open) => {
    if (!headerEl) return;
    headerEl.setAttribute('data-open', open ? 'true' : 'false');
    if (drawer) drawer.style.display = open ? 'block' : 'none';
  };

  if (drawer) drawer.style.display = 'none';

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const open = headerEl?.getAttribute('data-open') === 'true';
      setOpen(!open);
    });
  }

  // Close on ESC / click outside (mobile)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  document.addEventListener('click', (e) => {
    const open = headerEl?.getAttribute('data-open') === 'true';
    if (!open) return;
    const target = e.target;
    const isInside = headerEl && headerEl.contains(target);
    if (!isInside) setOpen(false);
  });

  // Back to top
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.id === 'backToTop') window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Header search: redirect to Notícias with query
  const wireSearch = (inputId) => {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const q = el.value.trim();
      const href = pageHref('todas-noticias.html') + (q ? `?q=${encodeURIComponent(q)}` : '');
      window.location.href = href;
    });
  };
  wireSearch('headerSearch');
  wireSearch('headerSearchMobile');
})();