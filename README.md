# InSafeFollow 🛡️ — Auditoría Privada y Segura de Conexiones

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Architecture: 100% Client-Side](https://img.shields.io/badge/Architecture-100%25%20Client--Side-brightgreen.svg)](#-arquitectura-técnica-y-decisiones-de-ingeniería)
[![Algorithm: O(N) Complexity](https://img.shields.io/badge/Algorithm-O(N)%20Set%20Diffs-blue.svg)](#1-complejidad-algorítmica-on-vs-on2)
[![Style: Neobrutalism](https://img.shields.io/badge/UI-Neobrutalism-orange.svg)](#-sistema-de-diseño-neobrutalista)
[![Zero Server Dependencies](https://img.shields.io/badge/Zero-Server%20Cost-black.svg)](#)

> **InSafeFollow** es una aplicación web estática, 100% client-side y de código abierto, diseñada para auditar conexiones y detectar quién te dejó de seguir en Instagram **sin contraseñas, sin bots, sin APIs privadas y con cero riesgo de baneo**, amparada bajo el derecho internacional a la portabilidad de datos personales (**RGPD Art. 20 / CCPA**).

### 🚀 [Probar Aplicación en Vivo (GitHub Pages)](https://raullencinas55.github.io/InSafeFollow/)

---

## 💡 El Problema Real y la Solución

| Aplicaciones Tradicionales ("Unfollowers") | InSafeFollow |
| :--- | :--- |
| Exigen usuario y contraseña de Instagram. | **Cero contraseñas:** Nunca solicita claves ni cookies. |
| Riesgo inminente de baneo o hackeo de cuenta. | **0% riesgo de baneo:** Cero actividad automatizada. |
| Envían tus datos a servidores opacos de terceros. | **100% Client-Side:** El cómputo ocurre en la RAM de tu navegador. |
| Costos de suscripción y publicidad invasiva. | **Open Source y Gratuita:** Sin servidores centrales. |

---

## 🧠 Arquitectura Técnica y Decisiones de Ingeniería

### 1. Complejidad Algorítmica $O(N)$ vs $O(N^2)$
El cálculo de diferencias entre listas extensas (ej. 20.000 seguidos vs. 15.000 seguidores) suele cometer el error de anidar iteraciones cuadráticas (`.filter()` + `.some()`), provocando cuelgues del hilo principal de JavaScript ($O(N \times M)$).

En [`storage.js`](js/storage.js), se implementó particionado matemático mediante **Hash Maps** y **Sets**:
```javascript
// Búsqueda O(1) en tiempo constante
const followersMap = new Map();
current.followers.forEach(u => followersMap.set(u.username.toLowerCase(), u));

// Particionado lineal O(N)
current.following.forEach(u => {
  const lower = u.username.toLowerCase();
  if (!followersMap.has(lower)) {
    if (whitelistSet.has(lower)) {
      whitelistedUsers.push(u);
    } else {
      notFollowingBack.push(u);
    }
  }
});
```
* **Resultado:** Comparación de más de **50.000 registros en menos de 40 milisegundos**.

---

### 2. Descompresión Eficiente en Memoria (`fflate`)
En lugar de depender de librerías pesadas como `JSZip` (150 KB+) que generan copias duplicadas en heap, se adoptó [`fflate`](js/vendor/fflate.js) (~32 KB, UMD):
- Procesa el archivo `.zip` directamente desde un buffer `Uint8Array`.
- Decodifica archivos JSON de relaciones con `TextDecoder` nativo sin intermediarios de red.
- Todo el ciclo de vida del archivo reside en memoria volátil y se libera al concluir la sesión.

---

### 3. Gráficos Vectoriales Procedurales (SVG Matemático Nativo)
En lugar de añadir dependencias de 500 KB (`Chart.js`, `D3` o `Recharts`):
- Se diseñó un motor matemático en [`app.js`](js/app.js) que calcula coordenadas relativas de barras, ejes y polilíneas dinámicas en SVG nativo.
- Soporta cuatro resoluciones temporales: **Semana**, **Mes**, **Año** e **Historial Completo**.
- Coordenadas con `viewBox` responsivo y tooltips flotantes accesibles.

---

### 4. Paginación Virtual y Batch Rendering (`IntersectionObserver`)
Para evitar sobrecargar el árbol de renderizado del navegador con miles de nodos DOM:
- Renderizado escalonado por lotes (`BATCH_SIZE = 30`).
- Un centinela invisible al final de la lista dispara la carga del siguiente lote mediante `IntersectionObserver`.
- Con fallback automático a eventos de scroll pasivos si el observer no está disponible.

---

### 5. Motor de Gestos Táctiles con Desambiguación Angular (Mobile-First)
El sistema de deslizamiento táctil (*Swipe Gestures*) implementa una máquina de estados para evitar interferir con el scroll vertical de la página:
- **Disambiguación en 6px:** Evalúa la trayectoria inicial del dedo ($\Delta X$ vs. $\Delta Y$). Si el usuario se desplaza verticalmente, cancela el swipe y cede el control al scroll nativo del sistema.
- **Deslizar a la derecha ($> 45\text{px}$):** Archiva o restaura la cuenta con animación elástica.
- **Deslizar a la izquierda ($< -45\text{px}$):** Abre directamente el perfil oficial en Instagram.

---

### 6. Seguridad Defensiva y Sanitización XSS
Toda entrada proveniente de los archivos procesados se sanitiza antes de inyectarse en el DOM mediante la función defensiva `escapeHtml`:
```javascript
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

---

## 🎨 Sistema de Diseño Neobrutalista

La interfaz fue diseñada con una estética **Neobrutalism** contemporánea:
- **Bordes de alto contraste:** `2px solid #000000` en todas las tarjetas interactivas.
- **Sombras geométricas duras:** `box-shadow: 2px 2px 0px #000000` con micro-animaciones al hacer clic/hover (`translate(-1px, -1px)`).
- **Paleta cromática funcional:** Fondo crema cálido (`#fcf9f2`), detalles en amarillo neobrutalista (`#fde047`), verde esmeralda para métricas positivas y rojo de alta visibilidad para no seguidores.
- **Tipografía moderna:** *Space Grotesk* (títulos y métricas con carácter) + *Plus Jakarta Sans* (lectura optimizada).

---

## ⚖️ Marco Legal y Cumplimiento Normativo

1. **Derecho a la Portabilidad de Datos (RGPD Art. 20 / CCPA):**
   Garantiza el derecho de los usuarios a descargar y portar sus datos en formato abierto (JSON). InSafeFollow asiste localmente al usuario en la interpretación de dicha información.
2. **Cero Web Scraping ni Infracción de Términos:**
   No se ejecuta scraping ni llamadas a endpoints privados de Meta.
3. **Uso Legítimo Nominativo de Marcas (Nominative Fair Use):**
   La mención de *Instagram* y *Meta* es estrictamente descriptiva bajo la doctrina de uso legítimo nominativo.

---

## ⚡ El Descubrimiento Clave en la Exportación ("Borrar todo")

1. En el Centro de Cuentas de Meta (`Tu información y permisos > Exportar tu información`), pulsa **"Borrar todo"**.
2. Marca **únicamente "Seguidores y seguidos"** en la sección *Conexiones*.
3. Elige formato **JSON**, intervalo de fechas **Desde el principio** y calidad multimedia **Más baja**.
4. **Resultado:** Tu archivo `.zip` se genera en **menos de 3 minutos**, pesa menos de **1 MB** y se procesa al instante en InSafeFollow.

---

## 📚 Expediente Técnico y Documentación Formal

Para fines académicos, auditorías de calidad o revisión de arquitectura en procesos de selección senior, consulta la documentación técnica y metodológica completa en la carpeta [`docs/`](docs/):

* 🔬 **[01. Metodología de Investigación (DSR) & Gobernanza ISO 21502 / ISO 12207](docs/01_RESEARCH_DSR_METHODOLOGY.md)**: Justificación teórica, preguntas de investigación (RQ1-RQ3), ciclo DSR de Peffers, matriz de riesgos PMO y ciclo de vida del software.
* 🔒 **[02. Expediente de Seguridad, Privacidad y Cumplimiento RGPD/CCPA](docs/02_SECURITY_AND_COMPLIANCE.md)**: Modelo de amenazas STRIDE, análisis de vectores de ataque XSS, tabnabbing, aislamiento en RAM y amparo bajo el Art. 20 del RGPD.
* 📊 **[03. Plan de Aseguramiento de Calidad (QA), Evaluación ISO/IEC 25010 y Suite de Pruebas](docs/03_QUALITY_AND_TESTING_ISO25010.md)**: Evaluación de las 8 dimensiones SQuaRE, benchmarks empíricos de rendimiento $O(N)$ vs $O(N^2)$ y matriz de casos de prueba con Selenium.
* 🏛️ **[04. Documento de Arquitectura de Software (SAD) y Sistema de Diseño](docs/04_SOFTWARE_ARCHITECTURE_DESIGN.md)**: Modelo C4 (Contexto, Contenedores, Componentes), diagramas de secuencia UML, máquina de estados táctil y tokens Neobrutalistas.

---

## 📂 Estructura del Código

```text
├── index.html        # Landing Page interactiva, guía visual y sandbox
├── app.html          # Dashboard principal, Bento Grid y visualizador
├── docs/             # Expediente técnico y metodológico formal (DSR, ISOs, SAD)
│   ├── 01_RESEARCH_DSR_METHODOLOGY.md
│   ├── 02_SECURITY_AND_COMPLIANCE.md
│   ├── 03_QUALITY_AND_TESTING_ISO25010.md
│   └── 04_SOFTWARE_ARCHITECTURE_DESIGN.md
├── css/
│   ├── main.css      # Variables de diseño globales y tokens neobrutalistas
│   ├── landing.css   # Estilos de la página de inicio
│   └── app.css       # Estilos del dashboard, lista infinita y gráfico SVG
├── js/
│   ├── vendor/
│   │   └── fflate.js # Descompresor ZIP nativo en memoria (32 KB, UMD)
│   ├── parser.js     # Parser universal y normalizador de esquemas de Meta
│   ├── storage.js    # Motor de snapshots O(N) y persistencia en localStorage
│   ├── app.js        # Controlador principal, gestos táctiles y gráfico SVG
│   └── landing.js    # Lógica interactiva de la página de presentación
├── .gitignore        # Reglas de exclusión para privacidad y dependencias
├── LICENSE           # Licencia MIT
└── README.md
```

---

## 🛠️ Ejecución Local

No requiere Node.js, compiladores ni dependencias externas:

```bash
# Clonar el repositorio
git clone https://github.com/raullencinas55/InSafeFollow.git

# Entrar a la carpeta
cd InSafeFollow

# Abrir con cualquier servidor local o directamente en el navegador
# Ejemplo con Python:
python -m http.server 8000
```
Abre `http://localhost:8000` en tu navegador.

---

## 👨‍💻 Autor

Desarrollado por **Raúl Lencinas**.
- **GitHub:** [@raullencinas55](https://github.com/raullencinas55)
- **Repositorio:** [InSafeFollow](https://github.com/raullencinas55/InSafeFollow)

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT** — puedes utilizarlo, modificarlo y distribuirlo libremente. Consulta el archivo [LICENSE](LICENSE) para más detalles.
