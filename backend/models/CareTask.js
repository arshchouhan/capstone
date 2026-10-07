const { Schema, model } = require('mongoose');
const { owner, plant, text, options } = require('./schemaHelpers');
module.exports = model('CareTask', new Schema({ owner, plant, type: { type:String, enum:['Water','Fertilize','Prune','Inspect'], required:true }, frequency:{ type:Number, required:true, min:1,max:365,validate:Number.isInteger }, due:{type:Date,required:true}, notes:text(1000), lastCompleted:Date, completions:[Date] }, options));
