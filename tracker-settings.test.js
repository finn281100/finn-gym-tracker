import assert from 'node:assert/strict';

const TRACKERS = ['sleep', 'calories_intake', 'calories_burned', 'water', 'protein', 'carbs', 'fat', 'training'];

function defaultTrackerSettings() {
  return TRACKERS.reduce((settings, id) => {
    settings[id] = true;
    return settings;
  }, {});
}

function normalizeProfile(profile) {
  const previousSettings = profile.trackerSettings || {};
  profile.trackerSettings = {
    ...defaultTrackerSettings(),
    ...previousSettings
  };
  if (previousSettings.calories === false) {
    profile.trackerSettings.calories_intake = false;
    profile.trackerSettings.calories_burned = false;
  }
  profile.days = profile.days || {};
  Object.values(profile.days).forEach(day => {
    if (!Array.isArray(day.sets)) day.sets = [];
    if (day.calories_intake === undefined) day.calories_intake = Number(day.calories || 0);
    if (day.carbs_grams === undefined) day.carbs_grams = 0;
    if (day.fat_grams === undefined) day.fat_grams = 0;
    if (day.energy_level === undefined) day.energy_level = 0;
    if (day.muscle_soreness === undefined) day.muscle_soreness = 0;
    if (day.stress_level === undefined) day.stress_level = 0;
  });
  return profile;
}

function trackerIsEnabled(profile, id) {
  return profile.trackerSettings[id] !== false;
}

function checkScaleValue(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 0;
}

function dayHasData(profile, key) {
  const d = profile.days[key];
  if (!d) return false;
  return (trackerIsEnabled(profile, 'sleep') && Number(d.sleep_hours || 0) > 0)
    || (trackerIsEnabled(profile, 'calories_intake') && Number((d.calories_intake ?? d.calories) || 0) > 0)
    || (trackerIsEnabled(profile, 'calories_burned') && getCardioCaloriesForDay(d) > 0)
    || (trackerIsEnabled(profile, 'water') && Number(d.water_liters || 0) > 0)
    || (trackerIsEnabled(profile, 'protein') && Number(d.protein_grams || 0) > 0)
    || (trackerIsEnabled(profile, 'carbs') && Number(d.carbs_grams || 0) > 0)
    || (trackerIsEnabled(profile, 'fat') && Number(d.fat_grams || 0) > 0)
    || (trackerIsEnabled(profile, 'training') && d.sets && d.sets.length > 0)
    || checkScaleValue(d.energy_level) > 0
    || checkScaleValue(d.muscle_soreness) > 0
    || checkScaleValue(d.stress_level) > 0;
}

function getCardioCaloriesForDay(day) {
  return (day.sets || [])
    .filter(set => set.type === 'cardio')
    .reduce((sum, set) => sum + Number(set.calories || 0), 0);
}

function saveDayMetrics(profile, key, values) {
  const d = profile.days[key];
  if (trackerIsEnabled(profile, 'sleep')) d.sleep_hours = values.sleep;
  if (trackerIsEnabled(profile, 'calories_intake')) {
    d.calories_intake = values.caloriesIntake;
    d.calories = values.caloriesIntake;
  }
  if (trackerIsEnabled(profile, 'water')) d.water_liters = values.water;
  if (trackerIsEnabled(profile, 'protein')) d.protein_grams = values.protein;
  if (trackerIsEnabled(profile, 'carbs')) d.carbs_grams = values.carbs;
  if (trackerIsEnabled(profile, 'fat')) d.fat_grams = values.fat;
  d.energy_level = checkScaleValue(values.energy);
  d.muscle_soreness = checkScaleValue(values.muscleSoreness);
  d.stress_level = checkScaleValue(values.stress);
  return d;
}

const legacyProfile = normalizeProfile({ days: {} });
assert.deepEqual(legacyProfile.trackerSettings, defaultTrackerSettings());

const mixedProfile = normalizeProfile({
  trackerSettings: { sleep: false, water: false },
  days: {}
});
assert.equal(mixedProfile.trackerSettings.sleep, false);
assert.equal(mixedProfile.trackerSettings.water, false);
assert.equal(mixedProfile.trackerSettings.calories_intake, true);
assert.equal(mixedProfile.trackerSettings.calories_burned, true);
assert.equal(mixedProfile.trackerSettings.protein, true);
assert.equal(mixedProfile.trackerSettings.carbs, true);
assert.equal(mixedProfile.trackerSettings.fat, true);
assert.equal(mixedProfile.trackerSettings.training, true);

const hiddenOnlyProfile = normalizeProfile({
  trackerSettings: { sleep: false, calories: false, water: false, protein: false, carbs: false, fat: false, training: false },
  days: {
    '2026-05-19': {
      sleep_hours: 8,
      calories: 2500,
      water_liters: 3,
      protein_grams: 160,
      sets: [{ set_id: 1, type: 'cardio', calories: 300 }]
    }
  }
});
assert.equal(dayHasData(hiddenOnlyProfile, '2026-05-19'), false);
assert.equal(hiddenOnlyProfile.trackerSettings.calories_intake, false);
assert.equal(hiddenOnlyProfile.trackerSettings.calories_burned, false);

const activeProfile = normalizeProfile({
  trackerSettings: { sleep: false, calories_intake: true, water: false, protein: false, carbs: false, fat: false, training: false },
  days: { '2026-05-19': { sleep_hours: 8, calories: 2300, sets: [{ set_id: 1 }] } }
});
assert.equal(dayHasData(activeProfile, '2026-05-19'), true);
assert.equal(activeProfile.days['2026-05-19'].calories_intake, 2300);

const burnedOnlyProfile = normalizeProfile({
  trackerSettings: { sleep: false, calories_intake: false, calories_burned: true, water: false, protein: false, carbs: false, fat: false, training: false },
  days: { '2026-05-19': { sets: [{ set_id: 1, type: 'cardio', calories: 180 }] } }
});
assert.equal(dayHasData(burnedOnlyProfile, '2026-05-19'), true);

const preserveProfile = normalizeProfile({
  trackerSettings: { sleep: false, calories_intake: true, carbs: true, fat: true },
  days: { '2026-05-19': { sleep_hours: 7, calories: 2100, water_liters: 2, protein_grams: 140 } }
});
saveDayMetrics(preserveProfile, '2026-05-19', { sleep: 0, caloriesIntake: 2400, water: 3, protein: 160, carbs: 220, fat: 70 });
assert.equal(preserveProfile.days['2026-05-19'].sleep_hours, 7);
assert.equal(preserveProfile.days['2026-05-19'].calories, 2400);
assert.equal(preserveProfile.days['2026-05-19'].calories_intake, 2400);
assert.equal(preserveProfile.days['2026-05-19'].carbs_grams, 220);
assert.equal(preserveProfile.days['2026-05-19'].fat_grams, 70);

const recoveryOnlyProfile = normalizeProfile({
  trackerSettings: { sleep: false, calories_intake: false, calories_burned: false, water: false, protein: false, carbs: false, fat: false, training: false },
  days: { '2026-05-20': { energy_level: 4, muscle_soreness: 2, stress_level: 2, sets: [] } }
});
assert.equal(dayHasData(recoveryOnlyProfile, '2026-05-20'), true);

saveDayMetrics(recoveryOnlyProfile, '2026-05-20', { energy: 5, muscleSoreness: 1, stress: 1 });
assert.equal(recoveryOnlyProfile.days['2026-05-20'].energy_level, 5);
assert.equal(recoveryOnlyProfile.days['2026-05-20'].muscle_soreness, 1);
assert.equal(recoveryOnlyProfile.days['2026-05-20'].stress_level, 1);

console.log('tracker-settings tests passed');
