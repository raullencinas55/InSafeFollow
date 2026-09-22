# Guía de Contribución a InSafeFollow 🤝

¡Gracias por tu interés en colaborar con **InSafeFollow**! Como proyecto de código abierto enfocado en la privacidad, la seguridad y la ingeniería rigurosa (ISO/IEC 25010), valoramos enormemente las contribuciones que respeten nuestros principios fundacionales.

---

## 🧭 Principios No Negociables del Proyecto

Cualquier cambio propuesto debe respetar estrictamente:
1. **Zero-Server / Client-Side Execution**: Todo el cómputo debe ocurrir localmente en el navegador del usuario. Bajo ninguna circunstancia se admitirán peticiones de red hacia APIs externas o almacenamiento centralizado.
2. **Conformidad con Content Security Policy (CSP)**: La directiva `connect-src 'none'` no debe alterarse. La aplicación debe ser incapaz de exfiltrar datos por diseño.
3. **Eficiencia Algorítmica $O(N)$**: Todo cálculo sobre relaciones y conjuntos debe emplear tablas hash (`Map` / `Set`) con tiempo lineal. No se admiten bucles anidados cuadráticos ($O(N^2)$).
4. **Respeto a la Privacidad (RGPD Art. 20)**: Cero rastreadores, cero cookies de analítica, cero bibliotecas con telemetría externa.

---

## 🛠️ Configuración del Entorno Local

InSafeFollow no requiere procesos de compilación complejos (`webpack`, `vite`, etc.), lo que garantiza que cualquier persona pueda ejecutarlo sin barreras:

```bash
# 1. Clonar el repositorio
git clone https://github.com/raullencinas55/InSafeFollow.git
cd InSafeFollow

# 2. Instalar dependencias de desarrollo (para ejecutar las pruebas)
# Nota: La aplicación en sí no tiene dependencias de producción.
npm install  # (Opcional, no requiere dependencias externas para testear)

# 3. Iniciar un servidor HTTP local
python -m http.server 8000
# o con Node: npx serve .
```

Abre `http://localhost:8000` en tu navegador.

---

## 🧪 Ejecución de Pruebas Automatizadas

Antes de enviar un Pull Request, debes asegurarte de que todas las pruebas pasen al 100%:

### 1. Comprobación de Sintaxis (Linting)
```bash
npm run lint
```

### 2. Pruebas Unitarias de Teoría de Conjuntos y Parsing
```bash
npm test
# o directamente: node tests/test_storage.js
```

### 3. Pruebas de Integración y E2E con Selenium
```bash
python tests/test_e2e.py
```

---

## 📝 Convención de Commits

Seguimos la convención de [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(modulo): descripción` — Nueva funcionalidad.
- `fix(modulo): descripción` — Corrección de un error o bug.
- `docs: descripción` — Mejoras o adiciones a la documentación.
- `test: descripción` — Adición o refactorización de pruebas.
- `refactor(modulo): descripción` — Refactorización de código sin cambio funcional.
- `perf(modulo): descripción` — Optimización de rendimiento.

---

## 🚀 Proceso de Pull Request (PR)

1. Crea una rama descriptiva para tu cambio (`git checkout -b feat/soporte-formato-adicional`).
2. Realiza tus cambios asegurando que no se rompan las pruebas existentes.
3. Agrega nuevas pruebas unitarias en `tests/test_storage.js` si introduces nuevas funciones.
4. Actualiza `CHANGELOG.md` en la sección `[Unreleased]`.
5. Abre el Pull Request detallando el contexto, motivación y capturas de pantalla si afecta la interfaz visual.
6. Verifica que el pipeline de **GitHub Actions CI** apruebe el build en verde.
