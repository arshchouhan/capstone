// Uses an isolated browser profile and a generated test camera. No physical camera or public tunnel.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir,writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
const require=createRequire(import.meta.url)
const express=require('../../backend/node_modules/express')
const service=require('../../backend/services/cameraSessionService')
const controller=require('../../backend/controllers/cameraController')
const host=express();host.use(express.json());host.use((req,_res,next)=>{req.user={_id:'browser-test'};next()})
host.get('/api/dashboard',(_req,res)=>res.json({success:true,data:{plants:[],tasks:[],recentScans:[]}}))
host.get('/api/notifications',(_req,res)=>res.json({success:true,data:[]}))
let pairing
host.post('/api/camera-sessions',(_req,res)=>{pairing=service.create('browser-test','http://192.168.1.10');res.status(201).json({success:true,data:pairing})})
host.get('/api/camera-sessions/:sessionId',controller.preview)
host.post('/api/camera-sessions/:sessionId/capture',controller.requestCapture)
host.get('/api/camera-sessions/:sessionId/capture/:captureId',controller.capture)
host.delete('/api/camera-sessions/:sessionId',controller.close)
host.use(require('../../backend/middleware/errors').errorHandler)
async function listen(app){const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));return {server,url:`http://127.0.0.1:${server.address().port}`}}
const desktopApi=await listen(host),phoneApi=await listen(require('../../backend/cameraApp'))
let browser
try {
  const artifacts=new URL('../.test-artifacts/',import.meta.url);await mkdir(artifacts,{recursive:true})
  const fakeVideo=new URL('test-camera.y4m',artifacts)
  const frames=[Buffer.from('YUV4MPEG2 W160 H120 F10:1 Ip A1:1 C420jpeg\n')]
  for(let index=0;index<60;index++){frames.push(Buffer.from('FRAME\n'),Buffer.alloc(160*120,60+index%3*50),Buffer.alloc(160*120/4,100+index%3*30),Buffer.alloc(160*120/4,160-index%3*30))}
  await writeFile(fakeVideo,Buffer.concat(frames))
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream',`--use-file-for-fake-video-capture=${fileURLToPath(fakeVideo)}`]})
  const context=await browser.newContext({viewport:{width:1440,height:900}})
  await context.addInitScript(()=>{localStorage.setItem('authToken','isolated-test');localStorage.setItem('user',JSON.stringify({userId:'browser-test',fullName:'Camera test'}))})
  const page=await context.newPage()
  await page.route('**/api/**',async route=>{const url=new URL(route.request().url());const response=await route.fetch({url:desktopApi.url+url.pathname+url.search});await route.fulfill({response})})
  await page.goto('http://localhost:5173/farm/dashboard/scan')
  await page.getByRole('button',{name:'Take photo',exact:true}).click()
  await page.getByAltText('Scan this QR code with your phone to connect its camera').waitFor()
  assert.ok(await page.getByRole('button',{name:'Capture photo',exact:true}).isDisabled())
  const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,permissions:['camera']})
  const phone=await phoneContext.newPage()
  await phone.goto(phoneApi.url+'/phone-camera#'+pairing.url.split('#')[1])
  await phone.waitForFunction(()=>!document.querySelector('#start').disabled)
  await phone.getByRole('button',{name:'Start camera',exact:true}).click()
  await page.getByAltText('Live view from your phone camera').waitFor({timeout:15000})
  await phone.waitForFunction(()=>{const video=document.querySelector('#preview');if(!video.videoWidth)return false;const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;const context=canvas.getContext('2d');context.drawImage(video,0,0,1,1);const pixel=context.getImageData(0,0,1,1).data;return pixel[0]+pixel[1]+pixel[2]>20})
  await page.screenshot({path:fileURLToPath(new URL('phone-camera-preview.png',artifacts)),fullPage:true})
  await page.getByRole('button',{name:'Capture photo',exact:true}).click()
  await page.getByAltText('Phone camera photo').waitFor({timeout:15000})
  assert.match(await page.getByAltText('Phone camera photo').getAttribute('src'),/^data:image\/jpeg;base64,/)
  await page.getByAltText('Phone camera photo').evaluate(image=>new Promise(resolve=>{if(image.complete&&image.naturalWidth)resolve();else image.onload=resolve}))
  const hasPhoto=await page.getByAltText('Phone camera photo').evaluate(image=>{const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;const context=canvas.getContext('2d');context.drawImage(image,0,0,1,1);const pixel=context.getImageData(0,0,1,1).data;return pixel[0]+pixel[1]+pixel[2]>20})
  assert.ok(hasPhoto,'Captured photo contains actual camera pixels')
  await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'))
  await phone.waitForFunction(()=>document.querySelector('#preview').srcObject===null,{timeout:15000})
  assert.ok(!service.sessions.has(pairing.id))
  const saved=await page.getByAltText('Phone camera photo').getAttribute('src')
  await page.getByRole('button',{name:'Take photo',exact:true}).click()
  await page.getByAltText('Scan this QR code with your phone to connect its camera').waitFor()
  const localContext=await browser.newContext()
  await localContext.addInitScript(()=>Object.defineProperty(window,'isSecureContext',{value:false}))
  const localPhone=await localContext.newPage()
  await localPhone.goto(phoneApi.url+'/phone-camera#'+pairing.url.split('#')[1])
  await localPhone.waitForFunction(()=>!document.querySelector('#take').disabled)
  assert.ok(await localPhone.locator('#start').isHidden())
  await localPhone.locator('#photo-input').setInputFiles({name:'plant.jpg',mimeType:'image/jpeg',buffer:Buffer.from(saved.split(',')[1],'base64')})
  await page.getByAltText('Photo from your phone').waitFor({timeout:15000})
  await page.getByRole('button',{name:'Use photo',exact:true}).click()
  await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'))
  assert.equal(await page.getByAltText('Phone camera photo').count(),2)
  await page.getByRole('button',{name:'Take photo',exact:true}).click()
  await page.getByRole('button',{name:'Use laptop camera',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('[role="dialog"] video')?.readyState>=2)
  await page.getByRole('button',{name:'Capture photo',exact:true}).click()
  await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'))
  assert.equal(await page.getByAltText('Phone camera photo').count(),3)
  console.log('PASS: local phone upload, laptop webcam, live localhost preview, capture and cleanup.')
} finally {
  if(pairing)service.close(pairing.id)
  await browser?.close()
  for(const {server} of [desktopApi,phoneApi]){server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
}

