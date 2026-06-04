import assert from 'node:assert/strict';

function exerciseTypeLabel(type) {
  return type === 'cardio' ? 'Cardio' : 'Krafttraining';
}

function updateExercise(profile, id, input) {
  const exercise = profile.exercises.find(item => item.id === Number(id));
  if (!exercise) throw new Error('Uebung nicht gefunden.');

  const name = String(input.name || '').trim();
  const type = input.type === 'cardio' ? 'cardio' : 'strength';
  let muscle = String(input.muscle_group || '').trim();

  if (!name) throw new Error('Bitte einen Uebungsnamen eingeben.');
  if (type === 'cardio' && !muscle) muscle = 'Cardio';
  if (profile.exercises.some(item => item.id !== exercise.id && item.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Diese Uebung existiert bereits.');
  }

  exercise.name = name;
  exercise.type = type;
  exercise.muscle_group = muscle;
  Object.values(profile.days || {}).forEach(day => {
    (day.sets || []).forEach(set => {
      if (set.exercise_id === exercise.id) set.type = type;
    });
  });
  return exercise;
}

function getWorkoutForDay(profile, key) {
  const day = profile.days[key] || { sets: [] };
  return day.sets.map(set => {
    const exercise = profile.exercises.find(item => item.id === set.exercise_id);
    const type = set.type === 'cardio' || exercise && exercise.type === 'cardio' ? 'cardio' : 'strength';
    return {
      set_id: set.set_id,
      exercise_id: set.exercise_id,
      type,
      exercise: exercise ? exercise.name : 'Geloeschte Uebung',
      muscle_group: exercise ? exercise.muscle_group : '',
      type_label: exerciseTypeLabel(type),
      volume: type === 'cardio' ? 0 : Number(set.weight || 0) * Number(set.reps || 0)
    };
  });
}

const profile = {
  exercises: [
    { id: 1, name: 'Bankdruecken', type: 'strength', muscle_group: 'Brust' },
    { id: 2, name: 'Kniebeugen', type: 'strength', muscle_group: 'Beine' }
  ],
  days: {
    '2026-06-04': {
      sets: [
        { set_id: 10, exercise_id: 1, type: 'strength', weight: 80, reps: 8 }
      ]
    }
  }
};

updateExercise(profile, 1, { name: 'Schraegbankdruecken', type: 'strength', muscle_group: 'Obere Brust' });
assert.equal(profile.exercises[0].id, 1);
assert.equal(profile.days['2026-06-04'].sets[0].exercise_id, 1);

const updatedWorkout = getWorkoutForDay(profile, '2026-06-04')[0];
assert.equal(updatedWorkout.exercise, 'Schraegbankdruecken');
assert.equal(updatedWorkout.muscle_group, 'Obere Brust');
assert.equal(updatedWorkout.volume, 640);

assert.throws(() => updateExercise(profile, 1, { name: 'Kniebeugen', type: 'strength', muscle_group: 'Brust' }), /existiert/);
assert.throws(() => updateExercise(profile, 1, { name: '   ', type: 'strength', muscle_group: 'Brust' }), /Uebungsnamen/);

updateExercise(profile, 1, { name: 'Joggen', type: 'cardio', muscle_group: '' });
assert.equal(profile.exercises[0].muscle_group, 'Cardio');
assert.equal(profile.days['2026-06-04'].sets[0].type, 'cardio');
assert.equal(getWorkoutForDay(profile, '2026-06-04')[0].type_label, 'Cardio');

console.log('exercise-editing tests passed');
