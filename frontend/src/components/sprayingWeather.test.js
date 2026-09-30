import test from 'node:test'
import assert from 'node:assert/strict'
import { assessSprayingWeather } from './sprayingWeather.js'
const fixture = () => ({ current: { time: '2026-09-30T22:00', wind_speed_10m: 7, wind_gusts_10m: 10, precipitation: 0, temperature_2m: 26, relative_humidity_2m: 60, is_day: 1 }, hourly: { time: ['2026-09-30T23:00', '2026-10-01T00:00', '2026-10-01T01:00'], precipitation: [0, 0, 0], precipitation_probability: [0, 0, 0] } })
test('uses future hours across midnight for weather screening', () => assert.equal(assessSprayingWeather(fixture()).status, 'Favorable weather'))
test('calm winds do not receive a favorable rating', () => { const data = fixture(); data.current.wind_speed_10m = .6; assert.equal(assessSprayingWeather(data).status, 'Calm · caution') })
test('rain, gusts and missing forecasts are handled', () => {
  const data = fixture(); data.hourly.precipitation[1] = 2; assert.equal(assessSprayingWeather(data).status, 'Rain expected')
  data.hourly.precipitation[1] = 0; data.current.wind_gusts_10m = 25; assert.equal(assessSprayingWeather(data).status, 'Too windy')
  data.hourly.precipitation_probability[0] = null; assert.equal(assessSprayingWeather(data).status, 'Data unavailable')
})
