// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── Protect: verify JWT and attach user to req ───────────────────────────────
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // BUG FIX: original code used decoded.id but JWT payload uses _id
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found. Token invalid." });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Account has been deactivated." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token expired. Please login again." });
    }
    return res
      .status(401)
      .json({ success: false, message: "Invalid token." });
  }
};

// ─── Authorize: restrict to specific roles ────────────────────────────────────
// Usage: authorize("admin"), authorize("admin", "department")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
