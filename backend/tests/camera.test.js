const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const service=require('../services/cameraSessionService');
const frame=`data:image/jpeg;base64,${Buffer.from([255,216,255,224,0,0,0,0,0,0,0,0,0,0,0,0]).toString('base64')}`;
test('local pairing links expire and can pair only one phone',()=>{
  assert.throws(()=>service.create('owner','http://example.com'),{status:400});
  const session=service.create('owner','http://192.168.1.10'),stored=service.sessions.get(session.id);
  assert.ok(session.url.startsWith('http://192.168.1.10/phone-camera#'));assert.ok(!session.url.includes('?'));
  assert.throws(()=>service.join(session.id,'wrong',randomUUID()),{status:403});
  assert.throws(()=>service.join(session.id,'é'.repeat(43),randomUUID()),{status:403});
  const client=randomUUID(),phone=service.join(session.id,stored.pairToken,client);
  assert.equal(service.join(session.id,stored.pairToken,client).token,phone.token);
  assert.throws(()=>service.join(session.id,stored.pairToken,randomUUID()),{status:409});
  assert.throws(()=>service.host(session.id,'another-owner'),{status:404});
  assert.throws(()=>service.phone(session.id,stored.pairToken),{status:403});
  service.host(session.id,'owner');service.phone(session.id,phone.token);
  service.close(session.id);assert.throws(()=>service.phone(session.id,phone.token),{status:410});
  const expired=service.create('owner','http://192.168.1.10'),old=service.sessions.get(expired.id);old.pairExpiresAt=Date.now()-1;
  assert.throws(()=>service.join(expired.id,old.pairToken,randomUUID()),{status:410});service.close(expired.id);
});
test('preview validation rejects bad formats and oversized frames',()=>{
  assert.equal(service.image(frame,400*1024),frame);
  assert.throws(()=>service.image('data:image/jpeg;base64,SGVsbG8=',400*1024),{status:400});
  assert.throws(()=>service.image(frame,5),{status:400});
});
test('phone gateway transfers previews and requested photos without exposing account APIs',async()=>{
  const session=service.create('test-owner','http://192.168.1.10'),stored=service.sessions.get(session.id);
  const server=require('../cameraApp').listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const send=async(action,body,token,method='POST')=>{const response=await fetch(`${base}/api/camera-phone/${session.id}${action}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});const payload=await response.json();return {status:response.status,data:payload.data};};
  try{
    assert.equal((await fetch(base+'/api/plants')).status,404);assert.equal((await fetch(base+'/phone-camera')).status,200);
    const phone=await send('/join',{token:stored.pairToken,clientId:randomUUID()});assert.equal(phone.status,200);
    assert.equal((await send('/frame',{image:frame},'bad')).status,403);
    stored.captureRequest=randomUUID();
    const preview=await send('/frame',{image:frame},phone.data.token);assert.equal(preview.data.captureId,stored.captureRequest);assert.equal(stored.frame,frame);
    assert.equal((await send('/capture',{captureId:'wrong',image:frame},phone.data.token)).status,409);
    assert.equal((await send('/capture',{captureId:stored.captureRequest,image:frame},phone.data.token)).status,200);assert.equal(stored.capture,frame);
    assert.equal((await send('/photo',{image:frame,preview:frame},phone.data.token)).status,200);
    assert.equal(stored.uploadedPhoto,frame);
    stored.phoneSeen=Date.now()-10000;
    const controller=require('../controllers/cameraController');
    let response;
    const res={json(value){response=value;return this;},status(){return this;},set(){return this;}};
    controller.preview({params:{sessionId:session.id},user:{_id:'test-owner'},query:{}},res);
    assert.equal(response.data.connected,true);assert.equal(response.data.photoReady,true);
    controller.requestCapture({params:{sessionId:session.id},user:{_id:'test-owner'}},res);
    assert.equal(stored.capture,frame);
    assert.equal((await send('',null,phone.data.token,'DELETE')).status,200);assert.ok(!service.sessions.has(session.id));
  }finally{service.close(session.id);server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});


