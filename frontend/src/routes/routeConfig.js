import { ROLES } from "../utils/roles";

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  SET_PASSWORD: "/set-password",
  UNAUTHORIZED: "/unauthorized",

  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_CLIENTS: "/admin/clients",
  ADMIN_EVENTS: "/admin/events",
  ADMIN_GUESTS: "/admin/guests",

  CLIENT: "/client",
  CLIENT_DASHBOARD: "/client/dashboard",
  CLIENT_EVENTS: "/client/events",
  CLIENT_INVOICES: "/client/invoices",

  DRIVER: "/driver",
  DRIVER_DASHBOARD: "/driver/dashboard",
};

export const ROLE_HOME = {
  [ROLES.SUPER_ADMIN]: ROUTES.ADMIN_DASHBOARD,
  [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
  [ROLES.OPERATIONS_MANAGER]: ROUTES.ADMIN_DASHBOARD,
  [ROLES.DISPATCHER]: ROUTES.ADMIN_DASHBOARD,
  [ROLES.ACCOUNTS]: ROUTES.ADMIN_DASHBOARD,
  [ROLES.SUPPORT]: ROUTES.ADMIN_DASHBOARD,

  [ROLES.CLIENT]: ROUTES.CLIENT_DASHBOARD,
  [ROLES.DRIVER]: ROUTES.DRIVER_DASHBOARD,

  [ROLES.VENDOR]: ROUTES.UNAUTHORIZED,
};

export const ADMIN_ROUTES = [
  {
    path: ROUTES.ADMIN_DASHBOARD,
    label: "Dashboard",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.OPERATIONS_MANAGER,
      ROLES.DISPATCHER,
      ROLES.ACCOUNTS,
      ROLES.SUPPORT,
    ],
  },

  {
    path: ROUTES.ADMIN_CLIENTS,
    label: "Clients",
    roles: [
      ROLES.ADMIN,
      ROLES.OPERATIONS_MANAGER,
    ],
  },

  {
    path: ROUTES.ADMIN_EVENTS,
    label: "Events",
    roles: [
      ROLES.ADMIN,
      ROLES.OPERATIONS_MANAGER,
      ROLES.DISPATCHER,
    ],
  },

  {
    path: ROUTES.ADMIN_GUESTS,
    label: "Guests",
    roles: [
      ROLES.ADMIN,
      ROLES.OPERATIONS_MANAGER,
      ROLES.DISPATCHER,
    ],
  },
];

export const CLIENT_ROUTES = [
  {
    path: ROUTES.CLIENT_DASHBOARD,
    label: "Dashboard",
    roles: [ROLES.CLIENT],
  },

  {
    path: ROUTES.CLIENT_EVENTS,
    label: "My Events",
    roles: [ROLES.CLIENT],
  },

  {
    path: ROUTES.CLIENT_INVOICES,
    label: "Invoices",
    roles: [ROLES.CLIENT],
  },
];

export const DRIVER_ROUTES = [
  {
    path: ROUTES.DRIVER_DASHBOARD,
    label: "Dashboard",
    roles: [ROLES.DRIVER],
  },
];