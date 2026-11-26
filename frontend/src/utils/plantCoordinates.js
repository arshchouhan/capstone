export function parsePlantCoordinates(value) {
  const latitude = String(value?.latitude ?? '').trim()
  const longitude = String(value?.longitude ?? '').trim()
  if (!latitude && !longitude) return null
  const lat = Number(latitude)
  const lon = Number(longitude)
  if (!latitude || !longitude || !Number.isFinite(lat) || Math.abs(lat) > 90 ||
      !Number.isFinite(lon) || Math.abs(lon) > 180) return undefined
  return { latitude: lat, longitude: lon, ...(value.accuracy != null ? { accuracy: value.accuracy } : {}) }
}
