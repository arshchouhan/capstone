const { Schema, model } = require('mongoose');
const { owner, options } = require('./schemaHelpers');
module.exports = model('UserPreference', new Schema({ owner:{...owner,unique:true}, latitude:{type:Number,min:-90,max:90}, longitude:{type:Number,min:-180,max:180}, units:{type:String,enum:['metric','imperial'],default:'metric'}, notifications:{type:Boolean,default:true} }, options));
