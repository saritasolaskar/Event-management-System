import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

function Placeholder({ title }) {
    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>{title}</h1>
                    <p>
                        This module is being
                        connected to the backend.
                    </p>
                </div>
            </div>

            <div className="panel">
                <div className="empty-state">
                    <h2>
                        {title} workspace
                    </h2>

                    <p>
                        Backend API integration
                        will be added in the next
                        module pass.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        path="/"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/clients"
                        element={
                            <Placeholder title="Clients" />
                        }
                    />

                    <Route
                        path="/events"
                        element={
                            <Placeholder title="Events" />
                        }
                    />

                    <Route
                        path="/drivers"
                        element={
                            <Placeholder title="Drivers" />
                        }
                    />

                    <Route
                        path="/vehicles"
                        element={
                            <Placeholder title="Vehicles" />
                        }
                    />

                    <Route
                        path="/vendors"
                        element={
                            <Placeholder title="Vendors" />
                        }
                    />

                    <Route
                        path="/assignments"
                        element={
                            <Placeholder title="Assignments" />
                        }
                    />

                    <Route
                        path="/guests"
                        element={
                            <Placeholder title="Guests" />
                        }
                    />

                    <Route
                        path="/billing"
                        element={
                            <Placeholder title="Billing" />
                        }
                    />

                    <Route
                        path="/notifications"
                        element={
                            <Placeholder title="Notifications" />
                        }
                    />
                </Route>

                <Route
                    path="*"
                    element={<NotFound />}
                />
            </Routes>
        </BrowserRouter>
    );
}