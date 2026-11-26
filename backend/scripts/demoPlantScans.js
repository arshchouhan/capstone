const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const mongoose = require('mongoose');
const Plant = require('../models/Plant');
const Scan = require('../models/Scan');
const CareTask = require('../models/CareTask');
const Formulation = require('../models/Formulation');
const scanner = require('../services/scanService');

const backend = path.resolve(__dirname, '..');
const uploads = path.join(backend, 'uploads');
const modelRoot = process.env.TEAM_MODEL_DIR || 'models/ai/plantaexa-ai-source';
const dataset = path.resolve(backend, modelRoot, 'data/PlantDoc-Dataset/test');
const kind = 'Disease Identifier';
const examples = [
  { key: 'apple', previous: 'Basil', name: 'Apple', scientific: 'Malus', type: 'Flowering',
    folders: [['Apple Scab Leaf', 'Apple scab']], cover: 'Apple Scab Leaf (1).jpg' },
  { key: 'tomato', previous: 'Tomato', name: 'Tomato', scientific: 'Solanum lycopersicum', type: 'Vegetable',
    folders: [['Tomato leaf late blight', 'Late blight']], cover: 'Tomato leaf late blight (8).jpg' },
  { key: 'bell-pepper', previous: 'Chili', name: 'Bell pepper', scientific: 'Capsicum annuum', type: 'Vegetable',
    folders: [['Bell_pepper leaf', 'Healthy'], ['Bell_pepper leaf spot', 'Bacterial spot']] },
  { key: 'grape', previous: 'Money Plant', name: 'Grape', scientific: 'Vitis', type: 'Flowering',
    folders: [['grape leaf', 'Healthy']] },
  { key: 'strawberry', previous: 'Flowering plant', name: 'Strawberry', scientific: 'Fragaria', type: 'Flowering',
    folders: [['Strawberry leaf', 'Healthy']] },
];

async function renameSeededCareReferences(owner, plant, example, session) {
  if (example.previous === example.name) return;
  for (const type of ['Water', 'Fertilize', 'Prune', 'Inspect']) {
    await CareTask.updateMany({ owner, plant, type, notes: `${type} ${example.previous.toLowerCase()} as needed` }, {
      $set: { notes: `${type} ${example.name.toLowerCase()} as needed` },
    }, { session });
  }
  await Formulation.updateMany({ owner, plant, name: 'Routine feeding', crop: example.previous }, {
    $set: { crop: example.name },
  }, { session });
}

async function preparePhotos(owner, example, count) {
  const chosen = [];
  let cover;
  for (const [folder, condition] of example.folders) {
    const files = await fs.readdir(path.join(dataset, folder));
    const images = files.filter(file => /\.(jpe?g|png|webp)$/i.test(file)).sort((left, right) => {
      return Number(right === example.cover) - Number(left === example.cover) || left.localeCompare(right, 'en', { numeric: true });
    });
    for (const file of images) {
      if (chosen.length === count) break;
      const bytes = await fs.readFile(path.join(dataset, folder, file));
      const digest = createHash('sha256').update(bytes).digest('hex');
      if (chosen.some(item => item.digest === digest)) continue;
      const extension = path.extname(file).toLowerCase().replace('.jpg', '.jpeg');
      const filename = `${owner}-${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}${extension}`;
      const photo = `/api/media/${filename}`;
      const uploaded = path.join(uploads, filename);
      const created = await fs.writeFile(uploaded, bytes, { flag: 'wx' }).then(() => true).catch(error => {
        if (error.code !== 'EEXIST') throw error;
        return false;
      });
      let selected = false;
      try {
        if (!created && !bytes.equals(await fs.readFile(uploaded))) throw new Error('Existing upload differs from its source file.');
        const result = await scanner.analyze({ photos: [photo], kind });
        const label = `${example.name} – ${condition}`;
        if (result.findings?.[0]?.label !== label || !Number.isFinite(result.confidence)) continue;
        const entry = { photo, digest, result: { ...result, scientific: example.scientific, type: example.type } };
        const accepted = ['Healthy', 'Needs Care'].includes(result.status);
        if (accepted && (!cover || file === example.cover)) cover = entry;
        chosen.push(entry);
        selected = true;
      } finally {
        if (created && !selected) await fs.unlink(uploaded);
      }
    }
  }
  if (!cover || chosen.length !== count) {
    throw new Error(`Found ${chosen.length}/${count} matching model results for ${example.name}.`);
  }
  return [...chosen.filter(item => item !== cover), cover];
}

async function saveExample(owner, example, previous, oldScans, photos) {
  const cover = photos.at(-1);
  const profile = {
    exampleKey: example.key, owner, name: example.name, scientific: example.scientific, type: example.type,
    image: cover.photo, status: cover.result.status, notes: cover.result.summary,
    aiCareRequirements: { source: 'ai' },
  };
  const session = await mongoose.startSession();
  let plant;
  try {
    await session.withTransaction(async () => {
      if (previous) {
        plant = await Plant.findOneAndUpdate({
          _id: previous._id, owner, name: example.previous, notes: 'Demo garden plant',
          'aiCareRequirements.source': 'demo', updatedAt: previous.updatedAt,
        }, { $set: profile }, { session, runValidators: true, returnDocument: 'after' });
        if (!plant) throw new Error(`The sample profile changed during import: ${example.previous}.`);
        await renameSeededCareReferences(owner, plant._id, example, session);
      } else {
        [plant] = await Plant.create([profile], { session });
      }
      let latest;
      for (const [index, { photo, result }] of photos.entries()) {
        const values = { owner, plant: plant._id, kind, photos: [photo], notes: '', state: 'complete',
          source: 'ai', completedAt: new Date(), result };
        const old = oldScans[index];
        if (old) {
          latest = await Scan.findOneAndUpdate({
            _id: old._id, owner, plant: plant._id, source: 'demo', notes: old.notes, updatedAt: old.updatedAt,
          }, { $set: values, $unset: { tasksComplete: '', totalTasks: '' } },
          { session, runValidators: true, returnDocument: 'after' });
          if (!latest) throw new Error(`A sample scan changed during import: ${example.previous}.`);
        } else {
          [latest] = await Scan.create([values], { session });
        }
      }
      plant.latestScan = latest._id;
      await plant.save({ session });
    });
  } finally {
    await session.endSession();
  }
  return plant;
}

exports.refreshPlantExamples = async (owner, { existingOnly = false } = {}) => {
  if (scanner.provider() !== 'agrismart') throw new Error('Set AI_MODEL_PROVIDER=agrismart before importing plant photos.');
  await fs.mkdir(uploads, { recursive: true });
  const plants = [];
  let updatedScans = 0;
  for (const example of examples) {
    const existing = await Plant.findOne({ owner, exampleKey: example.key });
    if (existing) {
      if (existing.name === example.name) await renameSeededCareReferences(owner, existing._id, example);
      plants.push(existing);
      continue;
    }
    const previous = await Plant.findOne({
      owner, name: example.previous, notes: 'Demo garden plant', 'aiCareRequirements.source': 'demo',
    });
    if (!previous && existingOnly) continue;
    if (!previous && await Plant.exists({ owner, name: example.name })) continue;
    const oldNotes = Array.from({ length: 7 }, (_, index) => `Demo garden scan ${index + 1}: ${example.previous}`);
    const oldScans = previous ? await Scan.find({
      owner, plant: previous._id, source: 'demo', state: 'complete', notes: { $in: oldNotes },
    }).sort({ createdAt: 1, _id: 1 }) : [];
    const photos = await preparePhotos(owner, example, oldScans.length || 7);
    plants.push(await saveExample(owner, example, previous, oldScans, photos));
    updatedScans += photos.length;
    console.log(`${example.previous} → ${example.name}: ${photos.length} scans analyzed.`);
  }
  return { plants, updatedScans };
};

exports.addSampleRecoveryChecks = async (owner, plant) => {
  const originals = await Scan.find({
    owner, plant: plant._id, kind, state: 'complete', sample: { $ne: true }, source: 'ai',
  }).sort({ createdAt: 1, _id: 1 });
  const photos = [...new Set(originals.map(scan => scan.photos[0]).filter(photo => photo && photo !== plant.image))].slice(0, 2);
  let added = 0;
  for (const [index, photo] of photos.entries()) {
    const id = new mongoose.Types.ObjectId(createHash('sha256').update(`${owner}:${plant._id}:sample-recovery:${index}`).digest('hex').slice(0, 24));
    if (await Scan.exists({ _id: id, owner, plant: plant._id, sample: true })) continue;
    const kind = 'Recovery check';
    const photos = [photo];
    const result = await scanner.analyze({ photos, kind });
    if (!result.isPlant || !Number.isFinite(result.confidence)) throw new Error(`Could not analyze the recovery sample for ${plant.name}.`);
    const values = { owner, plant: plant._id, kind, photos, notes: 'Sample recovery comparison', state: 'complete', source: 'ai', sample: true,
      completedAt: new Date(), result: { ...result, scientific: plant.scientific, type: plant.type } };
    const saved = await Scan.updateOne({ _id: id, owner, plant: plant._id, sample: true }, { $setOnInsert: values }, { upsert: true, runValidators: true });
    added += saved.upsertedCount;
  }
  return added;
};
