const {Schema,model}=require('mongoose');
const {owner,text,options}=require('./schemaHelpers');
module.exports=model('MeetRequest',new Schema({owner,expert:{type:Schema.Types.ObjectId,ref:'Expert',required:true,index:true},startsAt:{type:Date,required:true},message:text(1000),status:{type:String,enum:['pending','accepted','declined'],default:'pending'},demo:{type:Boolean,default:false},response:text(1000),respondedAt:Date,meetUrl:String,googleEventId:String},options));
