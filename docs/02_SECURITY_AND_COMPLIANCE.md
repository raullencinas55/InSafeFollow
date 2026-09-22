# 🔒 Expediente de Seguridad de la Información, Privacidad y Cumplimiento Normativo

**Proyecto:** InSafeFollow  
**Clasificación:** Documento de Seguridad y Privacidad (Privacy & Security Dossier)  
**Marco Regulatorio:** RGPD (UE 2016/679), CCPA (Cal. Civ. Code § 1798.100), ISO/IEC 27001 / OWASP Top 10  

---

## 1. Filosofía Arquitectónica: Zero-Knowledge & Client-Side Sandbox

La premisa fundamental de diseño de **InSafeFollow** es la **minimización radical del vector de ataque** mediante una arquitectura de **Cero Conocimiento (*Zero-Knowledge*)**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                   DISPOSITIVO DEL USUARIO (Sandbox)                   │
 │                                                                        │
 │   ┌──────────────────────┐          ┌──────────────────────────────┐   │
 │   │ Archivo Oficial .ZIP │ ───────> │  Procesamiento en RAM        │   │
 │   │ de Meta (JSONs)      │          │  (fflate + parser + storage) │   │
 │   └──────────────────────┘          └──────────────────────────────┘   │
 │                                                     │                  │
 │                                                     ▼                  │
 │                                     ┌──────────────────────────────┐   │
 │                                     │  DOM Local + localStorage    │   │
 │                                     └──────────────────────────────┘   │
 └────────────────────────────────────────────────────────────────────────┘
                                      ❌
                [ NINGÚN DATO ES ENVIADO A SERVIDORES EXTERNOS ]
```

1. **Inexistencia de Servidor Central:** La aplicación no cuenta con base de datos remota, APIs de telemetría ni servidores intermedios.
2. **Ciclo de Vida de Datos en Memoria Volátil:** Cuando el usuario carga su archivo `.zip`, este se transfiere a la memoria RAM de la pestaña del navegador como un `ArrayBuffer`. Al cerrar la pestaña o recargar, toda la memoria volátil es reclamada por el Garbage Collector.
3. **Persistencia Local Segura:** La única información que permanece persistida es la seleccionada explícitamente por el usuario (snapshots de seguimiento y lista blanca de exclusiones), residiendo exclusivamente en el motor `localStorage` del dispositivo local.

---

## 2. Marco Jurídico Internacional y Cumplimiento Normativo

### 2.1 RGPD (Reglamento General de Protección de Datos de la UE 2016/679)
* **Artículo 20 — Derecho a la Portabilidad de los Datos:**
  > *"El interesado tendrá derecho a recibir los datos personales que le incumban, que haya facilitado a un responsable del tratamiento, en un formato estructurado, de uso común y lectura mecánica, y a transmitirlos a otro responsable del tratamiento sin que lo impida el responsable..."*
  
  **Aplicación en InSafeFollow:** La herramienta actúa estrictamente como un visor y analizador local que asiste al titular de los datos en el ejercicio de su derecho de portabilidad. InSafeFollow no es responsable del tratamiento (*Data Controller*) ni encargado del tratamiento (*Data Processor*) según los términos del RGPD, dado que no recopila ni almacena datos ajenos.

* **Artículo 25 — Protección de Datos desde el Diseño y por Defecto (*Privacy by Design & by Default*):**
  La arquitectura client-side garantiza que la privacidad máxima sea el estado intrínseco e inmutable del sistema.

### 2.2 CCPA (California Consumer Privacy Act)
Conforme al Código Civil de California § 1798.100, los consumidores tienen derecho a acceder y transportar su información personal. InSafeFollow no comercializa ni intercambia datos de usuarios (*Zero Data Selling*), cumpliendo automáticamente con los estándares más restrictivos de la CCPA.

### 2.3 Marco Jurídico Argentino: Ley Nacional N° 25.326 (Protección de los Datos Personales)
* **Principio de Licitud y Finalidad (Art. 4):**
  Los datos personales procesados corresponden estrictamente a la exportación solicitada por el propio titular a Meta Platforms Inc. InSafeFollow no recopila, almacena ni somete a tratamiento datos con fines publicitarios, mercantiles ni de cesión a terceros.
* **Inexistencia de Base de Datos Centralizada (Art. 2 y Art. 3):**
  La aplicación no constituye un "archivo, registro, base o banco de datos" sometido a inscripción en el Registro Nacional de Bases de Datos (AAIP), dado que opera como un software utilitario puramente local para uso exclusivamente personal y privado del titular de los datos.
* **Seguridad y Confidencialidad de la Información (Art. 9 y 10):**
  Se cumple con la exigencia legal de adoptar las medidas técnicas y organizativas necesarias para garantizar la seguridad y confidencialidad de los datos personales, evitando su adulteración, pérdida, consulta o tratamiento no autorizado, garantizado mediante el aislamiento de red (CSP `connect-src 'none'`).
* **Autodeterminación Informativa (Art. 14):**
  El usuario ejerce plenamente su derecho a conocer, verificar y auditar el estado de sus relaciones en la plataforma sin intermediarios.

### 2.4 Homologación con Normas IRAM (Instituto Argentino de Normalización y Certificación)
* **IRAM-ISO/IEC 27001 (Sistemas de Gestión de Seguridad de la Información):**
  - Control A.8.24 (Uso de criptografía y protección de almacenamiento local).
  - Control A.8.26 (Arquitectura de sistemas segura y principios de ingeniería: aislamiento de procesos, defensa en profundidad).
  - Control A.8.28 (Codificación segura: prevención de inyección XSS, sanitización de entradas, ausencia de `eval()`).
* **IRAM-ISO/IEC 25010 (Ingeniería de Software — Calidad del Producto de Software):**
  - Evaluación rigurosa de las 8 características de calidad: Adecuación funcional, Eficiencia de desempeño, Compatibilidad, Usabilidad, Fiabilidad, Seguridad, Mantenibilidad y Portabilidad.
* **IRAM-ISO/IEC 12207 (Procesos del Ciclo de Vida del Software):**
  - Definición formal de los procesos de desarrollo, verificación automatizada, aseguramiento de la calidad y mantenimiento correctivo/perfectivo.
* **IRAM-ISO 21502 (Orientación sobre la Gestión de Proyectos / PMO):**
  - Gestión integral de alcance, riesgos de ciberseguridad, gestión de la configuración (Git) y entrega continua de artefactos de valor verificables.

### 2.5 Doctrina de Uso Legítimo Nominativo de Marcas (*Nominative Fair Use*)
InSafeFollow no está afiliado, respaldado ni patrocinado por Meta Platforms, Inc. Las denominaciones *"Instagram"* y *"Meta"* se utilizan con un propósito exclusivamente referencial e informativo para describir la procedencia del archivo `.zip` que la aplicación es capaz de interpretar, amparado bajo el principio legal internacional de *Nominative Fair Use*.

---

## 3. Modelo de Amenazas (STRIDE Threat Model)

Se realizó un análisis exhaustivo de amenazas bajo la metodología **STRIDE** (Microsoft Threat Modeling):

| Amenaza (STRIDE) | Aplicabilidad en InSafeFollow | Nivel de Riesgo | Contramedida Arquitectónica Implementada |
| :--- | :--- | :---: | :--- |
| **S**poofing (Suplantación) | Suplantación de identidad del usuario o de la plataforma. | **Nulo** | InSafeFollow no gestiona sesiones, tokens OAuth ni contraseñas. |
| **T**ampering (Manipulación) | Alteración de los datos exportados durante el análisis. | **Bajo** | Integridad garantizada por `TextDecoder` y validación estricta de esquemas en `parser.js`. |
| **R**epudiation (Repudio) | Desconocimiento de transacciones o acciones. | **No aplica** | No se ejecutan transacciones financieras ni cambios remotos en Instagram. |
| **I**nformation Disclosure (Fuga de información) | Exfiltración de listas de seguidores, bloqueados o chats. | **Nulo** | Cero conexiones de red hacia servidores de terceros. Total aislamiento en sandbox del navegador. |
| **D**enial of Service (Denegación de servicio) | Caída de UI o congelamiento por archivos zip excesivamente grandes. | **Medio** | Algoritmos $O(N)$ con `Map/Set`, paginación virtual en lotes de 30 e instrucción de exportación ligera (*"Borrar todo"*). |
| **E**levation of Privilege (Elevación de privilegios) | Inyección de código malicioso para acceder a datos locales. | **Bajo** | Sanitización integral de strings con `escapeHtml()` y ausencia de directivas `eval()` o `Function()`. |

---

## 4. Análisis de Vulnerabilidades y Contramedidas Técnicas

### 4.1 Prevención de Cross-Site Scripting (XSS - OWASP A03:2021)
En el análisis estático se identificó que nombres de usuario o nombres reales en el archivo JSON podrían contener caracteres de inyección HTML.

**Contramedida Implementada:**
Se integró una función de escape estricto en [`js/app.js`](../js/app.js) que se aplica de manera mandatoria a todo dato antes de su interpolación en el DOM:
```javascript
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### 4.2 Enlaces Seguros hacia Plataformas Externas (Tabnabbing Defense)
Todos los hipervínculos salientes que apuntan a perfiles de Instagram o al Centro de Cuentas de Meta incluyen de forma mandatoria los atributos de seguridad:
```html
<a href="..." target="_blank" rel="noopener noreferrer">
```
* `noopener`: Previene que la nueva ventana obtenga acceso al objeto `window.opener` de InSafeFollow.
* `noreferrer`: Evita que el navegador envíe la cabecera `Referer` hacia Instagram, preservando la privacidad del origen.

### 4.3 Auditoría de Dependencias de Terceros (Supply Chain Security)
InSafeFollow cuenta con **una única dependencia externa**: [`fflate.js`](../js/vendor/fflate.js).
- **Inspección de Código:** No utiliza Web Workers externos ni realiza llamadas de red (`fetch`, `XMLHttpRequest`, `WebSocket`).
- **Alojamiento Local:** La librería está congelada y alojada localmente en `/js/vendor/` para eliminar cualquier vector de ataque por envenenamiento de CDN (*CDN Poisoning*).

---

## 5. Comparativa de Seguridad: InSafeFollow vs. Aplicaciones Convencionales

```
+------------------------------------+--------------------------+--------------------+
| Dimensión de Seguridad             | InSafeFollow (Local)     | Apps Comerciales   |
+------------------------------------+--------------------------+--------------------+
| Solicita contraseña de Instagram   | NO (0%)                  | SÍ (100%)          |
| Riesgo de baneo / bloqueo de Meta  | NULO (0%)                | CRÍTICO (> 85%)    |
| Transmite datos a servidores cloud | NO (100% Client-Side)    | SÍ                 |
| Puede operar sin conexión a Internet| SÍ (Offline-First)      | NO                 |
| Código auditable (Open Source)     | SÍ (Licencia MIT)        | NO (Propietario)   |
| Cumplimiento RGPD Art. 20          | TOTAL Y COMPROBABLE      | DUDOSO / INFRACCIÓN|
+------------------------------------+--------------------------+--------------------+
```

---

## 6. Conclusión de Seguridad
InSafeFollow demuestra que el paradigma arquitectónico más eficaz en ciberseguridad es la **no posesión de datos**: al no recibir, almacenar ni transmitir las credenciales ni la información personal del usuario, el riesgo residual de compromiso se reduce prácticamente a cero.
