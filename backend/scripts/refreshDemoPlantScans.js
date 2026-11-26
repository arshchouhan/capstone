require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const connect = require('../config/db');
const User = require('../models/User');
const { refreshPlantExamples, addSampleRecoveryChecks } = require('./demoPlantScans');

async function main() {
  await connect();
  const user = await User.findOne({ email: 'arshchouhan246@gmail.com' }).select('_id');
  if (!user) throw new Error('Website account not found.');
  const { plants, updatedScans } = await refreshPlantExamples(user._id, { existingOnly: true });
  let sampleRecoveryChecks = 0;
  for (const plant of plants) sampleRecoveryChecks += await addSampleRecoveryChecks(user._id, plant);
  console.log(JSON.stringify({ plants: plants.length, updatedScans, sampleRecoveryChecks }));
}

main().catch(error => {
  console.error(error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, '[database address]'));
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
