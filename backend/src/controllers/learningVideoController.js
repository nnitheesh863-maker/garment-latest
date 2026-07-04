const LearningVideo = require('../models/LearningVideo');
const ApiResponse = require('../utils/apiResponse');

exports.createVideo = async (req, res, next) => {
  try {
    const { title, url, description, assignedTo, assignToAll } = req.body;

    if (!title || !url) {
      return ApiResponse.error(res, 'Please provide title and url', 400);
    }

    const video = await LearningVideo.create({
      title,
      url,
      description: description || '',
      // If assignToAll is true, set empty array (meaning all employees)
      assignedTo: assignToAll ? [] : (assignedTo || []),
      assignedBy: req.user._id,
    });

    return ApiResponse.success(res, video, 'Learning video created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getVideos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    let filter = {};

    // Employees see videos assigned to them OR videos for all (empty assignedTo)
    if (req.user.role === 'employee') {
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedTo: [] },
      ];
    }

    const total = await LearningVideo.countDocuments(filter);
    const videos = await LearningVideo.find(filter)
      .populate('assignedTo', 'email profile')
      .populate('assignedBy', 'email profile')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, videos, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.getVideo = async (req, res, next) => {
  try {
    const video = await LearningVideo.findById(req.params.id)
      .populate('assignedTo', 'email profile')
      .populate('assignedBy', 'email profile');

    if (!video) {
      return ApiResponse.error(res, 'Learning video not found', 404);
    }

    // Employees can view videos assigned to them OR for all employees
    if (req.user.role === 'employee') {
      const isAssigned = video.assignedTo?.some((u) => u._id?.equals?.(req.user._id));
      const isForAll = Array.isArray(video.assignedTo) && video.assignedTo.length === 0;
      if (!isAssigned && !isForAll) {
        return ApiResponse.error(res, 'Not authorized to view this video', 403);
      }
    }

    return ApiResponse.success(res, video, 'Learning video fetched');
  } catch (err) {
    next(err);
  }
};

exports.updateVideo = async (req, res, next) => {
  try {
    const { title, url, description, assignedTo, assignToAll } = req.body;

    const video = await LearningVideo.findById(req.params.id);

    if (!video) {
      return ApiResponse.error(res, 'Learning video not found', 404);
    }

    if (title !== undefined) video.title = title;
    if (url !== undefined) video.url = url;
    if (description !== undefined) video.description = description;
    if (assignToAll !== undefined) {
      video.assignedTo = assignToAll ? [] : (assignedTo || []);
    } else if (assignedTo !== undefined) {
      video.assignedTo = assignedTo;
    }

    await video.save();

    const updated = await LearningVideo.findById(video._id)
      .populate('assignedTo', 'email profile')
      .populate('assignedBy', 'email profile');

    return ApiResponse.success(res, updated, 'Learning video updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await LearningVideo.findById(req.params.id);

    if (!video) {
      return ApiResponse.error(res, 'Learning video not found', 404);
    }

    await video.deleteOne();

    return ApiResponse.success(res, null, 'Learning video deleted');
  } catch (err) {
    next(err);
  }
};
