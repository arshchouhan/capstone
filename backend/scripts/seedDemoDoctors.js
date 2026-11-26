const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Expert = require('../models/Expert');

const demos = [
  { email: 'mira@plantaexa.example', previous: 'Demo garden specialist', name: 'Dr. Mira Sen',
    specialty: 'Plant pathology', description: 'Reviews leaf spots, blight and rust on garden crops. Share a clear leaf photo and when symptoms first appeared.',
    qualifications: 'PhD in Plant Pathology (demo)', location: 'Pune, India', languages: ['English', 'Hindi', 'Marathi'], experienceYears: 9, consultationMinutes: 30, consultationFee: 500 },
  { email: 'dev@plantaexa.example', previous: 'Demo indoor specialist', name: 'Dr. Dev Patel',
    specialty: 'Horticulture and indoor plants', description: 'Helps with indoor plant care, watering, potting mixes, pest checks and light conditions. Share photos of the plant and its growing area.',
    qualifications: 'MSc in Horticulture (demo)', location: 'Ahmedabad, India', languages: ['English', 'Hindi', 'Gujarati'], experienceYears: 7, consultationMinutes: 30, consultationFee: 400 },
];

function demoSlots() {
  const slots = [];
  const indiaDay = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  for (let day = 1; day <= 5; day++) {
    for (const time of ['10:00', '14:30', '16:00']) slots.push(new Date(Date.parse(`${indiaDay}T${time}:00+05:30`) + day * 86400000));
  }
  return slots;
}

exports.seedDemoDoctors = async () => {
  const created = [];
  for (const { email, previous, ...profile } of demos) {
    let user = await User.findOne({ email });
    if (user && (!user.demoAccount || user.accountType !== 'doctor')) throw new Error(`Reserved demo email is in use: ${email}`);
    if (!user) {
      const password = `Demo!${randomBytes(9).toString('base64url')}`;
      user = await User.create({ email, fullName: profile.name, password: await bcrypt.hash(password, 10), accountType: 'doctor', demoAccount: true });
      created.push({ email, password });
    }
    const existing = await Expert.findOne({ user: user._id }) || await Expert.findOne({ name: previous, user: null });
    const values = { ...profile, user: user._id, demo: true, active: true, verified: false, availableSlots: demoSlots() };
    if (existing) {
      Object.assign(existing, values);
      await existing.save();
    } else {
      await Expert.create(values);
    }
  }
  return created;
};

if (require.main === module) {
  require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
  const mongoose = require('mongoose');
  require('../config/db')().then(exports.seedDemoDoctors).then(created => {
    console.log(JSON.stringify({ profiles: demos.length, newLogins: created }));
  }).catch(error => { console.error(error.name + ': demo doctor setup failed'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
}
