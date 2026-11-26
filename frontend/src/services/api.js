export const apiBase = import.meta.env.VITE_API_URL || '/api'
export async function api(path, options = {}) {
  const token = localStorage.getItem('authToken')
  const response = await fetch(`${apiBase}${path}`, { credentials: 'include', ...options, headers: { ...(options.body ? { 'Content-Type':'application/json' } : {}), ...(token ? { Authorization:`Bearer ${token}` } : {}), ...options.headers }, body: options.body ? JSON.stringify(options.body) : undefined })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Could not connect. Please retry.')
  return payload.data
}
export const isServerPlant = id => /^[a-f\d]{24}$/i.test(String(id))
export const mediaUrl = url => url?.startsWith('/api/') && apiBase !== '/api' ? `${apiBase.replace(/\/api\/?$/, '')}${url}` : url
export const uploadPhoto = async image => (await api('/media', {method:'POST',body:{image}})).url
export const fileData = file => new Promise((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file) })
export async function runScan({plantId,kind,images,notes,onAnalysisStart}) {
  const photos = await Promise.all(images.map(image => image.startsWith('data:') ? uploadPhoto(image) : Promise.resolve(image)))
  onAnalysisStart?.()
  return api(plantId ? `/plants/${plantId}/scans` : '/scans', {method:'POST',body:{kind,photos,notes}})
}
export const formatScanConfidence = value => {
  if (!Number.isFinite(value)) return null
  if (value >= 99.95) return '≥99.95%'
  return `${Number(value.toFixed(1))}%`
}

export function scanDetails(scan) {
  const result = scan.result || {}
  const legacyReference = ['PlantDoc dataset reference', 'PlantDoc verified reference'].includes(result.scientific)
  const outdatedScores = legacyReference
    || /The team EfficientNetB4 model classified .* with .*% confidence\./.test(result.summary || '')
    || (result.confidence === 0 && ['Needs review', 'Needs better photo'].includes(result.status))
  return {
    ...result,
    ...(legacyReference ? { scientific: undefined, summary: result.findings?.[0]?.label } : {}),
    score: outdatedScores ? undefined : result.score,
    confidence: outdatedScores ? undefined : result.confidence,
    analysisPhoto: mediaUrl(scan.photos?.[result.photoIndex ?? 0]),
    source: scan.source,
    scanResults: { 'Disease Identifier': { findings: result.findings || [], notes: result.notes } },
    scanId: scan.id,
    registeredPlantId: scan.plant,
  }
}

export const scanHistory = scan => ({
  ...scanDetails(scan),
  id: scan.id,
  checkedAt: scan.completedAt || scan.createdAt,
  kind: scan.kind,
  sample: scan.sample,
  findings: scan.result?.findings,
  photo: mediaUrl(scan.photos?.[0]),
  tasksComplete: scan.tasksComplete || 0,
  totalTasks: scan.totalTasks ?? 0,
})
export const scanChat = scanId => api(`/scans/${scanId}/chat`)
export const askScanChat = (scanId, message, attachment) => api(`/scans/${scanId}/chat`, {method:'POST', body:{message, ...(attachment ? {attachment} : {})}})
