const { Schema, model } = require('mongoose');
const { owner, plant, text, options } = require('./schemaHelpers');
module.exports = model('Formulation', new Schema({ owner, plant, name:text(120,true), crop:text(120), disease:text(200), mode:{type:String,enum:['trees','field'],required:true}, dose:{type:Number,min:0,required:true}, unit:{type:String,enum:['ml','g','mL','kg','L'],required:true}, rateUnit:text(60) }, options));
