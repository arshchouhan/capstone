const Plant = require('../models/Plant');
const CareTask = require('../models/CareTask');
const Scan = require('../models/Scan');
const { ok } = require('./helpers');
exports.get = async (req, res) => {
  const owner = req.user._id;
  const [plants, tasks, recentScans, taskCount] = await Promise.all([
    Plant.find({ owner }).sort({ createdAt: -1 }),
    CareTask.find({ owner }).populate('plant', 'name').sort({ due: 1 }).limit(12),
    Scan.find({ owner, state: 'complete' }).sort({ completedAt: -1 }).limit(6),
    CareTask.countDocuments({ owner }),
  ]);
  ok(res, { plants, tasks, recentScans, taskCount });
};
