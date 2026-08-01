import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSelector } from 'react-redux'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Projects from './pages/Projects.jsx'
import Incidents from './pages/Incidents.jsx'
import IncidentDetail from './pages/IncidentDetail.jsx'
import Tasks from './pages/Tasks.jsx'
import MyTasks from './pages/MyTasks.jsx'
import Notifications from './pages/Notifications.jsx'
import Users from './pages/Users.jsx'
import Logs from './pages/Logs.jsx'
import Reports from './pages/Reports.jsx'
import Account from './pages/Account.jsx'

export default function App() {
  const { user } = useSelector((state) => state.auth)

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/account" element={<Account />} />

            <Route element={<ProtectedRoute allowedRoles={['admin', 'teamlead', 'client']} />}>
              <Route path="/projects" element={<Projects />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'teamlead', 'developer']} />}>
              <Route path="/incidents" element={<Incidents />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'teamlead']} />}>
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/reports" element={<Reports />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['developer']} />}>
              <Route path="/my-tasks" element={<MyTasks />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/users" element={<Users />} />
              <Route path="/logs" element={<Logs />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </>
  )
}
