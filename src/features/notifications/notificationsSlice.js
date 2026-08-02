import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/axios.js'

export const fetchNotifications = createAsyncThunk('notifications/fetch', async () => {
  const { data } = await api.get('/notifications')
  return data
})

export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id) => {
  await api.put(`/notifications/${id}/read`)
  return id
})

export const markAllAsRead = createAsyncThunk('notifications/markAllAsRead', async () => {
  await api.put('/notifications/read-all')
})

export const deleteNotification = createAsyncThunk('notifications/delete', async (id) => {
  await api.delete(`/notifications/${id}`)
  return id
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    loaded: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload
        state.loaded = true
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.items.find((n) => n._id === action.payload)
        if (notification) notification.isRead = true
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.isRead = true
        })
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.items = state.items.filter((n) => n._id !== action.payload)
      })
  },
})

export const selectUnreadCount = (state) => state.notifications.items.filter((n) => !n.isRead).length

export default notificationsSlice.reducer
