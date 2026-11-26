const Product=require('../models/Product'),Cart=require('../models/Cart');
const {id,pick,page,ok,fail}=require('./helpers');
const Scan=require('../models/Scan'),marketplace=require('../services/marketplaceRecommendationService');
exports.list=async(req,res)=>{const {limit,skip}=page(req);ok(res,await Product.find({active:true}).sort({createdAt:-1}).skip(skip).limit(limit));};
exports.create=async(req,res)=>ok(res,await Product.create(pick(req.body,['name','description','category','image','price','stock'])),201);
exports.cart=async(req,res)=>ok(res,await Cart.findOne({owner:req.user._id}).populate('items.product')||{items:[]});
exports.setItem=async(req,res)=>{const quantity=req.body.quantity;if(!Number.isInteger(quantity)||quantity<0||quantity>100)throw fail(400,'Invalid quantity.');const product=await Product.findOne({_id:id(req.params.productId),active:true});if(!product)throw fail(404,'Product not found.');if(quantity>product.stock)throw fail(409,'Not enough stock available.');const cart=await Cart.findOneAndUpdate({owner:req.user._id},{$setOnInsert:{items:[]}},{upsert:true,returnDocument:'after'});const updated=cart.items.filter(item=>String(item.product)!==String(product._id));if(quantity)updated.push({product:product._id,quantity});const saved=await Cart.findOneAndUpdate({_id:cart._id,updatedAt:cart.updatedAt},{$set:{items:updated}},{returnDocument:'after',runValidators:true});if(!saved)throw fail(409,'Cart changed. Retry.');ok(res,await saved.populate('items.product'));};
exports.recommendations=async(req,res)=>{
  if(req.query.preview==='1')return ok(res,await marketplace.merchantPreview(req.query));
  if(req.query.scanId){
    const scan=await Scan.findOne({_id:id(req.query.scanId),owner:req.user._id,state:'complete','result.isPlant':true});
    if(!scan)throw fail(404,'That completed plant scan was not found.');
    const diagnosis=scan.result?.findings?.[0]?.label||scan.result?.name||'';
    return ok(res,{...(await marketplace.forDiagnosis(diagnosis)),scanId:scan._id,hasScan:true,personalized:true,catalog:marketplace.catalog()});
  }
  ok(res,{...(await marketplace.forCatalog({crop:req.query.crop})),scanId:null,hasScan:false,personalized:false});
};
