export const ROLES = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
  DISPATCHER: "DISPATCHER",
  ACCOUNTS: "ACCOUNTS",
  CLIENT: "CLIENT",
  VENDOR: "VENDOR",
  DRIVER: "DRIVER",
  SUPPORT: "SUPPORT"
});

export const ADMIN_ROLES = Object.freeze([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.OPERATIONS_MANAGER,
  ROLES.DISPATCHER,
  ROLES.ACCOUNTS,
  ROLES.SUPPORT
]);

export const CLIENT_ROLES = Object.freeze([
  ROLES.CLIENT
]);

export const VENDOR_ROLES = Object.freeze([
  ROLES.VENDOR
]);

export const DRIVER_ROLES = Object.freeze([
  ROLES.DRIVER
]);

export const isRole = (user, role) => {
  return Boolean(user?.role && user.role === role);
};

export const hasAnyRole = (user, roles = []) => {
  if (!user?.role) {
    return false;
  }

  return roles.includes(user.role);
};

export const isAdminRole = (user) => {
  return hasAnyRole(user, ADMIN_ROLES);
};

export const isClientRole = (user) => {
  return hasAnyRole(user, CLIENT_ROLES);
};

export const isVendorRole = (user) => {
  return hasAnyRole(user, VENDOR_ROLES);
};

export const isDriverRole = (user) => {
  return hasAnyRole(user, DRIVER_ROLES);
};