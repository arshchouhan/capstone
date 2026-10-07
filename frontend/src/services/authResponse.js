export async function readAuthResponse(response) {
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || (response.status >= 500 ? 'The server is unavailable. Please try again.' : 'Could not complete your request. Please check your details.'))
  }
  return data
}
