const { Schema, model } = require('mongoose');
const { text, options } = require('./schemaHelpers');
module.exports = model('Product', new Schema({ name:text(160,true), description:text(3000), category:{type:String,enum:['Treatments','Fertilizers','Tools','Plants'],required:true}, image:text(500), price:{type:Number,min:0,required:true}, stock:{type:Number,min:0,default:0,validate:Number.isInteger}, active:{type:Boolean,default:true} }, options));
