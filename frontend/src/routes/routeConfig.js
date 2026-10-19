
import { ROLES } from "../utils/roles";

const ADMIN_MANAGEMENT_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.OPERATIONS_MANAGER,
];

const EVENT_OPERATIONS_ROLES = [
  ...ADMIN_MANAGEMENT_ROLES,
  ROLES.DISPATCHER,
];

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  SET_PASSWORD: "/set-password",
  UNAUTHORIZED: "/unauthorized",

  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_BILLING: "/admin/billing",
  ADMIN_CLIENTS: "/admin/clients",
  ADMIN_EVENTS: "/admin/events",
  ADMIN_GUESTS: "/admin/guests",
  ADMIN_LOCATIONS: "/admin/locations",
  ADMIN_VENDORS: "/admin/vendors",
  ADMIN_DRIVERS: "/admin/drivers",
  ADMIN_VEHICLES: "/admin/vehicles",
  ADMIN_EVENT_VEHICLES: "/admin/events/:eventId/vehicles",
  ADMIN_VEHICLE_ASSIGNMENTS: "/admin/vehicle-assignments",
  ADMIN_GUEST_ASSIGNMENTS: "/admin/guest-assignments",

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
    roles: ADMIN_MANAGEMENT_ROLES,
  },
  {
    path: ROUTES.ADMIN_BILLING,
    label: "Billing",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.ACCOUNTS,
    ],
  },
  {
    path: ROUTES.ADMIN_EVENTS,
    label: "Events",
    roles: EVENT_OPERATIONS_ROLES,
  },
  {
    path: ROUTES.ADMIN_GUESTS,
    label: "Guests",
    roles: EVENT_OPERATIONS_ROLES,
  },
  {
    path: ROUTES.ADMIN_GUEST_ASSIGNMENTS,
    label: "Guest Assignments",
    roles: EVENT_OPERATIONS_ROLES,
  },
  {
    path: ROUTES.ADMIN_VEHICLE_ASSIGNMENTS,
    label: "Vehicle Assignments",
    roles: ADMIN_MANAGEMENT_ROLES,
  },
  {
    path: ROUTES.ADMIN_VEHICLES,
    label: "Vehicles",
    roles: EVENT_OPERATIONS_ROLES,
  },
  {
    path: ROUTES.ADMIN_VENDORS,
    label: "Vendors",
    roles: ADMIN_MANAGEMENT_ROLES,
  },
  {
    path: ROUTES.ADMIN_DRIVERS,
    label: "Drivers",
    roles: ADMIN_MANAGEMENT_ROLES,
  },
  {
    path: ROUTES.ADMIN_LOCATIONS,
    label: "Locations",
    roles: ADMIN_MANAGEMENT_ROLES,
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
