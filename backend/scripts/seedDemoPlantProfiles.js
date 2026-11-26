const Plant = require('../models/Plant');
const LightReading = require('../models/LightReading');

const reference = 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/';
const profiles = {
  apple: {
    overview: 'Apple trees are deciduous fruit trees. Cultivars differ in harvest season, cold tolerance, and pollination needs. Many benefit from a compatible apple or crabapple flowering nearby.',
    family: 'Rosaceae', growthForm: 'Deciduous fruit tree', variety: 'Honeycrisp',
    temperature: 'Cool winters for dormancy and a warm growing season. Choose a cultivar suited to the local climate.',
    hardiness: 'Varies by cultivar and rootstock. Some cold-hardy cultivars are suitable for USDA zone 3.',
    light: 'Full sun, ideally at least 8 hours of direct sunlight a day.', soil: 'Well-drained soil with a pH around 6–7.',
    site: 'Open orchard or garden site with airflow and room for the mature tree.',
    watering: 'Water young trees deeply during dry periods. Check soil moisture before watering again.',
    weed: { name: 'Common dandelion', scientific: 'Taraxacum officinale', notes: 'A low leaf rosette was noted near the edge of the sample tree bed.' },
    sourceUrl: `${reference}growing-apples`,
  },
  tomato: {
    overview: 'Tomatoes are warm-season fruiting plants. Bush varieties suit smaller spaces, and vining varieties keep growing and usually need support.',
    family: 'Solanaceae', growthForm: 'Warm-season fruiting crop', variety: 'Roma',
    temperature: 'Grow in warm soil and transplant outdoors after frost danger has passed.',
    hardiness: 'Frost-sensitive. Usually grown as an annual where winters are cold.',
    light: 'Full sun.', soil: 'Well-drained, compost-amended soil with a pH around 5.5–7.',
    site: 'Sunny garden bed or a large container with support suited to the variety.',
    watering: 'Water deeply at the root zone and keep moisture consistent while fruit develops.',
    weed: { name: 'Common purslane', scientific: 'Portulaca oleracea', notes: 'A low patch with fleshy leaves was noted beside the sample container.' },
    sourceUrl: `${reference}growing-tomatoes`,
  },
  'bell-pepper': {
    overview: 'Bell peppers are sweet peppers with thick-walled fruit. Warm conditions and steady moisture support flowering and fruit development.',
    family: 'Solanaceae', growthForm: 'Warm-season fruiting crop', variety: 'California Wonder',
    temperature: 'Transplant once nights stay above 10 °C. Moderate warmth supports flowering and fruit set.',
    hardiness: 'Frost-sensitive. Usually grown as an annual where winters are cold.',
    light: 'Sunny growing site. Leaf cover helps protect fruit in intense heat.', soil: 'Well-drained, compost-amended soil with a pH around 6.5–7.',
    site: 'Warm garden bed or a well-drained container.',
    watering: 'Keep soil moisture consistent and direct water to the base of the plant.',
    weed: { name: 'Large crabgrass', scientific: 'Digitaria sanguinalis', notes: 'A spreading grass clump was noted along the sample bed border.' },
    sourceUrl: `${reference}growing-peppers`,
  },
  grape: {
    overview: 'Grapevines are woody perennials that need a durable support. Pruning maintains the vine’s shape and manages the amount of fruiting wood.',
    family: 'Vitaceae', growthForm: 'Woody climbing vine', variety: 'Concord',
    temperature: 'Sunny, warm growing conditions help fruit ripen. Winter tolerance varies widely by cultivar.',
    hardiness: 'Varies by cultivar. Some cold-hardy grapes can grow in USDA zones 3–4.',
    light: 'Full sun.', soil: 'Well-drained soil that warms readily.',
    site: 'Open site with a sturdy trellis, arbor, or fence.',
    watering: 'Water young vines regularly at the root zone. Established vines usually need less frequent watering.',
    weed: { name: 'Field bindweed', scientific: 'Convolvulus arvensis', notes: 'A trailing stem with arrow-shaped leaves was noted near the sample trellis.' },
    sourceUrl: `${reference}growing-grapes-in-the-home-garden`,
  },
  strawberry: {
    overview: 'Strawberries are low-growing fruit plants. June-bearing varieties produce a concentrated harvest, while day-neutral varieties can fruit over a longer season.',
    family: 'Rosaceae', growthForm: 'Low-growing herbaceous perennial', variety: 'Annapolis',
    temperature: 'Plant in spring when soil can be worked. Protect dormant plants from severe winter cold where needed.',
    hardiness: 'Varies by cultivar and winter protection. Some mulched cultivars can overwinter in USDA zone 4.',
    light: 'Full sun, with at least 6 hours of direct sunlight a day.', soil: 'Well-drained soil improved with compost.',
    site: 'Sunny bed or container with drainage and room for the plants to spread.',
    watering: 'Aim for roughly 25 mm per week including rain, adjusted to conditions. Water early in the day.',
    weed: { name: 'Common chickweed', scientific: 'Stellaria media', notes: 'Small mat-forming growth was noted between rows in the sample bed.' },
    sourceUrl: `${reference}growing-strawberries-in-the-home-garden`,
  },
};

const sampleLight = { brightness: 68, lux: 850, category: 'Bright indirect', source: 'webcam-estimate' };

async function seedDemoPlantProfiles(owner) {
  const examples = await Plant.find({ owner, exampleKey: { $in: Object.keys(profiles) } }).select('+exampleKey').lean();
  for (const plant of examples) {
    const filter = { owner, plant: plant._id };
    await Plant.updateOne({ _id: plant._id, owner, exampleKey: plant.exampleKey },
      { $set: { exampleProfile: profiles[plant.exampleKey] } }, { runValidators: true, timestamps: false });
    const existing = await LightReading.updateMany({ ...filter, ...sampleLight, sample: { $ne: true } },
      { $set: { sample: true } }, { timestamps: false });
    if (!existing.matchedCount) {
      await LightReading.updateOne({ ...filter, ...sampleLight, sample: true },
        { $setOnInsert: { ...filter, ...sampleLight, sample: true, measuredAt: plant.createdAt } },
        { upsert: true, runValidators: true });
    }
  }
  return examples.length;
}

module.exports = { seedDemoPlantProfiles };

if (require.main === module) {
  require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
  const mongoose = require('mongoose');
  async function main() {
    await require('../config/db')();
    const user = await require('../models/User').findOne({ email: 'arshchouhan246@gmail.com' }).select('_id');
    if (!user) throw new Error('Demo account not found.');
    console.log(`Seeded plant details for ${await seedDemoPlantProfiles(user._id)} existing example plants.`);
  }
  main().catch(error => {
    console.error(error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, '[database address]'));
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}
