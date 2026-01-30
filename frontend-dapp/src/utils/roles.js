// Utilitaire global pour la gestion multi-rôle
export function hasRole(userRole, role) {
  if (Array.isArray(userRole)) {
    return userRole.includes(role);
  }
  return userRole === role;
}

export function initialRoleActeur(numRole) {
  switch (numRole) {
    case 0:
      return "AG";
    case 1:
      return "FO";
    case 2:
      return "CE";
    case 3:
      return "CO";
    case 4:
      return "AU";
    case 5:
      return "TR";
    case 6:
      return "EX";
    case 7:
      return "AD";
    default:
      break;
  }
}
