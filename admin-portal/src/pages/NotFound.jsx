
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="empty-page">
            <h1>404</h1>

            <p>
                The page you're looking for
                doesn't exist.
            </p>

            <Link
                to="/"
                className="primary-button"
            >
                Back to Dashboard
            </Link>
        </div>
    );
}