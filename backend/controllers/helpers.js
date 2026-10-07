const mongoose = require('mongoose');
const Plant = require('../models/Plant');
exports.fail = (status,message) => Object.assign(new Error(message),{status});
exports.pick = (body,fields) => Object.fromEntries(fields.filter(field => body[field] !== undefined).map(field => [field,body[field]]));
exports.id = value => { if (!mongoose.isValidObjectId(value)) throw exports.fail(400,'Invalid record ID.'); return value; };
exports.plantFor = async req => { const plant = await Plant.findOne({_id:exports.id(req.params.plantId),owner:req.user._id}); if (!plant) throw exports.fail(404,'Plant not found.'); return plant; };
exports.page = req => ({ limit:Math.min(100,Math.max(1,Number(req.query.limit)||50)), skip:Math.max(0,Number(req.query.offset)||0) });
exports.ok = (res,data,status=200) => res.status(status).json({success:true,data});
