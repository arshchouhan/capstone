
import { Box, Tabs, Tab, Typography } from '@mui/material'
const displayDate = (value, withTime = false) => {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';
  const date = new Date(timestamp);
  return withTime ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

export function PlantDetailTabs({ plant, tab = 0, onTabChange }) {

  const lastScan = displayDate(plant.lastScannedAt, true)
  const nextCareDate = displayDate(plant.nextCare?.due)
  const nextCare = plant.nextCare?.type && nextCareDate ? `${plant.nextCare.type} · ${nextCareDate}` : 'Not scheduled'

  return <Box className="plant-detail-tabs"><Tabs value={tab} onChange={(_, value) => { onTabChange?.(value) }} variant="fullWidth" aria-label="Plant details"><Tab id="plant-tab-info" aria-controls="plant-panel-info" label="Plant info" /><Tab id="plant-tab-analysis" aria-controls="plant-panel-analysis" label="Latest scan" /><Tab id="plant-tab-calculators" aria-controls="plant-panel-calculators" label="Care" /><Tab id="plant-tab-care" aria-controls="plant-panel-care" label="Diagnosis" /></Tabs><Box className="plant-tab-panel" role="tabpanel" id={`plant-panel-${['info', 'analysis', 'calculators', 'care'][tab]}`} aria-labelledby={`plant-tab-${['info', 'analysis', 'calculators', 'care'][tab]}`}><Box component="dl" className="plant-tab-identity"><Box><Typography component="dt">Plant</Typography><Typography component="dd">{plant.name}</Typography></Box><Box><Typography component="dt">Scientific name</Typography><Typography component="dd" className="plant-identity-scientific">{plant.scientific}</Typography></Box><Box><Typography component="dt">Next care</Typography><Typography component="dd">{nextCare}</Typography></Box><Box><Typography component="dt">Growing location</Typography><Typography component="dd">{plant.location || 'Not added'}</Typography></Box><Box><Typography component="dt">Last scan</Typography><Typography component="dd">{lastScan || 'No scan date recorded'}</Typography></Box></Box></Box></Box>
}






