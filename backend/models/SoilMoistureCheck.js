const { Schema, model } = require('mongoose');
const { owner, plant, text, options } = require('./schemaHelpers');

const schema = new Schema({
  owner, plant,
  condition: { type: String, enum: ['Dry', 'Moist', 'Wet'], required: true },
  meterPercent: { type: Number, min: 0, max: 100 },
  notes: text(500),
  checkedAt: { type: Date, default: Date.now, required: true },
}, options);
schema.index({ owner: 1, plant: 1, checkedAt: -1 });
module.exports = model('SoilMoistureCheck', schema);
