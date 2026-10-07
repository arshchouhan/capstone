const { Schema, model } = require('mongoose');
const { owner, plant, options } = require('./schemaHelpers');
module.exports = model('CalculatorRecord', new Schema({ owner, plant, mode:{type:String,enum:['budget','price','yield','profit','fertilizer','trees','field'],required:true}, inputs:{type:Map,of:Schema.Types.Mixed}, result:{type:Map,of:Schema.Types.Mixed} }, options));
