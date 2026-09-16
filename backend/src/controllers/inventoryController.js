const Inventory = require('../models/Inventory');
const ApiResponse = require('../utils/apiResponse');
const { getRecommendations } = require('../services/aiService');

exports.getInventory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      lowStock,
      search,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rawMaterialId: { $regex: search, $options: 'i' } },
      ];
    }
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$stockLevels.current', '$stockLevels.reorderPoint'] };
    }

    const total = await Inventory.countDocuments(filter);

    let query = Inventory.find(filter)
      .sort({ [sortBy]: Number(sortOrder) })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    if (!lowStock) {
      query = query.populate('consumptionHistory.orderId', 'orderNumber');
    }

    const items = await query;

    return ApiResponse.paginated(res, items, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.createItem = async (req, res, next) => {
  try {
    const { name, category, rawMaterialId } = req.body;
    const materialId = rawMaterialId || `${category.toUpperCase()}-${Date.now()}`;

    const existing = await Inventory.findOne({ rawMaterialId: materialId });
    if (existing) {
      return ApiResponse.error(res, 'Raw material ID already exists', 400);
    }

    const item = await Inventory.create({ ...req.body, rawMaterialId: materialId });
    return ApiResponse.success(res, item, 'Inventory item created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('consumptionHistory.orderId', 'orderNumber')
      .populate('consumptionHistory.issuedBy', 'email profile.firstName profile.lastName');

    if (!item) {
      return ApiResponse.error(res, 'Inventory item not found', 404);
    }

    return ApiResponse.success(res, item);
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'category', 'supplier', 'stockLevels',
      'unitOfMeasure', 'costPerUnit', 'location', 'quality',
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const item = await Inventory.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return ApiResponse.error(res, 'Inventory item not found', 404);
    }

    return ApiResponse.success(res, item, 'Inventory item updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return ApiResponse.error(res, 'Inventory item not found', 404);
    }
    return ApiResponse.success(res, null, 'Inventory item deleted');
  } catch (err) {
    next(err);
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    const { quantity, operation, reason, orderId } = req.body;
    if (!quantity || !operation || !reason) {
      return ApiResponse.error(res, 'Quantity, operation, and reason are required', 400);
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return ApiResponse.error(res, 'Inventory item not found', 404);
    }

    const qty = Number(quantity);
    if (operation === 'add') {
      item.stockLevels.current += qty;
    } else if (operation === 'subtract') {
      if (item.stockLevels.current < qty) {
        return ApiResponse.error(res, `Insufficient stock. Available: ${item.stockLevels.current}`, 400);
      }
      item.stockLevels.current -= qty;
    } else {
      return ApiResponse.error(res, 'Operation must be add or subtract', 400);
    }

    item.consumptionHistory.push({
      quantity: operation === 'add' ? qty : -qty,
      date: new Date(),
      orderId: orderId || undefined,
      issuedBy: req.user._id,
      purpose: reason,
    });

    await item.save();

    const alert = item.stockLevels.current <= item.stockLevels.reorderPoint;

    return ApiResponse.success(res, { item, alert }, `Stock ${operation === 'add' ? 'increased' : 'decreased'} by ${qty}`);
  } catch (err) {
    next(err);
  }
};

exports.createReorder = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return ApiResponse.error(res, 'Inventory item not found', 404);
    }

    const reorderQuantity = item.stockLevels.maximum - item.stockLevels.current;
    if (reorderQuantity <= 0) {
      return ApiResponse.error(res, 'Stock level is at or above maximum', 400);
    }

    const reorderRequest = {
      item: item.name,
      rawMaterialId: item.rawMaterialId,
      currentStock: item.stockLevels.current,
      reorderPoint: item.stockLevels.reorderPoint,
      reorderQuantity,
      unitOfMeasure: item.unitOfMeasure,
      supplier: item.supplier,
      requestedBy: req.user._id,
      requestDate: new Date(),
    };

    const Notification = require('../models/Notification');
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin', active: true });

    const notifications = admins.map(admin => ({
      recipient: admin._id,
      sender: req.user._id,
      type: 'system',
      title: 'Reorder Request',
      message: `Reorder requested for ${item.name} (${item.rawMaterialId}). Qty: ${reorderQuantity} ${item.unitOfMeasure}`,
      link: `/inventory/${item._id}`,
      priority: 'high',
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return ApiResponse.success(res, reorderRequest, 'Reorder request submitted');
  } catch (err) {
    next(err);
  }
};

exports.getInventoryAnalytics = async (req, res, next) => {
  try {
    const categoryCounts = await Inventory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stockLevels.current' } } },
    ]);

    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$stockLevels.current', '$stockLevels.reorderPoint'] },
    }).select('name rawMaterialId stockLevels category');

    const totalValue = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stockLevels.current', '$costPerUnit'] } },
          totalItems: { $sum: 1 },
        },
      },
    ]);

    return ApiResponse.success(res, {
      categoryCounts,
      lowStockItems,
      totalValue: totalValue[0] || { totalValue: 0, totalItems: 0 },
      lowStockCount: lowStockItems.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.getReorderItems = async (req, res, next) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ['$stockLevels.current', '$stockLevels.reorderPoint'] },
    }).sort({ 'stockLevels.current': 1 });

    return ApiResponse.success(res, items);
  } catch (err) {
    next(err);
  }
};

exports.bulkStockAdjust = async (req, res, next) => {
  try {
    const { adjustments } = req.body;
    if (!adjustments || !Array.isArray(adjustments) || !adjustments.length) {
      return ApiResponse.badRequest(res, 'adjustments array is required');
    }

    const updated = [];
    for (const adj of adjustments) {
      const item = await Inventory.findById(adj.id);
      if (!item) continue;

      const qty = Number(adj.quantity) || 0;
      if (adj.action === 'add') {
        item.stockLevels.current += qty;
      } else if (adj.action === 'subtract') {
        item.stockLevels.current = Math.max(0, item.stockLevels.current - qty);
      } else if (adj.action === 'set') {
        item.stockLevels.current = Math.max(0, qty);
      }

      await item.save();
      updated.push({ id: item._id, name: item.name, newStock: item.stockLevels.current });
    }

    return ApiResponse.success(res, { count: updated.length, updated }, 'Bulk stock adjustment completed');
  } catch (err) {
    next(err);
  }
};

