import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/auth/authSlice.js'
import notificationsReducer from './features/notifications/notificationsSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
  },
})
