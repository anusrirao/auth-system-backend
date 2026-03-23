// controllers/profile.controller.js

exports.getProfile = async (req, res) => {
  try {
    res.json({
      message: "Profile fetched successfully",
      user: req.user || {}
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    res.json({
      message: "Profile updated successfully",
      data: { name, email }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    res.json({
      message: "Password changed successfully"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to change password" });
  }
};