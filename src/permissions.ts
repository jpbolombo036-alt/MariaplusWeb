// Codes de permission du backend (V2 + V13). C'est la source de vérité pour
// piloter l'affichage : une action sans permission n'est pas affichée.
// La sécurité réelle est TOUJOURS côté backend (ici c'est uniquement du masquage UI).

export const Perm = {
  userView: 'USER_VIEW',
  userCreate: 'USER_CREATE',
  userUpdate: 'USER_UPDATE',
  userDelete: 'USER_DELETE',
  roleView: 'ROLE_VIEW',
  roleCreate: 'ROLE_CREATE',
  roleUpdate: 'ROLE_UPDATE',
  roleDelete: 'ROLE_DELETE',
  permissionView: 'PERMISSION_VIEW',
  organizationView: 'ORGANIZATION_VIEW',
  organizationCreate: 'ORGANIZATION_CREATE',
  organizationUpdate: 'ORGANIZATION_UPDATE',
  organizationDelete: 'ORGANIZATION_DELETE',
  organizationManageMembers: 'ORGANIZATION_MANAGE_MEMBERS',
  weddingView: 'WEDDING_VIEW',
  weddingCreate: 'WEDDING_CREATE',
  weddingUpdate: 'WEDDING_UPDATE',
  weddingDelete: 'WEDDING_DELETE',
  weddingPublish: 'WEDDING_PUBLISH',
  weddingArchive: 'WEDDING_ARCHIVE',
  eventView: 'EVENT_VIEW',
  eventCreate: 'EVENT_CREATE',
  eventUpdate: 'EVENT_UPDATE',
  eventDelete: 'EVENT_DELETE',
  guestView: 'GUEST_VIEW',
  guestCreate: 'GUEST_CREATE',
  guestUpdate: 'GUEST_UPDATE',
  guestDelete: 'GUEST_DELETE',
  guestImport: 'GUEST_IMPORT',
  guestExport: 'GUEST_EXPORT',
  invitationView: 'INVITATION_VIEW',
  invitationCreate: 'INVITATION_CREATE',
  invitationUpdate: 'INVITATION_UPDATE',
  invitationDelete: 'INVITATION_DELETE',
  invitationSend: 'INVITATION_SEND',
  invitationResend: 'INVITATION_RESEND',
  invitationCancel: 'INVITATION_CANCEL',
  rsvpView: 'RSVP_VIEW',
  rsvpManage: 'RSVP_MANAGE',
  checkinView: 'CHECKIN_VIEW',
  checkinScan: 'CHECKIN_SCAN',
  checkinCreate: 'CHECKIN_CREATE',
  checkinCancel: 'CHECKIN_CANCEL',
  tableView: 'TABLE_VIEW',
  tableCreate: 'TABLE_CREATE',
  tableUpdate: 'TABLE_UPDATE',
  tableDelete: 'TABLE_DELETE',
  tableAssignGuest: 'TABLE_ASSIGN_GUEST',
  drinkView: 'DRINK_VIEW',
  drinkCreate: 'DRINK_CREATE',
  drinkUpdate: 'DRINK_UPDATE',
  drinkDelete: 'DRINK_DELETE',
  dashboardView: 'DASHBOARD_VIEW',
  statisticsView: 'STATISTICS_VIEW',
  reportView: 'REPORT_VIEW',
  reportExport: 'REPORT_EXPORT',
  settingsView: 'SETTINGS_VIEW',
  settingsUpdate: 'SETTINGS_UPDATE',
} as const

/** Vérifie qu'un utilisateur possède une permission (n'importe laquelle si plusieurs). */
export function hasAny(permissions: string[], ...codes: string[]): boolean {
  if (permissions.includes('SUPER_ADMIN_GLOBAL')) return true
  return codes.some((c) => permissions.includes(c))
}

/** Indicateur global (SUPER_ADMIN) : backend renvoie toutes les permissions. */
export function isSuperAdmin(roles: string[]): boolean {
  return roles.includes('SUPER_ADMIN')
}
