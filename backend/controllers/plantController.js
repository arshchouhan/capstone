const Plant = require('../models/Plant');
const Scan = require('../models/Scan');
const LightReading = require('../models/LightReading');
const {pick,plantFor,page,ok} = require('./helpers');
const fields = ['name','scientific','type','variety','location','acquired','light','watering','notes','image'];
exports.list = async(req,res) => { const {limit,skip}=page(req); ok(res,await Plant.find({owner:req.user._id}).sort({createdAt:-1}).skip(skip).limit(limit)); };
exports.create = async(req,res) => {
  const {id,fail}=require('./helpers');
  const scanIds=req.body.scanIds;
  if(!Array.isArray(scanIds)||scanIds.length<3)throw fail(400,'Complete plant, disease and weed scans first.');
  scanIds.forEach(id);
  const scans=await Scan.find({_id:{$in:scanIds},owner:req.user._id,state:'complete',plant:{$exists:false}});
  if(!['Plant Identifier','Disease Identifier','Weed Identifier'].every(kind=>scans.some(scan=>scan.kind===kind)))throw fail(400,'Required scans are missing or already registered.');
  const identity=scans.find(scan=>scan.kind==='Plant Identifier'),disease=scans.find(scan=>scan.kind==='Disease Identifier');
  const plant=new Plant({...pick(req.body,fields),owner:req.user._id,image:identity?.photos[0],aiCareRequirements:identity?.result?.aiCareRequirements,latestScan:disease?._id});
  const reading=req.body.lightReading?new LightReading({...pick(req.body.lightReading,['brightness','lux','category','source','measuredAt']),plant:plant._id,owner:req.user._id}):null;
  await plant.validate(); if(reading)await reading.validate();
  const session=await Plant.startSession();
  try {await session.withTransaction(async()=>{await plant.save({session});const attached=await Scan.updateMany({_id:{$in:scans.map(scan=>scan._id)},owner:req.user._id,plant:{$exists:false}},{$set:{plant:plant._id}},{session});if(attached.modifiedCount!==scans.length)throw fail(409,'Scans were already registered. Refresh and try again.');if(reading)await reading.save({session});});}finally{await session.endSession();}
  ok(res,plant,201);
};
exports.get = async(req,res) => { const plant = (await plantFor(req)).toJSON(); const scans=await Scan.find({owner:req.user._id,plant:plant._id,state:'complete'}).sort({completedAt:-1}); plant.scanResults={}; for(const scan of scans) if(!plant.scanResults[scan.kind]) plant.scanResults[scan.kind]={...scan.result.toObject(),scannedAt:scan.completedAt,scanId:scan.id}; const identity=plant.scanResults['Plant Identifier']; if(identity?.aiCareRequirements) plant.aiCareRequirements=identity.aiCareRequirements; plant.lightReading=await LightReading.findOne({plant:plant._id,owner:req.user._id}).sort({measuredAt:-1}); ok(res,plant); };
exports.update = async(req,res) => { const plant=await plantFor(req); Object.assign(plant,pick(req.body,fields)); await plant.save(); ok(res,plant); };
exports.remove = async(req,res) => { const plant=await plantFor(req); await plant.deleteOne(); for(const name of ['Scan','CareTask','LightReading','RecoveryObservation','CalculatorRecord','Formulation','TreatmentPlan']) await require(`../models/${name}`).deleteMany({plant:plant._id,owner:req.user._id}); ok(res,{deleted:true}); };
