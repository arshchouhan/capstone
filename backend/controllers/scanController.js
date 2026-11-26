const Scan=require('../models/Scan'),Plant=require('../models/Plant'),service=require('../services/scanService'),overview=require('../services/plantOverviewService');
const {plantFor,pick,id,page,ok,fail}=require('./helpers');
exports.list=async(req,res)=>{if(req.params.plantId)await plantFor(req);const {limit,skip}=page(req);ok(res,await Scan.find({owner:req.user._id,...(req.params.plantId?{plant:req.params.plantId}:{})}).sort({createdAt:-1}).skip(skip).limit(limit));};
exports.unsaved=async(req,res)=>{const {limit,skip}=page(req);ok(res,await Scan.find({owner:req.user._id,plant:null,state:'complete',kind:{$ne:'Insect Identifier'}}).sort({createdAt:-1}).skip(skip).limit(limit));};
exports.get=async(req,res)=>{const scan=await Scan.findOne({_id:id(req.params.scanId),owner:req.user._id});if(!scan)throw fail(404,'Scan not found.');ok(res,scan);};
exports.overview=async(req,res)=>{const scan=await Scan.findOne({_id:id(req.params.scanId),owner:req.user._id});if(!scan)throw fail(404,'Scan not found.');const profile=scan.kind==='Insect Identifier'?null:await overview.forResult(scan.result);ok(res,{available:Boolean(profile),profile});};
exports.remove=async(req,res)=>{const scan=await Scan.findOne({_id:id(req.params.scanId),owner:req.user._id});if(!scan)throw fail(404,'Scan not found.');if(scan.plant)throw fail(409,'Only unregistered scans can be deleted here.');await scan.deleteOne();ok(res,{id:req.params.scanId});};
exports.create = async (req, res) => {
  const plant = req.params.plantId ? await plantFor(req) : null;
  const { kind, photos } = req.body;
  const isInsect = kind === 'Insect Identifier';
  if (!Array.isArray(photos) || !photos.length || photos.length > (isInsect ? 1 : 3) ||
      photos.some(photo => typeof photo !== 'string' || !photo.startsWith(`/api/media/${req.user._id}-`))) {
    throw fail(400, isInsect ? 'Select one uploaded insect photo.' : 'Select one to three uploaded photos.');
  }
  const provider = service.provider();
  const scan = await Scan.create({
    ...pick(req.body, ['kind', 'notes']), photos, plant: req.params.plantId, owner: req.user._id,
    state: 'processing', source: isInsect || ['agrismart', 'huggingface', 'local', 'team-resnet'].includes(provider) ? 'ai' : 'demo',
  });
  try {
    if (plant && !isInsect) {
      const CareTask = require('../models/CareTask');
      const filter = { plant: plant._id, owner: req.user._id };
      [scan.totalTasks, scan.tasksComplete] = await Promise.all([
        CareTask.countDocuments(filter), CareTask.countDocuments({ ...filter, lastCompleted: { $exists: true } }),
      ]);
    }
    scan.result = await service.analyze(scan, plant);
    scan.state = 'complete';
    scan.completedAt = new Date();
    await scan.save();
    if (scan.plant && !isInsect) {
      await Plant.updateOne({ _id: scan.plant, owner: req.user._id }, { $set: { latestScan: scan._id } });
    }
    ok(res, scan, 201);
  } catch (error) {
    scan.state = 'failed';
    scan.error = 'Analysis failed.';
    await scan.save();
    throw error;
  }
};
exports.attach=async(req,res)=>{await plantFor(req);const scan=await Scan.findOne({_id:id(req.params.scanId),owner:req.user._id});if(!scan)throw fail(404,'Scan not found.');const result=scan.result||{},unusable=result.isPlant===false||result.status==='Needs better photo'||/not suitable for plant analysis|does not appear to show a plant/i.test(result.summary||'');if(unusable&&scan.kind!=='Insect Identifier')throw fail(422,'This scan cannot be registered because AI could not confirm that the uploaded image is a plant. Upload a clear plant photo and scan again.');if(scan.plant&&String(scan.plant)!==req.params.plantId)throw fail(409,'Scan belongs to another plant.');scan.plant=req.params.plantId;await scan.save();ok(res,scan);};
