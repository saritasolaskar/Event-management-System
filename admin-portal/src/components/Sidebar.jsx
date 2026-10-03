import {
    LayoutDashboard,
    Building2,
    CalendarDays,
    Users,
    Car,
    Truck,
    UserRound,
    Link2,
    Receipt,
    Bell,
    LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { clearAuth } from "../store/auth";

const menu = [
    {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
    },
    {
        label: "Clients",
        path: "/clients",
        icon: Building2,
    },
    {
        label: "Events",
        path: "/events",
        icon: CalendarDays,
    },
    {
        label: "Drivers",
        path: "/drivers",
        icon: UserRound,
    },
    {
        label: "Vehicles",
        path: "/vehicles",
        icon: Car,
    },
    {
        label: "Vendors",
        path: "/vendors",
        icon: Truck,
    },
    {
        label: "Assignments",
        path: "/assignments",
        icon: Link2,
    },
    {
        label: "Guests",
        path: "/guests",
        icon: Users,
    },
    {
        label: "Billing",
        path: "/billing",
        icon: Receipt,
    },
    {
        label: "Notifications",
        path: "/notifications",
        icon: Bell,
    },
];

export default function Sidebar() {
    const navigate = useNavigate();

    const logout = () => {
        clearAuth();
        navigate("/login");
    };

    return (
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-mark">
                    TF
                </div>

                <div>
                    <h2>Transit Fleets</h2>
                    <span>Operations Portal</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menu.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/"}
                            className={({ isActive }) =>
                                isActive
                                    ? "nav-item active"
                                    : "nav-item"
                            }
                        >
                            <Icon size={19} />
                            <span>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>

            <button
                className="logout-button"
                onClick={logout}
            >
                <LogOut size={18} />
                Logout
            </button>
        </aside>
    );
}