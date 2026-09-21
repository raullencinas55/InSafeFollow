# InSafeFollow 🛡️ - Auditoría Privada y Segura de Conexiones

**InSafeFollow** (fusión conceptual de *In* + *Safe* + *Follow*) es una aplicación web estática, 100% client-side y de código abierto, diseñada para auditar conexiones y detectar quién te dejó de seguir en redes sociales **sin contraseñas, sin bots y con cero riesgo de baneo**.

El diseño está construido bajo principios de **UX Research** e interfaces modernas (estilo Linear / Vercel), con una paleta Zinc/Obsidian profunda, tipografía Plus Jakarta Sans, cuadrículas asimétricas Bento Grid y navegación segmentada táctil optimizada para teléfonos móviles (Mobile-First).

---

## ⚖️ Marco Legal y Cumplimiento Normativo

InSafeFollow opera bajo el más estricto apego al marco jurídico internacional de privacidad y soberanía de datos personales:

1. **Derecho a la Portabilidad de Datos (RGPD Art. 20 / CCPA):**
   El Artículo 20 del Reglamento General de Protección de Datos (RGPD) de la Unión Europea y normativas equivalentes en América (como la CCPA de California) reconocen el derecho inalienable de cualquier ciudadano a obtener sus datos personales generados en plataformas digitales en un formato interoperable, legible y estructurado (archivos JSON/ZIP). InSafeFollow es una utilidad puramente local de lectura que facilita el ejercicio de dicho derecho.

2. **Inexistencia Total de Prácticas Ilícitas o Infracciones:**
   * **Sin Web Scraping:** No se realizan peticiones automatizadas ni rastreo de perfiles ajenos.
   * **Sin Robo de Credenciales:** Nunca se solicitan ni almacenan contraseñas, claves ni cookies de sesión.
   * **Sin Evasión Tecnológica:** No se vulneran controles de seguridad ni APIs privadas.
   * **100% Client-Side:** Todo el procesamiento ocurre en la memoria RAM del navegador del usuario. Ningún dato viaja ni se almacena en servidores externos.

3. **Uso Legítimo Nominativo de Marcas (Nominative Fair Use):**
   InSafeFollow es un software independiente desarrollado por la comunidad y no está respaldado, patrocinado, avalado ni asociado comercialmente con Meta Platforms, Inc. ni Instagram. Los nombres comerciales "Instagram", "Meta" y sus logotipos asociados son marcas registradas de Meta Platforms, Inc. Su mención se realiza con fines exclusivamente referenciales e informativos para describir la compatibilidad del archivo de datos, amparado bajo la doctrina del uso legítimo nominativo (*Nominative Fair Use*).

---

## ⚡ El Descubrimiento Clave en la Exportación ("Borrar todo")

Las plataformas por defecto pre-seleccionan toda la actividad de la cuenta (fotos, historias, mensajes, vídeos), lo cual genera descargas gigantescas de varios gigabytes que tardan días en crearse.

**El truco fundamental:**
1. En el Centro de Cuentas oficial (`Tu información y permisos > Exportar tu información`), en la pantalla de selección de categorías, pulsa el enlace **"Borrar todo"**.
2. Marca **únicamente "Seguidores y seguidos"** en la sección *Conexiones*.
3. Elige formato **JSON**, intervalo de fechas **Desde el principio** y calidad multimedia **Más baja**.

> **Resultado:** Tu archivo `.zip` se genera en **menos de 3 minutos**, pesa menos de **1 MB** y se procesa al instante en InSafeFollow.

---

## 🚀 Características Principales

* **0% Riesgo de Baneo:** No utiliza bots, scripts automáticos ni conexiones no autorizadas.
* **100% Privado y Local:** Los datos se procesan en la memoria de tu propio navegador. Funciona incluso desconectando el Wi-Fi tras cargar la web.
* **Rotación de Snapshots:** Guarda un registro local para comparar periódicamente y saber con exactitud **quién te dejó de seguir** entre dos revisiones.
* **Gestión de Excepciones (Whitelist):** Oculta con un solo clic a celebridades, influencers o marcas para que no ensucien tus resultados.
* **Métricas en Bento Grid:**
  * 🎯 **No te siguen de vuelta** (Following - Followers).
  * 📉 **Te dejaron de seguir** (Detectados respecto a la revisión anterior).
  * 📈 **Nuevos seguidores** (Ganados respecto a la revisión anterior).
  * 🤝 **Seguimiento mutuo** (Relaciones recíprocas).
  * 🌟 **Fans** (Personas que te siguen pero tú no sigues).
  * ⏳ **Solicitudes pendientes** (Cuentas privadas que aún no aceptaron tu solicitud).
* **Guía Paso a Paso Integrada:** Modal esquemático con las 8 instrucciones oficiales para exportar sin descargar archivos pesados.
* **Modal Legal Integrado:** Consulta inmediata del amparo del RGPD y descargo de marcas en cualquier momento.
* **Ergonomía Mobile-First:** Objetivos táctiles mínimos de 44px, barra de filtros segmentada scrollable y diseño adaptado a pulgares.
* **Cero Costos:** Listo para desplegar gratis en **GitHub Pages**.

---

## 📂 Estructura del Proyecto

```text
├── index.html        # Landing Page con preview interactivo, comparativa y marco legal
├── app.html          # Dashboard con Bento Grid, gráfico de crecimiento y selector de períodos
├── css/
│   ├── main.css      # Sistema de diseño, tokens CSS y modales
│   ├── landing.css   # Estilos de la landing page y preview del producto
│   └── app.css       # Estilos del dashboard, header, gráfico y métricas Bento
├── js/
│   ├── vendor/
│   │   └── fflate.js # Descompresor ZIP nativo en memoria (32 KB, UMD)
│   ├── parser.js     # Parser para relaciones JSON y nombre de cuenta
│   ├── storage.js    # Motor de snapshots, diferencias y lista de excepciones
│   ├── app.js        # Controlador del dashboard, renderizado por lotes y filtros
│   └── landing.js    # Animaciones suaves de scroll con IntersectionObserver
├── .gitignore        # Reglas de exclusión para git y privacidad
├── LICENSE           # Licencia MIT
└── README.md
```

---

## 🛠️ Cómo Probarlo Localmente

Puedes abrir directamente el archivo `index.html` en cualquier navegador web (Chrome, Brave, Safari, Edge, Firefox):

1. Abre `index.html` para explorar la Landing Page.
2. Pulsa en **"Abrir Analizador"** para acceder al panel (`app.html`).
3. Arrastra tu archivo `.zip` oficial o pulsa para seleccionarlo.

---

## 🌐 Cómo Publicar en GitHub Pages

1. Sube los archivos a un repositorio en GitHub.
2. Ve a **Settings > Pages**.
3. En **Source**, selecciona `Deploy from a branch` y elige la rama `main` en la carpeta `/ (root)`.
4. Pulsa **Save**. En 1 minuto tendrás tu enlace activo y accesible desde cualquier celular o computadora.
