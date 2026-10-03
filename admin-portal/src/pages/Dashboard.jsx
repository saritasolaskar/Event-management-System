import {
    Building2,
    CalendarDays,
    UserRound,
    Car,
    Truck,
    Receipt,
} from "lucide-react";

import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

export default function Dashboard() {
    const [stats, setStats] =
        useState({
            clients: 0,
            events: 0,
            drivers: 0,
            vehicles: 0,
            vendors: 0,
            bills: 0,
        });

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const extractArray = (response) => {
        const data =
            response.data?.data ??
            response.data;

        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.items)) {
            return data.items;
        }

        if (Array.isArray(data?.results)) {
            return data.results;
        }

        return [];
    };

    const loadStats = async () => {
        try {
            const [
                clients,
                events,
                drivers,
                vehicles,
                vendors,
            ] = await Promise.allSettled([
                api.get("/clients"),
                api.get("/events"),
                api.get("/drivers"),
                api.get("/vehicles"),
                api.get("/vendors"),
            ]);

            setStats({
                clients:
                    clients.status === "fulfilled"
                        ? extractArray(
                              clients.value
                          ).length
                        : 0,

                events:
                    events.status === "fulfilled"
                        ? extractArray(
                              events.value
                          ).length
                        : 0,

                drivers:
                    drivers.status === "fulfilled"
                        ? extractArray(
                              drivers.value
                          ).length
                        : 0,

                vehicles:
                    vehicles.status === "fulfilled"
                        ? extractArray(
                              vehicles.value
                          ).length
                        : 0,

                vendors:
                    vendors.status === "fulfilled"
                        ? extractArray(
                              vendors.value
                          ).length
                        : 0,

                bills: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>

                    <p>
                        Operations overview for
                        Transit Fleets.
                    </p>
                </div>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Clients"
                    value={
                        loading
                            ? "..."
                            : stats.clients
                    }
                    icon={
                        <Building2 size={22} />
                    }
                    description="Active client records"
                />

                <StatCard
                    title="Events"
                    value={
                        loading
                            ? "..."
                            : stats.events
                    }
                    icon={
                        <CalendarDays
                            size={22}
                        />
                    }
                    description="Managed events"
                />

                <StatCard
                    title="Drivers"
                    value={
                        loading
                            ? "..."
                            : stats.drivers
                    }
                    icon={
                        <UserRound size={22} />
                    }
                    description="Registered drivers"
                />

                <StatCard
                    title="Vehicles"
                    value={
                        loading
                            ? "..."
                            : stats.vehicles
                    }
                    icon={
                        <Car size={22} />
                    }
                    description="Fleet vehicles"
                />

                <StatCard
                    title="Vendors"
                    value={
                        loading
                            ? "..."
                            : stats.vendors
                    }
                    icon={
                        <Truck size={22} />
                    }
                    description="Transport vendors"
                />

                <StatCard
                    title="Billing"
                    value="—"
                    icon={
                        <Receipt size={22} />
                    }
                    description="Billing workspace"
                />
            </div>

            <div className="dashboard-grid">
                <div className="panel">
                    <div className="panel-header">
                        <h2>
                            Operations Overview
                        </h2>
                    </div>

                    <div className="empty-state">
                        <CalendarDays
                            size={38}
                        />

                        <h3>
                            Event operations
                        </h3>

                        <p>
                            Event, vehicle
                            assignment, duty and
                            tracking activity will
                            appear here.
                        </p>
                    </div>
                </div>

                <div className="panel">
                    <div className="panel-header">
                        <h2>
                            Quick Actions
                        </h2>
                    </div>

                    <div className="quick-actions">
                        <a href="/clients">
                            Manage Clients
                        </a>

                        <a href="/events">
                            Manage Events
                        </a>

                        <a href="/assignments">
                            Vehicle Assignments
                        </a>

                        <a href="/billing">
                            Billing
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}