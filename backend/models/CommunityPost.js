const { Schema, model } = require('mongoose');
const { owner, text, options } = require('./schemaHelpers');
module.exports = model('CommunityPost', new Schema({ owner, title:text(160,true), body:text(5000,true), category:{type:String,enum:['Plant Health','Treatment','Indoor Plants','Growing Tips'],required:true}, topic:text(100), image:text(500), likedBy:[{type:Schema.Types.ObjectId,ref:'User'}], replyCount:{type:Number,default:0,min:0} }, options));
