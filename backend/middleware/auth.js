const jwt = require('jsonwebtoken');
const User = require('../models/User');
exports.requireAuth = async (req,res,next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : req.cookies?.authToken;
    if (!token) return res.status(401).json({success:false,message:'Please sign in.'});
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    const user = await User.findById(payload.userId).select('_id fullName role email');
    if (!user) return res.status(401).json({success:false,message:'Account not found.'});
    req.user = user; next();
  } catch (error) { if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({success:false,message:'Please sign in again.'}); next(error); }
};
exports.requireAdmin = (req,res,next) => req.user.role === 'admin' ? next() : res.status(403).json({success:false,message:'Admin access required.'});
