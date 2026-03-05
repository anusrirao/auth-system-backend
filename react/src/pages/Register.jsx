import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/register.css";

const API_BASE_URL = "http://localhost:8080";

const createOtpState = () => ({
  sent: false,
  verified: false,
  code: "",
  isSending: false,
  isVerifying: false,
  message: "",
  messageType: "",
});

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [otpState, setOtpState] = useState({
    email: createOtpState(),
    phone: createOtpState(),
  });

  const isEmailValid = (email) => /\S+@\S+\.\S+/.test(email);
  const isPhoneValid = (phone) => /^\d{10}$/.test(phone);

  const resetOtpChannel = (channel) => {
    setOtpState((prev) => ({
      ...prev,
      [channel]: createOtpState(),
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;

    if (name === "firstName" || name === "lastName") {
      newValue = (value || "").slice(0, 30);
    }

    if (name === "mobileNumber") {
      // allow digits only and limit to 10
      newValue = (value || "").replace(/\D/g, "").slice(0, 10);
    }

    if (name === "email" && newValue !== formData.email) {
      resetOtpChannel("email");
    }

    if (name === "mobileNumber" && newValue !== formData.mobileNumber) {
      resetOtpChannel("phone");
    }

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!isEmailValid(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    const mobileDigits = (formData.mobileNumber || "").replace(/\D/g, "");
    if (!mobileDigits) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (mobileDigits.length !== 10) {
      newErrors.mobileNumber = "Mobile number must be 10 digits";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept terms";
    }

    if (!otpState.email.verified) {
      newErrors.emailOtp = "Please verify your email with OTP";
    }

    if (!otpState.phone.verified) {
      newErrors.mobileOtp = "Please verify your mobile number with OTP";
    }

    return newErrors;
  };

  const handleOtpCodeChange = (channel, code) => {
    const formatted = code.replace(/\D/g, "").slice(0, 6);
    setOtpState((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        code: formatted,
        message: "",
        messageType: "",
      },
    }));
  };

  const handleSendOtp = async (channel) => {
    const isEmailChannel = channel === "email";
    const value = isEmailChannel ? formData.email.trim() : formData.mobileNumber.trim();

    if (isEmailChannel && !isEmailValid(value)) {
      setErrors((prev) => ({ ...prev, email: "Enter a valid email before sending OTP" }));
      return;
    }

    if (!isEmailChannel && !isPhoneValid(value)) {
      setErrors((prev) => ({ ...prev, mobileNumber: "Enter a valid 10-digit mobile number before sending OTP" }));
      return;
    }

    setErrors((prev) => ({
      ...prev,
      ...(isEmailChannel ? { email: "", emailOtp: "" } : { mobileNumber: "", mobileOtp: "" }),
    }));

    setOtpState((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        isSending: true,
        message: "",
        messageType: "",
      },
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          value,
        }),
      });

      const result = await response.text();
      if (!response.ok) {
        throw new Error(result || "Unable to send OTP");
      }

      setOtpState((prev) => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          sent: true,
          verified: false,
          code: "",
          message: result || "OTP sent successfully",
          messageType: "success",
        },
      }));
    } catch (error) {
      setOtpState((prev) => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          message: error.message || "Unable to send OTP",
          messageType: "error",
        },
      }));
    } finally {
      setOtpState((prev) => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          isSending: false,
        },
      }));
    }
  };

  const handleVerifyOtp = async (channel) => {
    const isEmailChannel = channel === "email";
    const value = isEmailChannel ? formData.email.trim() : formData.mobileNumber.trim();
    const code = otpState[channel].code;

    if (!/^\d{6}$/.test(code)) {
      setOtpState((prev) => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          message: "OTP must be 6 digits",
          messageType: "error",
        },
      }));
      return;
    }

    setOtpState((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        isVerifying: true,
        message: "",
        messageType: "",
      },
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          value,
          otp: code,
        }),
      });

      const result = await response.text();
      if (!response.ok) {
        throw new Error(result || "OTP verification failed");
      }

      setOtpState((prev) => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          verified: true,
          message: result || "OTP verified successfully",
          messageType: "success",
        },
      }));
    } catch (error) {
      setOtpState((prev) => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          verified: false,
          message: error.message || "OTP verification failed",
          messageType: "error",
        },
      }));
    } finally {
      setOtpState((prev) => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          isVerifying: false,
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length !== 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:8080/home/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          mobile: formData.mobileNumber,
          password: formData.password,
        }),
      });

      const result = await response.text();

      if (!response.ok) {
        throw new Error(result || "Registration Failed");
      }

      alert(result || "Registration Successful");
      navigate("/login");

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        mobileNumber: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
      });
      setOtpState({
        email: createOtpState(),
        phone: createOtpState(),
      });
      setErrors({});
    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.message || "Registration Failed");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="register-container">
      <div className="register-glow register-glow-1" />
      <div className="register-glow register-glow-2" />
      <div className="register-box">
        <p className="register-tag">Create account</p>
        <h2>Join Us Today</h2>
        <p className="register-subtitle">
          Build your profile and start in less than a minute.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="name-row">
            <div className="name-field">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                maxLength={30}
              />
              {errors.firstName && <p className="error">{errors.firstName}</p>}
            </div>

            <div className="name-field">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                maxLength={30}
              />
              {errors.lastName && <p className="error">{errors.lastName}</p>}
            </div>
          </div>

          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <div className="otp-row">
            <button
              type="button"
              className="otp-btn"
              onClick={() => handleSendOtp("email")}
              disabled={otpState.email.isSending || otpState.email.verified}
            >
              {otpState.email.verified
                ? "Email Verified"
                : otpState.email.isSending
                  ? "Sending..."
                  : otpState.email.sent
                    ? "Resend OTP"
                    : "Send OTP"}
            </button>
            {otpState.email.sent && !otpState.email.verified && (
              <>
                <input
                  type="text"
                  className="otp-input"
                  placeholder="Enter 6-digit OTP"
                  value={otpState.email.code}
                  onChange={(e) => handleOtpCodeChange("email", e.target.value)}
                />
                <button
                  type="button"
                  className="otp-btn verify-btn"
                  onClick={() => handleVerifyOtp("email")}
                  disabled={otpState.email.isVerifying}
                >
                  {otpState.email.isVerifying ? "Verifying..." : "Verify"}
                </button>
              </>
            )}
          </div>
          {otpState.email.message && (
            <p className={otpState.email.messageType === "error" ? "error" : "otp-success"}>
              {otpState.email.message}
            </p>
          )}
          {errors.emailOtp && <p className="error">{errors.emailOtp}</p>}

          <label htmlFor="mobileNumber">Mobile Number</label>
          <input
            id="mobileNumber"
            type="tel"
            name="mobileNumber"
            placeholder="Mobile Number"
            value={formData.mobileNumber}
            onChange={handleChange}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="10"
          />
          <div className="otp-row">
            <button
              type="button"
              className="otp-btn"
              onClick={() => handleSendOtp("phone")}
              disabled={otpState.phone.isSending || otpState.phone.verified}
            >
              {otpState.phone.verified
                ? "Phone Verified"
                : otpState.phone.isSending
                  ? "Sending..."
                  : otpState.phone.sent
                    ? "Resend OTP"
                    : "Send OTP"}
            </button>
            {otpState.phone.sent && !otpState.phone.verified && (
              <>
                <input
                  type="text"
                  className="otp-input"
                  placeholder="Enter 6-digit OTP"
                  value={otpState.phone.code}
                  onChange={(e) => handleOtpCodeChange("phone", e.target.value)}
                />
                <button
                  type="button"
                  className="otp-btn verify-btn"
                  onClick={() => handleVerifyOtp("phone")}
                  disabled={otpState.phone.isVerifying}
                >
                  {otpState.phone.isVerifying ? "Verifying..." : "Verify"}
                </button>
              </>
            )}
          </div>
          {otpState.phone.message && (
            <p className={otpState.phone.messageType === "error" ? "error" : "otp-success"}>
              {otpState.phone.message}
            </p>
          )}
          {errors.mobileNumber && <p className="error">{errors.mobileNumber}</p>}
          {errors.mobileOtp && <p className="error">{errors.mobileOtp}</p>}

          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          {errors.password && <p className="error">{errors.password}</p>}

          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="password-field">
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
          {errors.confirmPassword && (
            <p className="error">{errors.confirmPassword}</p>
          )}

          
          <div className="checkbox-container">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              id="terms"
            />
            <label htmlFor="terms">I accept Terms & Conditions</label>
          </div>
          {errors.acceptTerms && (
            <p className="error">{errors.acceptTerms}</p>
          )}
          <button
            type="submit"
            disabled={isLoading || !otpState.email.verified || !otpState.phone.verified}
          >
            {isLoading
              ? "Creating Account..."
              : !otpState.email.verified || !otpState.phone.verified
                ? "Verify Email & Phone First"
                : "Register"}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
