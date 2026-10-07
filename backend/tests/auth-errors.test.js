const {test}=require('node:test');
const assert=require('node:assert/strict');
test('signup displays the server validation error instead of replacing it with a status code',async()=>{
  const {readAuthResponse}=await import('../../frontend/src/services/authResponse.js');
  await assert.rejects(readAuthResponse({ok:false,status:409,json:async()=>({success:false,message:'This email is already registered. Sign in to continue.'})}),{message:'This email is already registered. Sign in to continue.'});
  await assert.rejects(readAuthResponse({ok:false,status:400,json:async()=>({message:'Emails do not match'})}),{message:'Emails do not match'});
  await assert.rejects(readAuthResponse({ok:false,status:502,json:async()=>{throw new Error('Not JSON')}}),{message:'The server is unavailable. Please try again.'});
  assert.equal((await readAuthResponse({ok:true,status:201,json:async()=>({success:true,token:'test'})})).token,'test');
});
test('signup normalizes email and identifies an existing account without modifying it',async()=>{
  const User=require('../models/User'),original=User.findOne;
  let query,status,payload;
  User.findOne=async value=>{query=value;return {_id:'existing'}};
  const res={status(value){status=value;return this},json(value){payload=value;return this}};
  try{
    await require('../controllers/authController').signup({body:{firstName:' Arsh ',lastName:' Chouhan ',email:' ARSHCHOUHAN246@GMAIL.COM ',confirmEmail:'arshchouhan246@gmail.com',password:'example',confirmPassword:'example'}},res);
    assert.equal(query.email,'arshchouhan246@gmail.com');assert.equal(status,409);assert.match(payload.message,/already registered/);
  }finally{User.findOne=original}
});
