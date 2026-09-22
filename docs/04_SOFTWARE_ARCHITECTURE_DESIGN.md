# 🏛️ Documento de Arquitectura de Software (SAD) y Sistema de Diseño Neobrutalista

**Proyecto:** InSafeFollow  
**Estándar de Documentación:** Modelo C4 (Context, Containers, Components, Code) & UML  
**Sistema de Diseño:** Neobrutalism UI System  

---

## 1. Visión General de la Arquitectura

**InSafeFollow** está estructurado como una **Single Page Application (SPA) Estática**, orientada a la privacidad (*Offline-First* y *Client-Side Execution*).

A diferencia de las arquitecturas cliente-servidor tradicionales donde la lógica de negocio y persistencia residen en una API REST o base de datos centralizada, InSafeFollow transfiere el 100% de la computación a la máquina virtual de JavaScript del navegador del usuario.

---

## 2. Modelo C4 (Architecture Metamodel)

### Nivel 1: Diagrama de Contexto del Sistema

```mermaid
graph TD
    User["👤 Usuario Final (Navegador Móvil / Desktop)"]
    MetaCenter["🌐 Centro de Cuentas de Meta (Instagram)"]
    InSafeFollowApp["🛡️ InSafeFollow (SPA Client-Side Estática)"]
    LocalStorage["💾 Web Storage API (localStorage del Navegador)"]

    User -- "1. Solicita descarga oficial (JSON/ZIP)" --> MetaCenter
    MetaCenter -- "2. Entrega archivo zip de conexiones" --> User
    User -- "3. Arrastra o selecciona archivo .zip local" --> InSafeFollowApp
    InSafeFollowApp -- "4. Descomprime en memoria RAM y particiona O(N)" --> InSafeFollowApp
    InSafeFollowApp -- "5. Persiste snapshots históricos y whitelist" --> LocalStorage
    LocalStorage -- "6. Recupera datos de revisiones previas" --> InSafeFollowApp
    InSafeFollowApp -- "7. Renderiza Bento Grid, Gráfico SVG y Lista" --> User
```

### Nivel 2: Diagrama de Contenedores y Módulos

```mermaid
graph LR
    subgraph "Navegador Web del Cliente (Client Environment)"
        subgraph "Capa de Presentación (View Layer)"
            HTML["HTML5 Semántico (index.html / app.html)"]
            CSS["CSS3 Neobrutalism Tokens (main.css / app.css)"]
        end

        subgraph "Capa de Control y Lógica (Controller & Logic Layer)"
            AppJS["app.js (Orquestador del Dashboard)"]
            ChartJS["chart.js (Motor Matemático & SVG Responsive)"]
            GesturesJS["gestures.js (Gestos Táctiles con Direction Lock)"]
            LandingJS["landing.js (Interacciones de Inicio & Sandbox)"]
        end

        subgraph "Capa de Procesamiento y Dominio (Domain & Parsing Layer)"
            ParserJS["parser.js (Normalizador Heurístico de Esquemas)"]
            FflateJS["fflate.js (Descompresión Asíncrona en RAM)"]
            StorageJS["storage.js (Motor de Snapshots y Conjuntos O(N))"]
        end

        subgraph "Capa de Almacenamiento Local (Local Persistence Layer)"
            StorageEngine["localStorage (insafefollow_snapshots & whitelist)"]
        end
    end

    HTML --> AppJS
    HTML --> LandingJS
    CSS --> HTML
    AppJS --> ChartJS
    AppJS --> GesturesJS
    AppJS --> ParserJS
    AppJS --> StorageJS
    ParserJS --> FflateJS
    StorageJS --> StorageEngine
```

---

## 3. Diagramas de Secuencia del Ciclo de Datos

### 3.1 Pipeline de Ingesta, Descompresión y Particionado de Relaciones

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Dropzone as "UI (Dropzone / FileInput)"
    participant Parser as "InstagramParser (parser.js)"
    participant Fflate as "fflate Engine (fflate.js)"
    participant Storage as "InSafeFollowStorage (storage.js)"
    participant UI as "Dashboard UI (app.js)"

    Usuario->>Dropzone: Selecciona archivo .zip oficial
    Dropzone->>Parser: parseZip(file)
    Parser->>Fflate: unzip(uint8Array) en memoria volátil
    Fflate-->>Parser: Retorna diccionario de buffers descomprimidos
    Parser->>Parser: Decodifica JSONs con TextDecoder (following, followers_*.json)
    Parser->>Parser: Normaliza arrays con extractItemsUniversal()
    Parser-->>UI: Retorna objeto estructurado con conexiones normalizadas
    UI->>Storage: saveNewSnapshot(parsedData)
    Storage->>Storage: Rota snapshot previo a KEY_PREVIOUS y guarda actual en KEY_CURRENT
    UI->>Storage: calculateDiffs()
    Storage->>Storage: Construye Map(followers) y Set(whitelist) -> Particionado O(N)
    Storage-->>UI: Retorna objeto con 13 categorías particionadas
    UI->>UI: updateCounters() + renderResults() + renderGrowthChart()
    UI-->>Usuario: Muestra Bento Grid, Gráfico SVG y Lista interactiva
```

### 3.2 Máquina de Estados de Gestos Táctiles (Swipe Gestures)

```mermaid
sequenceDiagram
    autonumber
    actor DedoUsuario as "Dedo del Usuario (Touch / Pointer)"
    participant Row as "user-row-content"
    participant Engine as "Swipe State Machine (app.js)"
    participant Storage as "InSafeFollowStorage"
    participant UI as "List View"

    DedoUsuario->>Row: touchstart (registra X, Y iniciales)
    DedoUsuario->>Row: touchmove (desplazamiento dx, dy)
    Engine->>Engine: Evalúa si Math.abs(dx) >= 6px o Math.abs(dy) >= 6px
    alt Trayectoria es vertical (|dy| > |dx|)
        Engine->>Engine: Bloquea swipe -> Cede control al scroll vertical nativo
    else Trayectoria es horizontal (|dx| >= |dy|)
        Engine->>Row: Aplica transform: translateX(dx px) [Resistencia máx 130px]
        alt dx > 18px
            Engine->>Row: Agrega clase 'swiping-right' (Fondo amarillo + Icono archivar)
        else dx < -18px
            Engine->>Row: Agrega clase 'swiping-left' (Fondo gradiente + Icono Instagram)
        end
    end
    DedoUsuario->>Row: touchend
    alt dx > 45px (Swipe a la derecha)
        Engine->>Row: Anima transform: translateX(105%)
        Engine->>Storage: handleArchiveToggle(username, isArchived)
        Storage-->>UI: Recalcula y refresca lista automáticamente
    else dx < -45px (Swipe a la izquierda)
        Engine->>Row: Restablece translateX(0px)
        Engine->>UI: window.open(instagram_url, '_blank')
    else Desplazamiento insuficiente (|dx| <= 45px)
        Engine->>Row: Retorno elástico suave a translateX(0px)
    end
```

---

## 4. Patrones de Diseño de Software Implementados

1. **Adapter Pattern (`parser.js` - `extractItemsUniversal`):**
   Actúa como un adaptador estructural que abstrae los múltiples esquemas que Meta ha utilizado a lo largo de los años (`label_values`, `string_list_data`, `title`, arrays de objetos anidados), entregando una interfaz uniforme (`{ username, name, timestamp, href }`).

2. **Sentinel / Intersection Observer Pattern (`app.js`):**
   Utiliza un elemento centinela invisible al pie del viewport de la lista para desacoplar el renderizado del DOM del evento continuo de scroll, cargando en fragmentos de 30 elementos mediante un micro-task optimizado.

3. **Repository / State Pattern (`storage.js`):**
   Encapsula el acceso y mutación del almacenamiento local (`localStorage`), manteniendo la inmutabilidad de los datos en memoria y ofreciendo métodos atómicos (`addToWhitelist`, `calculateDiffs`, `clearAllData`).

---

## 5. Sistema de Diseño Neobrutalista (Neobrutalism Design System)

La interfaz de InSafeFollow adopta el movimiento estético contemporáneo del **Neobrutalismo Digital**, caracterizado por la honestidad visual, la alta legibilidad y la eliminación de ornamentos artificiales.

### 5.1 Tokens de Diseño (Design Tokens)

| Token CSS | Valor | Propósito y Semántica |
| :--- | :--- | :--- |
| `--bg-canvas` | `#fcf9f2` | Lienzo principal en tono crema cálido, reduciendo la fatiga visual. |
| `--border-base` | `2px solid #000000` | Bordes negros rígidos de alto contraste en tarjetas, botones y modales. |
| `--shadow-card` | `2px 2px 0px #000000` | Sombra geométrica pura sin desenfoque gaussiano (*hard offset*). |
| `--shadow-card-lg`| `4px 4px 0px #000000` | Sombra para modales y elementos de elevación prioritaria. |
| `--color-yellow` | `#fde047` | Color de acento primario (acción, atención, advertencia controlada). |
| `--color-danger` | `#ef4444` | Color semántico para cuentas que no siguen de vuelta o bloqueos. |
| `--color-success` | `#10b981` | Color semántico para nuevos seguidores, mutuos y mejores amigos. |
| `--font-display` | `'Space Grotesk', sans-serif` | Tipografía geométrica de alto carácter para cifras, badges y títulos. |
| `--font-sans` | `'Plus Jakarta Sans', sans-serif` | Tipografía humanista optimizada para legibilidad de nombres y párrafos. |

### 5.2 Micro-Interacciones Táctiles y Accesibilidad
* **Estados Activos / Hover:** Al interactuar con botones o tarjetas interactivas, los elementos ejecutan un desplazamiento inverso:
  ```css
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0px #000000;
  ```
  Esto proporciona una respuesta táctil inmediata que simula el accionamiento de un pulsador físico analógico.
* **Accesibilidad (WCAG 2.1):** Todos los contrastes de color texto/fondo superan el ratio mínimo de **4.5:1** para texto normal y **3:1** para componentes de interfaz de usuario.
