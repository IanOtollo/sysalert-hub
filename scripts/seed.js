// Populates MongoDB Atlas with demo users, projects, incidents, tasks,
// notifications, and activity logs for local development and demos.
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import User from '../models/User.js'
import Project from '../models/Project.js'
import Incident from '../models/Incident.js'
import Task from '../models/Task.js'
import Notification from '../models/Notification.js'
import ActivityLog from '../models/ActivityLog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

async function hash(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB Atlas')

  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Incident.deleteMany({}),
    Task.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
  ])
  console.log('Cleared existing collections')

  const [admin, teamlead, dev1, dev2, client] = await User.create([
    { fullName: 'Marydiana Wangila', email: 'admin@kazilink.com', password: await hash('Admin@123'), role: 'admin', phone: '0700000001' },
    { fullName: 'Brian Otieno', email: 'teamlead@kazilink.com', password: await hash('Lead@123'), role: 'teamlead', phone: '0700000002' },
    { fullName: 'Faith Nyambura', email: 'dev1@kazilink.com', password: await hash('Dev@123'), role: 'developer', phone: '0700000003' },
    { fullName: 'Kevin Mwangi', email: 'dev2@kazilink.com', password: await hash('Dev@123'), role: 'developer', phone: '0700000004' },
    { fullName: 'Grace Wanjiru', email: 'client@kazilink.com', password: await hash('Client@123'), role: 'client', phone: '0700000005' },
  ])
  console.log('Seeded users')

  const [projectAlpha, projectBeta] = await Project.create([
    {
      title: 'Zoho CRM Migration',
      description: 'Migrate the client legacy CRM data into Zoho CRM with custom workflows.',
      client: client._id,
      teamLead: teamlead._id,
      developers: [dev1._id, dev2._id],
      status: 'active',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-09-30'),
      createdBy: admin._id,
    },
    {
      title: 'Mobile App Support Desk',
      description: 'Ongoing support and maintenance for the client mobile application.',
      client: client._id,
      teamLead: teamlead._id,
      developers: [dev1._id],
      status: 'active',
      startDate: new Date('2026-03-01'),
      createdBy: admin._id,
    },
  ])
  console.log('Seeded projects')

  const incidents = await Incident.create([
    {
      title: 'Login page throwing 500 error',
      description: 'Users report intermittent 500 errors when logging into the CRM migration staging environment.',
      project: projectAlpha._id,
      category: 'bug',
      priority: 'high',
      status: 'in-progress',
      reportedBy: client._id,
      assignedTo: dev1._id,
      comments: [{ user: teamlead._id, email: teamlead.email, comment: 'Investigating server logs now.' }],
    },
    {
      title: 'Production API outage',
      description: 'The mobile app support API went down for 15 minutes this morning.',
      project: projectBeta._id,
      category: 'outage',
      priority: 'critical',
      status: 'resolved',
      reportedBy: teamlead._id,
      assignedTo: dev1._id,
      resolvedAt: new Date(),
    },
    {
      title: 'Suspicious login attempts detected',
      description: 'Multiple failed login attempts detected from an unrecognized IP range.',
      project: projectAlpha._id,
      category: 'security',
      priority: 'critical',
      status: 'open',
      reportedBy: admin._id,
      assignedTo: dev2._id,
    },
    {
      title: 'Scheduled maintenance window',
      description: 'Database maintenance and index optimization scheduled for this weekend.',
      project: projectBeta._id,
      category: 'maintenance',
      priority: 'low',
      status: 'closed',
      reportedBy: teamlead._id,
    },
  ])
  console.log('Seeded incidents')

  const tasks = await Task.create([
    {
      title: 'Fix null pointer on login handler',
      description: 'Trace and patch the 500 error on the CRM migration login page.',
      incident: incidents[0]._id,
      project: projectAlpha._id,
      assignedTo: dev1._id,
      assignedBy: teamlead._id,
      priority: 'high',
      status: 'in-progress',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Write postmortem for API outage',
      description: 'Document root cause and remediation steps for the outage.',
      incident: incidents[1]._id,
      project: projectBeta._id,
      assignedTo: dev1._id,
      assignedBy: teamlead._id,
      priority: 'medium',
      status: 'completed',
      completedAt: new Date(),
    },
    {
      title: 'Block suspicious IP range',
      description: 'Add firewall rule to block the flagged IP range.',
      incident: incidents[2]._id,
      project: projectAlpha._id,
      assignedTo: dev2._id,
      assignedBy: admin._id,
      priority: 'critical',
      status: 'pending',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Run database index optimization',
      project: projectBeta._id,
      assignedTo: dev1._id,
      assignedBy: teamlead._id,
      priority: 'low',
      status: 'completed',
      completedAt: new Date(),
    },
    {
      title: 'Set up 2FA for CRM admin accounts',
      project: projectAlpha._id,
      assignedTo: dev2._id,
      assignedBy: teamlead._id,
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Update mobile app release notes',
      project: projectBeta._id,
      assignedTo: dev1._id,
      assignedBy: teamlead._id,
      priority: 'low',
      status: 'overdue',
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ])
  console.log('Seeded tasks')

  await Notification.create([
    { sender: client._id, receiver: dev1._id, message: 'New incident reported: "Login page throwing 500 error"', type: 'incident', referenceId: incidents[0]._id },
    { sender: teamlead._id, receiver: dev1._id, message: 'New task assigned: "Fix null pointer on login handler"', type: 'task', referenceId: tasks[0]._id },
    { sender: admin._id, receiver: dev2._id, message: 'New incident reported: "Suspicious login attempts detected"', type: 'incident', referenceId: incidents[2]._id, isRead: true },
    { sender: dev1._id, receiver: teamlead._id, message: 'Task "Write postmortem for API outage" status changed to completed', type: 'task', referenceId: tasks[1]._id },
    { sender: teamlead._id, receiver: client._id, message: 'Incident "Production API outage" has been resolved', type: 'incident', referenceId: incidents[1]._id },
  ])
  console.log('Seeded notifications')

  await ActivityLog.create([
    { user: admin._id, action: 'Created project "Zoho CRM Migration"', entity: 'project', entityId: projectAlpha._id },
    { user: client._id, action: 'Reported incident "Login page throwing 500 error"', entity: 'incident', entityId: incidents[0]._id },
    { user: teamlead._id, action: 'Assigned task "Fix null pointer on login handler" to user', entity: 'task', entityId: tasks[0]._id },
    { user: dev1._id, action: 'Changed task "Write postmortem for API outage" status to completed', entity: 'task', entityId: tasks[1]._id },
    { user: teamlead._id, action: 'Changed incident "Production API outage" status to resolved', entity: 'incident', entityId: incidents[1]._id },
  ])
  console.log('Seeded activity logs')

  console.log('\nSeed complete. Demo accounts:')
  console.log('  admin@kazilink.com / Admin@123')
  console.log('  teamlead@kazilink.com / Lead@123')
  console.log('  dev1@kazilink.com / Dev@123')
  console.log('  dev2@kazilink.com / Dev@123')
  console.log('  client@kazilink.com / Client@123')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
