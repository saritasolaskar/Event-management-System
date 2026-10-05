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
import EventVehicleManagement
  from "../pages/admin/EventVehicleManagement";
  
import { ROLES } from "../utils/roles";
import { ROUTES } from "./routeConfig";
import { AuthRedirect } from "./routeGuards";

function ClientDashboard() {
    return (
        <div className="page-container">
            <h1>Client Dashboard</h1>
            <p>
                Your event management dashboard will
                appear here.
            </p>
        </div>
    );
}

function ClientEvents() {
    return (
        <div className="page-container">
            <h1>My Events</h1>
            <p>
                Client events will be loaded from the
                API.
            </p>
        </div>
    );
}

function ClientInvoices() {
    return (
        <div className="page-container">
            <h1>Invoices</h1>
            <p>
                Client invoices will be loaded from the
                API.
            </p>
        </div>
    );
}

function DriverDashboard() {
    return (
        <div className="page-container">
            <h1>Driver Dashboard</h1>
            <p>
                Driver functionality will be connected
                to the backend in the driver module.
            </p>
        </div>
    );
}

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public */}

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

                {/* ADMIN / OPERATIONS */}

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

                        </Route>

                    </Route>

                </Route>

                {/* CLIENT PORTAL */}

                <Route element={<ProtectedRoute />}>

                    <Route
                        element={
                            <RoleRoute
                                allowedRoles={[
                                    ROLES.CLIENT,
                                ]}
                            />
                        }
                    >

                        <Route element={<ClientLayout />}>

                            <Route
                                path={ROUTES.CLIENT}
                                element={
                                    <Navigate
                                        to={
                                            ROUTES.CLIENT_DASHBOARD
                                        }
                                        replace
                                    />
                                }
                            />

                            <Route
                                path={
                                    ROUTES.CLIENT_DASHBOARD
                                }
                                element={<ClientDashboard />}
                            />

                            <Route
                                path={ROUTES.CLIENT_EVENTS}
                                element={<ClientEvents />}
                            />

                            <Route
                                path={
                                    ROUTES.CLIENT_INVOICES
                                }
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
                                allowedRoles={[
                                    ROLES.DRIVER,
                                ]}
                            />
                        }
                    >

                        <Route element={<DriverLayout />}>

                            <Route
                                path={ROUTES.DRIVER}
                                element={
                                    <Navigate
                                        to={
                                            ROUTES.DRIVER_DASHBOARD
                                        }
                                        replace
                                    />
                                }
                            />

                            <Route
                                path={
                                    ROUTES.DRIVER_DASHBOARD
                                }
                                element={
                                    <DriverDashboard />
                                }
                            />

                        </Route>

                    </Route>

                </Route>

                {/* CATCH ALL */}

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