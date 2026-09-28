/**
 * storage.js - Administrador de estado, snapshots y persistencia local en localStorage.
 * Cumple con ISO/IEC 25010 (Modularidad, Testabilidad y Robustez de Datos).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InSafeFollowStorage = factory();
    root.InsafeFollowStorage = root.InSafeFollowStorage;
    root.SafeFollowStorage = root.InSafeFollowStorage;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const KEY_CURRENT = 'insafefollow_current_snapshot';
  const KEY_PREVIOUS = 'insafefollow_previous_snapshot';
  const KEY_WHITELIST = 'insafefollow_whitelist';

  // Soporte de fallback para claves anteriores
  const LEGACY_KEY_CURRENT = 'safefollow_current_snapshot';
  const LEGACY_KEY_PREVIOUS = 'safefollow_previous_snapshot';
  const LEGACY_KEY_WHITELIST = 'safefollow_whitelist';

  function getWhitelist() {
    try {
      const data = localStorage.getItem(KEY_WHITELIST) || localStorage.getItem(LEGACY_KEY_WHITELIST);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function isWhitelisted(username) {
    const list = getWhitelist();
    return list.includes(username.toLowerCase());
  }

  function addToWhitelist(username) {
    const list = getWhitelist();
    const clean = username.toLowerCase().trim();
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(KEY_WHITELIST, JSON.stringify(list));
    }
    return list;
  }

  function removeFromWhitelist(username) {
    let list = getWhitelist();
    const clean = username.toLowerCase().trim();
    list = list.filter(u => u !== clean);
    localStorage.setItem(KEY_WHITELIST, JSON.stringify(list));
    return list;
  }

  function getCurrentSnapshot() {
    try {
      const data = localStorage.getItem(KEY_CURRENT) || localStorage.getItem(LEGACY_KEY_CURRENT);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function getPreviousSnapshot() {
    try {
      const data = localStorage.getItem(KEY_PREVIOUS) || localStorage.getItem(LEGACY_KEY_PREVIOUS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function getSnapshotFingerprint(s) {
    if (!s) return '';
    const fCount = Array.isArray(s.followers) ? s.followers.length : 0;
    const gCount = Array.isArray(s.following) ? s.following.length : 0;
    const firstFollower = (s.followers && s.followers[0] && s.followers[0].username) || '';
    const lastFollower = (s.followers && s.followers.length > 0 && s.followers[s.followers.length - 1] && s.followers[s.followers.length - 1].username) || '';
    const owner = s.accountOwner || '';
    return `${owner}|${fCount}|${gCount}|${firstFollower}|${lastFollower}`;
  }

  function getLatestTimestamp(s) {
    if (!s || !Array.isArray(s.followers) || s.followers.length === 0) return 0;
    let max = 0;
    for (const f of s.followers) {
      if (f && typeof f.timestamp === 'number' && f.timestamp > max) {
        max = f.timestamp;
      }
    }
    return max;
  }

  function saveNewSnapshot(parsedData) {
    if (!parsedData) return;

    const existingCurrent = getCurrentSnapshot();
    const existingPrevious = getPreviousSnapshot();

    // 1. Si no hay nada previo guardado, el nuevo es el actual
    if (!existingCurrent) {
      localStorage.setItem(KEY_CURRENT, JSON.stringify(parsedData));
      return;
    }

    // 2. Si el actual es Demo ficticia, reemplazarlo por completo sin contaminar el historial
    if (existingCurrent.accountOwner === 'demo_portfolio' || existingCurrent.isDemo) {
      localStorage.setItem(KEY_CURRENT, JSON.stringify(parsedData));
      if (existingPrevious && (existingPrevious.accountOwner === 'demo_portfolio' || existingPrevious.isDemo)) {
        localStorage.removeItem(KEY_PREVIOUS);
      }
      return;
    }

    // 3. Comprobar si el nuevo archivo es IDÉNTICO al actual (misma huella de datos)
    const newFingerprint = getSnapshotFingerprint(parsedData);
    const currentFingerprint = getSnapshotFingerprint(existingCurrent);

    if (newFingerprint && newFingerprint === currentFingerprint) {
      // El usuario re-subió o recargó el mismo archivo.
      // Prevenir la sobrescritura de KEY_PREVIOUS para proteger el archivo histórico anterior.
      localStorage.setItem(KEY_CURRENT, JSON.stringify(parsedData));
      return;
    }

    // 4. Si el nuevo archivo es idéntico al previous, no rotar
    const previousFingerprint = getSnapshotFingerprint(existingPrevious);
    if (previousFingerprint && newFingerprint === previousFingerprint) {
      return;
    }

    // 5. Comparar cronología real: ¿cuál es el más reciente?
    const currentLatestTime = getLatestTimestamp(existingCurrent);
    const newLatestTime = getLatestTimestamp(parsedData);

    if (newLatestTime > 0 && currentLatestTime > 0 && newLatestTime < currentLatestTime) {
      // El archivo recién subido es más antiguo cronológicamente que el actual
      localStorage.setItem(KEY_PREVIOUS, JSON.stringify(parsedData));
    } else {
      // El nuevo archivo es más reciente: rotar el actual a previous y guardar el nuevo en current
      localStorage.setItem(KEY_PREVIOUS, JSON.stringify(existingCurrent));
      localStorage.setItem(KEY_CURRENT, JSON.stringify(parsedData));
    }
  }

  function clearAllData() {
    localStorage.removeItem(KEY_CURRENT);
    localStorage.removeItem(KEY_PREVIOUS);
    localStorage.removeItem(KEY_WHITELIST);
    localStorage.removeItem(LEGACY_KEY_CURRENT);
    localStorage.removeItem(LEGACY_KEY_PREVIOUS);
    localStorage.removeItem(LEGACY_KEY_WHITELIST);
    localStorage.removeItem('insafefollow_owner_photo');
    localStorage.removeItem('safefollow_owner_photo');
  }

  /**
   * Exporta la lista blanca actual en formato JSON estándar estructurado.
   * @returns {string} JSON string listo para descarga
   */
  function exportWhitelistJson() {
    const list = getWhitelist();
    const payload = {
      app: 'InSafeFollow',
      version: '1.3.3',
      exportedAt: new Date().toISOString(),
      count: list.length,
      archivedUsernames: list
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Importa una lista de nombres de usuario archivados.
   * Acepta string JSON, objeto deserializado o texto plano con un usuario por línea.
   * Fusiona de forma idempotente con la lista existente sin duplicados.
   * 
   * @param {string|Object} rawInput
   * @returns {{ success: boolean, added: number, total: number, message: string }}
   */
  function importWhitelist(rawInput) {
    if (!rawInput) {
      return { success: false, added: 0, total: getWhitelist().length, message: 'El archivo o contenido está vacío.' };
    }

    let usernamesToImport = [];

    if (typeof rawInput === 'object' && rawInput !== null) {
      if (Array.isArray(rawInput)) {
        usernamesToImport = rawInput;
      } else if (Array.isArray(rawInput.archivedUsernames)) {
        usernamesToImport = rawInput.archivedUsernames;
      } else if (Array.isArray(rawInput.whitelist)) {
        usernamesToImport = rawInput.whitelist;
      } else if (Array.isArray(rawInput.users)) {
        usernamesToImport = rawInput.users;
      }
    } else if (typeof rawInput === 'string') {
      const trimmed = rawInput.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return importWhitelist(parsed);
        } catch (e) {
          // Si falla JSON, interpretar como texto plano
        }
      }
      usernamesToImport = trimmed.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
    }

    if (!Array.isArray(usernamesToImport) || usernamesToImport.length === 0) {
      return { success: false, added: 0, total: getWhitelist().length, message: 'No se encontraron nombres de usuario válidos para importar.' };
    }

    const currentList = getWhitelist();
    const currentSet = new Set(currentList.map(u => String(u).toLowerCase().trim()));
    let addedCount = 0;

    for (const item of usernamesToImport) {
      let candidate = '';
      if (typeof item === 'string') {
        candidate = item;
      } else if (item && typeof item === 'object') {
        candidate = item.username || item.user || item.value || '';
      }
      candidate = String(candidate).replace(/^@+/, '').toLowerCase().trim();
      if (candidate && /^[a-zA-Z0-9._]{1,30}$/.test(candidate)) {
        if (!currentSet.has(candidate)) {
          currentSet.add(candidate);
          currentList.push(candidate);
          addedCount++;
        }
      }
    }

    localStorage.setItem(KEY_WHITELIST, JSON.stringify(currentList));
    return {
      success: true,
      added: addedCount,
      total: currentList.length,
      message: addedCount > 0 
        ? `Se importaron ${addedCount} cuentas archivadas nuevas (Total: ${currentList.length}).` 
        : `Todas las cuentas (${usernamesToImport.length}) ya estaban en la lista de archivadas.`
    };
  }

  /**
   * Realiza todos los cálculos de teoría de conjuntos matemáticos sobre las conexiones.
   * Complejidad Algorítmica:
   *  - Tiempo: O(N + M) lineal mediante tablas hash (Map / Set) con búsquedas O(1).
   *  - Espacio: O(N + M) para normalización y particionado en memoria.
   *
   * @returns {Object|null} Retorna el objeto de diferencias particionado o null si no hay snapshot activo.
   */
  function calculateDiffs(overrideCurrent, overridePrevious, overrideWhitelist) {
    const current = overrideCurrent !== undefined ? overrideCurrent : getCurrentSnapshot();
    if (!current) return null;

    let previous = overridePrevious !== undefined ? overridePrevious : getPreviousSnapshot();

    // Aislamiento defensivo: si previous es de demo pero current no es demo, omitir previous
    if (previous && (previous.accountOwner === 'demo_portfolio' || previous.isDemo) && current.accountOwner !== 'demo_portfolio' && !current.isDemo) {
      previous = null;
    }
    // Si tienen distinto accountOwner declarado (y ninguno vacío), omitir comparación
    if (previous && previous.accountOwner && current.accountOwner && previous.accountOwner !== current.accountOwner) {
      previous = null;
    }

    const whitelist = overrideWhitelist !== undefined ? (overrideWhitelist || []) : getWhitelist();
    const whitelistSet = new Set((Array.isArray(whitelist) ? whitelist : []).map(u => String(u).toLowerCase()));

    const rawFollowing = Array.isArray(current.following) ? current.following : [];
    const rawFollowers = Array.isArray(current.followers) ? current.followers : [];

    const followingMap = new Map();
    rawFollowing.forEach(u => {
      if (u && u.username) followingMap.set(u.username.toLowerCase(), u);
    });

    const followersMap = new Map();
    rawFollowers.forEach(u => {
      if (u && u.username) followersMap.set(u.username.toLowerCase(), u);
    });

    // 1. No te siguen de vuelta (Following - Followers)
    const notFollowingBack = [];
    const whitelistedUsers = [];
    const matchedWhitelist = new Set();

    rawFollowing.forEach(u => {
      if (!u || !u.username) return;
      const lower = u.username.toLowerCase();
      if (whitelistSet.has(lower)) {
        whitelistedUsers.push(u);
        matchedWhitelist.add(lower);
      } else if (!followersMap.has(lower)) {
        notFollowingBack.push(u);
      }
    });

    // Garantizar que toda cuenta archivada en la whitelist se conserve en la vista de Archivadas
    whitelistSet.forEach(lower => {
      if (!matchedWhitelist.has(lower)) {
        whitelistedUsers.push({
          username: lower,
          name: '',
          timestamp: null
        });
      }
    });

    // 2. Fans (Followers - Following)
    const fans = [];
    rawFollowers.forEach(u => {
      if (!u || !u.username) return;
      const lower = u.username.toLowerCase();
      if (!followingMap.has(lower)) {
        fans.push(u);
      }
    });

    // 3. Seguimiento Mutuo (Following ∩ Followers)
    const mutual = [];
    rawFollowing.forEach(u => {
      if (!u || !u.username) return;
      const lower = u.username.toLowerCase();
      if (followersMap.has(lower)) {
        mutual.push(u);
      }
    });

    // 4. Comparativa Histórica (con Previous Snapshot)
    const unfollowedYou = [];
    const newFollowers = [];

    if (previous && Array.isArray(previous.followers)) {
      const prevFollowersMap = new Map();
      previous.followers.forEach(u => {
        if (u && u.username) prevFollowersMap.set(u.username.toLowerCase(), u);
      });

      // Quienes estaban antes pero ya no están ahora
      previous.followers.forEach(u => {
        if (!u || !u.username) return;
        const lower = u.username.toLowerCase();
        if (!followersMap.has(lower)) {
          unfollowedYou.push(u);
        }
      });

      // Nuevos seguidores (están ahora pero no antes)
      rawFollowers.forEach(u => {
        if (!u || !u.username) return;
        const lower = u.username.toLowerCase();
        if (!prevFollowersMap.has(lower)) {
          newFollowers.push(u);
        }
      });
    }

    return {
      current,
      previous,
      notFollowingBack,
      unfollowedYou,
      newFollowers,
      mutual,
      fans,
      whitelistedUsers,
      pendingRequests: current.pendingRequests || [],
      recentlyUnfollowed: current.recentlyUnfollowed || [],
      blockedProfiles: current.blockedProfiles || [],
      hideStoryFrom: current.hideStoryFrom || [],
      receivedRequests: current.receivedRequests || [],
      followingHashtags: current.followingHashtags || [],
      closeFriends: current.closeFriends || [],
      restrictedProfiles: current.restrictedProfiles || []
    };
  }

  return {
    saveNewSnapshot,
    getCurrentSnapshot,
    getPreviousSnapshot,
    clearAllData,
    getWhitelist,
    isWhitelisted,
    addToWhitelist,
    removeFromWhitelist,
    exportWhitelistJson,
    importWhitelist,
    calculateDiffs
  };
}));
