import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { setPassword } from "../../api/auth.api";
import { getApiErrorMessage } from "../../utils/errorHandler";

function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or missing password setup token.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain at least one special character.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Backend expects:
      // POST /auth/set-password
      // { token, password }
      await setPassword(token, password);

      setSuccess(
        "Password created successfully. You can now sign in."
      );

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Set Your Password</h1>
          <p>
            Create a secure password for your Event Management System account.
          </p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-alert auth-alert-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPasswordValue(event.target.value)
              }
              placeholder="Enter your new password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm your new password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>

          <div className="password-requirements">
            <p>Password must contain:</p>

            <ul>
              <li>At least 8 characters</li>
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
              <li>One special character</li>
            </ul>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Setting Password..." : "Set Password"}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="auth-link-button"
            onClick={() => navigate("/login")}
            disabled={isSubmitting}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default SetPassword;