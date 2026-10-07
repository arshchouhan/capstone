require('dotenv').config();
const connectDB=require('./config/db');
const app=require('./app');
connectDB().then(()=>{app.listen(process.env.PORT || 5000,()=>console.log('Backend is ready.'));require('./cameraApp').listen(process.env.PHONE_CAMERA_PORT||5001,'0.0.0.0',()=>console.log('Local phone camera gateway is ready.'));}).catch(error=>{console.error('Database connection failed:',error.message);process.exitCode=1;});
