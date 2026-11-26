const Scan=require('../models/Scan');
const directory=require('../services/botanistDirectoryService');
const {fail,id,ok}=require('./helpers');

exports.recommend=async(req,res)=>{
  const scan=await Scan.findOne({_id:id(req.params.scanId),owner:req.user._id,state:'complete'});
  if(!scan)throw fail(404,'Completed scan not found.');
  const result=scan.result||{};
  const disease=result.findings?.[0]?.label||result.status||'';
  const matches=await directory.findNearby({plant:result.name,disease,latitude:req.query.latitude,longitude:req.query.longitude});
  ok(res,{...matches,plant:result.name||'Plant',diagnosis:disease});
};
