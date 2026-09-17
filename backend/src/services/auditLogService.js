const AuditLog = require('../models/AuditLog');
const { emitToAdmin } = require('./socketService');

/**
 * Record an audit log entry and emit real-time event to Admin dashboard.
 */
async function logAudit({
  req,
  user,
  action,
  entityType,
  entityId,
  description,
  metadata = {},
  severity = 'info',
}) {
  try {
    const actor = user || req?.user;
    const userName = actor
      ? `${actor.profile?.firstName || ''} ${actor.profile?.lastName || ''}`.trim() || actor.email || 'User'
      : 'System';
    const userRole = actor?.role || 'system';
    const userId = actor?._id || null;

    let ipAddress = '127.0.0.1';
    if (req) {
      ipAddress =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        '127.0.0.1';
    }

    // Sanitize metadata to never store passwords or secrets
    const safeMetadata = { ...metadata };
    delete safeMetadata.password;
    delete safeMetadata.token;
    delete safeMetadata.refreshToken;

    const logEntry = await AuditLog.create({
      user: userId,
      userName,
      userRole,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      description,
      severity,
      metadata: safeMetadata,
      ipAddress,
    });

    // Real-time broadcast to Admin room
    emitToAdmin('newAuditEvent', logEntry);

    return logEntry;
  } catch (err) {
    console.error('[AUDIT LOG ERROR] Failed to record audit log:', err.message);
    return null;
  }
}

module.exports = { logAudit };
