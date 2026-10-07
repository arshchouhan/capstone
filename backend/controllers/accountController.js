const Notification=require('../models/Notification'),Preference=require('../models/UserPreference');
const {id,pick,ok,fail}=require('./helpers');
exports.me=async(req,res)=>ok(res,req.user);
exports.preferences=async(req,res)=>ok(res,await Preference.findOne({owner:req.user._id})||{});
exports.savePreferences=async(req,res)=>ok(res,await Preference.findOneAndUpdate({owner:req.user._id},{$set:pick(req.body,['latitude','longitude','units','notifications'])},{returnDocument:'after',upsert:true,runValidators:true}));
exports.notifications=async(req,res)=>ok(res,await Notification.find({owner:req.user._id}).sort({createdAt:-1}).limit(100));
exports.readNotification=async(req,res)=>{const record=await Notification.findOneAndUpdate({_id:id(req.params.notificationId),owner:req.user._id},{$set:{readAt:new Date()}},{returnDocument:'after'});if(!record)throw fail(404,'Notification not found.');ok(res,record);};
exports.logout=(req,res)=>{res.clearCookie('authToken');req.session?.destroy(()=>{});ok(res,{loggedOut:true});};
