const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextDue } = require('../services/careService');
const { calculate } = require('../services/calculationService');
const { Types } = require('mongoose');
const owner = new Types.ObjectId(), plant = new Types.ObjectId();
test('recurring tasks move forward from their due date or completion date', () => {
  assert.equal(nextDue('2026-10-10T12:00:00Z',7,new Date('2026-10-03T12:00:00Z')).toISOString(),'2026-10-17T12:00:00.000Z');
  assert.equal(nextDue('2026-09-01T12:00:00Z',7,new Date('2026-10-03T12:00:00Z')).toISOString(),'2026-10-10T12:00:00.000Z');
  assert.throws(()=>nextDue(new Date(),0));
});
test('calculations compute on the server and reject invalid quantities', () => {
  assert.equal(calculate('profit',{cost:1200,yieldKg:25,price:90}).value,1050);
  const spray=calculate('trees',{dose:2,water:25,pump:10});
  assert.equal(spray.totalProduct,50); assert.equal(spray.refills,3); assert.equal(spray.lastWater,5);
  assert.throws(()=>calculate('trees',{dose:2,water:0,pump:10}));
  assert.throws(()=>calculate('profit',{cost:1200,yieldKg:-25,price:90}));
});
test('scan results retain the plant type and reject excessive photos or scores', async () => {
  const Scan=require('../models/Scan');
  const scan=new Scan({owner,plant,kind:'Disease Identifier',photos:['photo'],result:{name:'Basil',type:'Herb',score:84}});
  await scan.validate(); assert.equal(scan.result.type,'Herb'); assert.equal(scan.result.score,84);
  await assert.rejects(new Scan({owner,kind:'Disease Identifier',photos:['a','b','c','d']}).validate());
  await assert.rejects(new Scan({owner,kind:'Disease Identifier',result:{score:101}}).validate());
});
test('plant records require owners and recurring schedules validate their frequency', async () => {
  await assert.rejects(new (require('../models/Plant'))({name:'Basil'}).validate());
  await assert.rejects(new (require('../models/CareTask'))({owner,plant,type:'Water',due:new Date(),frequency:2.5}).validate());
});
test('optional plant checks accept insect results and validate actual moisture readings', async () => {
  const SoilMoistureCheck = require('../models/SoilMoistureCheck');
  const Scan = require('../models/Scan');
  const touch = new SoilMoistureCheck({ owner, plant, condition: 'Moist' });
  await touch.validate();
  assert.equal(touch.meterPercent, undefined);
  await new SoilMoistureCheck({ owner, plant, condition: 'Dry', meterPercent: 0 }).validate();
  await assert.rejects(new SoilMoistureCheck({ owner, plant, condition: 'Wet', meterPercent: 101 }).validate());
  await assert.rejects(new SoilMoistureCheck({ owner, plant, condition: 'Unknown' }).validate());
  await new Scan({ owner, plant, kind: 'Insect Identifier', result: { isPlant: false, status: 'Needs review' } }).validate();
});
test('plant location updates validate coordinate pairs and support old records', async t => {
  const Plant = require('../models/Plant');
  const controller = require('../controllers/plantController');
  const record = new Plant({ _id: plant, owner, name: 'Basil' });
  t.mock.method(Plant, 'findOne', async query => {
    assert.equal(query.owner, owner);
    return record;
  });
  t.mock.method(record, 'save', () => record.validate());
  const req = { user: { _id: owner }, params: { plantId: String(plant) }, body: {} };
  const res = { status() { return this; }, json(payload) { return payload; } };
  await assert.rejects(controller.satellite(req, res), { status: 400 });
  req.body = { coordinates: { latitude: 0, longitude: 77.123456, accuracy: 9, source: 'ignored' } };
  await controller.update(req, res);
  assert.deepEqual(record.coordinates.toObject(), { latitude: 0, longitude: 77.123456, accuracy: 9 });
  req.body = { location: 'Balcony' };
  await controller.update(req, res);
  assert.equal(record.coordinates.longitude, 77.123456);
  for (const coordinates of [{ latitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: '0', longitude: 0 }]) {
    req.body = { coordinates };
    await assert.rejects(controller.update(req, res), { status: 400 });
    await assert.rejects(controller.create(req, res), { status: 400, message: /latitude and longitude/ });
  }
  req.body = { coordinates: null };
  await controller.update(req, res);
  assert.equal(record.coordinates, null);
});
test('resource lookup always scopes plant access to the authenticated owner', async () => {
  const Plant=require('../models/Plant'), original=Plant.findOne;
  let query;
  Plant.findOne=async value=>{query=value;return null};
  try {await assert.rejects(require('../controllers/helpers').plantFor({user:{_id:owner},params:{plantId:String(plant)}}),{status:404});assert.equal(String(query.owner),String(owner))} finally {Plant.findOne=original}
});
test('private APIs reject unauthenticated requests and malformed tokens', async () => {
  const server=require('../app').listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  try {
    for (const route of ['/plants','/scans','/community/posts','/appointments','/cart','/notifications']) assert.equal((await fetch(base+route)).status,401);
    assert.equal((await fetch(base+'/plants',{headers:{authorization:'Bearer broken'}})).status,401);
    assert.equal((await fetch(base+'/health')).status,200);
  } finally {await new Promise(resolve=>server.close(resolve))}
});
