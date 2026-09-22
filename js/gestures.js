/**
 * gestures.js - Motor de Gestos Táctiles y Swipe para Filas de Usuarios
 * InSafeFollow v1.3.0
 * 
 * Cumple con ISO/IEC 25010 (Usabilidad, Modularidad, Prevención de Errores).
 * Implementa máquina de estados de gestos con bloqueo direccional estricto (Direction Lock)
 * para evitar interferencias con el desplazamiento vertical nativo de la página móvil.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InSafeFollowGestures = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Configuración predeterminada de umbrales físicos (en píxeles)
  const DEFAULT_OPTIONS = {
    thresholdPx: 45,        // Desplazamiento mínimo para disparar la acción
    directionLockPx: 6,     // Desplazamiento antes de decidir si es horizontal o vertical
    visualFeedbackPx: 18,   // Desplazamiento para iluminar la etiqueta de acción
    maxDisplacementPx: 130  // Máximo arrastre permitido
  };

  /**
   * Vincula gestos táctiles y de ratón a una fila de usuario
   * 
   * @param {HTMLElement} row - Contenedor padre de la fila (.user-item-row)
   * @param {HTMLElement} rowContent - Contenedor deslizable (.user-row-content)
   * @param {Object} user - Objeto de usuario { username, name, href, timestamp }
   * @param {Object} callbacks - { onSwipeRight, onSwipeLeft }
   * @param {Object} [customOptions] - Opciones personalizadas de umbrales
   */
  function bindSwipe(row, rowContent, user, callbacks, customOptions) {
    if (!row || !rowContent || !user) return;

    const opts = Object.assign({}, DEFAULT_OPTIONS, customOptions);
    const onSwipeRight = callbacks && typeof callbacks.onSwipeRight === 'function' ? callbacks.onSwipeRight : null;
    const onSwipeLeft = callbacks && typeof callbacks.onSwipeLeft === 'function' ? callbacks.onSwipeLeft : null;

    let startX = 0;
    let startY = 0;
    let currentDx = 0;
    let isTracking = false;
    let directionLocked = false;
    let isHorizontal = false;

    function startSwipe(clientX, clientY, target) {
      if (target && target.closest && target.closest('button, a')) {
        return false;
      }
      startX = clientX;
      startY = clientY;
      currentDx = 0;
      isTracking = true;
      directionLocked = false;
      isHorizontal = false;
      rowContent.style.transition = 'none';
      return true;
    }

    function moveSwipe(clientX, clientY, e) {
      if (!isTracking) return;
      const dx = clientX - startX;
      const dy = clientY - startY;

      if (!directionLocked) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX < opts.directionLockPx && absY < opts.directionLockPx) return;
        directionLocked = true;
        isHorizontal = absX >= absY;
      }

      if (!isHorizontal) {
        isTracking = false;
        return;
      }

      if (e && e.cancelable) e.preventDefault();
      const maxRight = onSwipeRight ? opts.maxDisplacementPx : 0;
      currentDx = Math.max(-opts.maxDisplacementPx, Math.min(maxRight, dx));
      rowContent.style.transform = `translateX(${currentDx}px)`;

      if (onSwipeRight && currentDx > opts.visualFeedbackPx) {
        row.classList.add('swiping-right');
        row.classList.remove('swiping-left');
      } else if (currentDx < -opts.visualFeedbackPx) {
        row.classList.add('swiping-left');
        row.classList.remove('swiping-right');
      } else {
        row.classList.remove('swiping-right', 'swiping-left');
      }
    }

    function endSwipe() {
      if (!isTracking && !isHorizontal && currentDx === 0) return;
      isTracking = false;
      rowContent.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
      row.classList.remove('swiping-right', 'swiping-left');

      if (onSwipeRight && currentDx > opts.thresholdPx) {
        // Deslizar a la derecha: Acción primaria (Archivar o Restaurar)
        rowContent.style.transform = 'translateX(105%)';
        setTimeout(() => {
          onSwipeRight(user);
        }, 180);
      } else if (currentDx < -opts.thresholdPx) {
        // Deslizar a la izquierda: Acción secundaria (Abrir Instagram)
        rowContent.style.transform = 'translateX(0px)';
        if (onSwipeLeft) onSwipeLeft(user);
      } else {
        rowContent.style.transform = 'translateX(0px)';
      }

      currentDx = 0;
      directionLocked = false;
      isHorizontal = false;
    }

    function resetSwipe() {
      isTracking = false;
      rowContent.style.transition = 'transform 0.2s ease';
      rowContent.style.transform = 'translateX(0px)';
      row.classList.remove('swiping-right', 'swiping-left');
      currentDx = 0;
      directionLocked = false;
      isHorizontal = false;
    }

    // Dispositivos móviles y tablets (Touch Events)
    rowContent.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      startSwipe(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }, { passive: true });

    rowContent.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return;
      moveSwipe(e.touches[0].clientX, e.touches[0].clientY, e);
    }, { passive: false });

    rowContent.addEventListener('touchend', endSwipe);
    rowContent.addEventListener('touchcancel', resetSwipe);

    // Emuladores táctiles y ratón en PC (Pointer/Mouse Events)
    rowContent.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (startSwipe(e.clientX, e.clientY, e.target)) {
        const onMouseMove = (ev) => moveSwipe(ev.clientX, ev.clientY, ev);
        const onMouseUp = () => {
          endSwipe();
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      }
    });
  }

  return {
    DEFAULT_OPTIONS,
    bindSwipe
  };
}));
