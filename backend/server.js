const path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
// Always load the backend environment file, whether the server is started from
// /backend or from the repository root.
require('dotenv').config({path:path.join(__dirname,'.env')});
const connectDB=require('./config/db');
const app=require('./app');
const apiPort=Number(process.env.PORT)||5000;
const cameraPort=Number(process.env.PHONE_CAMERA_PORT)||5001;
let aiPort=Number(process.env.TEAM_AI_PORT)||8011;
let aiProcess;

async function startTeamAi(){
  if((process.env.AI_MODEL_PROVIDER||'team-resnet')!=='team-resnet')return;
  try{
    const response=await fetch(`http://127.0.0.1:${aiPort}/health`,{signal:AbortSignal.timeout(500)});
    if(response.ok){
      const status=await response.json();
      if(status.adapterVersion===2){console.log(`Team AI service is already running on port ${aiPort}.`);return;}
      // Keep an older standalone adapter untouched, but make this backend use
      // its own current adapter instead of accepting stale classifications.
      aiPort+=1;
      process.env.TEAM_AI_PORT=String(aiPort);
      console.log(`An older AI adapter is using port ${aiPort-1}; starting the current adapter on port ${aiPort}.`);
    }
  }catch{}
  const python=path.join(__dirname,'ai_service','.venv','Scripts','python.exe');
  if(!fs.existsSync(python)){console.warn('Team AI service was not started: Python environment is missing. Run npm run ai:install.');return;}
  aiProcess=spawn(python,['ai_service/plant_disease_server.py'],{cwd:__dirname,windowsHide:true,stdio:'inherit',env:{...process.env,TEAM_AI_PORT:String(aiPort)}});
  aiProcess.once('error',error=>console.warn(`Team AI service could not start: ${error.message}`));
  aiProcess.once('exit',code=>{if(code&&code!==0)console.warn(`Team AI service stopped (code ${code}).`)});
  console.log(`Starting team AI service on port ${aiPort}.`);
}

function stopTeamAi(){if(aiProcess&&!aiProcess.killed)aiProcess.kill();}
process.once('SIGINT',stopTeamAi);process.once('SIGTERM',stopTeamAi);process.once('exit',stopTeamAi);
connectDB().then(()=>{
  app.listen(apiPort,()=>console.log(`Backend API is ready at http://localhost:${apiPort}/api`));
  require('./cameraApp').listen(cameraPort,'0.0.0.0',()=>console.log(`Local phone camera gateway is ready on port ${cameraPort}.`));
  startTeamAi();
}).catch(error=>{console.error('Database connection failed:',error.message);process.exitCode=1;});
