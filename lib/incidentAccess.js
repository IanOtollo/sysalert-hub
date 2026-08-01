// Whether `user` is allowed to view/act on `incident` (with `project`,
// `reportedBy`, `assignedTo` populated — at least with teamLead/client on
// project). Mirrors the list-scoping filter in api/incidents/index.js so a
// single incident can't be reached out-of-scope just by knowing its id.
export default function canAccessIncident(user, incident) {
  if (user.role === 'admin') return true

  const uid = user._id.toString()
  const reportedBy = incident.reportedBy?._id?.toString() || incident.reportedBy?.toString()
  const assignedTo = incident.assignedTo?._id?.toString() || incident.assignedTo?.toString()
  const project = incident.project

  if (user.role === 'teamlead') {
    const teamLead = project?.teamLead?._id?.toString() || project?.teamLead?.toString()
    return teamLead === uid || reportedBy === uid || assignedTo === uid
  }

  if (user.role === 'developer') {
    return reportedBy === uid || assignedTo === uid
  }

  if (user.role === 'client') {
    const client = project?.client?._id?.toString() || project?.client?.toString()
    return client === uid
  }

  return false
}
