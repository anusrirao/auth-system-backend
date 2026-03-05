import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/forgotpassword.css";

const ForgotPassword = () => {
  const [method, setMethod] = useState("email");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const demoOtp = "123456";

  const validateContact = () => {
    if (!contact.trim()) {
      return method === "email" ? "Email is required" : "Phone number is required";
    }

    if (method === "email" && !/\S+@\S+\.\S+/.test(contact)) {
      return "Enter a valid email";
    }

    if (method === "phone" && !/^\d{10}$/.test(contact)) {
      return "Phone number must be 10 digits";
    }

    return "";
  };

  const handleSendOtp = (e) => {
    e.preventDefault();

    const validationError = validateContact();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSent(true);
    setIsVerified(false);
    setOtp("");
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must be 6 digits");
      return;
    }

    if (otp !== demoOtp) {
      setError("Invalid OTP");
      return;
    }

    setError("");
    setIsVerified(true);
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <h2>Forgot Password</h2>
        <p>Choose email or phone to receive OTP.</p>

        <div className="forgot-choice" role="group" aria-label="OTP method">
          <button
            type="button"
            className={method === "email" ? "choice-btn active" : "choice-btn"}
            onClick={() => {
              setMethod("email");
              setContact("");
              setOtp("");
              setError("");
              setIsSent(false);
              setIsVerified(false);
            }}
          >
            Email
          </button>
          <button
            type="button"
            className={method === "phone" ? "choice-btn active" : "choice-btn"}
            onClick={() => {
              setMethod("phone");
              setContact("");
              setOtp("");
              setError("");
              setIsSent(false);
              setIsVerified(false);
            }}
          >
            Phone
          </button>
        </div>

        <form onSubmit={isSent ? handleVerifyOtp : handleSendOtp}>
          <input
            type={method === "email" ? "email" : "tel"}
            placeholder={method === "email" ? "you@example.com" : "10-digit phone number"}
            value={contact}
            onChange={(e) => {
              const value = method === "phone"
                ? e.target.value.replace(/\D/g, "").slice(0, 10)
                : e.target.value;
              setContact(value);
            }}
            disabled={isSent}
          />

          {isSent && (
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="otp-input"
            />
          )}

          <p className="forgot-error">{error || ""}</p>

          {!isSent && (
            <button type="submit" className="forgot-submit">
              Send OTP
            </button>
          )}

          {isSent && (
            <button type="submit" className="forgot-submit">
              Verify OTP
            </button>
          )}
        </form>

        {isSent && !isVerified && (
          <p className="forgot-success">OTP sent. Demo OTP: 123456</p>
        )}

        {isVerified && (
          <p className="forgot-success">OTP verified successfully.</p>
        )}

        <p className="forgot-back">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
