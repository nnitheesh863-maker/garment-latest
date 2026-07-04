const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  getUsers,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const {
  loginRules,
  registerRules,
  validate,
} = require("../middleware/validate");

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/users", protect, authorize("admin", "manager"), getUsers);
router.get("/me", protect, getMe);
router.put("/update", protect, updateProfile);
router.post("/change-password", protect, changePassword);

module.exports = router;
