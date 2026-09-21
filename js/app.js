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
    closeFriends: 'Mejores Amigos'
  };

  // Pestañas y Métricas
  const tabButtons = document.querySelectorAll('.segment-btn');
  const metricCards = document.querySelectorAll('.metric-widget');

  // Estado en memoria
  let currentDiffs = null;
  let activeTab = 'notFollowingBack';
  let searchQuery = '';
  let sortMode = 'date-desc'; // 'date-desc' (por defecto: más recientes), 'date-asc', 'alpha-asc', 'alpha-desc'
  const BATCH_SIZE = 30;
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
      const selectBtn = dropzone.querySelector('button');
      if (selectBtn) {
        selectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.click();
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
      btn.addEventListener('click', () => {
        const sortVal = btn.getAttribute('data-sort') || 'default';
        sortMode = sortVal;
        filterChipBtns.forEach(b => b.classList.toggle('active', b === btn));
        visibleCount = BATCH_SIZE;
        if (userListWindow) userListWindow.scrollTop = 0;
        renderResults();
      });
    });

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
      closeFriends: (currentDiffs.closeFriends || []).length
    };

    document.querySelectorAll('[data-count]').forEach(el => {
      const key = el.getAttribute('data-count');
      if (counts[key] !== undefined) {
        el.textContent = counts[key];
      }
    });

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

    if (fromMetricClick) {
      showAppList();
    }

    renderResults();
  }

  /**
   * Genera el gráfico SVG interactivo de crecimiento de seguidores
   * Totalmente responsive (coordenadas 1:1 en móviles para textos nítidos y barras legibles).
   * Soporta Semana (7 días), Mes (días del mes), Año (12 meses) y Todos los tiempos (todos los años sin flechas).
   */
  function renderGrowthChart(granularity = 'year') {
    if (!growthChartContainer || !chartSvgWrap || !chartStatsRow) return;

    const followers = (currentDiffs && currentDiffs.current && currentDiffs.current.followers) || [];
    const withTimestamp = followers.filter(f => typeof f.timestamp === 'number' && !isNaN(f.timestamp) && f.timestamp > 0);

    if (withTimestamp.length === 0) {
      chartSvgWrap.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:0.85rem;font-weight:700;">
          No se encontraron marcas de fecha en tus seguidores para graficar.
        </div>`;
      chartStatsRow.innerHTML = '';
      if (chartPeriodNav) chartPeriodNav.style.display = 'none';
      return;
    }

    // Ordenar cronológicamente ascendente
    withTimestamp.sort((a, b) => a.timestamp - b.timestamp);

    const firstFollowerDate = new Date(withTimestamp[0].timestamp);
    const lastFollowerDate = new Date(withTimestamp[withTimestamp.length - 1].timestamp);

    const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthNamesLong = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const grouped = [];
    let periodTitle = '';
    let periodSubtitle = '';
    let canPrev = true;
    let canNext = chartOffset < 0;

    if (granularity === 'day') {
      // Semana (7 días) desplazable con flechas
      const baseEnd = new Date(lastFollowerDate.getFullYear(), lastFollowerDate.getMonth(), lastFollowerDate.getDate(), 23, 59, 59, 999);
      const targetEndDate = new Date(baseEnd.getTime() + chartOffset * 7 * 86400000);
      const targetStartDate = new Date(targetEndDate.getFullYear(), targetEndDate.getMonth(), targetEndDate.getDate() - 6, 0, 0, 0, 0);

      canPrev = targetStartDate.getTime() > firstFollowerDate.getTime();

      periodTitle = 'Semana';
      periodSubtitle = `${targetStartDate.toLocaleDateString()} a ${targetEndDate.toLocaleDateString()}`;

      for (let i = 0; i < 7; i++) {
        const dCurrent = new Date(targetStartDate.getFullYear(), targetStartDate.getMonth(), targetStartDate.getDate() + i, 0, 0, 0, 0);
        const dStart = dCurrent.getTime();
        const dEnd = new Date(targetStartDate.getFullYear(), targetStartDate.getMonth(), targetStartDate.getDate() + i, 23, 59, 59, 999).getTime();

        let count = 0;
        for (let j = 0; j < withTimestamp.length; j++) {
          const ts = withTimestamp[j].timestamp;
          if (ts >= dStart && ts <= dEnd) count++;
        }

        const dayName = dayNamesShort[dCurrent.getDay()];
        const label = `${dayName} ${dCurrent.getDate()}`;
        grouped.push({
          key: dCurrent.toISOString().split('T')[0],
          label: label,
          count: count,
          tooltipText: `${dCurrent.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}: +${count} seguidores`
        });
      }
    } else if (granularity === 'month') {
      // Mes = días del mes seleccionado
      const baseDate = new Date(lastFollowerDate.getFullYear(), lastFollowerDate.getMonth() + chartOffset, 1);
      const targetYear = baseDate.getFullYear();
      const targetMonth = baseDate.getMonth();
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const monthStart = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0).getTime();

      canPrev = monthStart > firstFollowerDate.getTime();

      periodTitle = `${monthNamesLong[targetMonth]} ${targetYear}`;
      periodSubtitle = '';

      for (let d = 1; d <= daysInMonth; d++) {
        const dStart = new Date(targetYear, targetMonth, d, 0, 0, 0, 0).getTime();
        const dEnd = new Date(targetYear, targetMonth, d, 23, 59, 59, 999).getTime();

        let count = 0;
        for (let j = 0; j < withTimestamp.length; j++) {
          const ts = withTimestamp[j].timestamp;
          if (ts >= dStart && ts <= dEnd) count++;
        }

        const dDate = new Date(targetYear, targetMonth, d);
        const dayName = dayNamesShort[dDate.getDay()];
        const peakLabel = `${dayName} - ${d}`;

        // Mostrar etiqueta de día de forma legible cada 7 días y en los extremos
        const showLabel = (d === 1 || d === 7 || d === 14 || d === 21 || d === 28 || d === daysInMonth);
        grouped.push({
          key: `${targetYear}-${targetMonth + 1}-${d}`,
          label: showLabel ? `${d}` : '',
          peakLabel: peakLabel,
          count: count,
          tooltipText: `${d} de ${monthNamesLong[targetMonth]} ${targetYear}: +${count} seguidores`
        });
      }
    } else if (granularity === 'year') {
      // Año = 12 meses del año seleccionado
      const latestYear = lastFollowerDate.getFullYear();
      const earliestYear = firstFollowerDate.getFullYear();
      const targetYear = latestYear + chartOffset;

      canPrev = targetYear > earliestYear;

      periodTitle = `Año ${targetYear}`;
      periodSubtitle = '';

      for (let m = 0; m < 12; m++) {
        const mDays = new Date(targetYear, m + 1, 0).getDate();
        const mStart = new Date(targetYear, m, 1, 0, 0, 0, 0).getTime();
        const mEnd = new Date(targetYear, m, mDays, 23, 59, 59, 999).getTime();

        let count = 0;
        for (let j = 0; j < withTimestamp.length; j++) {
          const ts = withTimestamp[j].timestamp;
          if (ts >= mStart && ts <= mEnd) count++;
        }

        grouped.push({
          key: `${targetYear}-${m}`,
          label: monthNamesShort[m],
          count: count,
          tooltipText: `${monthNamesLong[m]} ${targetYear}: +${count} seguidores`
        });
      }
    } else if (granularity === 'all') {
      // Todos los tiempos = Todos los años registrados (SIN FLECHAS)
      const earliestYear = firstFollowerDate.getFullYear();
      const latestYear = lastFollowerDate.getFullYear();

      canPrev = false;
      canNext = false;

      periodTitle = 'Historial Completo';
      periodSubtitle = '';

      let runningCumulative = 0;
      for (let yr = earliestYear; yr <= latestYear; yr++) {
        const yrStart = new Date(yr, 0, 1, 0, 0, 0, 0).getTime();
        const yrEnd = new Date(yr, 11, 31, 23, 59, 59, 999).getTime();

        let count = 0;
        for (let j = 0; j < withTimestamp.length; j++) {
          const ts = withTimestamp[j].timestamp;
          if (ts >= yrStart && ts <= yrEnd) count++;
        }
        runningCumulative += count;

        grouped.push({
          key: `${yr}`,
          label: `${yr}`,
          count: count,
          cumulative: runningCumulative,
          tooltipText: `Año ${yr}: +${count} seguidores (${runningCumulative} acumulados)`
        });
      }
    }

    // Actualizar barra de controles de período
    if (chartPeriodNav && chartPeriodLabel && chartPeriodSub) {
      chartPeriodNav.style.display = 'flex';
      chartPeriodLabel.textContent = periodTitle;
      chartPeriodSub.textContent = periodSubtitle;
      chartPeriodSub.style.display = periodSubtitle ? 'block' : 'none';

      // El de todos los tiempos NO tendrá flechas para cambiar nada
      if (chartPrevBtn && chartNextBtn) {
        if (granularity === 'all') {
          chartPrevBtn.style.display = 'none';
          chartNextBtn.style.display = 'none';
        } else {
          chartPrevBtn.style.display = 'inline-flex';
          chartNextBtn.style.display = 'inline-flex';
          chartPrevBtn.disabled = !canPrev;
          chartNextBtn.disabled = !canNext;
        }
      }
    }

    if (grouped.length === 0) return;

    let maxGroup = grouped[0];
    let periodSum = 0;
    grouped.forEach(g => {
      periodSum += g.count;
      if (g.count > maxGroup.count) maxGroup = g;
    });

    let picoDisplay = '-';
    if (maxGroup && maxGroup.count > 0) {
      if (granularity === 'month') {
        picoDisplay = maxGroup.peakLabel || `${maxGroup.label || maxGroup.key}`;
      } else {
        picoDisplay = `${maxGroup.label || maxGroup.key} (+${maxGroup.count})`;
      }
    }

    // Fichas estadísticas compactas en 1 fila
    chartStatsRow.innerHTML = `
      <div class="chart-stat-chip">
        <span class="chip-label">Período</span>
        <span class="chip-val">+${periodSum}</span>
      </div>
      <div class="chart-stat-chip">
        <span class="chip-label">Pico</span>
        <span class="chip-val">${picoDisplay}</span>
      </div>
      <div class="chart-stat-chip">
        <span class="chip-label">Total Archivo</span>
        <span class="chip-val">${withTimestamp.length}</span>
      </div>
    `;

    // Medidas dinámicas adaptadas al ancho físico real del contenedor para evitar fuentes microscópicas
    const clientW = chartSvgWrap.clientWidth || 340;
    const isMobile = clientW < 520;
    const svgWidth = isMobile ? Math.max(290, Math.floor(clientW)) : 560;
    const svgHeight = isMobile ? 165 : 205;

    const padLeft = isMobile ? 26 : 38;
    const padRight = isMobile ? 8 : 16;
    const padTop = isMobile ? 18 : 24;
    const padBottom = isMobile ? 24 : 30;
    const chartW = svgWidth - padLeft - padRight;
    const chartH = svgHeight - padTop - padBottom;

    const maxCount = Math.max(...grouped.map(g => g.count), 1);

    let chartElements = '';

    const gridSteps = 3;
    for (let s = 0; s <= gridSteps; s++) {
      const yVal = Math.round((maxCount / gridSteps) * s);
      const yPos = padTop + chartH - (s / gridSteps) * chartH;
      chartElements += `
        <line x1="${padLeft}" y1="${yPos}" x2="${svgWidth - padRight}" y2="${yPos}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
        <text x="${padLeft - 5}" y="${yPos + 4}" fill="#64748b" font-size="${isMobile ? 10 : 11}" font-weight="700" text-anchor="end">${yVal}</text>
      `;
    }

    const colStep = chartW / grouped.length;
    let barWidth;
    if (granularity === 'month') {
      barWidth = Math.max(3.5, Math.min(8, colStep * 0.65));
    } else if (granularity === 'day') {
      barWidth = Math.max(16, Math.min(28, colStep * 0.62));
    } else if (granularity === 'year') {
      barWidth = Math.max(10, Math.min(20, colStep * 0.65));
    } else {
      barWidth = Math.max(14, Math.min(32, colStep * 0.58));
    }

    grouped.forEach((g, idx) => {
      const isZero = g.count === 0;
      const barH = isZero ? 2 : Math.max(4, (g.count / maxCount) * chartH);
      const x = padLeft + idx * colStep + (colStep - barWidth) / 2;
      const y = padTop + chartH - barH;
      const barFill = isZero ? '#cbd5e1' : '#000000';

      const showTopNumber = !isZero && (grouped.length <= 14);
      const labelFontSize = (granularity === 'year' && isMobile) ? 9 : 10;

      chartElements += `
        <rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="${barWidth > 6 ? 3 : 1}" fill="${barFill}" data-tooltip="${g.tooltipText}" />
        ${showTopNumber ? `<text x="${x + barWidth / 2}" y="${y - 4}" fill="#000000" font-size="${isMobile ? 10 : 11}" font-weight="800" text-anchor="middle">${g.count}</text>` : ''}
        ${g.label ? `<text x="${x + barWidth / 2}" y="${svgHeight - (isMobile ? 6 : 8)}" fill="#475569" font-size="${labelFontSize}" font-weight="700" text-anchor="middle">${g.label}</text>` : ''}
      `;
    });

    chartSvgWrap.innerHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
        ${chartElements}
      </svg>
      <div id="chartTooltip" class="chart-tooltip" style="display: none;"></div>
    `;

    const tooltip = chartSvgWrap.querySelector('#chartTooltip');
    const interactiveEls = chartSvgWrap.querySelectorAll('.chart-bar');

    interactiveEls.forEach(el => {
      const showTip = (e) => {
        const text = el.getAttribute('data-tooltip');
        if (!text || !tooltip) return;
        tooltip.textContent = text;
        tooltip.style.display = 'block';

        const rect = chartSvgWrap.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        tooltip.style.left = `${clientX - rect.left}px`;
        tooltip.style.top = `${clientY - rect.top}px`;
      };

      el.addEventListener('mousemove', showTip);
      el.addEventListener('touchstart', showTip, { passive: true });
      el.addEventListener('mouseleave', () => { if (tooltip) tooltip.style.display = 'none'; });
      el.addEventListener('touchend', () => { if (tooltip) tooltip.style.display = 'none'; });
    });
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
      } else {
        dateString = `Siguiendo desde: ${d.toLocaleDateString()}`;
      }
    }

    row.innerHTML = `
      <div class="user-row-content">
        <div class="user-identity">
          <div class="user-monogram-avatar"><span>${isHashtag ? '#' : initial}</span></div>
          <div class="user-text-meta">
            <span class="user-handle-name">${isHashtag ? '#' : '@'}${user.username}</span>
            ${user.name ? `<span class="user-real-name" style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${user.name}</span>` : ''}
            ${dateString ? `<span class="user-subtext-date">${dateString}</span>` : ''}
          </div>
        </div>
        <div class="user-item-actions">
          <a href="${igUrl}" target="_blank" rel="noopener noreferrer" class="row-action-btn btn-ig-open" title="${isHashtag ? 'Ver hashtag en Instagram' : 'Ver perfil en Instagram'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span class="action-btn-text">${isHashtag ? 'Ver hashtag' : 'Ver perfil'}</span>
          </a>
        </div>
      </div>
    `;

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
