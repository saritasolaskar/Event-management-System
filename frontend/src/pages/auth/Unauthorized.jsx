import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <main className="unauthorized-page">
      <div className="unauthorized-card">
        <div className="unauthorized-card__code">
          403
        </div>

        <h1>Access denied</h1>

        <p>
          You do not have permission to access this
          section of the Event Management System.
        </p>

        <Link
          to="/"
          className="auth-submit"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}

export default Unauthorized;