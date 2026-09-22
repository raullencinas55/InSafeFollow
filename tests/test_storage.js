/**
 * test_storage.js - Suite de Pruebas Unitarias de InSafeFollow
 * Cumple con ISO/IEC 25010 (Adecuación Funcional, Confiabilidad y Testabilidad).
 * 
 * Ejecutable directamente con: node tests/test_storage.js
 */

const assert = require('assert');

// 1. Mock de localStorage para entorno Node.js
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();

// 2. Cargar módulos bajo prueba
const InSafeFollowStorage = require('../js/storage.js');
const InSafeFollowChart = require('../js/chart.js');
const InstagramParser = require('../js/parser.js');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${name}`);
    console.error(err);
  }
}

console.log('\n======================================================');
console.log('  InSafeFollow - Test Suite Automatizada (ISO 25010)   ');
console.log('======================================================\n');

// -----------------------------------------------------------
// SUITE 1: InSafeFollowStorage.calculateDiffs
// -----------------------------------------------------------
console.log('\x1b[36m[SUITE 1] InSafeFollowStorage - Algoritmo de Auditoría\x1b[0m');

runTest('Debe identificar con precisión usuarios que no siguen de vuelta (notFollowingBack)', () => {
  const currentSnapshot = {
    following: [
      { username: 'alice', timestamp: 1000 },
      { username: 'bob', timestamp: 2000 },
      { username: 'charlie', timestamp: 3000 }
    ],
    followers: [
      { username: 'alice', timestamp: 1000 },
      { username: 'david', timestamp: 4000 }
    ]
  };

  const diffs = InSafeFollowStorage.calculateDiffs(currentSnapshot, null, []);
  
  assert.strictEqual(diffs.notFollowingBack.length, 2);
  const usernamesNotBack = diffs.notFollowingBack.map(u => u.username).sort();
  assert.deepStrictEqual(usernamesNotBack, ['bob', 'charlie']);
});

runTest('Debe identificar con precisión fans que te siguen pero tú no sigues (fans)', () => {
  const currentSnapshot = {
    following: [{ username: 'alice', timestamp: 1000 }],
    followers: [
      { username: 'alice', timestamp: 1000 },
      { username: 'david', timestamp: 4000 }
    ]
  };

  const diffs = InSafeFollowStorage.calculateDiffs(currentSnapshot, null, []);
  assert.strictEqual(diffs.fans.length, 1);
  assert.strictEqual(diffs.fans[0].username, 'david');
});

runTest('Debe excluir de notFollowingBack a los usuarios archivados en whitelist', () => {
  const currentSnapshot = {
    following: [
      { username: 'alice', timestamp: 1000 },
      { username: 'vip_celebrity', timestamp: 2000 }
    ],
    followers: [{ username: 'alice', timestamp: 1000 }]
  };

  const whitelist = ['vip_celebrity'];
  const diffs = InSafeFollowStorage.calculateDiffs(currentSnapshot, null, whitelist);

  // vip_celebrity no debe estar en notFollowingBack
  assert.strictEqual(diffs.notFollowingBack.length, 0);
  // Pero debe figurar en whitelistedUsers
  assert.strictEqual(diffs.whitelistedUsers.length, 1);
  assert.strictEqual(diffs.whitelistedUsers[0].username, 'vip_celebrity');
});

runTest('Debe detectar quién te dejó de seguir comparando dos snapshots temporales (unfollowedYou)', () => {
  const oldSnapshot = {
    following: [{ username: 'alice', timestamp: 1000 }],
    followers: [
      { username: 'alice', timestamp: 1000 },
      { username: 'leaver_user', timestamp: 1500 }
    ]
  };

  const newSnapshot = {
    following: [{ username: 'alice', timestamp: 1000 }],
    followers: [{ username: 'alice', timestamp: 1000 }]
  };

  const diffs = InSafeFollowStorage.calculateDiffs(newSnapshot, oldSnapshot, []);
  assert.strictEqual(diffs.unfollowedYou.length, 1);
  assert.strictEqual(diffs.unfollowedYou[0].username, 'leaver_user');
});

runTest('Debe ser robusto ante estructuras nulas, vacías o malformadas (Guard Clauses)', () => {
  const diffsNull = InSafeFollowStorage.calculateDiffs(null, null, null);
  assert.strictEqual(diffsNull, null);

  const diffsMalformed = InSafeFollowStorage.calculateDiffs({ following: 'invalid', followers: null }, null, []);
  assert.ok(diffsMalformed !== null);
  assert.strictEqual(diffsMalformed.notFollowingBack.length, 0);
});

// -----------------------------------------------------------
// SUITE 2: InSafeFollowStorage - Gestión de Whitelist y Snapshots
// -----------------------------------------------------------
console.log('\n\x1b[36m[SUITE 2] InSafeFollowStorage - Persistencia y Whitelist\x1b[0m');

runTest('Debe agregar y remover usuarios de la whitelist (idempotencia)', () => {
  global.localStorage.clear();

  assert.deepStrictEqual(InSafeFollowStorage.getWhitelist(), []);
  
  InSafeFollowStorage.addToWhitelist('user_abc');
  assert.deepStrictEqual(InSafeFollowStorage.getWhitelist(), ['user_abc']);

  // Idempotencia: no duplicar
  InSafeFollowStorage.addToWhitelist('user_abc');
  assert.deepStrictEqual(InSafeFollowStorage.getWhitelist(), ['user_abc']);

  InSafeFollowStorage.removeFromWhitelist('user_abc');
  assert.deepStrictEqual(InSafeFollowStorage.getWhitelist(), []);
});

// -----------------------------------------------------------
// SUITE 3: InSafeFollowChart - Cálculo de Crecimiento
// -----------------------------------------------------------
console.log('\n\x1b[36m[SUITE 3] InSafeFollowChart - Algoritmo Estadístico\x1b[0m');

runTest('Debe calcular métricas y agrupaciones anuales correctamente', () => {
  const followers = [
    { username: 'f1', timestamp: new Date('2021-05-10T12:00:00Z').getTime() },
    { username: 'f2', timestamp: new Date('2022-03-15T12:00:00Z').getTime() },
    { username: 'f3', timestamp: new Date('2022-08-20T12:00:00Z').getTime() },
    { username: 'f4', timestamp: new Date('2023-01-01T12:00:00Z').getTime() }
  ];

  const yearData = InSafeFollowChart.computeGrowthData(followers, 'year', 0);
  assert.strictEqual(yearData.hasData, true);
  assert.strictEqual(yearData.totalCount, 4);
  assert.strictEqual(yearData.grouped.length, 12); // 12 meses
});

runTest('Debe manejar seguidores sin fecha o inválidos con resiliencia', () => {
  const malformedFollowers = [
    { username: 'f1', timestamp: null },
    { username: 'f2', timestamp: NaN },
    { username: 'f3', timestamp: 'not_a_number' }
  ];

  const chartData = InSafeFollowChart.computeGrowthData(malformedFollowers, 'year', 0);
  assert.strictEqual(chartData.hasData, false);
  assert.strictEqual(chartData.grouped.length, 0);
});

// -----------------------------------------------------------
// SUITE 4: InstagramParser - Normalización de Esquemas de Meta
// -----------------------------------------------------------
console.log('\n\x1b[36m[SUITE 4] InstagramParser - Extractor Universal\x1b[0m');

runTest('Debe extraer usuarios desde la estructura moderna label_values de Meta', () => {
  const metaModernJson = [
    {
      title: 'Seguidores',
      label_values: [
        { label: 'Nombre de usuario', value: 'coder_pro' },
        { label: 'Fecha', value: 1680000000 }
      ],
      href: 'https://www.instagram.com/coder_pro/'
    }
  ];

  const extracted = InstagramParser.extractItemsUniversal(metaModernJson, 'followers');
  assert.strictEqual(extracted.length, 1);
  assert.strictEqual(extracted[0].username, 'coder_pro');
  assert.strictEqual(extracted[0].timestamp, 1680000000000);
});

runTest('Debe extraer usuarios desde la estructura legacy string_list_data', () => {
  const metaLegacyJson = {
    relationships_following: [
      {
        title: 'artist_fan',
        string_list_data: [
          {
            value: 'artist_fan',
            timestamp: 1670000000,
            href: 'https://www.instagram.com/artist_fan'
          }
        ]
      }
    ]
  };

  const extracted = InstagramParser.extractItemsUniversal(metaLegacyJson, 'relationships_following');
  assert.strictEqual(extracted.length, 1);
  assert.strictEqual(extracted[0].username, 'artist_fan');
  assert.strictEqual(extracted[0].timestamp, 1670000000000);
});

// -----------------------------------------------------------
// RESUMEN FINAL
// -----------------------------------------------------------
console.log('\n------------------------------------------------------');
console.log(`Pruebas completadas: ${passedTests} / ${totalTests} exitosas`);
console.log('------------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ Todas las pruebas unitarias pasaron con éxito.\x1b[0m\n');
  process.exit(0);
}
