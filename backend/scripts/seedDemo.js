// Repeatable demo data. Existing accounts and unrelated records are preserved.
require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const connect = require('../config/db');
const models = Object.fromEntries(['User','Plant','Scan','CareTask','RecoveryObservation','LightReading','CalculatorRecord','Formulation','TreatmentPlan','Expert','Appointment','Product','Cart','CommunityPost','Comment','Notification','UserPreference'].map(name => [name, require(`../models/${name}`)]));
const { calculate } = require('../services/calculationService');
const email = 'arshchouhan246@gmail.com';
async function upsert(name, query, data) {
  return models[name].findOneAndUpdate(query, { $setOnInsert: data }, { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true });
}
async function main() {
  await connect();
  let user = await models.User.findOne({ email });
  let password;
  if (!user) {
    password = `Plant!${crypto.randomBytes(12).toString('base64url')}`;
    user = await models.User.create({ email, fullName: 'Arsh Chouhan', password: await bcrypt.hash(password, 12), role: 'user', demoAccount:true });
    console.log(JSON.stringify({email, password, created:true}));
  }
  const owner = user._id;
  const uploads = path.join(__dirname, '../uploads');
  await fs.mkdir(uploads, { recursive: true });
  const definitions = [
    ['Basil','Ocimum basilicum','Herb','plant_basil.jpg','Healthy',92],
    ['Tomato','Solanum lycopersicum','Vegetable','plant_tomato.jpg','Needs Care',76],
    ['Chili','Capsicum annuum','Vegetable','plant_chili.jpg','Healthy',88],
    ['Money Plant','Epipremnum aureum','Indoor','plant-types/indoor.png','Healthy',90],
    ['Flowering plant','Flowering ornamental','Flowering','plant-types/flowering.png','Needs Care',81],
  ];
  const plants = [];
  const now = new Date();
  for (const [name,scientific,type,asset,status,score] of definitions) {
    const hash = crypto.createHash('sha256').update(`${owner}:${name}:demo-photo`).digest('hex').slice(0,32);
    const uuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20)}`;
    const filename = `${owner}-${uuid}.${asset.endsWith('.png')?'png':'jpeg'}`;
    await fs.copyFile(path.join(__dirname, '../../frontend/src/assets', asset), path.join(uploads, filename));
    const photo = `/api/media/${filename}`;
    const plant = await upsert('Plant', { owner, name }, { owner, name, scientific, type, image:photo, status, location:'Balcony garden', acquired:new Date(now.getTime()-30*86400000), light:type==='Indoor'?'Bright indirect light':'Bright morning light', watering:'Check the soil before watering', notes:'Demo garden plant', aiCareRequirements:{temperature:'18–30°C',hardiness:'Protect from frost',light:'Bright indirect light',soil:'Well-draining potting mix',location:'Sheltered, ventilated spot',source:'demo'} });
    plants.push(plant);
    const tasks = [];
    for (const [taskType, frequency, days] of [['Water',3,1],['Fertilize',14,5],['Prune',21,7],['Inspect',7,2]]) {
      tasks.push(await upsert('CareTask',{owner,plant:plant._id,type:taskType},{owner,plant:plant._id,type:taskType,frequency,due:new Date(now.getTime()+days*86400000),notes:`${taskType} ${name.toLowerCase()} as needed`,lastCompleted:taskType==='Inspect'?new Date(now.getTime()-86400000):undefined}));
    }
    let latest;
    for (let index=0;index<7;index++) {
      const kind=index===0?'Plant Identifier':index===1?'Weed Identifier':index===2?'Disease Identifier':'Recovery check';
      const completedAt=new Date(now.getTime()-(6-index)*3600000);
      const note=`Demo garden scan ${index+1}: ${name}`;
      latest=await upsert('Scan',{owner,plant:plant._id,notes:note},{owner,plant:plant._id,kind,photos:[photo],notes:note,state:'complete',source:'demo',completedAt,tasksComplete:1,totalTasks:4,result:{name,scientific,type,status,score:Math.min(99,score-6+index),summary:status==='Healthy'?`${name} has an even leaf colour and steady growth. Keep its routine consistent and inspect new leaves regularly.`:`Review the older leaves on ${name.toLowerCase()} and check soil moisture. Keep affected leaves under observation and photograph any changes.`,findings:status==='Healthy'?[]:[{label:'Older leaf damage',description:'Inspect older leaves and monitor new growth.'}],light:plant.light,watering:plant.watering}});
    }
    if (!plant.latestScan) await models.Plant.updateOne({_id:plant._id},{$set:{latestScan:latest._id}});
    await upsert('LightReading',{owner,plant:plant._id,category:'Bright indirect'},{owner,plant:plant._id,brightness:68,lux:850,category:'Bright indirect',source:'webcam-estimate',measuredAt:now});
    for (const [condition,notes,days] of [['Unchanged','Leaves and soil checked; routine care continued.',2],['Improving','New growth is visible and the leaves look firmer.',0]]) await upsert('RecoveryObservation',{owner,plant:plant._id,notes},{owner,plant:plant._id,scan:latest._id,condition,notes,recordedAt:new Date(now.getTime()-days*86400000)});
    await upsert('TreatmentPlan',{owner,plant:plant._id},{owner,plant:plant._id,completed:['light','moisture']});
    const inputs={cost:1200,yieldKg:25,price:90,targetProfit:0};
    await upsert('CalculatorRecord',{owner,plant:plant._id,mode:'profit'},{owner,plant:plant._id,mode:'profit',inputs,result:calculate('profit',inputs)});
    await models.CalculatorRecord.updateOne({owner,plant:plant._id,mode:'profit','inputs.cost':1200},{$set:{result:calculate('profit',inputs)}});
    await upsert('Formulation',{owner,plant:plant._id,name:'Routine feeding'},{owner,plant:plant._id,name:'Routine feeding',crop:name,mode:'trees',dose:2,unit:'ml',rateUnit:'Litre'});
  }
  const expert=await upsert('Expert',{name:'Demo garden specialist'},{name:'Demo garden specialist',specialty:'Plant health',description:'Garden care and leaf health consultations',rating:4.8,reviews:24,active:true});
  await upsert('Expert',{name:'Demo indoor specialist'},{name:'Demo indoor specialist',specialty:'Indoor plants',description:'Indoor light, watering and growing conditions',rating:4.7,reviews:18,active:true});
  const startsAt=new Date(now); startsAt.setDate(startsAt.getDate()+1); startsAt.setHours(15,0,0,0);
  await upsert('Appointment',{owner,expert:expert._id,notes:'Demo garden consultation'},{owner,expert:expert._id,startsAt,status:'booked',notes:'Demo garden consultation'});
  const products=[];
  for (const [name,category,price] of [['Garden pruning scissors','Tools',249],['Organic plant feed','Fertilizers',199],['Moisture meter','Tools',399],['Indoor potting mix','Fertilizers',179],['Basil starter plant','Plants',129],['Leaf care spray','Treatments',229]]) products.push(await upsert('Product',{name},{name,category,price,stock:25,active:true,description:`${name} for your garden`}));
  await upsert('Cart',{owner},{owner,items:[{product:products[0]._id,quantity:1},{product:products[1]._id,quantity:1}]});
  const topics=[['My balcony garden','Growing Tips','Five plants, a bright growing spot, and a regular soil check. Sharing my garden setup.'],['Keeping basil healthy','Plant Health','What is your favourite way to encourage bushier basil growth?'],['Indoor plant watering routine','Indoor Plants','I check the soil before watering and keep the pots draining freely.']];
  for (const [title,category,body] of topics) {
    const post=await upsert('CommunityPost',{owner,title},{owner,title,category,body,image:plants[0].image,replyCount:0});
    await upsert('Comment',{owner,post:post._id,body:'Regular checks and consistent light have worked well in my garden.'},{owner,post:post._id,body:'Regular checks and consistent light have worked well in my garden.'});
    await models.CommunityPost.updateOne({_id:post._id},{$set:{replyCount:await models.Comment.countDocuments({post:post._id})}});
  }
  for (const [title,kind,body] of [['Your garden is ready','scan','Open Diagnosis to view your saved scans.'],['Watering check tomorrow','care','Check the soil on your balcony plants.'],['Garden consultation booked','appointment','Your demo consultation is scheduled for tomorrow.']]) await upsert('Notification',{owner,title},{owner,title,kind,body});
  await upsert('UserPreference',{owner},{owner,units:'metric',notifications:true});
  const counts={};
  for (const name of ['Plant','Scan','CareTask','RecoveryObservation','CalculatorRecord','Formulation','Appointment','CommunityPost']) counts[name]=await models[name].countDocuments({owner});
  console.log(JSON.stringify({email,created:!!password,...(password?{password}:{password:'Existing password preserved'}),counts},null,2));
}
main().catch(error=>{console.error(`Demo setup failed: ${error.name}: ${error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g,'[database address]')}`);process.exitCode=1}).finally(()=>mongoose.disconnect());
