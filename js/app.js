/**
 * app.js - Controlador principal del Dashboard de InSafeFollow
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const loadingBox = document.getElementById('loadingBox');
  const dashboardContent = document.getElementById('dashboardContent');
  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('resultsContainer');
  const userListWindow = document.getElementById('userListWindow');
  const scrollSentinel = document.getElementById('scrollSentinel');
  const emptyState = document.getElementById('emptyState');
  const statusBanner = document.getElementById('statusBanner');
  const lastUpdatedText = document.getElementById('lastUpdatedText');
  const newUploadBtn = document.getElementById('newUploadBtn');

  // Modales
  const instructionsModal = document.getElementById('instructionsModal');
  const openGuideBtn = document.getElementById('openGuideBtn');
  const closeGuideBtn = document.getElementById('closeGuideBtn');

  const resetModal = document.getElementById('resetModal');
  const openResetBtn = document.getElementById('openResetBtn');
  const closeResetBtn = document.getElementById('closeResetBtn');
  const confirmResetBtn = document.getElementById('confirmResetBtn');

  const legalModal = document.getElementById('legalModal');
  const openLegalBtn = document.getElementById('openLegalBtn');
  const closeLegalBtn = document.getElementById('closeLegalBtn');

  // Subvistas Modulares (App Shell Móvil y Desktop)
  const appOverviewView = document.getElementById('appOverviewView');
  const appListView = document.getElementById('appListView');
  const backToOverviewBtn = document.getElementById('backToOverviewBtn');
  const activeCategoryTitle = document.getElementById('activeCategoryTitle');
  const activeCategoryBadge = document.getElementById('activeCategoryBadge');
  const unifiedListHeader = document.getElementById('unifiedListHeader');
  const toggleSearchBtn = document.getElementById('toggleSearchBtn');
  const closeSearchBtn = document.getElementById('closeSearchBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  // Menú Drawer Fullscreen en app.html
  const openAppDrawerBtn = document.getElementById('openAppDrawerBtn');
  const closeAppDrawerBtn = document.getElementById('closeAppDrawerBtn');
  const appMobileDrawer = document.getElementById('appMobileDrawer');
  const drawerGuideBtn = document.getElementById('drawerGuideBtn');
  const drawerLegalBtn = document.getElementById('drawerLegalBtn');
  const drawerUploadBtn = document.getElementById('drawerUploadBtn');
  const drawerResetBtn = document.getElementById('drawerResetBtn');

  // Controles de Ordenación y Herramientas de Lista
  const listToolbar = document.getElementById('listToolbar');

  // Controles del Gráfico de Crecimiento
  const toggleChartBtn = document.getElementById('toggleChartBtn');
  const growthChartContainer = document.getElementById('growthChartContainer');
  const chartSummaryBadge = document.getElementById('chartSummaryBadge');
  const chartGranularityBtns = document.querySelectorAll('.chart-tab-btn');
  const chartStatsRow = document.getElementById('chartStatsRow');
  const chartSvgWrap = document.getElementById('chartSvgWrap');
  const chartPeriodNav = document.getElementById('chartPeriodNav');
  const chartPrevBtn = document.getElementById('chartPrevBtn');
  const chartNextBtn = document.getElementById('chartNextBtn');
  const chartPeriodLabel = document.getElementById('chartPeriodLabel');
  const chartPeriodSub = document.getElementById('chartPeriodSub');
  let currentGranularity = 'year';
  let chartOffset = 0;
  let isChartOpen = false;

  // ==========================================
  // Constantes del Sistema (Evitar Magic Numbers)
  // ==========================================
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const BATCH_SIZE = 30;

  /**
   * Sanitización defensiva contra XSS para inyección en el DOM
   * @param {string|number|null} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Recalcula diferencias de snapshots, actualiza contadores y refresca la vista activa (DRY)
   */
  function refreshDashboardData() {
    currentDiffs = InSafeFollowStorage.calculateDiffs();
    updateCounters();
    renderResults();
  }

  /**
   * Alterna el estado de archivado de una cuenta de forma centralizada
   * @param {string} username
   * @param {boolean} isCurrentlyArchived
   */
  function handleArchiveToggle(username, isCurrentlyArchived) {
    if (isCurrentlyArchived) {
      InSafeFollowStorage.removeFromWhitelist(username);
    } else {
      InSafeFollowStorage.addToWhitelist(username);
    }
    refreshDashboardData();
  }

  const categoryLabels = {
    notFollowingBack: 'No te siguen de vuelta',
    unfollowedYou: 'Te dejaron de seguir',
    newFollowers: 'Nuevos seguidores',
    mutual: 'Seguimiento mutuo',
    fans: 'Fans (Te siguen)',
    pendingRequests: 'Solicitudes pendientes',
    hideStoryFrom: 'Historias Ocultas',
    blockedProfiles: 'Cuentas Bloqueadas',
    receivedRequests: 'Solicitudes Recibidas',
    recentlyUnfollowed: 'Dejados de seguir',
    followingHashtags: 'Hashtags seguidos',
    closeFriends: 'Mejores Amigos',
    whitelistedUsers: 'Cuentas archivadas'
  };

  // Pestañas y Métricas
  const tabButtons = document.querySelectorAll('.segment-btn');
  const metricCards = document.querySelectorAll('.metric-widget');

  // Estado en memoria
  let currentDiffs = null;
  let activeTab = 'notFollowingBack';
  let searchQuery = '';
  let sortMode = 'date-desc'; // 'date-desc' (por defecto: más recientes), 'date-asc', 'alpha-asc', 'alpha-desc'
  let visibleCount = BATCH_SIZE;
  let infiniteObserver = null;
  let isRenderingBatch = false;
  let activeItemsForScroll = [];
  let scrollListenersBound = false;

  // Inicialización
  init();

  function init() {
    setupEventListeners();
    loadExistingData();

    // Registro defensivo de Service Worker para soporte PWA y Offline
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  function setupEventListeners() {
    // Dropzone drag & drop
    if (dropzone && fileInput) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFile(e.target.files[0]);
        }
      });

      // Asegurar que hacer clic en el botón de la dropzone abra el diálogo
      const selectBtn = dropzone.querySelector('button.btn-primary');
      if (selectBtn) {
        selectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.click();
        });
      }

      // Botón para cargar datos de prueba inmediatos (Reclutadores / Portfolio)
      const loadDemoBtn = document.getElementById('loadDemoBtn');
      if (loadDemoBtn) {
        loadDemoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          loadDemoDataset();
        });
      }
    }

    // Subida de foto de perfil personalizada del usuario
    const ownerAvatarWrap = document.getElementById('ownerAvatarWrap');
    const ownerPhotoInput = document.getElementById('ownerPhotoInput');
    if (ownerAvatarWrap && ownerPhotoInput) {
      ownerAvatarWrap.addEventListener('click', () => ownerPhotoInput.click());
      ownerPhotoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target.result;
            localStorage.setItem('insafefollow_owner_photo', base64);
            const ownerAvatarImg = document.getElementById('ownerAvatarImg');
            const ownerAvatarFallback = document.getElementById('ownerAvatarFallback');
            if (ownerAvatarImg) {
              ownerAvatarImg.src = base64;
              ownerAvatarImg.style.display = 'block';
            }
            if (ownerAvatarFallback) {
              ownerAvatarFallback.style.display = 'none';
            }
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }

    if (newUploadBtn) {
      newUploadBtn.addEventListener('click', () => {
        if (fileInput) fileInput.click();
      });
    }

    if (toggleSearchBtn) {
      toggleSearchBtn.addEventListener('click', openSearchMode);
    }
    if (closeSearchBtn) {
      closeSearchBtn.addEventListener('click', closeSearchMode);
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        clearSearchBtn.style.display = 'none';
        searchQuery = '';
        visibleCount = BATCH_SIZE;
        if (userListWindow) userListWindow.scrollTop = 0;
        renderResults();
      });
    }

    // Búsqueda en tiempo real
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        if (clearSearchBtn) {
          clearSearchBtn.style.display = searchQuery.length > 0 ? 'inline-flex' : 'none';
        }
        visibleCount = BATCH_SIZE;
        if (userListWindow) userListWindow.scrollTop = 0;
        renderResults();
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeSearchMode();
        }
      });
    }

    // Navegación por pestañas
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab, false);
      });
    });

    // Clic en tarjetas de métricas para cambiar de pestaña y mostrar lista en móvil
    metricCards.forEach(card => {
      card.addEventListener('click', () => {
        const tab = card.getAttribute('data-tab');
        if (tab) switchTab(tab, true);
      });
    });

    // Botón de retorno al Resumen en Móvil (Estilo App Nativa)
    if (backToOverviewBtn) {
      backToOverviewBtn.addEventListener('click', showAppOverview);
    }

    // Botones de Filtro de Ordenación (Chips Directos)
    const filterChipBtns = document.querySelectorAll('.filter-chip-btn');
    filterChipBtns.forEach(btn => {
      if (!btn.hasAttribute('data-sort')) return;
      btn.addEventListener('click', () => {
        const sortVal = btn.getAttribute('data-sort') || 'default';
        sortMode = sortVal;
        filterChipBtns.forEach(b => {
          if (b.hasAttribute('data-sort')) {
            b.classList.toggle('active', b === btn);
          }
        });
        visibleCount = BATCH_SIZE;
        if (userListWindow) userListWindow.scrollTop = 0;
        renderResults();
      });
    });

    // Botón de alternar lista de Archivadas desde la barra de herramientas
    const toggleArchivedListBtn = document.getElementById('toggleArchivedListBtn');
    if (toggleArchivedListBtn) {
      toggleArchivedListBtn.addEventListener('click', () => {
        if (activeTab === 'whitelistedUsers') {
          switchTab('notFollowingBack', true);
        } else {
          switchTab('whitelistedUsers', true);
        }
      });
    }

    // Botón de Archivadas en Navbar Desktop
    const openArchivedBtn = document.getElementById('openArchivedBtn');
    if (openArchivedBtn) {
      openArchivedBtn.addEventListener('click', () => {
        switchTab('whitelistedUsers', true);
      });
    }

    // Alternador del Gráfico de Crecimiento
    if (toggleChartBtn && growthChartContainer) {
      toggleChartBtn.addEventListener('click', () => {
        isChartOpen = !isChartOpen;
        growthChartContainer.style.display = isChartOpen ? 'block' : 'none';
        toggleChartBtn.classList.toggle('active', isChartOpen);
        if (isChartOpen) {
          renderGrowthChart(currentGranularity);
        }
      });
    }

    // Pestañas de granularidad del gráfico (Día, Mes, Año, Todos los tiempos)
    chartGranularityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const gran = btn.getAttribute('data-granularity');
        if (!gran) return;
        currentGranularity = gran;
        chartOffset = 0; // Resetear desplazamiento al cambiar vista temporal
        chartGranularityBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderGrowthChart(currentGranularity);
      });
    });

    // Flechas de navegación de período temporal [<] y [>]
    if (chartPrevBtn) {
      chartPrevBtn.addEventListener('click', () => {
        chartOffset--;
        renderGrowthChart(currentGranularity);
      });
    }

    if (chartNextBtn) {
      chartNextBtn.addEventListener('click', () => {
        if (chartOffset < 0) {
          chartOffset++;
          renderGrowthChart(currentGranularity);
        }
      });
    }

    // Redibujar gráfico al cambiar tamaño de ventana o girar dispositivo
    let chartResizeTimeout = null;
    window.addEventListener('resize', () => {
      if (isChartOpen) {
        clearTimeout(chartResizeTimeout);
        chartResizeTimeout = setTimeout(() => {
          renderGrowthChart(currentGranularity);
        }, 150);
      }
    });

    // Drawer / Menú Fullscreen en app.html
    function openAppDrawer() {
      if (appMobileDrawer) {
        appMobileDrawer.classList.add('active');
        appMobileDrawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeAppDrawer() {
      if (appMobileDrawer) {
        appMobileDrawer.classList.remove('active');
        appMobileDrawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }

    if (openAppDrawerBtn) openAppDrawerBtn.addEventListener('click', openAppDrawer);
    if (closeAppDrawerBtn) closeAppDrawerBtn.addEventListener('click', closeAppDrawer);
    if (appMobileDrawer) {
      appMobileDrawer.addEventListener('click', (e) => {
        if (e.target === appMobileDrawer) closeAppDrawer();
      });
    }

    if (drawerGuideBtn) {
      drawerGuideBtn.addEventListener('click', () => {
        closeAppDrawer();
        if (instructionsModal) instructionsModal.classList.add('active');
      });
    }
    if (drawerLegalBtn) {
      drawerLegalBtn.addEventListener('click', () => {
        closeAppDrawer();
        if (legalModal) legalModal.classList.add('active');
      });
    }
    const drawerArchivedBtn = document.getElementById('drawerArchivedBtn');
    if (drawerArchivedBtn) {
      drawerArchivedBtn.addEventListener('click', () => {
        closeAppDrawer();
        switchTab('whitelistedUsers', true);
      });
    }
    if (drawerUploadBtn) {
      drawerUploadBtn.addEventListener('click', () => {
        closeAppDrawer();
        if (fileInput) fileInput.click();
      });
    }
    if (drawerResetBtn) {
      drawerResetBtn.addEventListener('click', () => {
        closeAppDrawer();
        if (resetModal) resetModal.classList.add('active');
      });
    }

    // Modales: Guía
    if (openGuideBtn && instructionsModal && closeGuideBtn) {
      openGuideBtn.addEventListener('click', () => instructionsModal.classList.add('active'));
      closeGuideBtn.addEventListener('click', () => instructionsModal.classList.remove('active'));
      instructionsModal.addEventListener('click', (e) => {
        if (e.target === instructionsModal) instructionsModal.classList.remove('active');
      });
    }

    // Modales: Legal / Descargo de responsabilidad
    if (openLegalBtn && legalModal && closeLegalBtn) {
      openLegalBtn.addEventListener('click', () => legalModal.classList.add('active'));
      closeLegalBtn.addEventListener('click', () => legalModal.classList.remove('active'));
      legalModal.addEventListener('click', (e) => {
        if (e.target === legalModal) legalModal.classList.remove('active');
      });
    }

    // Modales: Restablecer
    if (openResetBtn && resetModal && closeResetBtn && confirmResetBtn) {
      openResetBtn.addEventListener('click', () => resetModal.classList.add('active'));
      closeResetBtn.addEventListener('click', () => resetModal.classList.remove('active'));
      resetModal.addEventListener('click', (e) => {
        if (e.target === resetModal) resetModal.classList.remove('active');
      });

      const cancelResetBtn = document.getElementById('cancelResetBtn');
      if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', () => resetModal.classList.remove('active'));
      }

      confirmResetBtn.addEventListener('click', () => {
        InSafeFollowStorage.clearAllData();
        resetModal.classList.remove('active');
        location.reload();
      });
    }
  }

  function loadExistingData() {
    const diffs = InSafeFollowStorage.calculateDiffs();
    if (diffs && diffs.current) {
      currentDiffs = diffs;
      renderDashboard();
    } else {
      showUploadOnly();
    }
  }

  /**
   * Carga un conjunto de datos realista de demostración en un clic (Modo Reclutador / Portfolio)
   */
  function loadDemoDataset() {
    setLoading(true);
    setTimeout(() => {
      const now = Date.now();
      const MS_DAY = 24 * 60 * 60 * 1000;

      const sampleFollowing = [
        { username: 'design_daily', name: 'Daily Design Inspiration', timestamp: now - 380 * MS_DAY },
        { username: 'tech_insider', name: 'Tech Insider', timestamp: now - 310 * MS_DAY },
        { username: 'react_core', name: 'React Developers', timestamp: now - 250 * MS_DAY },
        { username: 'alex_martinez', name: 'Alex Martínez', timestamp: now - 200 * MS_DAY },
        { username: 'sarah_dev', name: 'Sarah Connor Dev', timestamp: now - 180 * MS_DAY },
        { username: 'lukas_photo', name: 'Lukas Photography', timestamp: now - 150 * MS_DAY },
        { username: 'crypto_daily', name: 'Crypto News', timestamp: now - 120 * MS_DAY },
        { username: 'sofia_ux', name: 'Sofía UI/UX', timestamp: now - 90 * MS_DAY },
        { username: 'marcos_g', name: 'Marcos Gómez', timestamp: now - 60 * MS_DAY },
        { username: 'travel_vibes', name: 'Travel Worldwide', timestamp: now - 45 * MS_DAY },
        { username: 'julia_code', name: 'Julia Code & Coffee', timestamp: now - 30 * MS_DAY },
        { username: 'david_frontend', name: 'David Frontend', timestamp: now - 15 * MS_DAY },
        { username: 'emma_creative', name: 'Emma Creative Studio', timestamp: now - 5 * MS_DAY },
        { username: 'carlos_fullstack', name: 'Carlos Fullstack', timestamp: now - 2 * MS_DAY }
      ];

      const sampleFollowers = [
        { username: 'alex_martinez', name: 'Alex Martínez', timestamp: now - 200 * MS_DAY },
        { username: 'sarah_dev', name: 'Sarah Connor Dev', timestamp: now - 175 * MS_DAY },
        { username: 'sofia_ux', name: 'Sofía UI/UX', timestamp: now - 85 * MS_DAY },
        { username: 'julia_code', name: 'Julia Code & Coffee', timestamp: now - 28 * MS_DAY },
        { username: 'camila_rodriguez', name: 'Camila R.', timestamp: now - 140 * MS_DAY },
        { username: 'pedro_pascal_fan', name: 'Pedro Pascal Fan', timestamp: now - 110 * MS_DAY },
        { username: 'web_creators_hub', name: 'Web Creators Hub', timestamp: now - 40 * MS_DAY }
      ];

      const demoSnapshot = {
        accountOwner: 'demo_portfolio',
        parsedAt: new Date().toISOString(),
        following: sampleFollowing,
        followers: sampleFollowers,
        pendingRequests: [
          { username: 'private_account_99', name: 'John Doe', timestamp: now - 12 * MS_DAY }
        ],
        recentlyUnfollowed: [
          { username: 'old_friend', name: 'Old Friend', timestamp: now - 4 * MS_DAY }
        ],
        blockedProfiles: [
          { username: 'spam_bot_404', name: '', timestamp: now - 90 * MS_DAY }
        ],
        hideStoryFrom: [],
        receivedRequests: [],
        followingHashtags: [
          { username: 'javascript', name: '', timestamp: now - 300 * MS_DAY },
          { username: 'webdevelopment', name: '', timestamp: now - 220 * MS_DAY }
        ],
        closeFriends: [
          { username: 'sarah_dev', name: 'Sarah Connor Dev', timestamp: now - 180 * MS_DAY }
        ],
        restrictedProfiles: []
      };

      InSafeFollowStorage.saveNewSnapshot(demoSnapshot);
      currentDiffs = InSafeFollowStorage.calculateDiffs();
      renderDashboard();
      setLoading(false);
    }, 250);
  }

  async function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Por favor selecciona un archivo comprimido .zip oficial generado por el Centro de Cuentas de Meta.');
      return;
    }

    setLoading(true);

    try {
      const parsedData = await InstagramParser.parseZip(file);
      InSafeFollowStorage.saveNewSnapshot(parsedData);
      currentDiffs = InSafeFollowStorage.calculateDiffs();
      renderDashboard();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Ocurrió un error al procesar el archivo.');
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    if (isLoading) {
      if (dropzone) dropzone.style.display = 'none';
      if (loadingBox) loadingBox.style.display = 'flex';
      if (dashboardContent) dashboardContent.style.opacity = '0.4';
    } else {
      if (loadingBox) loadingBox.style.display = 'none';
      if (dashboardContent) dashboardContent.style.opacity = '1';
    }
  }

  function showUploadOnly() {
    if (dropzone) dropzone.style.display = 'block';
    if (statusBanner) statusBanner.style.display = 'none';
    if (dashboardContent) dashboardContent.style.display = 'none';
  }

  function renderDashboard() {
    if (!currentDiffs) return;

    if (dropzone) dropzone.style.display = 'none';
    if (statusBanner) statusBanner.style.display = 'flex';
    if (dashboardContent) dashboardContent.style.display = 'flex';

    // Fecha de análisis y propietario de la cuenta
    if (lastUpdatedText && currentDiffs.current) {
      const d = new Date(currentDiffs.current.parsedAt || Date.now());
      lastUpdatedText.textContent = `Último análisis: ${d.toLocaleDateString()} a las ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }

    const owner = (currentDiffs.current && currentDiffs.current.accountOwner) || 'usuario';
    const ownerHandleEl = document.getElementById('ownerHandle');
    const ownerAvatarImg = document.getElementById('ownerAvatarImg');
    const ownerAvatarFallback = document.getElementById('ownerAvatarFallback');

    if (ownerHandleEl) {
      ownerHandleEl.textContent = `@${owner}`;
    }

    const savedOwnerPhoto = localStorage.getItem('insafefollow_owner_photo') || localStorage.getItem('safefollow_owner_photo');
    if (savedOwnerPhoto && ownerAvatarImg) {
      ownerAvatarImg.src = savedOwnerPhoto;
      ownerAvatarImg.style.display = 'block';
      if (ownerAvatarFallback) ownerAvatarFallback.style.display = 'none';
    } else if (ownerAvatarFallback) {
      ownerAvatarFallback.textContent = owner.charAt(0).toUpperCase();
      ownerAvatarFallback.style.display = 'flex';
      if (ownerAvatarImg) ownerAvatarImg.style.display = 'none';
    }

    // Actualizar números de métricas y badges
    updateCounters();

    if (activeCategoryTitle && categoryLabels[activeTab]) {
      activeCategoryTitle.textContent = categoryLabels[activeTab];
    }
    if (activeCategoryBadge && currentDiffs && currentDiffs[activeTab]) {
      activeCategoryBadge.textContent = currentDiffs[activeTab].length;
      activeCategoryBadge.className = (activeTab === 'notFollowingBack' || activeTab === 'unfollowedYou') ? 'badge badge-danger' : 'badge badge-success';
    }

    showAppOverview();

    // Resetear paginación y renderizar
    visibleCount = BATCH_SIZE;
    renderResults();

    if (isChartOpen) {
      renderGrowthChart(currentGranularity);
    }
  }

  function updateCounters() {
    if (!currentDiffs) return;

    const counts = {
      notFollowingBack: (currentDiffs.notFollowingBack || []).length,
      unfollowedYou: (currentDiffs.unfollowedYou || []).length,
      newFollowers: (currentDiffs.newFollowers || []).length,
      mutual: (currentDiffs.mutual || []).length,
      fans: (currentDiffs.fans || []).length,
      pendingRequests: (currentDiffs.pendingRequests || []).length,
      hideStoryFrom: (currentDiffs.hideStoryFrom || []).length,
      blockedProfiles: (currentDiffs.blockedProfiles || []).length,
      receivedRequests: (currentDiffs.receivedRequests || []).length,
      recentlyUnfollowed: (currentDiffs.recentlyUnfollowed || []).length,
      followingHashtags: (currentDiffs.followingHashtags || []).length,
      closeFriends: (currentDiffs.closeFriends || []).length,
      whitelistedUsers: (currentDiffs.whitelistedUsers || []).length
    };

    document.querySelectorAll('[data-count]').forEach(el => {
      const key = el.getAttribute('data-count');
      if (counts[key] !== undefined) {
        el.textContent = counts[key];
      }
    });

    const archivedChipCount = document.getElementById('archivedChipCount');
    if (archivedChipCount) {
      archivedChipCount.textContent = counts.whitelistedUsers;
    }

    if (activeCategoryBadge && currentDiffs && currentDiffs[activeTab]) {
      activeCategoryBadge.textContent = currentDiffs[activeTab].length;
    }

    if (chartSummaryBadge && currentDiffs && currentDiffs.current && currentDiffs.current.followers) {
      chartSummaryBadge.textContent = `${currentDiffs.current.followers.length} seguidores`;
    }
  }

  // Manejo de Búsqueda Morfomórfica en Header Unificado
  function openSearchMode() {
    if (unifiedListHeader) {
      unifiedListHeader.classList.add('search-active');
    }
    if (searchInput) {
      searchInput.focus();
    }
  }

  function closeSearchMode() {
    if (unifiedListHeader) {
      unifiedListHeader.classList.remove('search-active');
    }
    if (searchInput) {
      searchInput.value = '';
    }
    if (clearSearchBtn) {
      clearSearchBtn.style.display = 'none';
    }
    if (searchQuery !== '') {
      searchQuery = '';
      visibleCount = BATCH_SIZE;
      if (userListWindow) userListWindow.scrollTop = 0;
      renderResults();
    }
  }

  // Hook de depuración para tests automatizados
  window.__insafeDebug = {
    checkAndLoadMore: () => checkAndLoadMore(activeItemsForScroll),
    handleScrollCheck: () => handleScrollCheck(),
    getStatus: () => ({
      visibleCount,
      itemsLength: activeItemsForScroll ? activeItemsForScroll.length : 0,
      isRenderingBatch,
      activeTab,
      windowScrollTop: userListWindow ? userListWindow.scrollTop : 0,
      windowScrollHeight: userListWindow ? userListWindow.scrollHeight : 0,
      windowClientHeight: userListWindow ? userListWindow.clientHeight : 0
    })
  };

  function showAppOverview() {
    document.body.classList.remove('in-list-view');
    closeSearchMode();
    activeItemsForScroll = [];
    if (appOverviewView) appOverviewView.classList.remove('subview-hidden');
    if (appListView) appListView.classList.add('subview-hidden');
    if (infiniteObserver) {
      infiniteObserver.disconnect();
      infiniteObserver = null;
    }
  }

  function showAppList() {
    document.body.classList.add('in-list-view');
    if (appOverviewView) appOverviewView.classList.add('subview-hidden');
    if (appListView) appListView.classList.remove('subview-hidden');
    if (userListWindow) userListWindow.scrollTop = 0;
  }

  function switchTab(tab, fromMetricClick = false) {
    activeTab = tab;
    closeSearchMode();
    sortMode = 'date-desc';
    visibleCount = BATCH_SIZE;
    activeItemsForScroll = [];
    if (infiniteObserver) {
      infiniteObserver.disconnect();
      infiniteObserver = null;
    }
    if (userListWindow) userListWindow.scrollTop = 0;

    // Resetear botones de chips de ordenación a 'date-desc' (Más recientes)
    const filterChipBtns = document.querySelectorAll('.filter-chip-btn');
    filterChipBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-sort') === 'date-desc');
    });

    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    metricCards.forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-tab') === tab);
    });

    if (activeCategoryTitle && categoryLabels[tab]) {
      activeCategoryTitle.textContent = categoryLabels[tab];
    }
    if (activeCategoryBadge && currentDiffs && currentDiffs[tab]) {
      activeCategoryBadge.textContent = currentDiffs[tab].length;
      if (tab === 'notFollowingBack' || tab === 'unfollowedYou' || tab === 'blockedProfiles') {
        activeCategoryBadge.className = 'badge badge-danger';
      } else if (tab === 'newFollowers' || tab === 'mutual' || tab === 'closeFriends') {
        activeCategoryBadge.className = 'badge badge-success';
      } else if (tab === 'hideStoryFrom') {
        activeCategoryBadge.className = 'badge badge-warning';
      } else {
        activeCategoryBadge.className = 'badge badge-neutral';
      }
    }

    const toggleArchivedListBtn = document.getElementById('toggleArchivedListBtn');
    if (toggleArchivedListBtn) {
      const isArchived = (tab === 'whitelistedUsers');
      toggleArchivedListBtn.classList.toggle('active', isArchived);
      if (isArchived) {
        toggleArchivedListBtn.innerHTML = '← Volver a No te siguen';
      } else {
        const count = (currentDiffs && currentDiffs.whitelistedUsers) ? currentDiffs.whitelistedUsers.length : 0;
        toggleArchivedListBtn.innerHTML = `📦 Archivadas (<span id="archivedChipCount">${count}</span>)`;
      }
    }

    if (fromMetricClick) {
      showAppList();
    }

    renderResults();
  }

  /**
   * Delega el renderizado del gráfico SVG interactivo al módulo desacoplado InSafeFollowChart
   * @param {string} granularity
   */
  function renderGrowthChart(granularity = 'year') {
    if (window.InSafeFollowChart) {
      const followers = (currentDiffs && currentDiffs.current && currentDiffs.current.followers) || [];
      window.InSafeFollowChart.render({
        container: growthChartContainer,
        svgWrap: chartSvgWrap,
        statsRow: chartStatsRow,
        periodNav: chartPeriodNav,
        periodLabel: chartPeriodLabel,
        periodSub: chartPeriodSub,
        prevBtn: chartPrevBtn,
        nextBtn: chartNextBtn
      }, followers, granularity, chartOffset);
    }
  }

  function renderResults() {
    if (!currentDiffs || !resultsContainer) return;

    if (infiniteObserver) {
      infiniteObserver.disconnect();
      infiniteObserver = null;
    }

    let items = [...(currentDiffs[activeTab] || [])];

    // Filtro de Búsqueda (por nombre de usuario o nombre real)
    if (searchQuery) {
      items = items.filter(u => 
        u.username.toLowerCase().includes(searchQuery) ||
        (u.name && u.name.toLowerCase().includes(searchQuery))
      );
    }

    // Filtro de Ordenación (Alfabético y Antigüedad)
    if (sortMode === 'alpha-asc') {
      items.sort((a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: 'base' }));
    } else if (sortMode === 'alpha-desc') {
      items.sort((a, b) => b.username.localeCompare(a.username, undefined, { sensitivity: 'base' }));
    } else if (sortMode === 'date-desc') {
      items.sort((a, b) => {
        const timeA = typeof a.timestamp === 'number' ? a.timestamp : 0;
        const timeB = typeof b.timestamp === 'number' ? b.timestamp : 0;
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        return timeB - timeA;
      });
    } else if (sortMode === 'date-asc') {
      items.sort((a, b) => {
        const timeA = typeof a.timestamp === 'number' ? a.timestamp : 0;
        const timeB = typeof b.timestamp === 'number' ? b.timestamp : 0;
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        return timeA - timeB;
      });
    }

    // VINCULAR SIEMPRE a la lista activa actual para evitar mezclas con otras pestañas
    activeItemsForScroll = items;

    resultsContainer.innerHTML = '';

    if (items.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (scrollSentinel) scrollSentinel.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    visibleCount = Math.min(BATCH_SIZE, items.length);
    renderBatch(items, 0, visibleCount);

    if (visibleCount >= items.length) {
      showEndOfList(items.length);
      if (scrollSentinel) scrollSentinel.style.display = 'none';
    } else {
      if (scrollSentinel) scrollSentinel.style.display = 'block';
      setupInfiniteScroll(items);
    }
  }

  function renderBatch(items, start, end) {
    const fragment = document.createDocumentFragment();
    for (let i = start; i < end && i < items.length; i++) {
      fragment.appendChild(createUserRow(items[i]));
    }
    resultsContainer.appendChild(fragment);
  }

  function createUserRow(user) {
    const row = document.createElement('div');
    row.className = 'user-item-row';
    row.setAttribute('data-username', user.username);

    const initial = user.username.charAt(0).toUpperCase();
    const isHashtag = activeTab === 'followingHashtags';
    const isArchivedTab = activeTab === 'whitelistedUsers';
    const isNotFollowingBack = activeTab === 'notFollowingBack';

    const igUrl = isHashtag 
      ? `https://www.instagram.com/explore/tags/${user.username}/`
      : (user.href || `https://www.instagram.com/${user.username}/`);

    let dateString = '';
    if (user.timestamp) {
      const d = new Date(user.timestamp);
      if (activeTab === 'blockedProfiles') {
        dateString = `Bloqueado el: ${d.toLocaleDateString()}`;
      } else if (activeTab === 'hideStoryFrom') {
        dateString = `Ocultado el: ${d.toLocaleDateString()}`;
      } else if (activeTab === 'recentlyUnfollowed') {
        dateString = `Dejado de seguir: ${d.toLocaleDateString()}`;
      } else if (activeTab === 'receivedRequests') {
        dateString = `Recibida el: ${d.toLocaleDateString()}`;
      } else if (activeTab === 'pendingRequests') {
        dateString = `Enviada el: ${d.toLocaleDateString()}`;
      } else if (activeTab === 'whitelistedUsers') {
        dateString = `Archivado • ${d.toLocaleDateString()}`;
      } else {
        dateString = `Siguiendo desde: ${d.toLocaleDateString()}`;
      }
    }

    let actionBtnHtml = '';
    if (isArchivedTab) {
      actionBtnHtml = `
        <button type="button" class="row-action-btn btn-restore" title="Restaurar a la lista principal">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          <span class="action-btn-text">Restaurar</span>
        </button>
      `;
    } else if (isNotFollowingBack) {
      actionBtnHtml = `
        <button type="button" class="row-action-btn btn-ignore" title="Archivar cuenta para que no aparezca en No te siguen">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="21 8 21 21 3 21 3 8"></polyline>
            <rect x="1" y="3" width="22" height="5"></rect>
            <line x1="10" y1="12" x2="14" y2="12"></line>
          </svg>
          <span class="action-btn-text">Archivar</span>
        </button>
      `;
    }

    const safeUsername = escapeHtml(user.username);
    const safeName = user.name ? escapeHtml(user.name) : '';
    const safeHref = escapeHtml(igUrl);
    const safeInitial = escapeHtml(initial);
    const safeDate = dateString ? escapeHtml(dateString) : '';

    row.innerHTML = `
      <div class="user-row-swipe-bg">
        <span class="swipe-action-label-left">${isArchivedTab ? '↩️ Restaurar' : '📦 Archivar'}</span>
        <span class="swipe-action-label-right">Instagram ↗</span>
      </div>
      <div class="user-row-content">
        <div class="user-identity">
          <div class="user-monogram-avatar"><span>${isHashtag ? '#' : safeInitial}</span></div>
          <div class="user-text-meta">
            <span class="user-handle-name">${isHashtag ? '#' : '@'}${safeUsername}</span>
            ${safeName ? `<span class="user-real-name" style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${safeName}</span>` : ''}
            ${safeDate ? `<span class="user-subtext-date">${safeDate}</span>` : ''}
          </div>
        </div>
        <div class="user-item-actions">
          ${actionBtnHtml}
          <a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="row-action-btn btn-ig-open" title="${isHashtag ? 'Ver hashtag en Instagram' : 'Ver perfil en Instagram'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span class="action-btn-text">${isHashtag ? 'Ver hashtag' : 'Ver perfil'}</span>
          </a>
        </div>
      </div>
    `;

    // Clic en botón Archivar (DRY)
    const ignoreBtn = row.querySelector('.btn-ignore');
    if (ignoreBtn) {
      ignoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleArchiveToggle(user.username, false);
      });
    }

    // Clic en botón Restaurar (DRY)
    const restoreBtn = row.querySelector('.btn-restore');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleArchiveToggle(user.username, true);
      });
    }

    // Gestos de deslizamiento táctil y ratón (Swipe Gestures) delegados a InSafeFollowGestures
    const rowContent = row.querySelector('.user-row-content');
    if (rowContent && window.InSafeFollowGestures) {
      window.InSafeFollowGestures.bindSwipe(row, rowContent, user, {
        onSwipeRight: () => {
          handleArchiveToggle(user.username, activeTab === 'whitelistedUsers');
        },
        onSwipeLeft: () => {
          window.open(igUrl, '_blank', 'noopener,noreferrer');
        }
      });
    }

    return row;
  }

  function checkAndLoadMore(items) {
    if (isRenderingBatch || !items || items !== activeItemsForScroll || visibleCount >= items.length) return;
    isRenderingBatch = true;
    const nextStart = visibleCount;
    const nextEnd = Math.min(items.length, visibleCount + BATCH_SIZE);
    renderBatch(items, nextStart, nextEnd);
    visibleCount = nextEnd;
    isRenderingBatch = false;

    if (visibleCount >= items.length) {
      showEndOfList(items.length);
      if (scrollSentinel) scrollSentinel.style.display = 'none';
      if (infiniteObserver) {
        infiniteObserver.disconnect();
        infiniteObserver = null;
      }
    }
  }

  function handleScrollCheck() {
    if (appListView && appListView.classList.contains('subview-hidden')) return;
    if (!activeItemsForScroll || activeItemsForScroll.length === 0) return;
    if (visibleCount >= activeItemsForScroll.length) return;
    if (!userListWindow) return;

    const scrollPos = userListWindow.scrollTop + userListWindow.clientHeight;
    const threshold = userListWindow.scrollHeight - 300;
    if (scrollPos >= threshold) {
      checkAndLoadMore(activeItemsForScroll);
    }
  }

  function setupInfiniteScroll(items) {
    activeItemsForScroll = items;

    if (!scrollListenersBound) {
      if (userListWindow) {
        userListWindow.addEventListener('scroll', handleScrollCheck, { passive: true });
      }
      scrollListenersBound = true;
    }

    if (!scrollSentinel) return;

    try {
      infiniteObserver = new IntersectionObserver((entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          checkAndLoadMore(items);
        }
      }, {
        root: userListWindow,
        rootMargin: '300px',
        threshold: 0
      });

      infiniteObserver.observe(scrollSentinel);
    } catch (e) {
      console.warn('IntersectionObserver not supported or failed, using scroll event fallback', e);
    }
  }

  function showEndOfList(count) {
    const existing = document.getElementById('infiniteEndNotice');
    if (existing) existing.remove();

    if (count > 0) {
      const notice = document.createElement('div');
      notice.id = 'infiniteEndNotice';
      notice.className = 'infinite-scroll-end';
      notice.innerHTML = `<span>✓ Has revisado las ${count} cuentas de este listado</span>`;
      resultsContainer.appendChild(notice);
    }
  }
});
