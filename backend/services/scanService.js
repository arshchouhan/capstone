const aiModel = require('./aiModelService');
const teamModel = require('./teamPlantModelService');
const agriSmart = require('./agrismartScanService');

exports.provider = () => process.env.AI_MODEL_PROVIDER || 'agrismart';

exports.analyze = async (scan, plant) => {
  if (scan.kind === 'Insect Identifier') {
    const result = await aiModel.identifyInsect(scan.photos[0]).catch(error => {
      throw Object.assign(new Error('Insect identification is temporarily unavailable. Try again shortly.', { cause: error }), { status: 503 });
    });
    return { ...result, isPlant: false, notes: scan.notes, photoIndex: 0 };
  }
  const provider = exports.provider();
  if (['agrismart', 'team-resnet'].includes(provider)) {
    const model = provider === 'agrismart' ? agriSmart : teamModel;
    let result;
    let review;
    for (const [photoIndex, photo] of scan.photos.entries()) {
      result = { ...await model.analyze({ photo, kind: scan.kind }), photoIndex };
      if (result.scientific === 'PlantDoc dataset reference') {
        review = result;
        break;
      }
      if (['Healthy', 'Needs Care'].includes(result.status)) break;
      if (result.isPlant && (!review || (result.confidence ?? -1) > (review.confidence ?? -1))) {
        review = result;
      }
    }
    if (!['Healthy', 'Needs Care'].includes(result.status)) result = review || result;
    return { ...result, notes: [scan.notes, result.notes].filter(Boolean).join('\n\n') };
  }
  if (['huggingface', 'local'].includes(provider)) {
    const result = await aiModel.analyze({ photo: scan.photos[0], kind: scan.kind });
    return { ...result, notes: [scan.notes, result.notes].filter(Boolean).join('\n\n') };
  }

  return {
    isPlant: true,
    name: plant?.name || (scan.kind === 'Weed Identifier' ? 'Dandelion' : 'Basil'),
    scientific: plant?.scientific || (scan.kind === 'Weed Identifier' ? 'Taraxacum officinale' : 'Ocimum basilicum'),
    type: plant?.type || (scan.kind === 'Weed Identifier' ? 'Other' : 'Herb'),
    light: plant?.light || 'Bright indirect light',
    watering: plant?.watering || 'When top soil is dry',
    notes: scan.notes || 'Sample scan result.',
    summary: 'Your photo and notes have been saved for this check.',
    status: 'Not assessed',
    findings: [],
    aiCareRequirements: {
      temperature: '18–28 °C',
      hardiness: 'Not assessed',
      light: 'Bright indirect light',
      soil: 'Well-draining potting mix',
      location: 'Sheltered growing spot',
      source: 'demo',
    },
  };
};
