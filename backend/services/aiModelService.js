const fs = require('node:fs/promises');
const path = require('node:path');
const { pipeline, RawImage } = require('@huggingface/transformers');

const uploadDirectory = path.resolve(__dirname, '../uploads');
const plantModel = process.env.HF_PLANT_MODEL || 'marwaALzaabi/plant-identification-vit';
const diseaseModel = process.env.HF_DISEASE_MODEL || 'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';
const localModel = process.env.LOCAL_AI_MODEL || 'Xenova/vit-base-patch16-224';
let localClassifier;
let insectClassifier;
const insectModel = 'Xenova/resnet-18';
const insectGroups = /^(?:ant|bee|fly|grasshopper|cricket|cockroach|mantis|dragonfly|damselfly|cicada|leafhopper|lacewing|walking stick|ladybug|ground beetle|long-horned beetle|leaf beetle|dung beetle|rhinoceros beetle|weevil|ringlet|monarch|cabbage butterfly|sulphur butterfly|lycaenid|admiral)(?:,|$)/i;

const careByPlant = {
  basil: { scientific: 'Ocimum basilicum', type: 'Herb', light: 'Bright indirect light', watering: 'When the top soil is dry', temperature: '18–30 °C', soil: 'Rich, well-draining potting mix' },
  tomato: { scientific: 'Solanum lycopersicum', type: 'Vegetable', light: '6–8 hours of direct sun', watering: 'Keep soil evenly moist', temperature: '18–29 °C', soil: 'Fertile, well-draining soil' },
  potato: { scientific: 'Solanum tuberosum', type: 'Vegetable', light: 'Full sun', watering: 'When the top 2–3 cm is dry', temperature: '15–24 °C', soil: 'Loose, well-draining soil' },
  pepper: { scientific: 'Capsicum annuum', type: 'Vegetable', light: '6–8 hours of direct sun', watering: 'When the top soil is dry', temperature: '18–30 °C', soil: 'Well-draining fertile soil' },
  chili: { scientific: 'Capsicum annuum', type: 'Vegetable', light: '6–8 hours of direct sun', watering: 'When the top soil is dry', temperature: '18–30 °C', soil: 'Well-draining fertile soil' },
  rose: { scientific: 'Rosa', type: 'Flowering', light: '6–8 hours of direct sun', watering: 'When the top soil is dry', temperature: '15–27 °C', soil: 'Rich, well-draining soil' },
};

function photoFilename(photo) {
  const filename = String(photo || '').split('/').pop();
  if (!/^[a-f\d]{24}-[a-f\d-]{36}\.(jpeg|png|webp)$/i.test(filename)) {
    throw new Error('Scan photo is not a private uploaded image.');
  }
  return filename;
}

async function imageBytes(photo) {
  return fs.readFile(path.join(uploadDirectory, photoFilename(photo)));
}

exports.identifyInsect = async photo => {
  const input = await RawImage.fromBlob(new Blob([await imageBytes(photo)]));
  insectClassifier ||= pipeline('image-classification', insectModel, { dtype: 'q8' }).catch(error => {
    insectClassifier = undefined;
    throw error;
  });
  const [first, second] = await (await insectClassifier)(input, { topk: 2 });
  if (!first || !insectGroups.test(first.label) || first.score < .55 || first.score - (second?.score ?? 0) < .15) {
    return { status: 'Needs review', summary: 'No reliable match. Try a closer photo with one insect in focus.' };
  }
  const name = first.label.split(',')[0];
  return { name, status: 'Possible match', confidence: first.score * 100,
    summary: 'Compare this possible match with the insect you photographed.' };
};

async function classify(model, image) {
  const token = process.env.HF_TOKEN || process.env.HUGGING_FACE_TOKEN;
  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/octet-stream',
    },
    body: image,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error || `Hugging Face returned ${response.status}.`;
    const error = new Error(
      response.status === 401 || response.status === 403
        ? 'Hugging Face rejected the token. Create a fine-grained token with Inference Providers permission, then restart the backend.'
        : message,
    );
    error.status = 503;
    throw error;
  }
  if (!Array.isArray(payload) || !payload.length || typeof payload[0]?.label !== 'string') {
    throw new Error('The configured AI model returned no classification.');
  }
  return payload.slice(0, 3).map(item => ({ label: item.label, score: Math.round(item.score * 100) }));
}

async function classifyLocally(image) {
  localClassifier ||= pipeline('image-classification', localModel);
  const predictions = await (await localClassifier)(await RawImage.fromBlob(new Blob([image])));
  return predictions.slice(0, 3).map(item => ({ label: item.label, score: Math.round(item.score * 100) }));
}

function cleanLabel(label) {
  return label.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function plantDetails(label) {
  const lower = label.toLowerCase();
  const known = Object.entries(careByPlant).find(([name]) => lower.includes(name));
  const care = known?.[1] || {
    scientific: 'Species not confirmed',
    type: 'Plant',
    light: 'Bright, indirect light until confirmed',
    watering: 'Water when the top soil is dry',
    temperature: 'Not assessed',
    soil: 'Well-draining potting mix',
  };
  return { name: cleanLabel(label), ...care };
}

function diseaseFinding(label, score) {
  const normalized = cleanLabel(label);
  const healthy = /healthy|normal|good/i.test(normalized);
  return {
    label: normalized,
    description: healthy
      ? 'No disease class was detected by the configured model.'
      : `The disease model classified the visible sample as ${normalized}. Confirm the result with an expert before treatment.`,
    ...(healthy ? {} : { region: { x: 8, y: 8, width: 84, height: 84 } }),
    confidence: score,
  };
}

exports.analyze = async ({ photo, kind = 'Disease Identifier' }) => {
  const image = await imageBytes(photo);
  const useLocal = process.env.AI_MODEL_PROVIDER !== 'huggingface';
  const identity = useLocal ? await classifyLocally(image) : await classify(plantModel, image);
  const bestPlant = identity[0];
  const details = plantDetails(bestPlant.label);
  const result = {
    name: details.name,
    scientific: details.scientific,
    type: details.type,
    light: details.light,
    watering: details.watering,
    confidence: bestPlant.score,
    aiCareRequirements: {
      temperature: details.temperature,
      hardiness: 'Not assessed',
      light: details.light,
      soil: details.soil,
      location: 'Sheltered growing spot',
      source: useLocal ? `Local model: ${localModel}` : `Hugging Face: ${plantModel}`,
    },
  };

  if (kind === 'Plant Identifier') {
    return {
      ...result,
      status: 'Identified',
      score: bestPlant.score,
      findings: identity.map(item => ({ label: cleanLabel(item.label), description: `Alternative identification at ${item.score}% confidence.` })),
      notes: `Pretrained plant classifier result: ${cleanLabel(bestPlant.label)}.`,
      summary: `The pretrained model identified this image as ${cleanLabel(bestPlant.label)} with ${bestPlant.score}% confidence.`,
    };
  }

  const disease = useLocal ? identity : await classify(diseaseModel, image);
  const bestDisease = disease[0];
  const healthy = /healthy|normal|good/i.test(bestDisease.label);
  return {
    ...result,
    status: healthy ? 'Healthy' : 'Needs Care',
    score: healthy ? bestDisease.score : Math.max(0, 100 - bestDisease.score),
    findings: [diseaseFinding(bestDisease.label, bestDisease.score)],
    notes: `Plant identity: ${cleanLabel(bestPlant.label)}. Disease model: ${cleanLabel(bestDisease.label)}.`,
    summary: `The pretrained models identified ${cleanLabel(bestPlant.label)} and classified the visible condition as ${cleanLabel(bestDisease.label)}.`,
    aiCareRequirements: { ...result.aiCareRequirements, source: useLocal ? `Local model: ${localModel}` : `Hugging Face: ${plantModel}; ${diseaseModel}` },
  };
};

exports.models = { plant: plantModel, disease: diseaseModel };
