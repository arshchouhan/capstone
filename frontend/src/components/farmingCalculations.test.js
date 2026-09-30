import test from 'node:test'
import assert from 'node:assert/strict'
import { farmingResult, sprayResult, nutrientResult } from './farmingCalculations.js'
test('farming calculators compute budgets, break-even price, yield and profit', () => {
  const inputs = { cost: 10000, yieldKg: 500, price: 30, targetProfit: 3000 }
  assert.equal(farmingResult('budget', inputs), 12000)
  assert.equal(farmingResult('price', inputs), 20)
  assert.equal(farmingResult('yield', inputs), 10000 / 30)
  assert.equal(farmingResult('profit', inputs), 5000)
  assert.throws(() => farmingResult('price', { ...inputs, yieldKg: 0 }))
})
test('tree spray scales dosage and handles partial last tanks', () => {
  const result = sprayResult({ mode: 'trees', dose: 2, water: 45, pump: 20 })
  assert.deepEqual(result, { totalProduct: 90, totalWater: 45, dosePerRefill: 40, refills: 3, lastWater: 5, lastDose: 10 })
  const small = sprayResult({ mode: 'trees', dose: 2, water: 5, pump: 20 })
  assert.equal(small.dosePerRefill, 10)
  assert.equal(small.refills, 1)
})
test('field areas and label rate units convert consistently', () => {
  const result = sprayResult({ mode: 'field', dose: 100, water: 200, pump: 20, area: 40, unit: 'Gunta', rateUnit: 'Acre' })
  assert.equal(result.totalProduct, 100)
  assert.equal(result.totalWater, 200)
  const metric = sprayResult({ mode: 'field', dose: 100, water: 200, pump: 20, area: 1, unit: 'Hectare', rateUnit: 'Hectare' })
  assert.equal(metric.totalProduct, 100)
  assert.equal(metric.refills, 10)
  assert.throws(() => sprayResult({ mode: 'field', dose: 1, water: 1, pump: 20, area: 0, unit: 'Acre', rateUnit: 'Acre' }))
})
test('nutrient totals scale input rates without supplying a dosage', () => {
  assert.deepEqual(nutrientResult({ n: 400, p: 200, k: 400, count: 10 }), { n: 4000, p: 2000, k: 4000 })
  assert.throws(() => nutrientResult({ n: -1, p: 0, k: 0, count: 10 }))
})
