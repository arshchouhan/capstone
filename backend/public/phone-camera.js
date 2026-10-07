const video=document.querySelector('#preview'),start=document.querySelector('#start'),controls=document.querySelector('#controls'),status=document.querySelector('#status'),error=document.querySelector('#error'),take=document.querySelector('#take'),input=document.querySelector('#photo-input'),photo=document.querySelector('#photo');
const match=/^#([a-f\d-]{36})\.([A-Za-z0-9_-]{43})$/.exec(location.hash);
const canvas=document.createElement('canvas'),live=window.isSecureContext&&!!navigator.mediaDevices?.getUserMedia;
let secret,stream,stopped=false,facing='environment',timer,wakeLock,generation=0;
start.disabled=true;
function uuid(){if(crypto.randomUUID)return crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const text=Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');return `${text.slice(0,8)}-${text.slice(8,12)}-${text.slice(12,16)}-${text.slice(16,20)}-${text.slice(20)}`}
async function request(action,body,method='POST'){
 const response=await fetch(`/api/camera-phone/${match[1]}${action}`,{method,headers:{'Content-Type':'application/json',...(secret?{Authorization:`Bearer ${secret}`}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.message||'Camera connection failed.'),{status:response.status});return data.data;
}
function stopTracks(){stream?.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;wakeLock?.release().catch(()=>{});wakeLock=null;}
function jpeg(source,maxWidth,quality){const width=source.videoWidth||source.naturalWidth,height=source.videoHeight||source.naturalHeight;if(!width||!height)return null;const ratio=Math.min(1,maxWidth/width);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',quality);}
async function frames(current){
 if(stopped||current!==generation)return;
 try{const image=video.readyState>=2?jpeg(video,800,.55):null;if(image){const result=await request('/frame',{image});if(result.captureId){await request('/capture',{captureId:result.captureId,image:jpeg(video,1920,.92)});status.textContent='Photo captured on your laptop.';}}}
 catch(err){if([403,410].includes(err.status)){disconnect(false);status.textContent=err.message;return;}error.textContent=err.message;}
 if(!stopped&&current===generation)timer=setTimeout(()=>frames(current),200);
}
async function openCamera(){
 const current=++generation;stopTracks();clearTimeout(timer);start.disabled=true;error.textContent='';
 try{const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1080}},audio:false});if(stopped||current!==generation){media.getTracks().forEach(track=>track.stop());return;}stream=media;video.hidden=false;video.srcObject=media;await video.play();if(stopped||current!==generation){stopTracks();return;}start.hidden=true;controls.hidden=false;status.textContent='Connected · Capture photos from your laptop.';try{wakeLock=await navigator.wakeLock?.request('screen');}catch{}frames(current);}
 catch(err){error.textContent=err.name==='NotAllowedError'?'Allow camera access or use Take photo.':err.message;start.hidden=false;controls.hidden=true;}finally{start.disabled=false;}
}
function disconnect(notify=true){stopped=true;generation++;clearTimeout(timer);stopTracks();controls.hidden=true;start.hidden=true;take.disabled=true;status.textContent='Disconnected. Scan a new QR code to reconnect.';if(notify&&secret)request('',undefined,'DELETE').catch(()=>{});}
start.onclick=openCamera;take.onclick=()=>input.click();document.querySelector('#flip').onclick=()=>{facing=facing==='environment'?'user':'environment';openCamera()};document.querySelector('#stop').onclick=()=>disconnect();window.addEventListener('pagehide',()=>{generation++;clearTimeout(timer);stopTracks()});
input.onchange=async()=>{
 const file=input.files?.[0];input.value='';if(!file||stopped)return;error.textContent='';take.disabled=true;status.textContent='Sending photo to your laptop…';let url;
 try{if(file.size>25*1024*1024)throw new Error('Choose a photo under 25 MB.');url=URL.createObjectURL(file);const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Could not open this image. Try a JPG or PNG photo.'));image.src=url});const full=jpeg(image,2048,.9),preview=jpeg(image,800,.55);if(stopped)return;await request('/photo',{image:full,preview});generation++;clearTimeout(timer);stopTracks();video.hidden=true;photo.src=full;photo.hidden=false;status.textContent='Photo sent · Select Use photo on your laptop.';}
 catch(err){error.textContent=err.message;status.textContent='Take another photo to try again.';}
 finally{if(url)URL.revokeObjectURL(url);take.disabled=stopped;}
};
async function pair(){
 if(!match){status.textContent='Scan the QR code on your laptop to connect.';return;}
 try{let clientId;try{clientId=sessionStorage.getItem(`camera-client-${match[1]}`)}catch{}clientId ||= uuid();try{sessionStorage.setItem(`camera-client-${match[1]}`,clientId)}catch{}const result=await request('/join',{token:match[2],clientId});secret=result.token;take.disabled=false;if(live){start.hidden=false;start.disabled=false;status.textContent='Laptop paired · Start the camera or take a photo.'}else{status.textContent='Laptop paired · Tap Take photo to open your phone camera.'}}
 catch(err){error.textContent=err.message;start.disabled=true;take.disabled=true;}
}
pair();