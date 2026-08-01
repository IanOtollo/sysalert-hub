import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from './authService.js'

const storedUser = authService.getStoredUser()

const initialState = {
  user: storedUser,
  isLoading: false,
  isError: false,
  message: '',
}

export const login = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
  try {
    return await authService.login(credentials)
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Login failed'
    return thunkAPI.rejectWithValue(message)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      authService.logout()
      state.user = null
    },
    reset: (state) => {
      state.isLoading = false
      state.isError = false
      state.message = ''
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.isError = false
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
        state.user = null
      })
  },
})

export const { logout, reset } = authSlice.actions
export default authSlice.reducer
