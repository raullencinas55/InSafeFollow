# Registro de Cambios (Changelog)

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.3.0] - 2026-09-21

- **Botón de Demostración Instantánea en Dashboard (`app.html`)**: Permite a reclutadores y evaluadores explorar el Bento Grid, gráfico de crecimiento y listas interactivas en 1 clic sin necesidad de archivo `.zip` personal.
- **Capacidades PWA y Soporte Offline-First (`sw.js` y `manifest.webmanifest`)**: Aplicación instalable en dispositivos móviles con Service Worker para funcionamiento en Modo Avión sin conexión.
- **Favicon SVG Neobrutalista**: Escudo vectorizado integrado vía URI de datos en `index.html` y `app.html` sin impacto de red.
- **Gobernanza de Código Abierto**: Incorporación de `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1) y plantillas de incidencias (`.github/ISSUE_TEMPLATE/`).
- **Verificación Estática en CI**: Comando `npm run lint` (`node --check`) integrado en el pipeline de GitHub Actions previo a las pruebas.
- **Módulo de Visualización Desacoplado (`js/chart.js`)**: Algoritmo de agregación temporal (`computeGrowthData`) y motor SVG responsive aislados en un módulo UMD puro bajo directrices de mantenibilidad ISO/IEC 25010.
- **Motor de Gestos Táctiles Aislado (`js/gestures.js`)**: Máquina de estados con bloqueo direccional estricto (*Direction Lock* a 6px) y umbrales físicos para gestos de arrastre táctil y ratón.
- **Suite de Pruebas Unitarias Automatizadas (`tests/test_storage.js`)**: 10 casos de prueba que evalúan teoría de conjuntos, snapshots temporales, listas blancas, extracción de esquemas Meta y funciones puras.
- **Suite de Pruebas de Integración y E2E (`tests/test_e2e.py`)**: Ejecutor automatizado con Selenium headless verificando renderizado móvil (375px), ausencia de excepciones JavaScript y directivas CSP.
- **Integración Continua (`.github/workflows/ci.yml`)**: Pipeline de GitHub Actions ejecutando pruebas unitarias en Node.js 18, 20 y 22.
- **Content Security Policy Estricta (CSP)**: Implementación de cabecera con directivas `connect-src 'none'` y `worker-src 'self'` en `index.html` y `app.html`.
- **Dossier de Documentación Formal de Ingeniería (`docs/`)**:
  - `01_RESEARCH_DSR_METHODOLOGY.md`: Metodología Design Science Research (Peffers et al., 2007).
  - `02_SECURITY_AND_COMPLIANCE.md`: Modelado de amenazas STRIDE, Matriz de Riesgos y RGPD Art. 20.
  - `03_QUALITY_AND_TESTING_ISO25010.md`: Métricas de calidad de software y trazabilidad de pruebas.
  - `04_SOFTWARE_ARCHITECTURE_DESIGN.md`: Diagramas C4 (Contexto, Contenedor, Componente) y patrones de diseño.

### Modificado
- **Controlador Principal (`js/app.js`)**: Reducción de complejidad ciclomática delegando visualización y gestos a módulos especializados.
- **Extractor Universal (`js/parser.js`)**: Robustecimiento defensivo con conversión a cadenas seguras de valores numéricos en `label_values` y extracción de marcas temporales de fecha.
- **Capa de Persistencia (`js/storage.js`)**: Soporte modular UMD compatible con navegador y entornos de testing Node.js, así como inyección de parámetros para pruebas.

### Corregido
- Posible excepción de tipo `TypeError: (lv.value || "").trim is not a function` cuando Meta envía marcas temporales numéricas en `label_values`.
- Cierre del módulo de almacenamiento en Node.js para testing headless.

---

## [1.2.0] - 2026-09-20

### Añadido
- Vista móvil unificada con navegación por pestañas y modal de filtrado rápido.
- Botones de acción directa en filas ("Archivar", "Restaurar", "Ver perfil").
- Soporte para descompresión ZIP en memoria con `fflate`.
- Gestión de cuentas ignoradas/archivadas en almacenamiento local (`localStorage`).

---

## [1.1.0] - 2026-09-18

### Añadido
- Comparación de instantáneas históricas para detección de unfollowers.
- Filtro de búsqueda en tiempo real e infinite scroll con `IntersectionObserver`.

---

## [1.0.0] - 2026-09-15

### Añadido
- Lanzamiento inicial de InSafeFollow: auditoría local sin credenciales ni conexiones remotas.
