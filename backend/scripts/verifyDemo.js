require('dotenv').config({path:require('path').join(__dirname,'../.env'),quiet:true});
const assert=require('node:assert/strict'),mongoose=require('mongoose'),jwt=require('jsonwebtoken');
async function main(){
  await require('../config/db')();
  const user=await require('../models/User').findOne({email:'arshchouhan246@gmail.com'});
  assert.ok(user,'Demo account exists');
  const token=jwt.sign({userId:String(user._id)},process.env.JWT_SECRET||'your-secret-key-change-in-production',{expiresIn:'5m'});
  const server=require('../app').listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api`, headers={authorization:`Bearer ${token}`};
  const get=async route=>{const response=await fetch(base+route,{headers});assert.equal(response.status,200,route);return (await response.json()).data};
  try{
    if(process.env.DEMO_VERIFY_PASSWORD){const response=await fetch(base+'/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:process.env.DEMO_VERIFY_PASSWORD})});assert.equal(response.status,200,'Demo sign-in');await response.json();}
    const plants=await get('/plants');assert.ok(plants.length>=5);
    const plant=plants[0],root=`/plants/${plant.id}`;
    const scans=await get(`${root}/scans`);assert.ok(scans.length>=7);assert.ok(scans.every(scan=>scan.result?.name));
    const profile=await get(root);assert.equal(profile.name,plant.name);assert.ok(profile.scanResults['Disease Identifier']);
    const image=await fetch(base+plant.image.replace('/api',''),{headers});assert.equal(image.status,200);assert.ok(image.headers.get('content-type').startsWith('image/'));await image.arrayBuffer();
    for(const route of ['/dashboard','/cart','/products','/experts','/appointments','/community/posts','/preferences','/notifications',`${root}/care-tasks`,`${root}/recovery-observations`,`${root}/calculations`,`${root}/formulations`,`${root}/treatment-plans`])await get(route);
    const send=async(route,method,body,status=200)=>{const response=await fetch(base+route,{method,headers:{...headers,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(response.status,status,route);return(await response.json()).data};
    let task;
    try{task=await send(`${root}/care-tasks`,'POST',{type:'Inspect',frequency:7,due:new Date().toISOString(),notes:'Temporary API verification'},201);const completed=await send(`${root}/care-tasks/${task.id}/complete`,'POST');assert.ok(new Date(completed.due)>new Date());assert.ok(completed.lastCompleted);}finally{if(task)await send(`${root}/care-tasks/${task.id}`,'DELETE');}
    let calculation;
    try{calculation=await send(`${root}/calculations`,'POST',{mode:'profit',inputs:{cost:10,yieldKg:3,price:10},result:{value:999}},201);assert.equal(calculation.result.value,20,'Client cannot override computed results');const updated=await send(`${root}/calculations/${calculation.id}`,'PATCH',{result:{value:999}});assert.equal(updated.result.value,20);}finally{if(calculation)await send(`${root}/calculations/${calculation.id}`,'DELETE');}
    const registrationScans=[];let registered;
    try{
      for(const kind of ['Plant Identifier','Disease Identifier','Weed Identifier'])registrationScans.push(await send('/scans','POST',{kind,photos:[plant.image],notes:'Temporary registration verification'},201));
      const body={name:'Temporary API verification plant',type:'Herb',scanIds:registrationScans.map(scan=>scan.id)};
      await send('/plants','POST',{...body,lightReading:{source:'webcam-estimate',category:'Bright indirect',brightness:500}},400);
      registered=await send('/plants','POST',body,201);assert.equal((await get(`/plants/${registered.id}/scans`)).length,3);
      await send('/plants','POST',body,400);
    }finally{if(registered)await send(`/plants/${registered.id}`,'DELETE');await require('../models/Scan').deleteMany({_id:{$in:registrationScans.map(scan=>scan.id)},owner:user._id,notes:'Temporary registration verification'});}
    const denied=await fetch(base+`/plants/${new mongoose.Types.ObjectId()}`,{headers});assert.equal(denied.status,404);
    console.log(JSON.stringify({verified:true,email:user.email,plants:plants.length,scans:await require('../models/Scan').countDocuments({owner:user._id}),accountCreatedAt:user.createdAt,checks:'Authenticated feature APIs, private photos, scan details and inaccessible plants'}));
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
}
main().catch(error=>{console.error(error.message);process.exitCode=1}).finally(()=>mongoose.disconnect());
