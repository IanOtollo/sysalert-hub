import api from '../../utils/axios.js'

const STORAGE_KEY = 'kazilink_user'

async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}

function logout() {
  localStorage.removeItem(STORAGE_KEY)
}

function getStoredUser() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : null
}

async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data
}

export default { login, logout, getStoredUser, fetchMe }
