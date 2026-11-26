const { Schema, model } = require('mongoose');
const { owner, text, options } = require('./schemaHelpers');
const coordinates = new Schema({
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  accuracy: { type: Number, min: 0 },
}, { _id: false });
const exampleProfile = new Schema({
  overview: text(700), family: text(100), growthForm: text(120), variety: text(120),
  temperature: text(220), hardiness: text(220), light: text(220), soil: text(220),
  site: text(220), watering: text(220), sourceUrl: text(500),
  weed: { name: text(120), scientific: text(180), notes: text(500) },
}, { _id: false });
const schema = new Schema({ owner, exampleKey: { type: String, select: false }, name: text(120, true), scientific: text(180), type: { type: String, enum: ['Herb','Vegetable','Indoor','Flowering','Succulent','Other'], default: 'Indoor' }, variety: text(120), location: text(200), acquired: Date, light: text(160), watering: text(160), notes: text(5000), image: text(500), status: { type: String, enum: ['Not assessed','Healthy','Needs Care','At Risk'], default: 'Not assessed' }, aiCareRequirements: { temperature: String, hardiness: String, light: String, soil: String, location: String, source: { type: String, enum: ['demo','ai'] } }, latestScan: { type: Schema.Types.ObjectId, ref: 'Scan' } }, options);
schema.add({ coordinates, exampleProfile });
schema.index({ owner: 1, createdAt: -1 });
module.exports = model('Plant', schema);
