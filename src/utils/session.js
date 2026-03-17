import { api, clearSessionStorage, getStoredUser, getToken, setStoredUser, setToken } from './api'
import { clearLocalGameCache } from './storage'

export const hasSession = () => Boolean(getToken())

export const fetchCurrentUser = async () => {
  const data = await api.get('/auth/me')
  setStoredUser(data.user)
  return data.user
}

export const registerUser = async ({ username, email, password }) => {
  const data = await api.post('/auth/register', { username, email, password })
  setToken(data.token)
  setStoredUser(data.user)
  clearLocalGameCache()
  return data.user
}

export const loginUser = async ({ email, password }) => {
  const data = await api.post('/auth/login', { email, password })
  setToken(data.token)
  setStoredUser(data.user)
  clearLocalGameCache()
  return data.user
}

export const logoutUser = () => {
  clearSessionStorage()
  clearLocalGameCache()
}

export const getCachedUser = () => getStoredUser()
