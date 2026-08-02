import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSelector } from 'react-redux'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Spinner from './components/Spinner.jsx'

import Login from './pages/Login.jsx'

// Lazy-loaded: each page (and its dependencies, e.g. recharts for
// Dashboard/Reports) only downloads when a user actually visits it,
// instead of one large upfront bundle.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Projects = lazy(() => import('./pages/Projects.jsx'))
const Incidents = lazy(() => import('./pages/Incidents.jsx'))
const IncidentDetail = lazy(() => import('./pages/IncidentDetail.jsx'))
const Tasks = lazy(() => import('./pages/Tasks.jsx'))
const MyTasks = lazy(() => import('./pages/MyTasks.jsx'))
const Notifications = lazy(() => import('./pages/Notifications.jsx'))
const Users = lazy(() => import('./pages/Users.jsx'))
const Logs = lazy(() => import('./pages/Logs.jsx'))
const Reports = lazy(() => import('./pages/Reports.jsx'))
const Account = lazy(() => import('./pages/Account.jsx'))

export default function App() {
  const { user } = useSelector((state) => state.auth)

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      <Suspense fallback={<Spinner size="lg" className="min-h-screen" />}>
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
      </Suspense>
    </>
  )
}
