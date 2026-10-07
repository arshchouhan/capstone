const {networkInterfaces}=require('node:os');
const service=require('../services/cameraSessionService');
const {ok,fail}=require('./helpers');
async function cameraOrigin(){
  const interfaces=Object.entries(networkInterfaces()).sort(([a],[b])=>Number(/wi-?fi|wireless/i.test(b))-Number(/wi-?fi|wireless/i.test(a)));
  const candidates=interfaces.flatMap(([name,addresses])=>/virtual|vethernet|docker|vpn|loopback/i.test(name)?[]:addresses).filter(value=>value.family==='IPv4'&&!value.internal&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(value.address));
  const address=process.env.PHONE_CAMERA_HOST||candidates[0]?.address;
  if(!address)throw fail(503,'Connect your laptop to Wi-Fi to use a phone, or select Use laptop camera.');
  return `http://${address}:${process.env.PHONE_CAMERA_PORT||5001}`;
}
exports.create=async(req,res)=>ok(res,service.create(req.user._id,await cameraOrigin(req)),201);
exports.preview=(req,res)=>{const session=service.host(req.params.sessionId,req.user._id);res.set('Cache-Control','no-store');ok(res,{connected:!!session.uploadedPhoto||session.phoneSeen>Date.now()-5000,photoReady:!!session.uploadedPhoto,pairExpired:!session.guestToken&&session.pairExpiresAt<Date.now(),frameId:session.frameId,image:Number(req.query.after)===session.frameId?null:session.frame,expiresAt:new Date(session.expiresAt)});};
exports.requestCapture=(req,res)=>{const session=service.host(req.params.sessionId,req.user._id);if(!session.uploadedPhoto&&(session.phoneSeen<Date.now()-5000||!session.frame))throw fail(409,'Take a photo on your phone first.');if(session.captureRequest&&!session.capture&&session.captureRequestedAt>Date.now()-15000)throw fail(409,'A photo is already being captured.');session.captureRequest=require('node:crypto').randomUUID();session.captureRequestedAt=Date.now();session.capture=session.uploadedPhoto;ok(res,{captureId:session.captureRequest});};
exports.capture=(req,res)=>{const session=service.host(req.params.sessionId,req.user._id);res.set('Cache-Control','no-store');if(req.params.captureId!==session.captureRequest)throw fail(404,'Photo request not found.');ok(res,{ready:!!session.capture,image:session.capture});};
exports.close=(req,res)=>{service.host(req.params.sessionId,req.user._id);service.close(req.params.sessionId);ok(res,{closed:true});};
exports.join=(req,res)=>{res.set('Cache-Control','no-store');ok(res,service.join(req.params.sessionId,req.body.token,req.body.clientId));};
const phone=req=>service.phone(req.params.sessionId,req.get('authorization')?.replace(/^Bearer /,''));
exports.frame=(req,res)=>{const session=phone(req);if(session.lastFrameAt>Date.now()-100)throw fail(429,'Camera is sending too quickly.');session.lastFrameAt=Date.now();session.frame=service.image(req.body.image,400*1024);session.frameId++;ok(res,{captureId:session.captureRequest&&!session.capture?session.captureRequest:null});};
exports.sendCapture=(req,res)=>{const session=phone(req);if(req.body.captureId!==session.captureRequest)throw fail(409,'Photo request expired.');session.capture=service.image(req.body.image,8*1024*1024);ok(res,{saved:true});};
exports.uploadPhoto=(req,res)=>{const session=phone(req);const image=service.image(req.body.image,8*1024*1024),preview=service.image(req.body.preview,400*1024);session.uploadedPhoto=image;session.frame=preview;session.frameId++;ok(res,{saved:true});};
exports.stop=(req,res)=>{phone(req);service.close(req.params.sessionId);ok(res,{closed:true});};
