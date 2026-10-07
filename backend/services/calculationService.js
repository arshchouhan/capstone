const areaInAcres = (area, unit) => area * ({ Acre: 1, Hectare: 2.4710538147, Gunta: 0.025 }[unit])
function farmingResult(mode, { cost, yieldKg, price, targetProfit = 0 }) {
  if (![cost, yieldKg, price, targetProfit].every(Number.isFinite) || cost < 0 || targetProfit < 0 || yieldKg <= 0 || price <= 0) throw new Error('Enter valid costs, yield, and selling price. Yield and price must be above zero.')
  const values = { budget: yieldKg * price - targetProfit, price: cost / yieldKg, yield: cost / price, profit: yieldKg * price - cost }
  return values[mode]
}
function sprayResult({ mode, dose, water, pump, area, unit, rateUnit }) {
  if (![dose, water, pump].every(Number.isFinite) || dose <= 0 || water <= 0 || pump <= 0) throw new Error('Dosage, water, and pump size must be above zero.')
  const acres = mode === 'field' ? areaInAcres(area, unit) : 0
  if (mode === 'field' && (!Number.isFinite(acres) || acres <= 0)) throw new Error('Enter an area above zero.')
  const treatedArea = rateUnit === 'Hectare' ? acres / 2.4710538147 : acres
  const totalWater = mode === 'field' ? water * treatedArea : water
  const totalProduct = mode === 'field' ? dose * treatedArea : dose * water
  return { totalProduct, totalWater, dosePerRefill: totalProduct / totalWater * Math.min(pump, totalWater), refills: Math.ceil(totalWater / pump), lastWater: totalWater % pump || pump, lastDose: totalProduct / totalWater * (totalWater % pump || pump) }
}
function nutrientResult({ n, p, k, count }) {
  if (![n, p, k, count].every(Number.isFinite) || Math.min(n, p, k) < 0 || count <= 0) throw new Error('Enter nonnegative nutrient quantities and a quantity above zero.')
  return { n: n * count, p: p * count, k: k * count }
}

exports.calculate = (mode,input) => {
  const num = key => Number(input[key]);
  const format=value=>value.toLocaleString('en-IN',{maximumFractionDigits:2});
  if(['budget','price','yield','profit'].includes(mode)){const value=farmingResult(mode,{cost:mode==='budget'?0:num('cost'),yieldKg:['price','profit','budget'].includes(mode)?num('yieldKg'):1,price:mode==='price'?1:num('price'),targetProfit:num('targetProfit')||0});return {kind:'money',value,unit:mode==='yield'?'kg':mode==='price'?'₹ / kg':'₹',summary:mode==='yield'?`${format(value)} kg`:`₹${format(value)}${mode==='price'?' / kg':''}`};}
  if(mode==='fertilizer'){if(input.basis==='Trees'&&!Number.isInteger(num('count')))throw new Error('Enter a whole number of trees.');const totals=nutrientResult({n:num('n'),p:num('p'),k:num('k'),count:num('count')}),unit=input.basis==='Trees'?'g':'kg';return {kind:'nutrient',...totals,unit,summary:`N ${format(totals.n)}, P ${format(totals.p)}, K ${format(totals.k)} ${unit}`};}
  if(!['trees','field'].includes(mode))throw new Error('Invalid calculator type.');
  const totals=sprayResult({mode,dose:num('dose'),water:num('water'),pump:num('pump'),area:num('area'),unit:input.unit,rateUnit:input.rateUnit}),unit=['ml','g','mL','kg','L'].includes(input.productUnit)?input.productUnit:'ml';
  if(Object.values(totals).some(value=>!Number.isFinite(value)))throw new Error('These quantities are too large.');
  return {kind:'spray',...totals,unit,summary:`${format(totals.totalProduct)} ${unit} · ${format(totals.totalWater)} L water`};
};
