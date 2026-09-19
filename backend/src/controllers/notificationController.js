/**
 * JSDoc: NotificationController - Real-time alerts, system announcements, and user push notifications
 * @module controllers/notificationController
 */
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const { emitToUser } = require('../services/socketService');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, unreadOnly } = req.query;
    const filter = { recipient: req.user._id };

    if (type) filter.type = type;
    if (unreadOnly === 'true') filter.read = false;

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .populate('sender', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, notifications, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return ApiResponse.error(res, 'Notification not found', 404);
    }

    return ApiResponse.success(res, notification, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    return ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

exports.createNotification = async (req, res, next) => {
  try {
    const { recipient, type, title, message, link, priority } = req.body;
    if (!recipient || !type || !title || !message) {
      return ApiResponse.error(res, 'Recipient, type, title, and message are required', 400);
    }

    const notification = await Notification.create({
      recipient,
      sender: req.user._id,
      type,
      title,
      message,
      link,
      priority: priority || 'medium',
    });

    const populated = await Notification.findById(notification._id)
      .populate('sender', 'email profile');

    emitToUser(recipient, 'newNotification', populated);

    return ApiResponse.success(res, populated, 'Notification created', 201);
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return ApiResponse.error(res, 'Notification not found', 404);
    }

    return ApiResponse.success(res, null, 'Notification deleted');
  } catch (err) {
    next(err);
  }
};

exports.clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({
      recipient: req.user._id,
    });

    return ApiResponse.success(res, null, 'All notifications cleared');
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return ApiResponse.success(res, { unreadCount: count });
  } catch (err) {
    next(err);
  }
};
