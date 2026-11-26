const express=require('express'),cors=require('cors'),cookieParser=require('cookie-parser'),session=require('express-session');const app=express();
app.use(cors({origin:(process.env.FRONTEND_ORIGINS||'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000').split(','),credentials:true,methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS']}));
app.use(express.json({limit:'15mb'}));app.use(express.urlencoded({extended:false,limit:'1mb'}));app.use(cookieParser());app.use(session({secret:process.env.SESSION_SECRET||'your-session-secret-change-in-production',resave:false,saveUninitialized:false,cookie:{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:7*86400000}}));
app.use(require('./routes/cameraPublicRoutes'));
const health=()=>({status:'ok',database:require('mongoose').connection.readyState===1?'connected':'disconnected',aiProvider:process.env.AI_MODEL_PROVIDER||'demo',aiTokenConfigured:Boolean(process.env.HF_TOKEN||process.env.HUGGING_FACE_TOKEN)});
app.get('/',(_req,res)=>res.json({success:true,data:{service:'Plantaexa backend',api:'/api',health:'/api/health',...health()}}));
app.get('/api',(_req,res)=>res.json({success:true,data:{service:'Plantaexa API',health:'/api/health',authentication:'Sign in through the Plantaexa app to use protected API routes.',...health()}}));
app.get('/api/health',(_req,res)=>res.json({success:true,data:health()}));
app.use('/api',require('./routes/authRoutes'));app.use('/api',require('./routes/googleRoutes'));app.use('/api',require('./routes/featureRoutes'));app.use(require('./middleware/errors').notFound);app.use(require('./middleware/errors').errorHandler);module.exports=app;
