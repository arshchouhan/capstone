import { useState } from 'react'
import { Box, Button, Card, CardActionArea, IconButton, InputBase, Select, MenuItem, Radio, RadioGroup, FormControlLabel, InputAdornment, Typography, ThemeProvider, createTheme, Accordion, AccordionSummary, AccordionDetails, Alert } from '@mui/material'
import { FaArrowLeft, FaRupeeSign, FaStore, FaSeedling, FaChartLine, FaFlask, FaTint } from 'react-icons/fa'
import { farmingResult, nutrientResult, sprayResult } from './farmingCalculations'
import './FarmingTools.css'
import ManagePlant from './ManagePlant'

const options = [
  ['budget', 'Maximum input budget', 'How much you can spend on inputs', FaRupeeSign],
  ['price', 'No loss price', 'The lowest selling price to cover expenses', FaStore],
  ['yield', 'Required yield', 'How much to harvest to cover expenses', FaSeedling],
  ['profit', 'Estimated profit', 'Revenue after covering expenses', FaChartLine],
  ['fertilizer', 'Fertilizer calculator', 'Total N, P and K quantities for your crop', FaFlask],
  ['trees', 'Trees · spray calculator', 'Product quantity and pump refills', FaTint],
  ['field', 'Field crops · spray calculator', 'Mixing quantities for your field area', FaSeedling],
  ['manage', 'Manage your plant', 'Growth stages, health recovery and your next care step', FaSeedling],
]
const format = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)
const toolTheme = createTheme({ palette: { primary: { main: '#008b73' }, text: { primary: '#181c1b', secondary: '#575e5c' } }, typography: { fontFamily: 'Segoe UI, Arial, sans-serif' }, shape: { borderRadius: 18 } })
function NumberField({ label, value, onChange, min = 0, step = 'any', suffix = '' }) {
  return <Box className="calculator-row"><Typography component="label">{label}</Typography><InputBase className="calculator-value" type="number" value={value} onChange={event => onChange(event.target.value)} required inputProps={{ min, step, 'aria-label': label }} endAdornment={suffix ? <InputAdornment position="end">{suffix}</InputAdornment> : undefined} /></Box>
}
function Stepper({ label, value, onChange, unit, min = 1, step = 1 }) {
  return <Box className="calculator-stepper"><Typography variant="h6">{label}</Typography><Box className="stepper-controls"><IconButton aria-label={`Decrease ${label}`} disabled={Number(value) <= min} onClick={() => onChange(String(Math.max(min, Number(value) - step)))}>−</IconButton><Box className="stepper-display"><InputBase type="number" required placeholder="0" value={value} onChange={event => onChange(event.target.value)} inputProps={{ min, step: unit === 'Trees' ? 1 : 'any', 'aria-label': label }} /><Typography>{unit}</Typography></Box><IconButton aria-label={`Increase ${label}`} onClick={() => onChange(String(Number(value) + step))}>+</IconButton></Box></Box>
}
export default function FarmingTools({ plantId, plant }) {
  const storageKey = `plantaexa-calculators-${plantId}`
  const [saved, setSaved] = useState(() => { try { const value = JSON.parse(localStorage.getItem(storageKey)); return { recent: Array.isArray(value?.recent) ? value.recent : [], formulations: Array.isArray(value?.formulations) ? value.formulations : [], rating: value?.rating || '' } } catch { return { recent: [], formulations: [], rating: '' } } })
  const [active, setActive] = useState('')
  const [cost, setCost] = useState('')
  const [yieldKg, setYield] = useState('')
  const [price, setPrice] = useState('')
  const [targetProfit, setTarget] = useState('0')
  const [crop, setCrop] = useState(plant.name)
  const [basis, setBasis] = useState('Trees')
  const [n, setN] = useState('')
  const [p, setP] = useState('')
  const [k, setK] = useState('')
  const [count, setCount] = useState('1')
  const [area, setArea] = useState('1')
  const [unit, setUnit] = useState('Acre')
  const [rateUnit, setRateUnit] = useState('Acre')
  const [dose, setDose] = useState('')
  const [productUnit, setProductUnit] = useState('ml')
  const [water, setWater] = useState('')
  const [pump, setPump] = useState('20')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const persist = next => { setSaved(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); setNotice('Saved on this device.') } catch { setNotice('Could not save on this device. Your result is still available below.') } }
  const open = mode => { setActive(mode); setResult(null); setError(''); setQuery('') }
  const selected = options.find(item => item[0] === active)
  const calculate = event => {
    event.preventDefault()
    try {
      let output
      if (['budget', 'price', 'yield', 'profit'].includes(active)) {
        // Only the inputs needed for this calculation are required.
        const value = farmingResult(active, { cost: active === 'budget' ? 0 : Number(cost), yieldKg: ['price', 'profit', 'budget'].includes(active) ? Number(yieldKg) : 1, price: active === 'price' ? 1 : Number(price), targetProfit: Number(targetProfit) })
        output = { kind: 'money', value, unit: active === 'yield' ? 'kg' : active === 'price' ? '₹ / kg' : '₹', summary: active === 'yield' ? `${format(value)} kg` : `₹${format(value)}${active === 'price' ? ' / kg' : ''}` }
      } else if (active === 'fertilizer') {
        if (basis === 'Trees' && !Number.isInteger(Number(count))) throw new Error('Enter a whole number of trees.')
        const totals = nutrientResult({ n: Number(n), p: Number(p), k: Number(k), count: Number(count) })
        output = { kind: 'nutrient', ...totals, unit: basis === 'Trees' ? 'g' : 'kg', summary: `${crop}: N ${format(totals.n)}, P ${format(totals.p)}, K ${format(totals.k)} ${basis === 'Trees' ? 'g' : 'kg'}` }
      } else {
        output = { kind: 'spray', ...sprayResult({ mode: active === 'field' ? 'field' : 'trees', dose: Number(dose), water: Number(water), pump: Number(pump), area: Number(area), unit, rateUnit }), unit: productUnit }
        output.summary = `${format(output.totalProduct)} ${productUnit} · ${format(output.totalWater)} L water`
      }
      if (Object.values(output).some(value => typeof value === 'number' && !Number.isFinite(value))) throw new Error('These inputs are too large. Use smaller values.')
      setResult(output); setError('')
      persist({ ...saved, recent: [{ id: crypto.randomUUID(), mode: active, title: selected[1], result: output, inputs: { cost, yieldKg, price, targetProfit, crop, basis, n, p, k, count, area, unit, rateUnit, dose, productUnit, water, pump }, date: new Date().toISOString() }, ...saved.recent].slice(0, 8) })
    } catch (err) { setError(err.message); setResult(null) }
  }
  const matching = saved.formulations.filter(entry => entry.mode === active && `${entry.name} ${entry.crop} ${entry.disease}`.toLowerCase().includes(query.toLowerCase()))
  const spray = active === 'trees' || active === 'field'
  const money = ['budget', 'price', 'yield', 'profit'].includes(active)
  const change = setter => event => { setter(event.target.value); setResult(null) }
  const displayTitle = active === 'field' ? 'Field crops' : active === 'trees' ? 'Trees' : selected?.[1] || 'Farming calculator'
  const renderResults = () => <Box className="calculator-results" aria-live="polite"><Typography variant="h6">{spray ? 'Per application' : 'Your calculation'}</Typography><Card elevation={0} className="calculator-total"><Typography>{spray ? 'Total product' : selected?.[1]}</Typography><Typography className="total-number">{result ? spray ? format(result.totalProduct) : result.kind === 'money' ? result.summary : 'Nutrient totals' : '–––'}{spray && <small> {productUnit}</small>}</Typography></Card>{spray && <Box className="calculator-metrics"><Card elevation={0}><span className="metric-symbol"><FaTint /></span><Typography>Dose per refill</Typography><strong>{result ? format(result.dosePerRefill) : '–––'} {productUnit}</strong></Card><Card elevation={0}><span className="metric-symbol">↻</span><Typography>Pump fills</Typography><strong>{result ? result.refills : '–––'} times</strong></Card></Box>}{result?.kind === 'nutrient' && <Box className="calculator-metrics">{['n', 'p', 'k'].map(item => <Card key={item} elevation={0}><Typography>Total {item.toUpperCase()}</Typography><strong>{format(result[item])} {result.unit}</strong></Card>)}</Box>}{spray && result && <Typography className="calculator-note">Total water: {format(result.totalWater)} L · Last tank: {format(result.lastWater)} L with {format(result.lastDose)} {productUnit}. Pump fills include the first tank.</Typography>}{result?.value < 0 && <Alert severity="info">{active === 'budget' ? 'Your desired profit exceeds the expected revenue.' : 'Estimated expenses exceed revenue.'}</Alert>}</Box>
  return <ThemeProvider theme={toolTheme}><Box component="section" className="farming-tools" aria-labelledby="farming-tools-title">
    {active && <IconButton className="calculator-back" aria-label="Back to all calculators" onClick={() => open('')}><FaArrowLeft /></IconButton>}
    <Typography variant="h4" component="h2" id="farming-tools-title" className="calculator-title">{displayTitle}</Typography>
    {!active ? <><Typography variant="h6" className="calculator-question">What do you want to calculate?</Typography><Box className="tools-grid">{options.map(([mode, title, description, Icon]) => <Card key={mode} variant="outlined" className="tool-tile"><CardActionArea onClick={() => open(mode)}><span className="tool-icon"><Icon /></span><Typography component="h3">{title}</Typography><Typography>{description}</Typography></CardActionArea></Card>)}</Box></> : active === 'manage' ? <ManagePlant key={plantId} plantId={plantId} plant={plant} /> : <Box component="form" onSubmit={calculate} onChange={() => { setResult(null); setError('') }} className="calculator-form">
      {spray && renderResults()}
      {money && <><Typography className="calculator-question">{selected[2]}</Typography>{active !== 'budget' && <NumberField label="Total expenses" value={cost} onChange={setCost} suffix="₹" />}{active !== 'yield' && <Stepper label="Expected sellable yield" value={yieldKg} onChange={value => { setYield(value); setResult(null) }} unit="kg" min={0.01} step={10} />}{active !== 'price' && <NumberField label="Selling price" value={price} onChange={setPrice} min={0.01} suffix="₹ / kg" />}{active === 'budget' && <NumberField label="Desired profit" value={targetProfit} onChange={setTarget} suffix="₹" />}</>}
      {active === 'fertilizer' && <><Box className="nutrient-heading"><Typography variant="h6">Nutrient quantities</Typography><Select className="crop-pill" value={crop} onChange={change(setCrop)} inputProps={{ 'aria-label': 'Crop' }}>{[...new Set([plant.name, crop, 'Apple', 'Basil', 'Tomato', 'Chili'])].map(name => <MenuItem key={name} value={name}>🌱 {name}</MenuItem>)}</Select></Box><Box className="nutrient-tiles">{[['N', n, setN], ['P', p, setP], ['K', k, setK]].map(([label, value, setter]) => <Box key={label}><Typography>{label}</Typography><InputBase type="number" required placeholder="0" value={value} onChange={change(setter)} inputProps={{ min: 0, step: 'any', 'aria-label': `${label} nutrient rate` }} /></Box>)}</Box><Typography className="calculator-note">Rates in {basis === 'Trees' ? 'grams per tree' : 'kilograms per hectare'}. Enter quantities from your nutrient plan.</Typography><RadioGroup row value={basis} onChange={event => { setBasis(event.target.value); setN(''); setP(''); setK(''); setResult(null) }}>{['Trees', 'Hectares'].map(item => <FormControlLabel value={item} key={item} control={<Radio />} label={item} />)}</RadioGroup><Stepper label={basis === 'Trees' ? 'Number of trees' : 'Area to fertilize'} value={count} onChange={value => { setCount(value); setResult(null) }} unit={basis} min={basis === 'Trees' ? 1 : 0.01} /></>}
      {spray && <>
        <Stepper label={active === 'field' ? 'Area to treat' : 'Amount of water'} value={active === 'field' ? area : water} onChange={value => { (active === 'field' ? setArea : setWater)(value); setResult(null) }} unit={active === 'field' ? unit : 'Litre'} min={0.01} step={active === 'field' ? 0.1 : 1} />
        {active === 'field' && <Box className="area-unit"><Typography>Area unit</Typography><RadioGroup row value={unit} onChange={change(setUnit)}>{['Acre', 'Hectare', 'Gunta'].map(item => <FormControlLabel key={item} value={item} control={<Radio />} label={item} />)}</RadioGroup></Box>}
        <Box className="formulation-search"><Typography variant="h6">Don’t know dosage?</Typography><Typography>Search your saved formulations by crop and disease.</Typography><InputBase fullWidth value={query} onChange={change(setQuery)} placeholder="Search formulation" startAdornment={<InputAdornment position="start">⌕</InputAdornment>} inputProps={{ 'aria-label': 'Search saved formulations' }} />{matching.map(entry => <Button key={entry.id} fullWidth onClick={() => { setDose(entry.dose); setProductUnit(entry.unit); setRateUnit(entry.rateUnit); setResult(null) }}>{entry.name} · {entry.crop} · {entry.dose} {entry.unit}/{active === 'trees' ? 'L' : entry.rateUnit}</Button>)}{!matching.length && <Typography className="calculator-note">Enter the label dosage below, or save a formulation for later.</Typography>}</Box>
        <Box className="calculator-row"><Box><Typography component="h3">Product dosage</Typography><Typography className="row-description">Product needed per {active === 'trees' ? '1 litre' : rateUnit.toLowerCase()}</Typography></Box><Box className="dosage-control"><InputBase type="number" required value={dose} placeholder="0" onChange={change(setDose)} inputProps={{ min: 0.001, step: 'any', 'aria-label': 'Product dosage' }} /><Select variant="standard" disableUnderline value={productUnit} onChange={change(setProductUnit)} inputProps={{ 'aria-label': 'Product dosage unit' }}>{['ml', 'g'].map(item => <MenuItem key={item} value={item}>{item}/{active === 'trees' ? 'L' : rateUnit === 'Acre' ? 'ac' : 'ha'}</MenuItem>)}</Select></Box></Box>
        {active === 'field' && <><Box className="calculator-row"><Typography>Label rate basis</Typography><Select value={rateUnit} onChange={change(setRateUnit)} inputProps={{ 'aria-label': 'Label rate basis' }}><MenuItem value="Acre">Per acre</MenuItem><MenuItem value="Hectare">Per hectare</MenuItem></Select></Box><NumberField label="Water amount" value={water} onChange={setWater} min={0.001} suffix={`L / ${rateUnit === 'Acre' ? 'ac' : 'ha'}`} /></>}
        <Box className="calculator-row"><Box><Typography component="h3">Pump size</Typography><Typography className="row-description">Volume of the pump</Typography></Box><Select value={pump} onChange={change(setPump)} inputProps={{ 'aria-label': 'Pump size' }}>{[...new Set(['5', '10', '15', '16', '20', '25', pump])].filter(Boolean).map(value => <MenuItem key={value} value={value}>{value} L</MenuItem>)}</Select></Box>
        <Accordion elevation={0} className="save-formulation"><AccordionSummary expandIcon={<span>⌄</span>}>Save this label rate for later</AccordionSummary><AccordionDetails>{[['formulationName', 'Formulation name', ''], ['formulationCrop', 'Crop', plant.name], ['formulationDisease', 'Disease or purpose', '']].map(([name, label, value]) => <InputBase key={name} name={name} defaultValue={value} placeholder={label} fullWidth inputProps={{ 'aria-label': label }} />)}<Button onClick={event => { const fields = new FormData(event.currentTarget.closest('form')); if (!fields.get('formulationName')?.trim() || Number(dose) <= 0) { setError('Enter a formulation name and positive dosage.'); return } persist({ ...saved, formulations: [...saved.formulations, { id: crypto.randomUUID(), mode: active, name: fields.get('formulationName').trim(), crop: fields.get('formulationCrop'), disease: fields.get('formulationDisease'), dose, unit: productUnit, rateUnit }] }); setError('') }}>Save formulation</Button></AccordionDetails></Accordion>
      </>}
      <Button className="tool-calculate" type="submit" variant="contained" disableElevation>Calculate</Button>{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {!spray && result && renderResults()}
      {!result && !spray && <Box className="calculator-empty-art"><FaSeedling /><Typography>Your calculation will appear here</Typography></Box>}
      <Typography className="calculator-note">{spray ? 'Use rates from the product label for your crop and application.' : active === 'fertilizer' ? 'Results are nutrient totals, not commercial fertilizer product weights.' : 'Results use your entered expenses, yield and selling price.'}</Typography>
    </Box>}
    {notice && <Typography className="tool-notice" role="status">{notice}</Typography>}
  </Box></ThemeProvider>
}