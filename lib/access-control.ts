import type { Role } from "@prisma/client";

export const ADMIN_ROLES: Role[] = ["OWNER", "ADMIN"];
export const MANAGE_USERS_ROLES: Role[] = ["OWNER", "ADMIN"];

export function canAccessAdmin(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canManagePesquisas(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canManageUsers(role: Role): boolean {
  return MANAGE_USERS_ROLES.includes(role);
}

export function canEditTargetUser(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") return targetRole === "MEMBER";
  return false;
}

export function canAssignRole(actorRole: Role, nextRole: Role): boolean {
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") return nextRole === "MEMBER";
  return false;
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "MEMBER":
      return "Member";
    default:
      return role;
  }
}