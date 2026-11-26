const fs = require('node:fs/promises');
const path = require('node:path');
const { fail } = require('../controllers/helpers');
const { loadClassifier } = require('./plantDiseaseModel');

const modelDirectory = path.resolve(__dirname, '../models/ai/agrismart');
const uploadDirectory = path.resolve(__dirname, '../uploads');
const classifiers = new Map();

function getClassifier(id) {
  if (classifiers.has(id)) return classifiers.get(id);
  const pending = fs.readFile(path.join(modelDirectory, 'models.json'), 'utf8').then(text => {
    const config = JSON.parse(text).models.find(model => model.id === id);
    return loadClassifier(modelDirectory, config);
  }).catch(error => {
    classifiers.delete(id);
    if (error.code === 'ENOENT') throw fail(503, 'Plant model files are missing. Run npm run ai:download in backend.');
    throw error;
  });
  classifiers.set(id, pending);
  return pending;
}

const titleCrop = crop => crop.replaceAll('_', ' ').replace(/^./, first => first.toUpperCase());
const isHealthy = prediction => prediction.label.toLowerCase() === 'healthy';
const needsReviewFor = ([best, runnerUp]) => best.probability < 0.4
  || best.probability - (runnerUp?.probability ?? 0) < 0.1;

exports.analyze = async ({ photo, kind }) => {
  const filename = String(photo || '').split('/').pop();
  if (!/^[a-f\d]{24}-[a-f\d-]{36}\.(jpeg|png|webp)$/i.test(filename)) {
    throw fail(400, 'Scan photo is not a private uploaded image.');
  }
  const bytes = await fs.readFile(path.join(uploadDirectory, filename));
  const classify = await getClassifier('india_v1');
  let predictions = await classify(bytes);
  let source = 'AgriSmart India v1';
  if (!predictions.length) {
    return { isPlant: false, name: 'Plant photo needed', status: 'Needs better photo', summary: 'Use a clear photo of one leaf against a plain background.' };
  }

  if (needsReviewFor(predictions)) {
    const classifyCore = await getClassifier('core');
    const alternative = await classifyCore(bytes);
    if (alternative.length && !needsReviewFor(alternative)
      && alternative[0].probability > predictions[0].probability + 0.1) {
      predictions = alternative;
      source = 'AgriSmart Core v2';
    }
  }
  const [best] = predictions;
  const crop = titleCrop(best.crop);
  const healthy = isHealthy(best);
  const needsReview = needsReviewFor(predictions);
  const related = predictions.filter(item => item.crop === best.crop);
  const healthySupport = related.filter(isHealthy).reduce((sum, item) => sum + item.probability, 0);
  const totalSupport = related.reduce((sum, item) => sum + item.probability, 0);
  const score = healthySupport > 0 && related.some(item => !isHealthy(item))
    ? Math.round(100 * healthySupport / totalSupport)
    : undefined;
  const label = `${crop} – ${best.label}`;
  const findings = [{
    label,
    description: needsReview ? 'Check this possible match against symptoms on the plant.' : healthy
      ? 'The model’s leading result is a healthy leaf.'
      : `The model identified visual signs consistent with ${best.label.toLowerCase()}.`,
  }];
  if (kind === 'Plant Identifier') {
    findings.push(...predictions.slice(1, 3).map(item => ({
      label: `${titleCrop(item.crop)} – ${item.label}`,
      description: `Alternative match · ${(item.probability * 100).toFixed(1)}% model confidence.`,
    })));
  }

  return {
    isPlant: true,
    name: crop,
    type: 'Plant',
    confidence: 100 * best.probability,
    score,
    status: needsReview ? 'Needs review' : healthy ? 'Healthy' : 'Needs Care',
    modelNeedsReview: needsReview,
    findings,
    notes: needsReview ? 'Take a close-up in even daylight to confirm the result.' : healthy
      ? 'Continue your current care routine and check new growth for changes.'
      : 'Check other leaves for similar symptoms and keep affected plant material away from healthy plants. Confirm the diagnosis before starting a treatment.',
    summary: needsReview ? `Possible match: ${label}.` : label,
    aiCareRequirements: { source },
  };
};
