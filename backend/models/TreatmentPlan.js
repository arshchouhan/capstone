const {Schema,model}=require('mongoose');const {owner,plant,options}=require('./schemaHelpers');
module.exports=model('TreatmentPlan',new Schema({owner,plant,completed:{type:[String],validate:values=>values.every(value=>['light','moisture','leaves','followup'].includes(value))}},{...options}));
