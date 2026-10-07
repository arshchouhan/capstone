const { Schema, model } = require('mongoose');
const { owner, options } = require('./schemaHelpers');
module.exports = model('Cart', new Schema({ owner:{...owner,unique:true}, items:[{ _id:false, product:{type:Schema.Types.ObjectId,ref:'Product',required:true}, quantity:{type:Number,min:1,max:100,validate:Number.isInteger,required:true} }] }, options));
