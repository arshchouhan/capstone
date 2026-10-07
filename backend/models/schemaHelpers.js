const { Schema } = require('mongoose');
exports.owner = { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true };
exports.plant = { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true };
exports.text = (max = 500, required = false) => ({ type: String, trim: true, maxlength: max, required });
exports.options = { timestamps: true, toJSON: { virtuals: true, transform: (_doc, value) => { value.id = String(value._id); delete value.__v; return value; } } };
