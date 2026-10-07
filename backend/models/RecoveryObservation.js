const { Schema, model } = require('mongoose');
const { owner, plant, text, options } = require('./schemaHelpers');
module.exports = model('RecoveryObservation', new Schema({ owner, plant, scan:{type:Schema.Types.ObjectId,ref:'Scan'}, condition:{type:String,enum:['Improving','Unchanged','Worsening'],required:true}, notes:text(3000), recordedAt:{type:Date,default:Date.now} }, options));
