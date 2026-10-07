const { Schema, model } = require('mongoose');
const { owner, plant, options } = require('./schemaHelpers');
module.exports = model('LightReading', new Schema({ owner, plant, brightness:{type:Number,min:0,max:100}, lux:{type:Number,min:0}, category:{type:String,enum:['Low light','Medium light','Bright light','Bright indirect','Strong light'],required:true}, source:{type:String,enum:['webcam-estimate','ambient-sensor'],required:true}, measuredAt:{type:Date,default:Date.now} }, options));
