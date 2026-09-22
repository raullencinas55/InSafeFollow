# 🎨 Documento de Diseño de UI/UX, Sistema de Diseño y Mockups (ISO 9241-210 & WCAG 2.1 AA)

**Proyecto:** InSafeFollow — Auditoría Privada y Segura de Grafos Sociales  
**Clasificación:** Expediente de Diseño de Interfaz y Experiencia de Usuario (UI/UX Design Specification)  
**Estándares de Referencia:** ISO 9241-210:2019 (Diseño centrado en el ser humano), WCAG 2.1 Nivel AA (W3C), Material Design Ergonomics  
**Estilo Visual:** Neobrutalismo Funcional de Alto Rendimiento (*Functional High-Contrast Neobrutalism*)  

---

## 1. Filosofía de Diseño: Neobrutalismo Funcional

El diseño visual de **InSafeFollow** rechaza intencionalmente el minimalismo genérico de bordes difusos y tonalidades grises de bajo contraste. En su lugar, adopta un **Neobrutalismo Funcional**, caracterizado por:

1. **Bordes Negros Puros y Contornos Definidos (`2px solid #000000`):** Cada componente se delimita con precisión geométrica, creando una jerarquía visual nítida e inequívoca.
2. **Sombras Duras Desplazadas (*Hard Offset Shadows* `2.5px 2.5px 0px #000000`):** Proporcionan sensación de profundidad táctil y tridimensionalidad sin recurrir a costosos filtros de desenfoque (*blur*), optimizando el renderizado en GPUs móviles.
3. **Paleta Base de Papel Cálido (`#fcf9f2`):** Reduce la fatiga visual frente al blanco puro clínico (`#ffffff`), generando una atmósfera editorial premium similar a un documento o pasaporte oficial.
4. **Gradiente Sunset Oficial de Instagram:** Utilizado estratégicamente solo en puntos focales de interacción (avatares, botón de inspección de perfil, acentos de marca) para evocar de inmediato el contexto visual de la red social.
5. **Ergonomía de Mano Única (One-Handed Mobile Ergonomics):** En pantallas móviles, todos los controles primarios, botones de acción y gestos se ubican dentro de la "Zona del Pulgar" (*Thumb Zone*), garantizando uso confortable con una sola mano.

---

## 2. Tokens de Diseño (Design Tokens)

### 2.1 Paleta Cromática y Ratios de Contraste (WCAG 2.1 AA)

| Token CSS | Valor HEX / RGB | Propósito / Semántica | Ratio de Contraste vs Fondo |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#fcf9f2` | Fondo general de la aplicación (Papel crema cálido) | — |
| `--bg-surface` | `#ffffff` | Superficie de tarjetas, cajas y filas | 1.1:1 vs canvas |
| `--color-black` | `#000000` | Textos titulares, bordes y sombras duras | **19.8:1 (Cumple AAA)** |
| `--text-muted` | `#64748b` | Metadatos secundarios, fechas y leyendas | **4.9:1 (Cumple AA)** |
| `--color-yellow` | `#ffde59` | Acento neo-brutalista primario, avisos y hover | 1.3:1 (Uso decorativo) |
| `--color-green` | `#22c55e` | Métricas positivas (Seguimiento mutuo, nuevos) | **3.8:1 (Gran texto / iconos)** |
| `--color-red` | `#ef4444` | Métricas de atención (No te siguen, unfollows) | **4.6:1 (Cumple AA)** |
| `--ig-sunset` | `linear-gradient(135deg, #f58529, #dd2a7b, #8134af)` | Botón de apertura a Instagram y avatar | **5.2:1 con texto blanco** |

### 2.2 Sistema Tipográfico

- **Titulares, Métricas y Botones:** `Space Grotesk` (Google Fonts, pesos 600, 700, 800). Tipografía geométrica de alto impacto y excelente legibilidad numérica.
- **Cuerpo de Texto y Metadatos:** `Plus Jakarta Sans` (Google Fonts, pesos 500, 600, 700). Tipografía de legibilidad óptima para pantallas de alta densidad de píxeles (Retina / OLED).

### 2.3 Escala de Espaciado y Radios

- **Radios de Borde:** `--radius-xs: 6px`, `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`. Bordes ligeramente redondeados que suavizan la rigidez geométrica neobrutalista.
- **Bordes:** `1.5px solid #000000` para controles internos; `2px solid #000000` para contenedores y tarjetas; `2.5px solid #000000` para ventanas modales.
- **Sombras:** `1.5px 1.5px 0px #000000` en chips y botones; `2.5px 2.5px 0px #000000` en widgets; `4px 4px 0px #000000` en modales y hojas flotantes.

---

## 3. Anatomía y Especificación de Componentes

### 3.1 Tarjeta de Cabecera de Perfil (`.profile-header-card`)
- **Avatar Monograma:** Círculo de 38px con borde negro, fondo degradado Instagram y letra inicial en caja blanca central.
- **Identidad de Cuenta:** Handle `@usuario` con badge de estado `ACTIVO` (punto verde pulsante) y fecha del último análisis.
- **Acciones Rápidas:**
  - Botón `#toggleChartBtn`: Despliega/oculta el gráfico SVG interactivo. En móvil muestra "Gráfico" y en desktop "Crecimiento".
  - Botón `#newUploadBtn`: Permite cargar un nuevo archivo `.zip` en cualquier momento.

### 3.2 Bento Grid de Métricas (`.bento-metrics-grid`)
- Cuadrícula adaptable de 12 tarjetas:
  - Móvil (`< 640px`): 2 columnas compactas.
  - Tablet (`640px - 959px`): 2 columnas expandidas.
  - Desktop (`>= 960px`): 3 columnas optimizadas.
- Cada tarjeta contiene:
  - Etiqueta de métrica (ej. "NO TE SIGUEN DE VUELTA").
  - Badge de contexto (ej. "Atención", "Recíproco", "Círculo").
  - Valor numérico destacado en `Space Grotesk` (32px).
  - Texto descriptivo legible.
  - Efecto de interacción física: hover y active con traslación `translate(-2px, -2px)` y sombra `4px 4px 0 #000`.

### 3.3 Gráfico SVG de Crecimiento Interactivo (`#growthChartContainer`)
- Selector de granularidad temporal en 4 pestañas: `Semana` | `Mes` | `Año` | `Histórico`.
- Navegación temporal con flechas `[ < ] Período Activo [ > ]`.
- Canvas SVG 100% responsive (`viewBox="0 0 520 220"`):
  - Líneas de guía horizontales discontinuas.
  - Barras SVG con gradiente y esquinas redondeadas superiores (`rx="3"`).
  - Valores directos sobre las barras y etiquetas de eje X.
  - Tooltips interactivos al tocar o pasar el ratón.
  - Fila de 3 métricas de resumen: `PERÍODO`, `PICO MÁXIMO`, `TOTAL EN ARCHIVO`.

### 3.4 Vista de Lista Móvil (Modo App Shell `< 768px`)
- La página entra en modo aplicación nativa (`body.in-list-view`):
  - `height: 100dvh; overflow: hidden;`
  - Se oculta la barra de navegación superior clásica.
  - Cabecera unificada fija de 50px con botón Volver cuadrado `[ ← ]`, título dinámico con badge de cantidad y botón Lupa `[ 🔍 ]`.
  - **Buscador Morphing:** Al tocar la lupa, la cabecera se transforma en un campo de texto interactivo con botón limpiar `[ ✕ ]` y cancelar.
  - **Barra de Herramientas Horizontal:** Chips de ordenación con scroll horizontal sin scrollbar visible (`Más recientes`, `Más antiguos`, `A → Z`, `Z → A`, `📦 Archivadas`).
  - **Área de Lista con Virtualización/Batching:** Renderizado en bloques de 40 ítems con scroll infinito fluido mediante `IntersectionObserver`.

### 3.5 Filas de Usuario y Botones de Acción Responsivos (`.row-action-btn`)
- **Diseño Móvil (`<= 639px`):**
  - Botones en formato **cuadrado compacto de 32px × 32px**.
  - Texto oculto (`.action-btn-text, span { display: none !important; }`), mostrando **solo el icono centrado**.
  - Ocupan solo 70px en total, dejando más de 250px libres para el nombre de usuario, nombre real y fecha.
- **Diseño Desktop (`>= 640px`):**
  - Botones expandidos con icono y texto completo (`"Archivar"`, `"Ver perfil"`, `"Restaurar"`).
- **Delimitación Estricta de Funcionalidad:**
  - El botón "Archivar" y el chip de "Archivadas" **únicamente existen en la categoría "No te siguen de vuelta"**.
  - En las demás categorías (*Seguimiento mutuo*, *Fans*, *Nuevos seguidores*, etc.), las filas muestran **exclusivamente el botón de Instagram** y el gesto de swipe a la derecha queda deshabilitado.

---

## 4. Mockups y Wireframes en Alta Fidelidad

### 4.1 Mockup 1: Landing Page y Dropzone en Móvil (375px)

```
┌─────────────────────────────────────────┐
│ [🛡️] InSafeFollow                 [ = ] │  <-- Navbar 50px
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ - - - - - - - - - - - - - - - - - │  │
│  │                                   │  │
│  │               [ 📤 ]              │  │  <-- Icono sunset
│  │                                   │  │
│  │    Selecciona tu exportación      │  │
│  │        oficial de datos           │  │  <-- H1 Space Grotesk
│  │                                   │  │
│  │    Toca para seleccionar tu       │  │
│  │    archivo .zip de Meta.          │  │
│  │    100% en tu navegador.          │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Seleccionar archivo .ZIP  │  │  │  <-- Botón Sunset
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ ⚡ Probar con Demo (1 clic)  │  │  │  <-- Botón Neobrutal
│  │  └─────────────────────────────┘  │  │
│  │ - - - - - - - - - - - - - - - - - │  │
│  └───────────────────────────────────┘  │
│                                         │
│   🔒 100% Seguro • 🚫 Cero Contraseñas  │
└─────────────────────────────────────────┘
```

---

### 4.2 Mockup 2: Overview Dashboard con Gráfico Desplegado (Móvil 375px)

```
┌─────────────────────────────────────────┐
│ [🛡️] InSafeFollow                 [ = ] │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ (D) @demo_portfolio     [ ACTIVO ]  │ │  <-- Tarjeta de perfil
│ │ Último análisis: 21/09/2026         │ │
│ │ ┌───────────────┐ ┌───────────────┐ │ │
│ │ │ 📊 Gráfico    │ │ 🔄 Subir .zip │ │ │  <-- Botones simétricos
│ │ └───────────────┘ └───────────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Evolución de Seguidores  [7 SEGUID.]│ │  <-- Panel Gráfico
│ │ ┌────────┬───────┬───────┬────────┐ │ │
│ │ │ Semana │  Mes  │ *Año* │ Histór.│ │ │  <-- Tabs granularidad
│ │ └────────┴───────┴───────┴────────┘ │ │
│ │   [ < ]        Año 2026       [ > ] │ │  <-- Selector período
│ │  ┌───────────────────────────────┐  │ │
│ │  │ 2  |      █       █       █   │  │ │  <-- Gráfico SVG
│ │  │ 1  |      █   ▄   █       █   │  │ │      con barras
│ │  │ 0  |_._._.█_._█_._█_._._._█_._│  │ │      interactivas
│ │  │    E  F   M A M   J J A S O N │  │ │
│ │  └───────────────────────────────┘  │ │
│ │ ┌──────────┐ ┌──────────┐ ┌────────┐│ │
│ │ │PERÍODO +7│ │PICO Mar+2│ │TOTAL 7 ││ │  <-- Métricas resumen
│ │ └──────────┘ └──────────┘ └────────┘│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌──────────────────┐ ┌────────────────┐ │
│ │ NO TE SIGUEN     │ │ TE DEJARON     │ │  <-- Bento Grid
│ │ 10               │ │ 0              │ │      2 columnas
│ │ Cuentas que no   │ │ Detectados vs  │ │
│ │ te siguen        │ │ anterior       │ │
│ └──────────────────┘ └────────────────┘ │
│ ┌──────────────────┐ ┌────────────────┐ │
│ │ NUEVOS SEGUID.   │ │ SEGUIMIENTO MUT│ │
│ │ 0                │ │ 4              │ │
│ └──────────────────┘ └────────────────┘ │
└─────────────────────────────────────────┘
```

---

### 4.3 Mockup 3: Vista de Lista Móvil — "No te siguen" con Botones Cuadrados (375px)

```
┌─────────────────────────────────────────┐
│ [ ← ]       No te siguen de vuelta [10]  [ 🔍 ] │ <-- Header fijo 50px
├─────────────────────────────────────────┤
│ [Filtro] [Más recientes] [Más antiguos] [📦 Archivadas(0)] <-- Toolbar
├─────────────────────────────────────────┤
│ 👉 Desliza a la derecha para Archivar • Izquierda Ver Perfil 👈 │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ (C) @carlos_fullstack               │ │
│ │     Carlos Fullstack                │ │
│ │     Siguiendo desde: 19/9/2026      │ │
│ │                     ┌────┐  ┌────┐  │ │  <-- Botones cuadrados
│ │                     │ 📦 │  │ 👁️ │  │ │      32px x 32px (solo icono)
│ │                     └────┘  └────┘  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ (E) @emma_creative                  │ │
│ │     Emma Creative Studio            │ │
│ │     Siguiendo desde: 16/9/2026      │ │
│ │                     ┌────┐  ┌────┐  │ │
│ │                     │ 📦 │  │ 👁️ │  │ │
│ │                     └────┘  └────┘  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ (D) @david_frontend                 │ │
│ │     David Frontend                  │ │
│ │     Siguiendo desde: 6/9/2026       │ │
│ │                     ┌────┐  ┌────┐  │ │
│ │                     │ 📦 │  │ 👁️ │  │ │
│ │                     └────┘  └────┘  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### 4.4 Mockup 4: Vista de Lista Móvil — "Seguimiento Mutuo" (Solo Botón Instagram, Sin Archivar)

```
┌─────────────────────────────────────────┐
│ [ ← ]          Seguimiento mutuo [4]     [ 🔍 ] │
├─────────────────────────────────────────┤
│ [Filtro] [Más recientes] [Más antiguos] [A → Z] [Z → A]  │ (Sin chip Archivadas)
├─────────────────────────────────────────┤
│       👉 Desliza a la izquierda para Ver Perfil en Instagram 👈 │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ (J) @julia_code                     │ │
│ │     Julia Code & Coffee             │ │
│ │     Siguiendo desde: 22/8/2026      │ │
│ │                             ┌────┐  │ │  <-- SOLO 1 BOTÓN (👁️)
│ │                             │ 👁️ │  │ │      (Archivar deshabilitado)
│ │                             └────┘  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ (S) @sofia_ux                       │ │
│ │     Sofía UI/UX                     │ │
│ │     Siguiendo desde: 23/6/2026      │ │
│ │                             ┌────┐  │ │
│ │                             │ 👁️ │  │ │
│ │                             └────┘  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│     ✓ Has revisado las 4 cuentas de este listado │
└─────────────────────────────────────────┘
```

---

### 4.5 Mockup 5: Vista de Lista en Escritorio (1200px) con Botones Expandidos

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🛡️] InSafeFollow                                       [ 📖 Guía ] [ ℹ️ Legal ] [ 📦 Archivadas ] [ 🗑️ Limpiar ] │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [ No te siguen 10 ] [ Dejaron de seguir 0 ] [ Nuevos 0 ] [ Mutuo 4 ] [ Fans 3 ] [ Solicitudes 1 ] ... │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [ ← Volver ]                           No te siguen de vuelta [ 10 ]                  [ 🔍 ] │ │
│ ├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ │ [Filtro] [ Más recientes ] [ Más antiguos ] [ A → Z ] [ Z → A ]    [ 📦 Archivadas ( 0 ) ]    │ │
│ ├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ │ ┌───────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ (C)  @carlos_fullstack                                    ┌───────────┐  ┌──────────────┐ │ │ │
│ │ │      Carlos Fullstack • Siguiendo desde: 19/9/2026         │ 📦 Archivar│  │ 👁️ Ver perfil │ │ │ │
│ │ │                                                           └───────────┘  └──────────────┘ │ │ │
│ │ └───────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ │ ┌───────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ (E)  @emma_creative                                       ┌───────────┐  ┌──────────────┐ │ │ │
│ │ │      Emma Creative Studio • Siguiendo desde: 16/9/2026     │ 📦 Archivar│  │ 👁️ Ver perfil │ │ │ │
│ │ │                                                           └───────────┘  └──────────────┘ │ │ │
│ │ └───────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ └───────────────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Accesibilidad (WCAG 2.1 Nivel AA) y Estándares de Ergonomía Táctil (ISO 9241-210)

1. **Objetivo de Toque Mínimo (*Touch Target Size*):**
   - Todos los botones interactivos poseen al menos **32px × 32px** de superficie física y un espaciado periférico de seguridad (`gap: 6px` a `8px`), alcanzando el estándar de área de toque eficaz para dedos humanos según directrices W3C y Apple HIG.
2. **Navegación por Teclado y Foco Visible:**
   - Todos los elementos interactivos (`button`, `a`, `input`) mantienen indicadores de foco nativos de alto contraste con el borde negro y contorno accesible.
3. **Lectores de Pantalla y Accesibilidad Semántica (A11y):**
   - Atributos `aria-label` descriptivos en todos los botones de icono único (`aria-label="Volver"`, `aria-label="Abrir búsqueda"`, `aria-label="Cerrar búsqueda"`, `aria-label="Abrir menú"`).
   - Atributos `role="dialog"` y `aria-hidden` dinámicos en el panel de navegación móvil (drawer) y ventanas modales.
4. **Respeto a Preferencias de Movimiento (*Reduced Motion*):**
   - La aplicación implementa transiciones directas y ágiles (`0.15s` a `0.22s`) sin efectos de rebote excesivos, garantizando confort vestibular.
