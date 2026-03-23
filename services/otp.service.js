// services/otp.service.js
const { generateOTP } = require("../utils/otp");

let otpStore = {};

const createOTP = (key, userData) => {
  const otp = generateOTP();
  otpStore[key] = {
    otp,
    ...userData,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };
  return otp;
};

const verifyOTP = (key, otp) => {
  if (!otpStore[key]) return { valid: false, message: "OTP not found" };
  if (Date.now() > otpStore[key].expiresAt) {
    delete otpStore[key];
    return { valid: false, message: "OTP expired" };
  }
  if (otpStore[key].otp !== otp.toString()) {
    return { valid: false, message: "Invalid OTP" };
  }
  const data = otpStore[key];
  delete otpStore[key];
  return { valid: true, data };
};

module.exports = { createOTP, verifyOTP };