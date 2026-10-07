const { Schema, model } = require('mongoose');
const { owner, text, options } = require('./schemaHelpers');
module.exports = model('Comment', new Schema({ owner, post:{type:Schema.Types.ObjectId,ref:'CommunityPost',required:true,index:true}, body:text(2000,true) }, options));
