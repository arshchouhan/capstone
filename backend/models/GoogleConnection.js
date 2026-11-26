const {Schema,model}=require('mongoose');
module.exports=model('GoogleConnection',new Schema({owner:{type:Schema.Types.ObjectId,ref:'User',required:true,unique:true},email:String,refreshToken:{type:String,select:false},scope:String},{timestamps:true}));
