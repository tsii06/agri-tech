// Utilitaire global pour la gestion multi-rôle
export function hasRole(userRole, role) {
  if (Array.isArray(userRole)) {
    return userRole.includes(role);
  }
  return userRole === role;
} 