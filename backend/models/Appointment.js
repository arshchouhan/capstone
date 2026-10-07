const { Schema, model } = require('mongoose');
const { owner, text, options } = require('./schemaHelpers');
const schema = new Schema({ owner, expert:{type:Schema.Types.ObjectId,ref:'Expert',required:true}, startsAt:{type:Date,required:true}, status:{type:String,enum:['booked','cancelled','completed'],default:'booked'}, notes:text(2000) }, options);
schema.index({ expert:1, startsAt:1 }, {unique:true,partialFilterExpression:{status:'booked'}});
module.exports = model('Appointment', schema);
