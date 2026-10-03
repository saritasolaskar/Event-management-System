import { Bell, Search } from "lucide-react";
import { getUser } from "../store/auth";

export default function Topbar() {
    const user = getUser();

    return (
        <header className="topbar">
            <div className="search-box">
                <Search size={18} />

                <input
                    placeholder="Search..."
                />
            </div>

            <div className="topbar-right">
                <button className="icon-button">
                    <Bell size={20} />
                </button>

                <div className="profile">
                    <div className="avatar">
                        {(user?.name || "A")
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div>
                        <strong>
                            {user?.name ||
                                "Administrator"}
                        </strong>

                        <span>
                            {user?.role ||
                                "ADMIN"}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}