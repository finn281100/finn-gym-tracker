import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../exercise-catalog.js', import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);

const {
  CATEGORIES,
  EXERCISE_CATALOG,
  filterExerciseCatalog,
  normalizeCatalogQuery,
  validateExerciseCatalog,
  renderCatalogPoseSvg,
  renderCatalogMuscleSvg,
  renderExerciseCatalog
} = sandbox.window.GYM_EXERCISE_CATALOG_API;

assert.equal(CATEGORIES.includes('Alle'), true);
assert.equal(CATEGORIES.includes('Beine'), true);
assert.equal(validateExerciseCatalog(EXERCISE_CATALOG).length, 0);
assert.equal(new Set(EXERCISE_CATALOG.map(exercise => exercise.id)).size, EXERCISE_CATALOG.length);

const armExercises = filterExerciseCatalog(EXERCISE_CATALOG, { category: 'Arme' });
assert.equal(armExercises.some(exercise => exercise.id === 'dumbbell-biceps-curl'), true);
assert.equal(armExercises.every(exercise => exercise.category === 'Arme'), true);

const kettlebellExercises = filterExerciseCatalog(EXERCISE_CATALOG, { query: 'kettlebell' });
assert.equal(kettlebellExercises.length >= 2, true);
assert.equal(kettlebellExercises.every(exercise => /kettlebell/i.test(`${exercise.name} ${exercise.equipment}`)), true);

const normalizedQuery = normalizeCatalogQuery('  HANTELN  ');
assert.equal(normalizedQuery, 'hanteln');
assert.equal(filterExerciseCatalog(EXERCISE_CATALOG, { category: 'Beine', query: 'gesäß' }).some(exercise => exercise.id === 'goblet-squat'), true);

const curl = EXERCISE_CATALOG.find(exercise => exercise.id === 'dumbbell-biceps-curl');
assert.match(renderCatalogPoseSvg(curl, 'start'), /<svg class="catalog-figure"/);
assert.match(renderCatalogPoseSvg(curl, 'end'), /Kurzhantel Bizepscurls End-Position/);
assert.match(renderCatalogMuscleSvg(curl), /Primär/);
assert.match(renderCatalogMuscleSvg(curl), /#ff5a3f/);
assert.match(renderExerciseCatalog(EXERCISE_CATALOG, { query: 'zzzz' }), /Keine passende/);

console.log('exercise-catalog tests passed');
