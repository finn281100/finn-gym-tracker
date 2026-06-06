import assert from 'node:assert/strict';

const DEFAULT_WATER_TARGET_LITERS = 3;

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function checkScaleValue(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 0;
}

function recoveryCheckComplete(day) {
  return checkScaleValue(day.energy_level)
    && checkScaleValue(day.muscle_soreness)
    && checkScaleValue(day.stress_level)
    && Number(day.sleep_hours || 0) > 0;
}

function calculateRecoveryScore(day) {
  if (!recoveryCheckComplete(day)) return null;
  const sleepScore = Math.min(Number(day.sleep_hours || 0) / 8, 1) * 100;
  const energyScore = checkScaleValue(day.energy_level) / 5 * 100;
  const sorenessScore = (6 - checkScaleValue(day.muscle_soreness)) / 5 * 100;
  const stressScore = (6 - checkScaleValue(day.stress_level)) / 5 * 100;
  return clampScore(sleepScore * .35 + energyScore * .25 + sorenessScore * .2 + stressScore * .2);
}

function scoreStatus(score) {
  if (score >= 85) return { key: 'optimal', label: 'Optimal' };
  if (score >= 70) return { key: 'good', label: 'Gut' };
  if (score >= 50) return { key: 'medium', label: 'Mittel' };
  return { key: 'low', label: 'Niedrig' };
}

function targetCompletion(value, target, tolerance = 0) {
  if (!target) return 0;
  const amount = Number(value || 0);
  if (tolerance) {
    const diff = Math.abs(amount - target);
    return clampScore((1 - Math.min(diff, target) / target) * 100);
  }
  return clampScore(amount / target * 100);
}

function calculateDailyScore(day, targets = { calories: 0, protein: 0, water: DEFAULT_WATER_TARGET_LITERS }) {
  const calories = targets.calories ? targetCompletion(Number((day.calories_intake ?? day.calories) || 0), targets.calories, .15) : 0;
  const protein = targetCompletion(Number(day.protein_grams || 0), targets.protein);
  const water = targetCompletion(Number(day.water_liters || 0), targets.water);
  const training = (day.sets || []).length ? 100 : 0;
  return clampScore(calories * .3 + protein * .3 + water * .2 + training * .2);
}

function dailyScoreText(score) {
  if (score >= 85) return 'Tagesziele sehr gut erfüllt';
  if (score >= 70) return 'Tagesziele gut erfüllt';
  if (score >= 50) return 'Tagesziele teilweise erfüllt';
  return 'Tagesziele offen';
}

const readyDay = {
  sleep_hours: 8,
  energy_level: 5,
  muscle_soreness: 1,
  stress_level: 1
};

assert.equal(calculateRecoveryScore(readyDay), 100);
assert.equal(scoreStatus(calculateRecoveryScore(readyDay)).label, 'Optimal');

const mediumDay = {
  sleep_hours: 6,
  energy_level: 3,
  muscle_soreness: 3,
  stress_level: 4
};
assert.equal(calculateRecoveryScore(mediumDay), 61);
assert.equal(scoreStatus(calculateRecoveryScore(mediumDay)).label, 'Mittel');

assert.equal(calculateRecoveryScore({ sleep_hours: 8, energy_level: 5, muscle_soreness: 1 }), null);
assert.equal(checkScaleValue(6), 0);

const targets = { calories: 2500, protein: 180, water: 3 };
const completeDay = {
  calories_intake: 2500,
  protein_grams: 180,
  water_liters: 3,
  sets: [{ set_id: 1 }]
};
assert.equal(calculateDailyScore(completeDay, targets), 100);
assert.equal(dailyScoreText(100), 'Tagesziele sehr gut erfüllt');

const partialDay = {
  calories_intake: 2000,
  protein_grams: 90,
  water_liters: 1.5,
  sets: []
};
assert.equal(calculateDailyScore(partialDay, targets), 49);
assert.equal(dailyScoreText(64), 'Tagesziele teilweise erfüllt');

console.log('daily-scores tests passed');
