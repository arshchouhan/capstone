const crypto=require('node:crypto');
const Connection=require('../models/GoogleConnection');
const {fail}=require('../controllers/helpers');
const scopes=['openid','email','https://www.googleapis.com/auth/calendar.events'];
const configured=()=>!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.GOOGLE_REDIRECT_URI&&/^[a-f\d]{64}$/i.test(process.env.GOOGLE_TOKEN_KEY||''));
const seal=value=>{const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',Buffer.from(process.env.GOOGLE_TOKEN_KEY,'hex'),iv);return [iv.toString('hex'),cipher.update(value,'utf8','hex')+cipher.final('hex'),cipher.getAuthTag().toString('hex')].join('.')};
const unseal=value=>{const [iv,text,tag]=value.split('.'),cipher=crypto.createDecipheriv('aes-256-gcm',Buffer.from(process.env.GOOGLE_TOKEN_KEY,'hex'),Buffer.from(iv,'hex'));cipher.setAuthTag(Buffer.from(tag,'hex'));return cipher.update(text,'hex','utf8')+cipher.final('utf8')};
async function request(url,options){const response=await fetch(url,{...options,signal:AbortSignal.timeout(20000)});const data=await response.json().catch(()=>({}));if(!response.ok)throw fail(502,'Google could not complete the request. Reconnect your account or retry.');return data}
const token=body=>request('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,...body})});
async function access(owner){if(!configured())throw fail(503,'Google Calendar is not configured yet.');const connection=await Connection.findOne({owner}).select('+refreshToken');if(!connection)throw fail(409,'Connect your Google account first.');const result=await token({grant_type:'refresh_token',refresh_token:unseal(connection.refreshToken)});return result.access_token}
module.exports={configured,scopes,seal,unseal,token,access,request};
