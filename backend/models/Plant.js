const { Schema, model } = require('mongoose');
const { owner, text, options } = require('./schemaHelpers');
const schema = new Schema({ owner, name: text(120, true), scientific: text(180), type: { type: String, enum: ['Herb','Vegetable','Indoor','Flowering','Succulent','Other'], default: 'Indoor' }, variety: text(120), location: text(200), acquired: Date, light: text(160), watering: text(160), notes: text(5000), image: text(500), status: { type: String, enum: ['Not assessed','Healthy','Needs Care','At Risk'], default: 'Not assessed' }, aiCareRequirements: { temperature: String, hardiness: String, light: String, soil: String, location: String, source: { type: String, enum: ['demo','ai'] } }, latestScan: { type: Schema.Types.ObjectId, ref: 'Scan' } }, options);
schema.index({ owner: 1, createdAt: -1 });
module.exports = model('Plant', schema);
