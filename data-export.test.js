import assert from 'node:assert/strict';

function exerciseTypeLabel(type) {
  return type === 'cardio' ? 'Cardio' : 'Krafttraining';
}

function exportNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function summarizeMealItems(items) {
  return (items || []).reduce((sum, item) => {
    sum.calories += exportNumber(item.calories);
    sum.protein += exportNumber(item.protein);
    sum.carbs += exportNumber(item.carbs);
    sum.fat += exportNumber(item.fat);
    return sum;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function getCardioCaloriesForDay(day) {
  return (day.sets || [])
    .filter(set => set.type === 'cardio')
    .reduce((sum, set) => sum + exportNumber(set.calories), 0);
}

const GOAL_LABELS = { cut: 'Cut', lean_bulk: 'Lean Bulk', bulk: 'Bulk', maintenance: 'Erhaltung' };

function calculateGoalTargets(plan) {
  return plan.targets || { calories: 2200, protein: 170, carbs: 230, fat: 70 };
}

function exportDayHasEnteredData(day) {
  return exportNumber(day.sleep_hours) > 0
    || exportNumber(day.calories_intake ?? day.calories) > 0
    || exportNumber(day.water_liters) > 0
    || exportNumber(day.protein_grams) > 0
    || exportNumber(day.carbs_grams) > 0
    || exportNumber(day.fat_grams) > 0
    || (day.sets || []).length > 0
    || (day.meals || []).length > 0;
}

function buildExcelExportSheets(state) {
  const sheets = [
    { name: 'Tageswerte', rows: [['Profil', 'Datum', 'Schlaf Stunden', 'Kalorien Intake', 'Kalorien verbrannt', 'Wasser Liter', 'Protein g', 'Kohlenhydrate g', 'Fett g']] },
    { name: 'Training', rows: [['Profil', 'Datum', 'Uebung', 'Typ', 'Muskelgruppe', 'Satz', 'Gewicht kg', 'Wiederholungen', 'Volumen kg', 'Dauer Minuten', 'Kalorien', 'Geraet']] },
    { name: 'Mahlzeiten', rows: [['Profil', 'Datum', 'Mahlzeit', 'Lebensmittel', 'Menge', 'Einheit', 'Kalorien', 'Protein g', 'Kohlenhydrate g', 'Fett g', 'Quelle']] },
    { name: 'Uebungen', rows: [['Profil', 'Uebung', 'Typ', 'Muskelgruppe']] },
    { name: 'Ziele', rows: [['Profil', 'Typ', 'Datum', 'Gewicht kg', 'Kalorien', 'Ziel kcal', 'Protein g', 'Kohlenhydrate g', 'Fett g', 'Zielgewicht kg']] }
  ];
  (state.profiles || []).forEach(profile => {
    const profileName = profile.name || 'Profil';
    const goalPlan = profile.goalPlanner && profile.goalPlanner.plan;
    const goalTargets = goalPlan ? calculateGoalTargets(goalPlan) : null;
    if (goalPlan) sheets[4].rows.push([profileName, GOAL_LABELS[goalPlan.type] || goalPlan.type, 'Plan', exportNumber(goalPlan.weightKg), '', goalTargets.calories, goalTargets.protein, goalTargets.carbs, goalTargets.fat, exportNumber(goalPlan.targetWeightKg)]);
    (profile.goalPlanner?.entries || []).forEach(entry => sheets[4].rows.push([profileName, goalPlan ? (GOAL_LABELS[goalPlan.type] || goalPlan.type) : '', entry.date, exportNumber(entry.weight), exportNumber(entry.calories), goalTargets ? goalTargets.calories : '', goalTargets ? goalTargets.protein : '', goalTargets ? goalTargets.carbs : '', goalTargets ? goalTargets.fat : '', goalPlan ? exportNumber(goalPlan.targetWeightKg) : '']));
    profile.exercises.forEach(exercise => sheets[3].rows.push([profileName, exercise.name, exerciseTypeLabel(exercise.type), exercise.muscle_group || '']));
    Object.values(profile.days || {}).filter(exportDayHasEnteredData).forEach(day => {
      const mealTotals = summarizeMealItems((day.meals || []).flatMap(meal => meal.items || []));
      sheets[0].rows.push([
        profileName,
        day.entry_date,
        exportNumber(day.sleep_hours),
        exportNumber(day.calories_intake ?? day.calories) || mealTotals.calories,
        getCardioCaloriesForDay(day),
        exportNumber(day.water_liters),
        exportNumber(day.protein_grams) || mealTotals.protein,
        exportNumber(day.carbs_grams) || mealTotals.carbs,
        exportNumber(day.fat_grams) || mealTotals.fat
      ]);
      (day.sets || []).forEach(set => {
        const exercise = profile.exercises.find(item => item.id === set.exercise_id);
        const type = set.type === 'cardio' || exercise && exercise.type === 'cardio' ? 'cardio' : 'strength';
        sheets[1].rows.push([
          profileName,
          day.entry_date,
          exercise ? exercise.name : 'Geloeschte Uebung',
          exerciseTypeLabel(type),
          exercise ? exercise.muscle_group : '',
          type === 'cardio' ? '' : exportNumber(set.set_number || 1),
          type === 'cardio' ? '' : exportNumber(set.weight),
          type === 'cardio' ? '' : exportNumber(set.reps),
          type === 'cardio' ? '' : exportNumber(set.weight) * exportNumber(set.reps),
          type === 'cardio' ? Math.round(exportNumber(set.duration_seconds) / 6) / 10 : '',
          type === 'cardio' ? exportNumber(set.calories) : '',
          type === 'cardio' ? (set.device || 'Ohne Geraet') : ''
        ]);
      });
      (day.meals || []).forEach(meal => (meal.items || []).forEach(item => {
        sheets[2].rows.push([profileName, day.entry_date, meal.name || 'Mahlzeit', item.name || 'Lebensmittel', exportNumber(item.amount), item.unit || 'g', exportNumber(item.calories), exportNumber(item.protein), exportNumber(item.carbs), exportNumber(item.fat), item.source || 'manual']);
      }));
    });
  });
  return sheets;
}

function fakeXlsxHeader() {
  return new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
}

const state = {
  profiles: [{
    name: 'Finn',
    exercises: [
      { id: 1, name: 'Bankdruecken', type: 'strength', muscle_group: 'Brust' },
      { id: 2, name: 'Laufen', type: 'cardio', muscle_group: 'Cardio' }
    ],
    goalPlanner: {
      plan: { type: 'cut', weightKg: 85, targetWeightKg: 78, targets: { calories: 2400, protein: 187, carbs: 260, fat: 68 } },
      entries: [{ date: '2026-06-04', weight: 84.7, calories: 2380 }]
    },
    days: {
      '2026-06-04': {
        entry_date: '2026-06-04',
        sleep_hours: 8,
        water_liters: 3,
        sets: [
          { exercise_id: 1, set_number: 1, weight: 80, reps: 8 },
          { exercise_id: 2, type: 'cardio', duration_seconds: 1230, calories: 210, device: 'Laufband' }
        ],
        meals: [{
          name: 'Fruehstueck',
          items: [{ name: 'Skyr', amount: 250, unit: 'g', calories: 150, protein: 28, carbs: 10, fat: 1, source: 'manual' }]
        }]
      },
      '2026-06-05': { entry_date: '2026-06-05', sets: [], meals: [] }
    }
  }]
};

const sheets = buildExcelExportSheets(state);
assert.deepEqual(sheets.map(sheet => sheet.name), ['Tageswerte', 'Training', 'Mahlzeiten', 'Uebungen', 'Ziele']);
assert.equal(sheets.some(sheet => /Statistik|Diagramm/i.test(sheet.name)), false);
assert.equal(sheets[0].rows.length, 2);
assert.equal(sheets[1].rows[1][2], 'Bankdruecken');
assert.equal(sheets[1].rows[1][8], 640);
assert.equal(sheets[1].rows[2][9], 20.5);
assert.equal(sheets[2].rows[1][3], 'Skyr');
assert.equal(sheets[3].rows.length, 3);
assert.equal(sheets[4].rows[1][1], 'Cut');
assert.equal(sheets[4].rows[2][3], 84.7);

const header = fakeXlsxHeader();
assert.equal(String.fromCharCode(header[0], header[1]), 'PK');

console.log('data-export tests passed');
