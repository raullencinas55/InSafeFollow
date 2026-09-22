/**
 * chart.js - Módulo de Visualización de Crecimiento de Seguidores
 * InSafeFollow v1.3.0
 * 
 * Cumple con ISO/IEC 25010 (Modularidad, Testabilidad, Desempeño).
 * Diseñado con funciones puras para cálculo matemático desacopladas del renderizado SVG en el DOM.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Entorno Node.js / CommonJS para pruebas unitarias
    module.exports = factory();
  } else {
    // Entorno Navegador
    root.InSafeFollowChart = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MONTH_NAMES_LONG = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  /**
   * Cálculo puramente matemático y algorítmico de agrupación de seguidores por período temporal.
   * Totalmente determinista y testeable sin DOM.
   * 
   * @param {Array<{username: string, timestamp: number}>} followers 
   * @param {string} granularity - 'day' | 'month' | 'year' | 'all'
   * @param {number} chartOffset - Desplazamiento temporal hacia el pasado (<= 0)
   * @returns {Object} Datos calculados del gráfico
   */
  function computeGrowthData(followers, granularity = 'year', chartOffset = 0) {
    const validFollowers = (Array.isArray(followers) ? followers : [])
      .filter(f => f && typeof f.timestamp === 'number' && !isNaN(f.timestamp) && f.timestamp > 0)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (validFollowers.length === 0) {
      return {
        hasData: false,
        grouped: [],
        periodTitle: '',
        periodSubtitle: '',
        canPrev: false,
        canNext: false,
        periodSum: 0,
        picoDisplay: '-',
        totalCount: 0
      };
    }

    const firstFollowerDate = new Date(validFollowers[0].timestamp);
    const lastFollowerDate = new Date(validFollowers[validFollowers.length - 1].timestamp);

    const grouped = [];
    let periodTitle = '';
    let periodSubtitle = '';
    let canPrev = true;
    let canNext = chartOffset < 0;

    if (granularity === 'day') {
      // Semana (7 días)
      const baseEnd = new Date(lastFollowerDate.getFullYear(), lastFollowerDate.getMonth(), lastFollowerDate.getDate(), 23, 59, 59, 999);
      const targetEndDate = new Date(baseEnd.getTime() + chartOffset * 7 * MS_PER_DAY);
      const targetStartDate = new Date(targetEndDate.getFullYear(), targetEndDate.getMonth(), targetEndDate.getDate() - 6, 0, 0, 0, 0);

      canPrev = targetStartDate.getTime() > firstFollowerDate.getTime();
      periodTitle = 'Semana';
      periodSubtitle = `${targetStartDate.toLocaleDateString()} a ${targetEndDate.toLocaleDateString()}`;

      for (let i = 0; i < 7; i++) {
        const dCurrent = new Date(targetStartDate.getFullYear(), targetStartDate.getMonth(), targetStartDate.getDate() + i, 0, 0, 0, 0);
        const dStart = dCurrent.getTime();
        const dEnd = new Date(targetStartDate.getFullYear(), targetStartDate.getMonth(), targetStartDate.getDate() + i, 23, 59, 59, 999).getTime();

        let count = 0;
        for (let j = 0; j < validFollowers.length; j++) {
          const ts = validFollowers[j].timestamp;
          if (ts >= dStart && ts <= dEnd) count++;
        }

        const dayName = DAY_NAMES_SHORT[dCurrent.getDay()];
        const label = `${dayName} ${dCurrent.getDate()}`;
        grouped.push({
          key: dCurrent.toISOString().split('T')[0],
          label: label,
          count: count,
          tooltipText: `${dCurrent.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}: +${count} seguidores`
        });
      }
    } else if (granularity === 'month') {
      // Mes calendario
      const baseDate = new Date(lastFollowerDate.getFullYear(), lastFollowerDate.getMonth() + chartOffset, 1);
      const targetYear = baseDate.getFullYear();
      const targetMonth = baseDate.getMonth();
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const monthStart = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0).getTime();

      canPrev = monthStart > firstFollowerDate.getTime();
      periodTitle = `${MONTH_NAMES_LONG[targetMonth]} ${targetYear}`;
      periodSubtitle = '';

      for (let d = 1; d <= daysInMonth; d++) {
        const dStart = new Date(targetYear, targetMonth, d, 0, 0, 0, 0).getTime();
        const dEnd = new Date(targetYear, targetMonth, d, 23, 59, 59, 999).getTime();

        let count = 0;
        for (let j = 0; j < validFollowers.length; j++) {
          const ts = validFollowers[j].timestamp;
          if (ts >= dStart && ts <= dEnd) count++;
        }

        const dDate = new Date(targetYear, targetMonth, d);
        const dayName = DAY_NAMES_SHORT[dDate.getDay()];
        const peakLabel = `${dayName} - ${d}`;
        const showLabel = (d === 1 || d === 7 || d === 14 || d === 21 || d === 28 || d === daysInMonth);

        grouped.push({
          key: `${targetYear}-${targetMonth + 1}-${d}`,
          label: showLabel ? `${d}` : '',
          peakLabel: peakLabel,
          count: count,
          tooltipText: `${d} de ${MONTH_NAMES_LONG[targetMonth]} ${targetYear}: +${count} seguidores`
        });
      }
    } else if (granularity === 'year') {
      // Año (12 meses)
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
        for (let j = 0; j < validFollowers.length; j++) {
          const ts = validFollowers[j].timestamp;
          if (ts >= mStart && ts <= mEnd) count++;
        }

        grouped.push({
          key: `${targetYear}-${m}`,
          label: MONTH_NAMES_SHORT[m],
          count: count,
          tooltipText: `${MONTH_NAMES_LONG[m]} ${targetYear}: +${count} seguidores`
        });
      }
    } else if (granularity === 'all') {
      // Historial completo
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
        for (let j = 0; j < validFollowers.length; j++) {
          const ts = validFollowers[j].timestamp;
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

    let maxGroup = grouped[0] || null;
    let periodSum = 0;
    for (let i = 0; i < grouped.length; i++) {
      const g = grouped[i];
      periodSum += g.count;
      if (maxGroup === null || g.count > maxGroup.count) {
        maxGroup = g;
      }
    }

    let picoDisplay = '-';
    if (maxGroup && maxGroup.count > 0) {
      if (granularity === 'month') {
        picoDisplay = maxGroup.peakLabel || `${maxGroup.label || maxGroup.key}`;
      } else {
        picoDisplay = `${maxGroup.label || maxGroup.key} (+${maxGroup.count})`;
      }
    }

    return {
      hasData: true,
      grouped,
      periodTitle,
      periodSubtitle,
      canPrev,
      canNext,
      periodSum,
      picoDisplay,
      totalCount: validFollowers.length
    };
  }

  /**
   * Renderiza el gráfico SVG e interactividad en los nodos DOM correspondientes
   */
  function render(domElements, followers, granularity = 'year', chartOffset = 0) {
    const {
      container,
      svgWrap,
      statsRow,
      periodNav,
      periodLabel,
      periodSub,
      prevBtn,
      nextBtn
    } = domElements;

    if (!container || !svgWrap || !statsRow) return;

    const data = computeGrowthData(followers, granularity, chartOffset);

    if (!data.hasData) {
      svgWrap.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:0.85rem;font-weight:700;">
          No se encontraron marcas de fecha en tus seguidores para graficar.
        </div>`;
      statsRow.innerHTML = '';
      if (periodNav) periodNav.style.display = 'none';
      return;
    }

    // Actualizar barra de controles de período
    if (periodNav && periodLabel && periodSub) {
      periodNav.style.display = 'flex';
      periodLabel.textContent = data.periodTitle;
      periodSub.textContent = data.periodSubtitle;
      periodSub.style.display = data.periodSubtitle ? 'block' : 'none';

      if (prevBtn && nextBtn) {
        if (granularity === 'all') {
          prevBtn.style.display = 'none';
          nextBtn.style.display = 'none';
        } else {
          prevBtn.style.display = 'inline-flex';
          nextBtn.style.display = 'inline-flex';
          prevBtn.disabled = !data.canPrev;
          nextBtn.disabled = !data.canNext;
        }
      }
    }

    if (data.grouped.length === 0) return;

    // Fichas estadísticas
    statsRow.innerHTML = `
      <div class="chart-stat-chip">
        <span class="chip-label">Período</span>
        <span class="chip-val">+${data.periodSum}</span>
      </div>
      <div class="chart-stat-chip">
        <span class="chip-label">Pico</span>
        <span class="chip-val">${data.picoDisplay}</span>
      </div>
      <div class="chart-stat-chip">
        <span class="chip-label">Total Archivo</span>
        <span class="chip-val">${data.totalCount}</span>
      </div>
    `;

    // Medidas dinámicas adaptadas al contenedor
    const clientW = svgWrap.clientWidth || 340;
    const isMobile = clientW < 520;
    const svgWidth = isMobile ? Math.max(290, Math.floor(clientW)) : 560;
    const svgHeight = isMobile ? 165 : 205;

    const padLeft = isMobile ? 26 : 38;
    const padRight = isMobile ? 8 : 16;
    const padTop = isMobile ? 18 : 24;
    const padBottom = isMobile ? 24 : 30;
    const chartW = svgWidth - padLeft - padRight;
    const chartH = svgHeight - padTop - padBottom;

    const maxCount = Math.max(...data.grouped.map(g => g.count), 1);

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

    const colStep = chartW / data.grouped.length;
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

    data.grouped.forEach((g, idx) => {
      const isZero = g.count === 0;
      const barH = isZero ? 2 : Math.max(4, (g.count / maxCount) * chartH);
      const x = padLeft + idx * colStep + (colStep - barWidth) / 2;
      const y = padTop + chartH - barH;
      const barFill = isZero ? '#cbd5e1' : '#000000';

      const showTopNumber = !isZero && (data.grouped.length <= 14);
      const labelFontSize = (granularity === 'year' && isMobile) ? 9 : 10;

      chartElements += `
        <rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="${barWidth > 6 ? 3 : 1}" fill="${barFill}" data-tooltip="${g.tooltipText}" />
        ${showTopNumber ? `<text x="${x + barWidth / 2}" y="${y - 4}" fill="#000000" font-size="${isMobile ? 10 : 11}" font-weight="800" text-anchor="middle">${g.count}</text>` : ''}
        ${g.label ? `<text x="${x + barWidth / 2}" y="${svgHeight - (isMobile ? 6 : 8)}" fill="#475569" font-size="${labelFontSize}" font-weight="700" text-anchor="middle">${g.label}</text>` : ''}
      `;
    });

    svgWrap.innerHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
        ${chartElements}
      </svg>
      <div id="chartTooltip" class="chart-tooltip" style="display: none;"></div>
    `;

    const tooltip = svgWrap.querySelector('#chartTooltip');
    const interactiveEls = svgWrap.querySelectorAll('.chart-bar');

    interactiveEls.forEach(el => {
      const showTip = (e) => {
        const text = el.getAttribute('data-tooltip');
        if (!text || !tooltip) return;
        tooltip.textContent = text;
        tooltip.style.display = 'block';

        const rect = svgWrap.getBoundingClientRect();
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

  return {
    computeGrowthData,
    render
  };
}));
