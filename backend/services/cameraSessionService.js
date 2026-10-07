const { randomBytes, randomUUID, timingSafeEqual } = require('node:crypto');
const { fail } = require('../controllers/helpers');
const sessions = new Map();
const equal = (left,right) => {if(typeof left!=='string'||typeof right!=='string')return false;const a=Buffer.from(left),b=Buffer.from(right);return a.length===b.length&&timingSafeEqual(a,b);};
const token = () => randomBytes(32).toString('base64url');
const cleanup = setInterval(() => {
  for(const [id,session] of sessions) if(session.expiresAt<Date.now() || session.hostSeen<Date.now()-45000) sessions.delete(id);
},15000); cleanup.unref();
exports.create = (owner, origin) => {
  const url = new URL(origin);
  const local=/^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(url.hostname);
  if(url.protocol!=='https:' && !(url.protocol==='http:'&&local))throw fail(400,'Use a local network camera address.');
  for(const [id,session] of sessions) if(session.owner===String(owner))sessions.delete(id);
  if(sessions.size>=50)throw fail(503,'Camera connections are busy. Please try again.');
  const session={id:randomUUID(),owner:String(owner),pairToken:token(),guestToken:null,clientId:null,expiresAt:Date.now()+10*60000,pairExpiresAt:Date.now()+2*60000,hostSeen:Date.now(),phoneSeen:0,frame:null,frameId:0,captureRequest:null,capture:null,uploadedPhoto:null};
  sessions.set(session.id,session);
  return {id:session.id,url:`${url.origin}/phone-camera#${session.id}.${session.pairToken}`,expiresAt:new Date(session.expiresAt),pairExpiresAt:new Date(session.pairExpiresAt)};
};
const find = id => {const session=sessions.get(id);if(!session || session.expiresAt<Date.now() || session.hostSeen<Date.now()-45000){sessions.delete(id);throw fail(410,'This camera connection has ended. Scan a new QR code.');}return session;};
exports.host = (id,owner) => {const session=find(id);if(session.owner!==String(owner))throw fail(404,'Camera connection not found.');session.hostSeen=Date.now();return session;};
exports.join = (id,pairToken,clientId) => {
  const session=find(id);
  if(!equal(pairToken,session.pairToken))throw fail(403,'Invalid camera link.');
  if(typeof clientId!=='string'||!/^[a-f\d-]{36}$/i.test(clientId))throw fail(400,'Invalid phone connection.');
  if(session.clientId && session.clientId!==clientId)throw fail(409,'A phone is already connected. Create a new QR code to switch phones.');
  if(!session.clientId && session.pairExpiresAt<Date.now())throw fail(410,'This QR code expired. Create a new one on your laptop.');
  session.clientId=clientId;session.guestToken ||= token();session.phoneSeen=Date.now();
  return {token:session.guestToken,expiresAt:new Date(session.expiresAt)};
};
exports.phone = (id,guestToken) => {const session=find(id);if(!equal(guestToken,session.guestToken))throw fail(403,'Invalid phone connection.');session.phoneSeen=Date.now();return session;};
exports.image = (value,maxBytes) => {
  if(typeof value!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value))throw fail(400,'Invalid camera frame.');
  const bytes=Buffer.from(value.slice(value.indexOf(',')+1),'base64');
  if(bytes.length<12||bytes.length>maxBytes||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw fail(400,'Invalid camera frame size or format.');
  return value;
};
exports.close = id => sessions.delete(id);
exports.sessions = sessions;
