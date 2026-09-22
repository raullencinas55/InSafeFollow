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

  function saveNewSnapshot(parsedData) {
    const existingCurrent = getCurrentSnapshot();
    if (existingCurrent) {
      // Rotar: el actual pasa a ser el anterior
      localStorage.setItem(KEY_PREVIOUS, JSON.stringify(existingCurrent));
    }
    // Guardar el nuevo como actual
    localStorage.setItem(KEY_CURRENT, JSON.stringify(parsedData));
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

    const previous = overridePrevious !== undefined ? overridePrevious : getPreviousSnapshot();
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
    rawFollowing.forEach(u => {
      if (!u || !u.username) return;
      const lower = u.username.toLowerCase();
      if (!followersMap.has(lower)) {
        if (whitelistSet.has(lower)) {
          whitelistedUsers.push(u);
        } else {
          notFollowingBack.push(u);
        }
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
    calculateDiffs
  };
}));
