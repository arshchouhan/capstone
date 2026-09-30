export const areaInAcres = (area, unit) => area * ({ Acre: 1, Hectare: 2.4710538147, Gunta: 0.025 }[unit])
export function farmingResult(mode, { cost, yieldKg, price, targetProfit = 0 }) {
  if (![cost, yieldKg, price, targetProfit].every(Number.isFinite) || cost < 0 || targetProfit < 0 || yieldKg <= 0 || price <= 0) throw new Error('Enter valid costs, yield, and selling price. Yield and price must be above zero.')
  const values = { budget: yieldKg * price - targetProfit, price: cost / yieldKg, yield: cost / price, profit: yieldKg * price - cost }
  return values[mode]
}
export function sprayResult({ mode, dose, water, pump, area, unit, rateUnit }) {
  if (![dose, water, pump].every(Number.isFinite) || dose <= 0 || water <= 0 || pump <= 0) throw new Error('Dosage, water, and pump size must be above zero.')
  const acres = mode === 'field' ? areaInAcres(area, unit) : 0
  if (mode === 'field' && (!Number.isFinite(acres) || acres <= 0)) throw new Error('Enter an area above zero.')
  const treatedArea = rateUnit === 'Hectare' ? acres / 2.4710538147 : acres
  const totalWater = mode === 'field' ? water * treatedArea : water
  const totalProduct = mode === 'field' ? dose * treatedArea : dose * water
  return { totalProduct, totalWater, dosePerRefill: totalProduct / totalWater * Math.min(pump, totalWater), refills: Math.ceil(totalWater / pump), lastWater: totalWater % pump || pump, lastDose: totalProduct / totalWater * (totalWater % pump || pump) }
}
export function nutrientResult({ n, p, k, count }) {
  if (![n, p, k, count].every(Number.isFinite) || Math.min(n, p, k) < 0 || count <= 0) throw new Error('Enter nonnegative nutrient quantities and a quantity above zero.')
  return { n: n * count, p: p * count, k: k * count }
}
