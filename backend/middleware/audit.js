const AuditLog = require("../models/AuditLog");
const logAudit = (action, targetModel) => async (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    if (res.statusCode >= 200 && res.statusCode < 300) {
      AuditLog.create({
        action,
        adminId: req.user ? req.user.id : null,
        targetId: req.params.id || req.body.targetId || null,
        targetModel,
        details: { method: req.method, path: req.originalUrl, body: req.body },
        ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress
      }).catch(err => console.error("Audit log failure:", err));
    }
    return res.send(data);
  };
  next();
};
module.exports = logAudit;
