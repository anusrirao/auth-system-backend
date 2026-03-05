import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const REGISTERED_USER_KEY = "registeredUser";
const API_LOGIN_URL = "http://localhost:8080/home/login";

const renderEyeIcon = (isVisible) => {
  if (isVisible) {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1 12C2.8 7.7 7 5 12 5C17 5 21.2 7.7 23 12C21.2 16.3 17 19 12 19C7 19 2.8 16.3 1 12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 4.24C10.58 4.08 11.28 4 12 4C17 4 21.27 6.92 23 12C22.52 13.4 21.81 14.66 20.91 15.74"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.71 6.72C4.55 8.13 2.84 9.95 1.99 12C3.72 17.08 8 20 13 20C14.99 20 16.86 19.54 18.53 18.72"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.58 10.59C10.21 10.96 10 11.47 10 12C10 13.1 10.9 14 12 14C12.53 14 13.04 13.79 13.41 13.42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    remember: true,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = "Username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length !== 0) {
      setErrors(validationErrors);
      alert("Please check your login information.");
      return;
    }

    setErrors({});
    setIsLoading(true);

    const loginWithBackend = async () => {
      const response = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password: formData.password,
        }),
      });

      return response.ok;
    };

    try {
      let authenticated = false;

      try {
        authenticated = await loginWithBackend();
      } catch {
        authenticated = false;
      }

      const storedUserRaw = localStorage.getItem(REGISTERED_USER_KEY);
      const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

      const identifier = formData.identifier.trim();
      const normalizedEmail = identifier.toLowerCase();
      const normalizedMobile = identifier.replace(/\D/g, "");

      const emailMatch =
        normalizedEmail === ((storedUser?.email || "").toLowerCase());
      const registeredMobile = String(
        storedUser?.mobileNumber || storedUser?.mobile || ""
      ).replace(/\D/g, "");
      const mobileMatch =
        normalizedMobile !== "" && normalizedMobile === registeredMobile;
      const passwordMatch = formData.password === storedUser?.password;

      const localStorageAuth =
        !!storedUser && passwordMatch && (emailMatch || mobileMatch);

      if (!authenticated && !localStorageAuth) {
        alert("Please check your login information.");
        return;
      }

      alert("Login Successful!");
      localStorage.setItem("isLoggedIn", "true");
      setFormData({ identifier: "", password: "", remember: true });
      navigate("/dashboard", { replace: true });
    } catch {
      alert("Please check your login information.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <section className="left-side" aria-hidden="true">
          <h1>Welcome to website</h1>
          <span className="shape shape-a" />
          <span className="shape shape-b" />
          <span className="shape shape-c" />
        </section>

        <section className="right-side">
          <h2>USER LOGIN</h2>

          <form onSubmit={handleSubmit}>
            <div className="field-wrap">
              <input
                type="text"
                name="identifier"
                placeholder="email or mobile number "
                value={formData.identifier}
                onChange={handleChange}
              />
              <p className="error">{errors.identifier || ""}</p>
            </div>
  
            <div className="password-field-wrap">
              <div className="password-pill">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {renderEyeIcon(showPassword)}
                </button>
              </div>
              <p className="error">{errors.password || ""}</p>
            </div>

            <div className="login-options">
              <label>
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                Remember
              </label>

              <Link className="forgot" to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? "Logging in..." : "LOGIN"}
            </button>

            <p className="register-link">
              Don't have account? <Link to="/register">Register</Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
