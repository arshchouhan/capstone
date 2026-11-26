const Plant = require('../models/Plant');
const Scan = require('../models/Scan');
const CareTask = require('../models/CareTask');
const LightReading = require('../models/LightReading');
const SoilMoistureCheck = require('../models/SoilMoistureCheck');
const { inspectPlantLocation } = require('../services/plantSatelliteService');
const {pick,plantFor,page,ok,fail} = require('./helpers');
const fields = ['name','scientific','type','variety','location','acquired','light','watering','notes','image'];
function plantFields(body) {
  const profile = pick(body, fields);
  const coordinates = body.coordinates;
  if (coordinates === undefined) return profile;
  if (coordinates === null) return { ...profile, coordinates: null };
  const { latitude, longitude, accuracy } = coordinates;
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
      (accuracy !== undefined && (!Number.isFinite(accuracy) || accuracy < 0))) {
    throw fail(400, 'Enter valid latitude and longitude coordinates.');
  }
  return { ...profile, coordinates: { latitude, longitude, accuracy } };
}
exports.list = async(req,res) => { const {limit,skip}=page(req); ok(res,await Plant.find({owner:req.user._id}).sort({createdAt:-1}).skip(skip).limit(limit)); };
exports.create = async(req,res) => {
  const {id}=require('./helpers');
  const profile = plantFields(req.body);
  const scanIds=req.body.scanIds;
  if(!Array.isArray(scanIds)||scanIds.length<3)throw fail(400,'Complete plant, disease and weed scans first.');
  scanIds.forEach(id);
  const scans=await Scan.find({_id:{$in:scanIds},owner:req.user._id,state:'complete',plant:{$exists:false}});
  if(!['Plant Identifier','Disease Identifier','Weed Identifier'].every(kind=>scans.some(scan=>scan.kind===kind)))throw fail(400,'Required scans are missing or already registered.');
  const identity=scans.find(scan=>scan.kind==='Plant Identifier'),disease=scans.find(scan=>scan.kind==='Disease Identifier');
  const plant=new Plant({...profile,owner:req.user._id,image:identity?.photos[0],aiCareRequirements:identity?.result?.aiCareRequirements,latestScan:disease?._id});
  const reading=req.body.lightReading?new LightReading({...pick(req.body.lightReading,['brightness','lux','category','source','measuredAt']),plant:plant._id,owner:req.user._id}):null;
  const moisture = req.body.soilMoistureCheck ? new SoilMoistureCheck({
    ...pick(req.body.soilMoistureCheck, ['condition', 'meterPercent', 'notes', 'checkedAt']), plant: plant._id, owner: req.user._id,
  }) : null;
  await Promise.all([plant.validate(), reading?.validate(), moisture?.validate()]);
  const session=await Plant.startSession();
  try {
    await session.withTransaction(async () => {
      await plant.save({ session });
      const attached = await Scan.updateMany({ _id: { $in: scans.map(scan => scan._id) }, owner: req.user._id, plant: { $exists: false } }, { $set: { plant: plant._id } }, { session });
      if (attached.modifiedCount !== scans.length) throw fail(409, 'Scans were already registered. Refresh and try again.');
      if (reading) await reading.save({ session });
      if (moisture) await moisture.save({ session });
    });
  } finally { await session.endSession(); }
  ok(res,plant,201);
};
exports.get = async (req, res) => {
  const plant = (await plantFor(req)).toJSON();
  const filter = { owner: req.user._id, plant: plant._id };
  const [scans, nextCare, lightReading, soilMoistureCheck] = await Promise.all([
    Scan.find({ ...filter, state: 'complete' }).sort({ completedAt: -1, createdAt: -1 }),
    CareTask.findOne(filter).sort({ due: 1, _id: 1 }).select('type due').lean(),
    LightReading.findOne({ ...filter, sample: { $ne: true } }).sort({ measuredAt: -1 }),
    SoilMoistureCheck.findOne(filter).sort({ checkedAt: -1, _id: -1 }),
  ]);
  plant.scanResults = {};
  for (const scan of scans) {
    if (scan.result && !plant.scanResults[scan.kind]) {
      plant.scanResults[scan.kind] = { ...scan.result.toObject(), scannedAt: scan.completedAt || scan.createdAt, scanId: scan.id, source: scan.source, sample: scan.sample };
      if (scan.kind === 'Insect Identifier') plant.scanResults[scan.kind].photo = scan.photos[scan.result.photoIndex ?? 0];
    }
  }
  const identity = plant.scanResults['Plant Identifier'];
  if (identity?.aiCareRequirements) plant.aiCareRequirements = identity.aiCareRequirements;
  const latestScan = scans.find(scan => !scan.sample && scan.kind !== 'Insect Identifier');
  plant.lastScannedAt = latestScan?.completedAt || latestScan?.createdAt || null;
  plant.nextCare = nextCare ? { type: nextCare.type, due: nextCare.due } : null;
  plant.lightReading = lightReading || (plant.exampleProfile ? await LightReading.findOne({ ...filter, sample: true }).sort({ measuredAt: -1 }) : null);
  plant.soilMoistureCheck = soilMoistureCheck;
  ok(res, plant);
};
exports.update = async(req,res) => { const plant=await plantFor(req); Object.assign(plant,plantFields(req.body)); await plant.save(); ok(res,plant); };
exports.satellite = async (req, res) => {
  const plant = await plantFor(req);
  if (!plant.coordinates) throw fail(400, 'Save the plant coordinates first.');
  res.set('Cache-Control', 'private, no-store');
  try {
    ok(res, await inspectPlantLocation(plant.coordinates));
  } catch {
    throw fail(502, 'Satellite vegetation data is temporarily unavailable. Try again later.');
  }
};
exports.remove = async(req,res) => { const plant=await plantFor(req); await plant.deleteOne(); for(const name of ['Scan','CareTask','LightReading','SoilMoistureCheck','RecoveryObservation','CalculatorRecord','Formulation','TreatmentPlan']) await require(`../models/${name}`).deleteMany({plant:plant._id,owner:req.user._id}); ok(res,{deleted:true}); };
