const fs = require('node:fs/promises');
const path = require('node:path');
const { fail } = require('../controllers/helpers');

const uploadDirectory = path.resolve(__dirname, '../uploads');
const endpoint = () => `http://127.0.0.1:${process.env.TEAM_AI_PORT || 8011}`;
function photoPath(photo) {
  const file = String(photo || '').split('/').pop();
  if (!/^[a-f\d]{24}-[a-f\d-]{36}\.(jpeg|png|webp)$/i.test(file)) {
    throw fail(400, 'Scan photo is not a private uploaded image.');
  }
  return path.join(uploadDirectory, file);
}

const care = {
  light: 'Bright, indirect light while the diagnosis is confirmed',
  watering: 'Water only when the upper soil is dry',
  temperature: '18–30 °C',
  soil: 'Well-draining potting mix',
  location: 'Sheltered growing spot',
};

exports.analyze = async ({ photo, kind }) => {
  const image = (await fs.readFile(photoPath(photo))).toString('base64');
  let response;
  let payload;
  try {
    response = await fetch(endpoint() + '/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
      signal: AbortSignal.timeout(90000),
    });
    payload = await response.json();
  } catch {
    throw fail(503, 'Team AI service is unavailable. Run npm run ai:start in backend.');
  }
  if (!response.ok) throw fail(503, payload?.error || 'Team AI could not analyze this photo.');
  if (payload.unusable || payload.unreliable) {
    return {
      isPlant: !payload.unusable,
      name: payload.unusable ? 'Plant photo needed' : 'Plant needs review',
      scientific: 'Diagnosis not confirmed',
      type: 'Plant',
      status: payload.unusable ? 'Needs better photo' : 'Needs review',
      findings: [{ label: payload.unusable ? 'A clear plant photo is needed' : 'No reliable diagnosis', description: payload.reason }],
      notes: 'Use a clear, well-lit close-up of one leaf.',
      summary: payload.reason,
      aiCareRequirements: { ...care, source: payload.source || 'Team EfficientNetB4 input assessment' },
    };
  }
  if (typeof payload.needsReview !== 'boolean') {
    throw fail(503, 'Restart the team AI service to enable the updated confidence and health scoring.');
  }

  if (payload.referenceLabel) {
    return {
      isPlant: true,
      name: payload.crop,
      scientific: 'PlantDoc dataset reference',
      type: 'Plant',
      confidence: payload.confidence,
      score: payload.healthScore,
      status: payload.rawLabel.endsWith('___healthy') ? 'Healthy' : 'Needs Care',
      modelNeedsReview: payload.needsReview,
      findings: [{ label: payload.label, description: `Dataset label: ${payload.referenceLabel}.` }],
      notes: payload.treatment?.treatment,
      summary: `PlantDoc labels this exact photo “${payload.referenceLabel}.” The confidence and health scores come from the team model.`,
      aiCareRequirements: { ...care, source: payload.source },
    };
  }

  if (payload.needsReview) {
    return {
      isPlant: true,
      name: 'Plant needs review',
      scientific: 'Diagnosis not confirmed',
      type: 'Plant',
      confidence: payload.confidence,
      score: payload.healthScore,
      status: 'Needs review',
      findings: [{ label: `Tentative match: ${payload.label}`, description: 'The model returned competing or weak class scores.' }],
      notes: 'Try a well-lit close-up of one leaf before using this result to guide care.',
      summary: `The team model’s leading leaf class was ${payload.label}. Any health score is tentative for ${payload.crop}.`,
      aiCareRequirements: { ...care, source: payload.source },
    };
  }

  const healthy = payload.rawLabel.endsWith('___healthy');
  const finding = {
    label: payload.label,
    description: payload.treatment?.symptoms || 'No treatment details returned.',
    ...(healthy ? {} : { region: { x: 8, y: 8, width: 84, height: 84 } }),
  };
  return {
    isPlant: true,
    name: payload.label.split('–')[0].trim(),
    scientific: 'Leaf image classification',
    type: 'Plant',
    light: care.light,
    watering: care.watering,
    confidence: payload.confidence,
    status: healthy ? 'Healthy' : 'Needs Care',
    score: payload.healthScore,
    findings: kind === 'Plant Identifier' ? [
      finding,
      ...payload.topPredictions.slice(1).map(item => ({
        label: item.label,
        description: 'Alternative model classification.',
      })),
    ] : [finding],
    notes: payload.treatment?.treatment || 'No treatment recommendation returned.',
    summary: `The AI model classified this leaf as ${payload.label}.`,
    plantOverview: payload.plantOverview,
    aiCareRequirements: { ...care, source: payload.source },
  };
};
