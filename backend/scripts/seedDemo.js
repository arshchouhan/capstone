// Repeatable demo data. Existing accounts and unrelated records are preserved.
require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const connect = require('../config/db');
const models = Object.fromEntries(['User','Plant','Scan','CareTask','RecoveryObservation','LightReading','CalculatorRecord','Formulation','TreatmentPlan','Expert','Appointment','Product','Cart','CommunityPost','Comment','Notification','UserPreference'].map(name => [name, require(`../models/${name}`)]));
const { calculate } = require('../services/calculationService');
const { refreshPlantExamples, addSampleRecoveryChecks } = require('./demoPlantScans');
const { seedDemoPlantProfiles } = require('./seedDemoPlantProfiles');
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
  const { plants } = await refreshPlantExamples(owner);
  await seedDemoPlantProfiles(owner);
  const now = new Date();
  for (const plant of plants) {
    const { name } = plant;
    await addSampleRecoveryChecks(owner, plant);
    for (const [taskType, frequency, days] of [['Water',3,1],['Fertilize',14,5],['Prune',21,7],['Inspect',7,2]]) {
      await upsert('CareTask',{owner,plant:plant._id,type:taskType},{owner,plant:plant._id,type:taskType,frequency,due:new Date(now.getTime()+days*86400000),notes:`${taskType} ${name.toLowerCase()} as needed`,lastCompleted:taskType==='Inspect'?new Date(now.getTime()-86400000):undefined});
    }
    await upsert('TreatmentPlan',{owner,plant:plant._id},{owner,plant:plant._id,completed:['light','moisture']});
    const inputs={cost:1200,yieldKg:25,price:90,targetProfit:0};
    await upsert('CalculatorRecord',{owner,plant:plant._id,mode:'profit'},{owner,plant:plant._id,mode:'profit',inputs,result:calculate('profit',inputs)});
    await models.CalculatorRecord.updateOne({owner,plant:plant._id,mode:'profit','inputs.cost':1200},{$set:{result:calculate('profit',inputs)}});
    await upsert('Formulation',{owner,plant:plant._id,name:'Routine feeding'},{owner,plant:plant._id,name:'Routine feeding',crop:name,mode:'trees',dose:2,unit:'ml',rateUnit:'Litre'});
  }
  const doctorLogins = await require('./seedDemoDoctors').seedDemoDoctors();
  if (doctorLogins.length) console.log(JSON.stringify({ demoDoctorLogins: doctorLogins }));
  const expert = await models.Expert.findOne({ name: 'Dr. Mira Sen', demo: true });
  const startsAt=new Date(now); startsAt.setDate(startsAt.getDate()+1); startsAt.setHours(15,0,0,0);
  await upsert('Appointment',{owner,expert:expert._id,notes:'Demo garden consultation'},{owner,expert:expert._id,startsAt,status:'booked',notes:'Demo garden consultation'});
  const products=[];
  for (const [name,category,price] of [['Garden pruning scissors','Tools',249],['Organic plant feed','Fertilizers',199],['Moisture meter','Tools',399],['Indoor potting mix','Fertilizers',179],['Basil starter plant','Plants',129],['Leaf care spray','Treatments',229]]) products.push(await upsert('Product',{name},{name,category,price,stock:25,active:true,description:`${name} for your garden`}));
  await upsert('Cart',{owner},{owner,items:[{product:products[0]._id,quantity:1},{product:products[1]._id,quantity:1}]});
  const topics=[['My balcony garden','Growing Tips','Five plants, a bright growing spot, and a regular soil check. Sharing my garden setup.'],['Keeping basil healthy','Plant Health','What is your favourite way to encourage bushier basil growth?'],['Indoor plant watering routine','Indoor Plants','I check the soil before watering and keep the pots draining freely.']];
  for (const [title,category,body] of topics) {
    const post=await upsert('CommunityPost',{owner,title},{owner,title,category,body,image:plants[0]?.image,replyCount:0});
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
