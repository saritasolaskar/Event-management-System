
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import ProtectedRoute from "../auth/ProtectedRoute";
import RoleRoute from "../auth/RoleRoute";

import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import ClientLayout from "../layouts/ClientLayout";
import DriverLayout from "../layouts/DriverLayout";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import SetPassword from "../pages/auth/SetPassword";
import Unauthorized from "../pages/auth/Unauthorized";

import AdminDashboard from "../pages/admin/AdminDashboard";
import ClientManagement from "../pages/admin/ClientManagement";
import EventManagement from "../pages/admin/EventManagement";
import GuestManagement from "../pages/admin/GuestManagement";
import VehicleManagement from "../pages/admin/VehicleManagement";
import EventVehicleManagement from "../pages/admin/EventVehicleManagement";

import DriverDashboard from "../pages/driver/DriverPortalPages";

import {
    ClientDashboard,
    ClientEvents,
    ClientInvoices,
} from "../pages/client/ClientPortalPages";

import VehicleAssignmentManagement
    from "../pages/admin/VehicleAssignmentManagement";

import GuestAssignmentManagement
    from "../pages/admin/GuestAssignmentManagement";

import { ROLES } from "../utils/roles";
import { ROUTES } from "./routeConfig";
import { AuthRedirect } from "./routeGuards";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>

                {/* PUBLIC ROUTES */}

                <Route element={<AuthLayout />}>
                    <Route
                        path={ROUTES.LOGIN}
                        element={<Login />}
                    />

                    <Route
                        path={ROUTES.REGISTER}
                        element={<Register />}
                    />

                    <Route
                        path={ROUTES.SET_PASSWORD}
                        element={<SetPassword />}
                    />
                </Route>

                <Route
                    path={ROUTES.UNAUTHORIZED}
                    element={<Unauthorized />}
                />

                <Route
                    path="/"
                    element={<AuthRedirect />}
                />

                {/* ADMIN / OPERATIONS ROUTES */}

                <Route element={<ProtectedRoute />}>
                    <Route
                        element={
                            <RoleRoute
                                allowedRoles={[
                                    ROLES.SUPER_ADMIN,
                                    ROLES.ADMIN,
                                    ROLES.OPERATIONS_MANAGER,
                                    ROLES.DISPATCHER,
                                    ROLES.ACCOUNTS,
                                    ROLES.SUPPORT,
                                ]}
                            />
                        }
                    >
                        <Route element={<AdminLayout />}>

                            <Route
                                path={ROUTES.ADMIN}
                                element={
                                    <Navigate
                                        to={ROUTES.ADMIN_DASHBOARD}
                                        replace
                                    />
                                }
                            />

                            {/* ADMIN DASHBOARD */}

                            <Route
                                path={ROUTES.ADMIN_DASHBOARD}
                                element={<AdminDashboard />}
                            />

                            {/* CLIENT MANAGEMENT */}

                            <Route
                                element={
                                    <RoleRoute
                                        allowedRoles={[
                                            ROLES.ADMIN,
                                            ROLES.OPERATIONS_MANAGER,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path={ROUTES.ADMIN_CLIENTS}
                                    element={<ClientManagement />}
                                />
                            </Route>

                            {/* EVENT MANAGEMENT */}

                            <Route
                                element={
                                    <RoleRoute
                                        allowedRoles={[
                                            ROLES.ADMIN,
                                            ROLES.OPERATIONS_MANAGER,
                                            ROLES.DISPATCHER,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path={ROUTES.ADMIN_EVENTS}
                                    element={<EventManagement />}
                                />
                            </Route>

                            {/* GUEST MANAGEMENT */}

                            <Route
                                element={
                                    <RoleRoute
                                        allowedRoles={[
                                            ROLES.ADMIN,
                                            ROLES.OPERATIONS_MANAGER,
                                            ROLES.DISPATCHER,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path={ROUTES.ADMIN_GUESTS}
                                    element={<GuestManagement />}
                                />
                            </Route>

                            {/* VEHICLE MANAGEMENT */}

                            <Route
                                element={
                                    <RoleRoute
                                        allowedRoles={[
                                            ROLES.ADMIN,
                                            ROLES.OPERATIONS_MANAGER,
                                            ROLES.DISPATCHER,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path={ROUTES.ADMIN_VEHICLES}
                                    element={<VehicleManagement />}
                                />

                                <Route
                                    path={ROUTES.ADMIN_EVENT_VEHICLES}
                                    element={<EventVehicleManagement />}
                                />
                            </Route>

                            {/* GUEST ASSIGNMENTS */}

                            <Route
                                element={
                                    <RoleRoute
                                        allowedRoles={[
                                            ROLES.ADMIN,
                                            ROLES.OPERATIONS_MANAGER,
                                            ROLES.DISPATCHER,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path={ROUTES.ADMIN_GUEST_ASSIGNMENTS}
                                    element={<GuestAssignmentManagement />}
                                />
                            </Route>

                            {/* VEHICLE ASSIGNMENTS */}

                            <Route
                                element={
                                    <RoleRoute
                                        allowedRoles={[
                                            ROLES.ADMIN,
                                            ROLES.OPERATIONS_MANAGER,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path={ROUTES.ADMIN_VEHICLE_ASSIGNMENTS}
                                    element={<VehicleAssignmentManagement />}
                                />
                            </Route>

                        </Route>
                    </Route>
                </Route>

                {/* CLIENT PORTAL */}

                <Route element={<ProtectedRoute />}>
                    <Route
                        element={
                            <RoleRoute
                                allowedRoles={[ROLES.CLIENT]}
                            />
                        }
                    >
                        <Route element={<ClientLayout />}>

                            <Route
                                path={ROUTES.CLIENT}
                                element={
                                    <Navigate
                                        to={ROUTES.CLIENT_DASHBOARD}
                                        replace
                                    />
                                }
                            />

                            <Route
                                path={ROUTES.CLIENT_DASHBOARD}
                                element={<ClientDashboard />}
                            />

                            <Route
                                path={ROUTES.CLIENT_EVENTS}
                                element={<ClientEvents />}
                            />

                            <Route
                                path={ROUTES.CLIENT_INVOICES}
                                element={<ClientInvoices />}
                            />

                        </Route>
                    </Route>
                </Route>

                {/* DRIVER PORTAL */}

                <Route element={<ProtectedRoute />}>
                    <Route
                        element={
                            <RoleRoute
                                allowedRoles={[ROLES.DRIVER]}
                            />
                        }
                    >
                        <Route element={<DriverLayout />}>

                            <Route
                                path={ROUTES.DRIVER}
                                element={
                                    <Navigate
                                        to={ROUTES.DRIVER_DASHBOARD}
                                        replace
                                    />
                                }
                            />

                            <Route
                                path={ROUTES.DRIVER_DASHBOARD}
                                element={<DriverDashboard />}
                            />

                        </Route>
                    </Route>
                </Route>

                {/* CATCH-ALL ROUTE */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
