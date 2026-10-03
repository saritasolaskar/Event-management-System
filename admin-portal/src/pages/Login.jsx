import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { saveAuth } from "../store/auth";

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] =
        useState(false);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]:
                event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response =
                await api.post(
                    "/auth/login",
                    form
                );

            const data =
                response.data?.data ||
                response.data;

            saveAuth({
                accessToken:
                    data.accessToken,
                refreshToken:
                    data.refreshToken,
                user: data.user,
            });

            navigate("/");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Login failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <div className="brand-mark">
                        TF
                    </div>

                    <h1>Transit Fleets</h1>

                    <p>
                        Event Transport Management
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="login-form"
                >
                    <h2>Welcome back</h2>

                    <p>
                        Sign in to your operations
                        dashboard.
                    </p>

                    {error && (
                        <div className="error-box">
                            {error}
                        </div>
                    )}

                    <label>
                        Email

                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
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
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="primary-button"
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}