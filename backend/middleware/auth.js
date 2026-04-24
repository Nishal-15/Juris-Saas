const jwt = require("jsonwebtoken");

module.exports = function (roles = []) {
  return function (req, res, next) {
    try {
      const token = req.header("x-auth-token");

      if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ FIXED: correct structure
      req.user = decoded.user;

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied (role)" });
      }

      next();

    } catch (err) {
      console.error("Auth Error:", err.message);
      res.status(401).json({ message: "Invalid token" });
    }
  };
};