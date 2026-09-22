# 🔬 Documento de Investigación y Metodología: Design Science Research (DSR) & Gobernanza ISO 21502 / ISO 12207

**Proyecto:** InSafeFollow — Auditoría Privada y Segura de Grafos Sociales  
**Autor:** Raúl Lencinas  
**Estándares de Referencia:** ISO/IEC/IEEE 12207:2017, ISO 21502:2020, ISO/IEC 25010:2011  
**Marco Metodológico:** Design Science Research (Hevner et al., 2004; Peffers et al., 2007)  

---

## 1. Resumen Ejecutivo (Abstract)

El presente documento expone el marco metodológico y de investigación aplicada bajo el cual fue concebido, diseñado, implementado y evaluado **InSafeFollow**. A diferencia de los proyectos de software convencionales que abordan el desarrollo de forma puramente empírica, InSafeFollow se fundamenta en el paradigma de **Design Science Research (DSR)** para resolver un problema crítico del ecosistema digital contemporáneo: la ausencia de mecanismos seguros, éticos y transparentes para que los usuarios auditen sus conexiones en redes sociales sin entregar sus credenciales de acceso a terceros ni exponerse al bloqueo de sus cuentas.

El ciclo de vida del desarrollo se estructura según los procesos técnicos y de soporte de **ISO/IEC/IEEE 12207:2017**, mientras que la gobernanza, gestión del alcance y mitigación de riesgos se articulan bajo los lineamientos de **ISO 21502:2020** (Project Management Office).

---

## 2. Planteamiento del Problema y Preguntas de Investigación

### 2.1 Contexto y Problemática
En la última década, las plataformas de redes sociales (particularmente Instagram / Meta) han restringido progresivamente el acceso a sus APIs públicas para mitigar el scraping y la manipulación de grafos sociales. Esta política, aunque legítima, generó una brecha en la experiencia de usuario:
1. Millones de usuarios buscan activamente conocer el estado de reciprocidad de sus relaciones (*unfollowers*, fans, conexiones mutuas).
2. Para suplir esta demanda surgieron cientos de aplicaciones móviles de terceros denominadas *"Unfollowers apps"*.
3. **El fallo estructural de la industria:** Dichas aplicaciones exigen al usuario ingresar su usuario y contraseña, o bien capturan sus *session cookies*, incurriendo en:
   - Violación directa de los Términos de Servicio de Meta.
   - Activación de sistemas heurísticos anti-bot que derivan en **bloqueos temporales o cierres definitivos de cuentas (shadowbans / account bans)**.
   - Riesgo crítico de seguridad por exfiltración y secuestro de credenciales en servidores opacos de terceros.

### 2.2 Preguntas de Investigación (Research Questions)
* **RQ1:** ¿Es factible diseñar una arquitectura de software que permita realizar auditorías completas de relaciones sociales garantizando **cero acceso a credenciales, cero comunicación con servidores externos y cero riesgo de baneo**?
* **RQ2:** ¿Cómo puede aprovecharse el derecho fundamental a la portabilidad de datos personales (**RGPD Art. 20 / CCPA**) para estructurar un modelo de datos analizable puramente en memoria del cliente (*Client-Side*)?
* **RQ3:** ¿Qué estructuras de datos y algoritmos minimizan la complejidad temporal a escala lineal $O(N)$ para procesar grafos de más de 50.000 nodos en navegadores móviles con recursos limitados?

---

## 3. Metodología DSR (Design Science Research)

La metodología DSR genera conocimiento científico y técnico mediante la creación y evaluación iterativa de un **artefacto tecnológico innovador** orientado a resolver un problema organizacional o humano relevante.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. Identificar  │ ──> │ 2. Definir      │ ──> │ 3. Diseño y     │
│    el Problema  │     │    Objetivos    │     │    Desarrollo   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 6. Comunicación │ <── │ 5. Evaluación   │ <── │ 4. Demostración │
│    del Artefacto│     │    Empírica     │     │    del Artefacto│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Fase 1: Identificación del Problema y Motivación
- **Riesgo Sistémico:** Millones de cuentas sufren robos de sesión al delegar contraseñas a apps no oficiales.
- **Motivación:** Devolver el control de los datos al usuario mediante herramientas locales que no dependan de APIs privadas ni de servidores intermediarios.

### Fase 2: Definición de Objetivos de la Solución
- **Objetivo 1 (Seguridad):** Arquitectura *Zero-Knowledge* y *Offline-First*. Ningún dato personal (nombres, fotos, relaciones) debe abandonar la memoria RAM del dispositivo del usuario.
- **Objetivo 2 (Legalidad):** Sustentación jurídica en el Artículo 20 del RGPD (Portabilidad de Datos) y la doctrina de *Nominative Fair Use*.
- **Objetivo 3 (Eficiencia):** Algoritmos de cálculo de conjuntos en tiempo lineal $O(N + M)$ y espacio $O(N + M)$.
- **Objetivo 4 (Accesibilidad):** Cero costos de infraestructura para el usuario final (despliegue estático serverless).

### Fase 3: Diseño y Desarrollo del Artefacto
El artefacto resultante es **InSafeFollow**, compuesto por:
1. **Constructos:** Modelo de datos normalizado (`RelationshipItem`, `FollowerRecord`, `SnapshotDiff`).
2. **Modelos:** Modelo de particionado conjuntista (Diferencia $A \setminus B$, Intersección $A \cap B$, Diferencia Simétrica respecto al histórico).
3. **Métodos:** Pipeline asíncrono de streaming decompression (`fflate`), adaptación heurística de esquemas JSON (`parser.js`), y motor de renderizado vectorial procedural (SVG).
4. **Instanciación:** Aplicación web modular con diseño Neobrutalista e interacción táctil móvil avanzada.

### Fase 4: Demostración
Validación en escenarios reales con paquetes oficiales de datos de Meta (`instagram-username-YYYY-MM-DD-hash.zip`):
- Lectura exitosa de estructuras JSON de 1 a 100 MB.
- Extracción de 13 categorías analíticas: No seguidores, unrecíprocos históricos, fans, solicitudes enviadas/recibidas, mejores amigos, hashtags, etc.

### Fase 5: Evaluación
Siguiendo las pautas de Hevner et al. (2004), la evaluación del artefacto se ejecutó bajo criterios de rigor y relevancia:
- **Pruebas Automatizadas:** Suite E2E con Selenium WebDriver sobre navegadores desktop y móviles emulados.
- **Pruebas de Estrés Computacional:** Carga sintética de 50.000 usuarios procesada en $38\text{ ms}$.
- **Pruebas de Ergonomía Táctil:** Verificación del algoritmo de desambiguación angular de gestos swipe con tolerancia a desplazamientos involuntarios.

### Fase 6: Comunicación
- Publicación en repositorio abierto con licencia permisiva MIT.
- Documentación exhaustiva en GitHub Pages.
- Confección de expedientes técnicos de arquitectura, calidad y seguridad.

---

## 4. Ciclo de Vida del Software (ISO/IEC/IEEE 12207:2017)

InSafeFollow alinea sus actividades de ingeniería con los procesos normativos de ISO 12207:

```
                  ISO/IEC/IEEE 12207:2017
 ┌─────────────────────────────────────────────────────────┐
 │               PROCESOS TÉCNICOS (Technical)             │
 │  • Definición de Requisitos del Sistema y Software      │
 │  • Diseño de Arquitectura (Módulos desacoplados)        │
 │  • Implementación del Software (ES6+ Nativo)            │
 │  • Integración y Verificación del Software              │
 ├─────────────────────────────────────────────────────────┤
 │               PROCESOS DE SOPORTE (Supporting)          │
 │  • Aseguramiento de Calidad del Software (QA)           │
 │  • Verificación y Validación Automatizada (Selenium)    │
 │  • Gestión de la Configuración del Software (Git SCM)   │
 ├─────────────────────────────────────────────────────────┤
 │               PROCESOS DE ACUERDO Y GOBERNANZA          │
 │  • Licenciamiento Open Source (MIT)                     │
 │  • Gestión de Riesgos y Cumplimiento Regulatorio        │
 └─────────────────────────────────────────────────────────┘
```

1. **Definición de Requisitos Técnicos:** Especificación de requisitos no funcionales prioritarios: Cero latencia de red en cómputo, renderizado en menos de 60 FPS, footprint de descarga $< 150\text{ KB}$.
2. **Diseño Arquitectónico:** Desacoplamiento estricto en tres capas (Ingesta/Parsing $\to$ Lógica de Dominio/Storage $\to$ Presentación/UI).
3. **Gestión de Configuración (SCM):** Trazabilidad total de cambios mediante Conventional Commits, ramas protegidas y versionado semántico formal.
4. **Verificación Formal:** Ejecución de pruebas funcionales y pruebas de regresión visual tras cada actualización de estilos o controladores.

---

## 5. Gobernanza y Gestión del Proyecto (ISO 21502:2020 / PMO)

La norma ISO 21502 establece lineamientos para la gestión integral de proyectos. La gestión de InSafeFollow contempló los siguientes núcleos de gobernanza:

### 5.1 Gestión del Alcance (Scope Management)
- **Criterio de Exclusión (*Out of Scope*):** Se determinó explícitamente que el artefacto **no realizaría llamadas directas a las APIs privadas de Instagram** para ejecutar acciones automáticas (como dejar de seguir en masa con un solo clic), dado que violaría los términos de la plataforma y comprometería la seguridad del usuario.
- **Criterio de Inclusión (*In Scope*):** Auditoría pura, enriquecimiento de datos temporales, filtrado por whitelist y redirección oficial asistida mediante enlaces HTTPS canónicos.

### 5.2 Matriz de Gestión de Riesgos (Risk Management Matrix)

| ID | Riesgo Identificado | Probabilidad | Impacto | Estrategia de Mitigación (ISO 21502) |
| :---: | :--- | :---: | :---: | :--- |
| **R-01** | Bloqueo o baneo de cuentas de usuario por Meta. | Nula ($0\%$) | Catastrófico | **Evitación:** Cero uso de bots o scrapers. Cómputo 100% sobre archivo oficial exportado por el propio usuario. |
| **R-02** | Exfiltración de datos personales por interceptación de red. | Nula ($0\%$) | Crítico | **Eliminación:** Cero endpoints backend. Toda la ejecución reside en memoria volátil de la pestaña del navegador. |
| **R-03** | Congelamiento de UI en dispositivos móviles con datasets masivos. | Media | Alto | **Mitigación:** Algoritmos de orden $O(N)$ con `Map/Set` y paginación virtual en lotes de 30 mediante `IntersectionObserver`. |
| **R-04** | Cambios arbitrarios en el esquema JSON de Meta. | Alta | Moderado | **Adaptación:** Implementación del patrón Adapter en `extractItemsUniversal()` que inspecciona dinámicamente múltiples claves candidatas. |
| **R-05** | Cacheo persistente de versiones obsoletas en navegadores móviles. | Alta | Bajo | **Control:** Parametrización estricta de assets con query strings de versión canónica (`?v=X.Y.Z`). |

---

## 6. Conclusiones y Contribución al Conocimiento

La aplicación del marco **DSR** validó empíricamente que:
1. Es posible democratizar la analítica y auditoría de grafos sociales sin vulnerar los principios éticos de ciberseguridad ni la privacidad de los usuarios.
2. El uso consciente del marco legal internacional (**RGPD Art. 20**) constituye una alternativa técnica viable frente a la ingeniería inversa y el web scraping clandestino.
3. Los estándares **ISO 12207** e **ISO 21502** proporcionan un marco de control riguroso que transforma un script analítico en un producto de software robusto, auditable y mantenible en el tiempo.
