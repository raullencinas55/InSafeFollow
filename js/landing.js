/**
 * landing.js - Lógica interactiva de la Landing Page de InSafeFollow
 * - Sandbox interactivo en vivo con datos de ejemplo
 * - Soporte directo de Drag & Drop para analizar archivos desde la home
 * - Animaciones reveal suaves y navegación interna
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Datos para el Sandbox Interactivo en Vivo (Continuidad 1:1 con la App)
  const demoData = {
    notFollowingBack: [
      { username: 'marcos_growth', date: 'Siguiendo desde hace 6 meses', initial: 'M' },
      { username: 'estudio_grafico_ba', date: 'Siguiendo desde hace 1 año', initial: 'E' },
      { username: 'viajes_fotografia', date: 'Siguiendo desde hace 8 meses', initial: 'V' },
      { username: 'sofia_tech_latam', date: 'Siguiendo desde hace 3 meses', initial: 'S' },
      { username: 'crypto_noticias_hoy', date: 'Siguiendo desde hace 2 años', initial: 'C' }
    ],
    unfollowedYou: [
      { username: 'lucas_fit_coach', date: 'Dejó de seguirte recientemente', initial: 'L' },
      { username: 'agencia_digital_x', date: 'Dejó de seguirte esta semana', initial: 'A' },
      { username: 'martin_fotografo', date: 'Dejó de seguirte hace 2 semanas', initial: 'M' }
    ],
    newFollowers: [
      { username: 'carolina_art', date: 'Empezó a seguirte ayer', initial: 'C' },
      { username: 'startup_fund', date: 'Empezó a seguirte hace 3 días', initial: 'S' },
      { username: 'matias_dj', date: 'Empezó a seguirte esta semana', initial: 'M' }
    ],
    mutual: [
      { username: 'camila_design', date: 'Se siguen mutuamente', initial: 'C' },
      { username: 'diego_programador', date: 'Se siguen mutuamente', initial: 'D' },
      { username: 'laura_musica', date: 'Se siguen mutuamente', initial: 'L' }
    ],
    fans: [
      { username: 'fan_account_99', date: 'Te sigue desde hace 5 meses', initial: 'F' },
      { username: 'comunidad_fans_arg', date: 'Te sigue desde hace 1 año', initial: 'C' }
    ],
    pendingRequests: [
      { username: 'cuenta_privada_xyz', date: 'Solicitud enviada hace 4 semanas', initial: 'P' },
      { username: 'privado_travel_22', date: 'Solicitud enviada hace 2 meses', initial: 'P' }
    ]
  };

  const categoryMeta = {
    notFollowingBack: { title: 'No te siguen', count: '14', badgeClass: 'badge-danger' },
    unfollowedYou: { title: 'Te dejaron de seguir', count: '3', badgeClass: 'badge-neutral' },
    newFollowers: { title: 'Nuevos seguidores', count: '8', badgeClass: 'badge-success' },
    mutual: { title: 'Seguimiento mutuo', count: '1,280', badgeClass: 'badge-neutral' },
    fans: { title: 'Fans', count: '42', badgeClass: 'badge-neutral' },
    pendingRequests: { title: 'Solicitudes pendientes', count: '5', badgeClass: 'badge-neutral' }
  };

  let activeDemoTab = 'notFollowingBack';
  let demoSearchQuery = '';

  const demoOverviewView = document.getElementById('demoOverviewView');
  const demoListView = document.getElementById('demoListView');
  const demoUnifiedHeader = document.getElementById('demoUnifiedHeader');
  const demoBackBtn = document.getElementById('demoBackBtn');
  const demoActiveTitle = document.getElementById('demoActiveTitle');
  const demoActiveBadge = document.getElementById('demoActiveBadge');
  const demoList = document.getElementById('demoList');
  const demoSearchInput = document.getElementById('demoSearchInput');
  const demoToggleSearchBtn = document.getElementById('demoToggleSearchBtn');
  const demoCloseSearchBtn = document.getElementById('demoCloseSearchBtn');
  const demoClearSearchBtn = document.getElementById('demoClearSearchBtn');

  function openDemoSearchMode() {
    if (demoUnifiedHeader) {
      demoUnifiedHeader.classList.add('search-active');
    }
    if (demoSearchInput) {
      demoSearchInput.focus();
    }
  }

  function closeDemoSearchMode() {
    if (demoUnifiedHeader) {
      demoUnifiedHeader.classList.remove('search-active');
    }
    if (demoSearchInput) {
      demoSearchInput.value = '';
    }
    if (demoClearSearchBtn) {
      demoClearSearchBtn.style.display = 'none';
    }
    if (demoSearchQuery !== '') {
      demoSearchQuery = '';
      renderDemoList();
    }
  }

  function showDemoOverview() {
    closeDemoSearchMode();
    if (demoOverviewView && demoListView) {
      demoListView.classList.add('demo-subview-hidden');
      demoOverviewView.classList.remove('demo-subview-hidden');
    }
  }

  function showDemoList(tabName) {
    closeDemoSearchMode();
    if (tabName) {
      activeDemoTab = tabName;
    }
    if (demoOverviewView && demoListView) {
      demoOverviewView.classList.add('demo-subview-hidden');
      demoListView.classList.remove('demo-subview-hidden');
    }
    selectDemoCategory(activeDemoTab);
  }

  function selectDemoCategory(tabName) {
    if (!tabName) return;
    activeDemoTab = tabName;
    closeDemoSearchMode();

    // Sincronizar pestañas de lista
    document.querySelectorAll('.mockup-tab[data-demo-tab]').forEach(t => {
      if (t.getAttribute('data-demo-tab') === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    // Sincronizar tarjetas Bento
    document.querySelectorAll('.demo-metric-card[data-demo-tab]').forEach(c => {
      if (c.getAttribute('data-demo-tab') === tabName) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    // Actualizar cabecera de categoría en la vista de lista
    const meta = categoryMeta[activeDemoTab];
    if (meta) {
      if (demoActiveTitle) demoActiveTitle.textContent = meta.title;
      if (demoActiveBadge) {
        demoActiveBadge.textContent = meta.count;
        demoActiveBadge.className = `badge ${meta.badgeClass}`;
      }
    }

    renderDemoList();
  }

  function renderDemoList() {
    if (!demoList) return;

    let items = demoData[activeDemoTab] || [];
    if (demoSearchQuery) {
      items = items.filter(u => u.username.toLowerCase().includes(demoSearchQuery));
    }

    demoList.innerHTML = '';

    if (items.length === 0) {
      demoList.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">
          No se encontraron cuentas que coincidan con "${demoSearchQuery}".
        </div>
      `;
      return;
    }

    items.forEach(user => {
      const row = document.createElement('div');
      row.className = 'mockup-row';
      row.innerHTML = `
        <div class="mockup-row-user">
          <div class="mockup-initial"><span>${user.initial}</span></div>
          <div>
            <div class="mockup-handle">@${user.username}</div>
            <div class="mockup-sub">${user.date}</div>
          </div>
        </div>
        <div class="mockup-row-actions">
          <button type="button" class="mockup-btn-action btn-demo-ignore" title="Ignorar (archivar cuenta)" aria-label="Ignorar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="21 8 21 21 3 21 3 8"></polyline>
              <rect x="1" y="3" width="22" height="5"></rect>
              <line x1="10" y1="12" x2="14" y2="12"></line>
            </svg>
            <span>Ignorar</span>
          </button>
          <a href="https://www.instagram.com/${user.username}/" target="_blank" rel="noopener noreferrer" class="mockup-btn-primary" title="Ver perfil en Instagram" aria-label="Ver perfil">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Ver perfil</span>
          </a>
        </div>
      `;

      const ignoreBtn = row.querySelector('.btn-demo-ignore');
      if (ignoreBtn) {
        ignoreBtn.addEventListener('click', () => {
          row.style.opacity = '0.4';
          row.style.transform = 'scale(0.98)';
          ignoreBtn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Archivado</span>
          `;
          ignoreBtn.disabled = true;
        });
      }

      demoList.appendChild(row);
    });
  }

  // Clic en tarjetas Bento del Dashboard -> Transición a Vista de Lista de esa categoría
  document.querySelectorAll('.demo-metric-card[data-demo-tab]').forEach(card => {
    card.addEventListener('click', () => {
      const tab = card.getAttribute('data-demo-tab');
      showDemoList(tab);
    });
  });

  // Clic en pestañas superiores dentro de la Vista de Lista
  document.querySelectorAll('.mockup-tab[data-demo-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-demo-tab');
      selectDemoCategory(targetTab);
    });
  });

  // Botón Volver al Dashboard
  if (demoBackBtn) {
    demoBackBtn.addEventListener('click', () => {
      showDemoOverview();
    });
  }

  if (demoToggleSearchBtn) {
    demoToggleSearchBtn.addEventListener('click', openDemoSearchMode);
  }
  if (demoCloseSearchBtn) {
    demoCloseSearchBtn.addEventListener('click', closeDemoSearchMode);
  }
  if (demoClearSearchBtn) {
    demoClearSearchBtn.addEventListener('click', () => {
      if (demoSearchInput) {
        demoSearchInput.value = '';
        demoSearchInput.focus();
      }
      demoClearSearchBtn.style.display = 'none';
      demoSearchQuery = '';
      renderDemoList();
    });
  }

  if (demoSearchInput) {
    demoSearchInput.addEventListener('input', (e) => {
      demoSearchQuery = e.target.value.toLowerCase().trim();
      if (demoClearSearchBtn) {
        demoClearSearchBtn.style.display = demoSearchQuery.length > 0 ? 'inline-flex' : 'none';
      }
      renderDemoList();
    });
    demoSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDemoSearchMode();
      }
    });
  }

  // Render inicial del sandbox
  renderDemoList();


  // 2. Drag & Drop directo desde la Landing Page
  const landingDropzone = document.getElementById('landingDropzone');
  const landingFileInput = document.getElementById('landingFileInput');
  const landingDropLoading = document.getElementById('landingDropLoading');

  if (landingDropzone && landingFileInput) {
    landingDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      landingDropzone.classList.add('dragover');
    });

    landingDropzone.addEventListener('dragleave', () => {
      landingDropzone.classList.remove('dragover');
    });

    landingDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      landingDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processLandingFile(e.dataTransfer.files[0]);
      }
    });

    landingFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processLandingFile(e.target.files[0]);
      }
    });
  }

  async function processLandingFile(file) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Por favor selecciona un archivo comprimido .zip oficial generado por el Centro de Cuentas de Meta.');
      return;
    }

    if (landingDropLoading) landingDropLoading.style.display = 'flex';

    try {
      if (typeof InstagramParser !== 'undefined' && typeof InSafeFollowStorage !== 'undefined') {
        const parsedData = await InstagramParser.parseZip(file);
        InSafeFollowStorage.saveNewSnapshot(parsedData);
        window.location.href = 'app.html';
      } else {
        window.location.href = 'app.html';
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Ocurrió un error al procesar el archivo. Serás redirigido al panel.');
      window.location.href = 'app.html';
    } finally {
      if (landingDropLoading) landingDropLoading.style.display = 'none';
    }
  }


  // 3. Scroll Reveal mediante IntersectionObserver
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.08,
    rootMargin: '0px 0px -30px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  // 4. Arquitectura de Navegación Móvil (App Shell) vs Desktop
  const openDrawerBtn = document.getElementById('openDrawerBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const webSections = document.querySelectorAll('section.web-section');
  let currentActiveMobileView = 'hero-view';

  function isMobileViewport() {
    return window.innerWidth < 768;
  }

  // Sincronizar selección activa en Desktop Navbar y Drawer Móvil
  function setActiveNavSection(sectionId) {
    if (!sectionId) return;
    const cleanId = sectionId.replace('#', '');

    // Actualizar enlaces del navbar de escritorio
    document.querySelectorAll('.nav-links .nav-link').forEach(link => {
      const href = (link.getAttribute('href') || '').replace('#', '');
      if (href === cleanId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Actualizar enlaces del menú hamburguesa / drawer
    document.querySelectorAll('.drawer-nav .drawer-link').forEach(link => {
      const href = (link.getAttribute('href') || '').replace('#', '');
      if (href === cleanId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ScrollSpy para vista continua de escritorio y tablet
  let isScrollingFromClick = false;
  let scrollTimeout = null;

  function updateActiveNavOnScroll() {
    if (isMobileViewport() || isScrollingFromClick) return;

    const scrollPos = window.scrollY + 140; // Margen de detección debajo del header
    const sections = Array.from(document.querySelectorAll('section.web-section'));
    let currentId = 'hero-view';

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.id;
        break;
      }
      if (scrollPos >= top) {
        currentId = sec.id;
      }
    }

    // Si el usuario llega al final de la página (ej. Marco Legal)
    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60)) {
      currentId = sections[sections.length - 1]?.id || currentId;
    }

    setActiveNavSection(currentId);
  }

  window.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateActiveNavOnScroll);
  }, { passive: true });

  function updateViewportMode() {
    if (isMobileViewport()) {
      document.body.classList.add('mobile-view-active');
      switchMobileView(currentActiveMobileView, false);
    } else {
      document.body.classList.remove('mobile-view-active');
      webSections.forEach(sec => sec.classList.remove('active-view'));
      updateActiveNavOnScroll();
    }
  }

  function switchMobileView(viewId, shouldScroll = true) {
    if (!viewId) return;
    const cleanId = viewId.replace('#', '');
    const targetEl = document.getElementById(cleanId);
    if (!targetEl) return;

    currentActiveMobileView = cleanId;
    setActiveNavSection(cleanId);

    if (isMobileViewport()) {
      document.body.classList.add('mobile-view-active');
      webSections.forEach(sec => sec.classList.remove('active-view'));
      targetEl.classList.add('active-view');
      closeDrawer();
      if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else {
      isScrollingFromClick = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrollingFromClick = false;
      }, 750);

      const headerOffset = 68;
      const elementPosition = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      closeDrawer();
    }
  }

  function openDrawer() {
    if (mobileDrawer) {
      mobileDrawer.classList.add('active');
      mobileDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDrawer() {
    if (mobileDrawer) {
      mobileDrawer.classList.remove('active');
      mobileDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (openDrawerBtn) openDrawerBtn.addEventListener('click', openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);

  // Escuchar todos los enlaces con anclas (#)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      e.preventDefault();
      switchMobileView(targetId);
    });
  });

  // Escuchar redimensionamiento de pantalla
  window.addEventListener('resize', updateViewportMode);

  // Inicializar modo según ancho de pantalla
  updateViewportMode();
  setActiveNavSection('hero-view');

  // Registro de Service Worker para soporte PWA y Offline
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});

