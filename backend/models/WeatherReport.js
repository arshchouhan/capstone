const {Schema,model}=require('mongoose');const {owner,options}=require('./schemaHelpers');
const schema=new Schema({owner,latitude:Number,longitude:Number,current:Schema.Types.Mixed,hourly:Schema.Types.Mixed,expiresAt:Date},options);schema.index({expiresAt:1},{expireAfterSeconds:0});module.exports=model('WeatherReport',schema);
