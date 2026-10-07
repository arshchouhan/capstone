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
export async function runScan({plantId,kind,images,notes}) {
  const photos = await Promise.all(images.map(image => image.startsWith('data:') ? uploadPhoto(image) : Promise.resolve(image)))
  return api(plantId ? `/plants/${plantId}/scans` : '/scans', {method:'POST',body:{kind,photos,notes}})
}
export const scanHistory = scan => ({ id:scan.id, checkedAt:scan.completedAt || scan.createdAt, name:scan.result?.name, scientific:scan.result?.scientific, kind:scan.kind, summary:scan.result?.summary, score:scan.result?.score, status:scan.result?.status, findings:scan.result?.findings, photo:mediaUrl(scan.photos?.[0]), source:scan.source, tasksComplete:scan.tasksComplete || 0, totalTasks:scan.totalTasks ?? 0 })
