const {test}=require('node:test'),assert=require('node:assert/strict');
const Expert=require('../models/Expert'),Appointment=require('../models/Appointment'),controller=require('../controllers/expertController');
test('expert booking accepts only offered future slots and handles occupied slots',async()=>{
 const find=Expert.findOne,create=Appointment.create;
 const date=new Date(Date.now()+86400000),req={body:{expert:'111111111111111111111111',startsAt:date.toISOString()},user:{_id:'owner'}};
 const res={status(){return this},json(){return this}};
 try{
  Expert.findOne=async()=>({_id:req.body.expert,availableSlots:[]});await assert.rejects(controller.book(req,res),{status:409});
  Expert.findOne=async()=>({_id:req.body.expert,availableSlots:[date]});let saved;Appointment.create=async data=>{saved=data;return data};await controller.book(req,res);assert.equal(saved.owner,'owner');assert.equal(saved.startsAt.getTime(),date.getTime());
  Appointment.create=async()=>{throw Object.assign(new Error('duplicate'),{code:11000})};await assert.rejects(controller.book(req,res),{status:409});
 }finally{Expert.findOne=find;Appointment.create=create}
});
