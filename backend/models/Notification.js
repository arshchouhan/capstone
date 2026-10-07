const { Schema, model } = require('mongoose');
const { owner, text, options } = require('./schemaHelpers');
module.exports = model('Notification', new Schema({ owner, title:text(120,true), body:text(1000), link:text(300), readAt:Date, kind:{type:String,enum:['care','scan','appointment','community'],required:true} }, options));
