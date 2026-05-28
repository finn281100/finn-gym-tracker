export const NUTRITION_FIELDS = ['calories', 'protein', 'carbs', 'fat'];

export function emptyNutritionValues() {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function calculateNutritionForAmount(nutritionPer100g, amountGrams) {
  const factor = clampNumber(amountGrams) / 100;
  return NUTRITION_FIELDS.reduce((values, field) => {
    values[field] = Math.round(clampNumber(nutritionPer100g?.[field]) * factor * 10) / 10;
    return values;
  }, emptyNutritionValues());
}

export function isValidGs1Barcode(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(digits.length)) return false;
  const checkDigit = Number(digits.at(-1));
  const body = digits.slice(0, -1);
  const sum = [...body].reverse().reduce((total, digit, index) => {
    return total + Number(digit) * (index % 2 === 0 ? 3 : 1);
  }, 0);
  return (10 - (sum % 10)) % 10 === checkDigit;
}

export function normalizeBarcodeInput(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) throw new Error('Bitte einen Barcode eingeben.');
  if (![8, 12, 13, 14].includes(digits.length)) {
    throw new Error('Bitte einen gueltigen EAN-/GTIN-Barcode mit 8, 12, 13 oder 14 Ziffern eingeben.');
  }
  if (!isValidGs1Barcode(digits)) {
    throw new Error('Die Barcode-Pruefziffer ist ungueltig. Bitte die Ziffern erneut pruefen.');
  }
  return digits;
}

export function openFoodFactsBarcodeCandidates(input) {
  const barcode = normalizeBarcodeInput(input);
  const candidates = [barcode];
  if (barcode.length === 12) candidates.push(`0${barcode}`);
  if (barcode.length === 14 && barcode.startsWith('0')) candidates.push(barcode.slice(1));
  return [...new Set(candidates)];
}

export function openFoodFactsProductUrls(input) {
  return openFoodFactsBarcodeCandidates(input).flatMap(barcode => [
    `https://de.openfoodfacts.org/api/v2/product/${barcode}.json`,
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
  ]);
}

export function normalizeOpenFoodFactsProduct(payload) {
  if (!payload || payload.status !== 1 || !payload.product) {
    return { found: false, reason: 'not_found' };
  }

  const product = payload.product;
  const nutriments = product.nutriments || {};
  const per100g = {
    calories: clampNumber(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal']),
    protein: clampNumber(nutriments.proteins_100g ?? nutriments.proteins),
    carbs: clampNumber(nutriments.carbohydrates_100g ?? nutriments.carbohydrates),
    fat: clampNumber(nutriments.fat_100g ?? nutriments.fat)
  };
  const missingNutrition = NUTRITION_FIELDS.filter(field => per100g[field] === 0);

  return {
    found: true,
    barcode: product.code || payload.code || '',
    name: product.product_name || product.generic_name || 'Unbenanntes Produkt',
    brand: product.brands || '',
    servingSize: product.serving_size || '',
    nutritionPer100g: per100g,
    source: 'open_food_facts',
    confidence: missingNutrition.length ? 0.7 : 0.95,
    missingNutrition
  };
}

export function normalizeOpenFoodFactsSearchResults(payload) {
  return (payload?.products || [])
    .map(product => normalizeOpenFoodFactsProduct({ status: 1, code: product.code, product }))
    .filter(product => product.found)
    .filter(product => product.name && product.name !== 'Unbenanntes Produkt');
}

export async function fetchOpenFoodFactsProduct(barcode, fetchImpl = fetch) {
  let lastProduct = { found: false, reason: 'not_found' };
  for (const url of openFoodFactsProductUrls(barcode)) {
    let response;
    try {
      response = await fetchImpl(url, { headers: { accept: 'application/json' } });
    } catch {
      throw new Error('Open Food Facts ist gerade nicht erreichbar.');
    }
    if (!response.ok) throw new Error('Open Food Facts ist gerade nicht erreichbar.');
    const product = normalizeOpenFoodFactsProduct(await response.json());
    if (product.found) return product;
    lastProduct = product;
  }
  return lastProduct;
}

export function createMealItem(input = {}) {
  const amountGrams = clampNumber(input.amountGrams ?? input.amount);
  const nutritionPer100g = input.nutritionPer100g || emptyNutritionValues();
  const nutrition = input.nutrition || calculateNutritionForAmount(nutritionPer100g, amountGrams);
  return {
    id: input.id || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: input.name || 'Lebensmittel',
    amount: amountGrams,
    unit: input.unit || 'g',
    calories: clampNumber(nutrition.calories),
    protein: clampNumber(nutrition.protein),
    carbs: clampNumber(nutrition.carbs),
    fat: clampNumber(nutrition.fat),
    nutritionPer100g,
    source: input.source || 'manual',
    confidence: clampNumber(input.confidence, input.source === 'open_food_facts' ? 0.95 : 0.5),
    corrected: Boolean(input.corrected),
    note: input.note || ''
  };
}

export function updateMealItem(item, correction = {}) {
  const next = { ...item, ...correction, corrected: true };
  if (correction.amount !== undefined || correction.amountGrams !== undefined || correction.nutritionPer100g) {
    const amount = clampNumber(correction.amountGrams ?? correction.amount ?? next.amount);
    const nutrition = calculateNutritionForAmount(correction.nutritionPer100g || next.nutritionPer100g, amount);
    return createMealItem({ ...next, amount, nutrition, corrected: true });
  }
  return createMealItem(next);
}

export function summarizeMealItems(items = []) {
  return items.reduce((summary, item) => {
    NUTRITION_FIELDS.forEach(field => {
      summary[field] = Math.round((summary[field] + clampNumber(item[field])) * 10) / 10;
    });
    return summary;
  }, emptyNutritionValues());
}

export function createMeal(input = {}) {
  const items = (input.items || []).map(createMealItem);
  return {
    id: input.id || `meal-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: input.name || 'Mahlzeit',
    source: input.source || 'manual',
    createdAt: input.createdAt || new Date().toISOString(),
    uncertaintyNote: input.uncertaintyNote || '',
    items,
    totals: summarizeMealItems(items)
  };
}

export function saveConfirmedMeal(profile, dateKey, mealInput) {
  if (!profile.days) profile.days = {};
  if (!profile.days[dateKey]) profile.days[dateKey] = { entry_date: dateKey, sets: [] };
  const day = profile.days[dateKey];
  if (!Array.isArray(day.meals)) day.meals = [];
  const meal = createMeal(mealInput);
  day.meals.push(meal);
  const summary = getDailyNutritionSummary(profile, dateKey);
  day.calories_intake = summary.calories;
  day.calories = summary.calories;
  day.protein_grams = summary.protein;
  day.carbs_grams = summary.carbs;
  day.fat_grams = summary.fat;
  return meal;
}

export function getDailyNutritionSummary(profile, dateKey) {
  const day = profile.days?.[dateKey] || {};
  const mealTotals = (day.meals || []).reduce((sum, meal) => {
    const totals = meal.totals || summarizeMealItems(meal.items || []);
    NUTRITION_FIELDS.forEach(field => {
      sum[field] += clampNumber(totals[field]);
    });
    return sum;
  }, emptyNutritionValues());
  return {
    calories: Math.round((mealTotals.calories || clampNumber(day.calories_intake ?? day.calories)) * 10) / 10,
    protein: Math.round((mealTotals.protein || clampNumber(day.protein_grams)) * 10) / 10,
    carbs: Math.round((mealTotals.carbs || clampNumber(day.carbs_grams)) * 10) / 10,
    fat: Math.round((mealTotals.fat || clampNumber(day.fat_grams)) * 10) / 10
  };
}
