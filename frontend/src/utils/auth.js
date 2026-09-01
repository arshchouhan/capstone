// Auth utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token)
  }
}

export const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

export const clearAuthToken = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}

export const setUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const isAuthenticated = () => {
  return getAuthToken() !== null
}
