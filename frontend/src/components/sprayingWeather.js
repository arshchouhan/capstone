// Weather screening only. Product labels and on-site wind/inversion checks
// take precedence. Wind bounds follow general UMN Extension drift guidance.
export function assessSprayingWeather(data) {
  const current = data?.current
  if (!current || !['wind_speed_10m', 'wind_gusts_10m', 'precipitation', 'temperature_2m', 'relative_humidity_2m'].every(key => Number.isFinite(current[key]))) return { status: 'Data unavailable', reason: 'Weather data is incomplete.' }
  const hourly = data.hourly
  const indexes = hourly?.time?.map((time, index) => time > current.time ? index : -1).filter(index => index >= 0).slice(0, 3) || []
  if (indexes.length < 3 || indexes.some(index => !Number.isFinite(hourly.precipitation_probability?.[index]) || !Number.isFinite(hourly.precipitation?.[index]))) return { status: 'Data unavailable', reason: 'Upcoming rainfall forecast is incomplete.' }
  const rainChance = Math.max(...indexes.map(index => hourly.precipitation_probability[index]))
  const rain = indexes.reduce((sum, index) => sum + hourly.precipitation[index], 0)
  if (current.precipitation > 0 || rain > 0) return { status: 'Rain expected', reason: `Rain now or within 3 hours (${rainChance}% maximum chance).`, rainChance }
  if (current.wind_speed_10m > 16.1 || current.wind_gusts_10m > 16.1) return { status: 'Too windy', reason: 'Wind or gusts exceed the general drift screening limit.', rainChance }
  if (current.wind_speed_10m < 4.8) return { status: 'Calm · caution', reason: 'Light wind can indicate inversion risk; check conditions on site.', rainChance }
  if (!current.is_day) return { status: 'Night · caution', reason: 'Verify inversion conditions before applying any product.', rainChance }
  if (rainChance >= 30) return { status: 'Rain risk', reason: `${rainChance}% maximum rain chance over the next 3 hours.`, rainChance }
  // Conservative application-level screening thresholds, not product limits.
  if (current.temperature_2m >= 30 || current.relative_humidity_2m < 40 || current.wind_speed_10m > 11.3) return { status: 'Use caution', reason: 'Heat, dry air, or wind may affect application conditions.', rainChance }
  return { status: 'Favorable weather', reason: 'Weather screen passed for the next 3 hours. Check the product label and on-site conditions.', rainChance }
}
