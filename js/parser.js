/**
 * parser.js - Extractor y normalizador integral de datos del archivo ZIP de Instagram
 * Utiliza fflate para descomprimir en memoria de forma segura, privada y eficiente.
 */

window.InstagramParser = (function () {
  /**
   * Extrae de forma universal usuarios y metadatos de las diversas estructuras de Meta
   * (string_list_data, label_values, arrays, objetos anidados)
   */
  function extractItemsUniversal(rawJson, primaryKey) {
    if (!rawJson) return [];

    let items = [];
    if (Array.isArray(rawJson)) {
      items = rawJson;
    } else if (typeof rawJson === 'object') {
      const candidates = [
        primaryKey,
        'relationships_following',
        'relationships_followers',
        'relationships_blocked_users',
        'relationships_close_friends',
        'relationships_following_hashtags',
        'relationships_restricted_users',
        'relationships_follow_requests_sent',
        'relationships_unfollowed_users'
      ];

      for (const k of candidates) {
        if (k && Array.isArray(rawJson[k])) {
          items = rawJson[k];
          break;
        }
      }

      // Si no encontró claves de lista pero tiene label_values o string_list_data a nivel raíz
      if (items.length === 0 && (rawJson.label_values || rawJson.string_list_data)) {
        items = [rawJson];
      } else if (items.length === 0) {
        for (const val of Object.values(rawJson)) {
          if (Array.isArray(val) && val.length > 0) {
            items = val;
            break;
          }
        }
      }
    }

    const results = [];
    for (const item of items) {
      if (!item) continue;

      let username = '';
      let displayName = '';
      let timestamp = null;
      let href = '';

      // 1. Extraer desde label_values (formato moderno de Meta)
      if (Array.isArray(item.label_values)) {
        for (const lv of item.label_values) {
          const lbl = (lv.label || '').toLowerCase();
          const val = (lv.value || '').trim();
          if (lbl.includes('usuario') || lbl.includes('username')) {
            username = val;
          } else if (lbl.includes('nombre') || lbl.includes('name')) {
            displayName = val;
          } else if (lbl.includes('url') && val) {
            href = val;
          }
        }
      }

      // 2. Extraer desde string_list_data (formato estándar de followers/following)
      if (Array.isArray(item.string_list_data) && item.string_list_data.length > 0) {
        const s = item.string_list_data[0];
        if (!username) {
          username = (s.value || item.title || '').trim();
        }
        if (!timestamp && s.timestamp) {
          timestamp = s.timestamp * 1000;
        }
        if (!href && s.href) {
          href = s.href;
        }
      }

      // 3. Fallbacks de título o timestamp directo
      if (!username && item.title) {
        username = item.title.trim();
      }
      if (!username && item.value) {
        username = item.value.trim();
      }
      if (!timestamp && item.timestamp) {
        timestamp = typeof item.timestamp === 'number' ? item.timestamp * 1000 : null;
      }

      if (username) {
        results.push({
          username,
          name: displayName,
          timestamp,
          href: href || `https://www.instagram.com/${username}/`
        });
      }
    }

    return results;
  }

  /**
   * Lee un archivo Blob/File ZIP y extrae todas las conexiones de Instagram
   * @param {File} zipFile
   * @returns {Promise<Object>}
   */
  async function parseZip(zipFile) {
    if (!window.fflate) {
      throw new Error('La librería fflate no está disponible.');
    }

    const arrayBuffer = await zipFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    return new Promise((resolve, reject) => {
      window.fflate.unzip(uint8Array, (err, unzipped) => {
        if (err) {
          return reject(new Error('No se pudo descomprimir el archivo. Asegúrate de que es un archivo .zip válido de Instagram.'));
        }

        try {
          const files = Object.keys(unzipped);
          const textDecoder = new TextDecoder('utf-8');

          function parseFile(pattern, primaryKey) {
            const matchedFile = files.find(f => {
              if (typeof pattern === 'string') return f.includes(pattern);
              return pattern.test(f);
            });
            if (!matchedFile) return [];
            try {
              const content = textDecoder.decode(unzipped[matchedFile]);
              const json = JSON.parse(content);
              return extractItemsUniversal(json, primaryKey);
            } catch (e) {
              console.warn(`No se pudo parsear ${matchedFile}`, e);
              return [];
            }
          }

          // 1. Following (cuentas que sigues)
          let followingData = parseFile('following.json', 'relationships_following');

          // 2. Followers (cuentas que te siguen - pueden ser followers_1.json, followers_2.json, etc.)
          let followersData = [];
          const followerFiles = files.filter(f => f.match(/followers_\d+\.json$/) || f.endsWith('followers.json'));
          followerFiles.forEach(fPath => {
            try {
              const content = textDecoder.decode(unzipped[fPath]);
              const json = JSON.parse(content);
              followersData = followersData.concat(extractItemsUniversal(json, 'relationships_followers'));
            } catch (e) {
              console.warn(`No se pudo parsear ${fPath}`, e);
            }
          });

          // 3. Solicitudes pendientes enviadas
          const pendingRequestsData = parseFile('pending_follow_requests.json', 'relationships_follow_requests_sent');

          // 4. Perfiles dejados de seguir recientemente
          const recentlyUnfollowedData = parseFile('recently_unfollowed_profiles.json', 'relationships_unfollowed_users');

          // 5. Cuentas bloqueadas
          const blockedProfilesData = parseFile('blocked_profiles.json', 'relationships_blocked_users');

          // 6. Historias ocultas a perfiles
          const hideStoryFromData = parseFile('hide_story_from.json', 'relationships_hide_stories_from');

          // 7. Solicitudes de seguimiento recibidas
          let receivedRequestsData = parseFile("follow_requests_you've_received.json", 'relationships_follow_requests_received');
          if (receivedRequestsData.length === 0) {
            receivedRequestsData = parseFile('recent_follow_requests.json', 'relationships_recent_follow_requests');
          }

          // 8. Hashtags que sigues
          const followingHashtagsData = parseFile(/following_hashtags\.json$|follow_hashtags\.json$/, 'relationships_following_hashtags');

          // 9. Mejores Amigos (Close Friends)
          const closeFriendsData = parseFile('close_friends.json', 'relationships_close_friends');

          // 10. Perfiles Restringidos
          const restrictedProfilesData = parseFile('restricted_profiles.json', 'relationships_restricted_users');

          if (followingData.length === 0 && followersData.length === 0) {
            return reject(new Error('No se encontraron listas de seguidores o seguidos en el archivo. Asegúrate de haber marcado "Seguidores y seguidos" en formato JSON al pedirlo a Instagram.'));
          }

          let accountOwner = '';
          if (zipFile && zipFile.name) {
            const match = zipFile.name.match(/^instagram-([a-zA-Z0-9._]+)-/i);
            if (match) {
              accountOwner = match[1];
            }
          }

          resolve({
            accountOwner,
            following: followingData,
            followers: followersData,
            pendingRequests: pendingRequestsData,
            recentlyUnfollowed: recentlyUnfollowedData,
            blockedProfiles: blockedProfilesData,
            hideStoryFrom: hideStoryFromData,
            receivedRequests: receivedRequestsData,
            followingHashtags: followingHashtagsData,
            closeFriends: closeFriendsData,
            restrictedProfiles: restrictedProfilesData,
            parsedAt: new Date().toISOString()
          });

        } catch (parseError) {
          reject(new Error('Error al interpretar el contenido JSON: ' + parseError.message));
        }
      });
    });
  }

  return {
    parseZip,
    extractItemsUniversal
  };
})();
