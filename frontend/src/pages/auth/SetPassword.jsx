import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { setPassword } from "../../api/auth.api";
import { getApiErrorMessage } from "../../utils/errorHandler";

function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";

  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Password setup token is missing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await setPassword({
        token,
        password,
      });

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
    <section className="auth-card">
      <div className="auth-card__header">
        <span className="auth-card__eyebrow">
          Account setup
        </span>

        <h2>Set password</h2>

        <p>
          Create a secure password for your account.
        </p>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="form-success" role="status">
          {success}
        </div>
      )}

      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPasswordValue(event.target.value)
            }
            autoComplete="new-password"
            required
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            autoComplete="new-password"
            required
          />
        </label>

        <button
          type="submit"
          className="auth-submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Saving..."
            : "Set password"}
        </button>
      </form>
    </section>
  );
}

export default SetPassword;