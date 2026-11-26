const {Schema,model}=require('mongoose');
const {owner,text,options}=require('./schemaHelpers');
module.exports=model('ChatMessage',new Schema({
  owner,
  expert:{type:Schema.Types.ObjectId,ref:'Expert',index:true},
  scan:{type:Schema.Types.ObjectId,ref:'Scan',index:true},
  sender:{type:Schema.Types.ObjectId,ref:'User'},
  role:{type:String,enum:['user','assistant'],required:true},
  body:text(2000,true),
  attachment:text(300),
},options));
