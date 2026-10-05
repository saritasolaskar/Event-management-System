import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { ROLE_HOME } from "../../routes/routeConfig";
import { getApiErrorMessage } from "../../utils/errorHandler";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(form);

      const requestedPath = location.state?.from?.pathname;

      if (requestedPath && requestedPath !== "/login") {
        navigate(requestedPath, { replace: true });
        return;
      }

      navigate(
        ROLE_HOME[result.user?.role] || "/unauthorized",
        { replace: true }
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-card">
      <div className="auth-card__header">
        <span className="auth-card__eyebrow">
          Welcome back
        </span>

        <h2>Sign in</h2>

        <p>
          Sign in to continue to your Event Management
          System.
        </p>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          className="auth-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="auth-card__footer">
        <span>Don't have an account?</span>

        <Link to="/register">
          Create account
        </Link>
      </div>
    </section>
  );
}

export default Login;