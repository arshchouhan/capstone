import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
export default function useApiData(path, initial = []) {
  const [data, setData] = useState(initial), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const reload = useCallback(async () => { if (!path) return; setLoading(true); setError(''); try { const value = await api(path); setData(value); return value } catch(err) { setError(err.message) } finally { setLoading(false) } }, [path])
  useEffect(() => { if (!path) { setLoading(false); return } const controller = new AbortController(); setLoading(true); setError(''); api(path,{signal:controller.signal}).then(setData).catch(err=>{if(!controller.signal.aborted)setError(err.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)}); return ()=>controller.abort() },[path])
  return {data,setData,loading,error,reload,setError}
}
