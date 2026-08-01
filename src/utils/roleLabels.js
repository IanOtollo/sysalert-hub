export const ROLE_LABELS = {
  admin: 'Admin',
  teamlead: 'Team Lead',
  developer: 'Developer',
  client: 'Client',
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role
}
