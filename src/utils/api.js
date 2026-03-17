const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'solo_leveling_auth_token_v1'
const USER_KEY = 'solo_leveling_auth_user_v1'

export const getToken = () => {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(TOKEN_KEY) || ''
}

export const setToken = (token) => {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const setStoredUser = (user) => {
  if (typeof window === 'undefined') return
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  else window.localStorage.removeItem(USER_KEY)
}

export const clearSessionStorage = () => {
  setToken('')
  setStoredUser(null)
}

export const apiRequest = async (path, options = {}) => {
  const headers = new Headers(options.headers || {})
  const token = getToken()

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof data === 'object' && data?.message ? data.message : 'Request failed'
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) => apiRequest(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
}

export { API_BASE_URL, TOKEN_KEY, USER_KEY }
