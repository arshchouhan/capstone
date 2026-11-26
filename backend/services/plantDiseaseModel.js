const fs = require('node:fs/promises');
const path = require('node:path');
const { InferenceSession, Tensor } = require('onnxruntime-node');
const sharp = require('sharp');

exports.loadClassifier = async (directory, config) => {
  const model = await fs.readFile(path.join(directory, path.basename(config.file)));
  const session = await InferenceSession.create(model, { intraOpNumThreads: 2 });
  return async image => {
    const { img_size: size, crop_pct: cropRatio, mean, std } = config;
    const contextSize = Math.round(size / cropRatio);
    const offset = Math.floor((contextSize - size) / 2);
    const resized = await sharp(image).autoOrient().removeAlpha().toColourspace('srgb')
      .resize(contextSize, contextSize, { fit: 'cover', position: 'centre', kernel: 'cubic' })
      .raw().toBuffer();
    let leafColoredPixels = 0;
    for (let pixel = 0; pixel < resized.length; pixel += 3) {
      const red = resized[pixel], green = resized[pixel + 1], blue = resized[pixel + 2];
      if ((green > 42 && green > red * 1.06 && green > blue * 1.06)
        || (red > 42 && red > blue * 1.16 && green > blue * 1.08)) leafColoredPixels++;
    }
    if (leafColoredPixels < contextSize * contextSize * 0.025) return [];

    const area = size * size;
    const input = new Float32Array(3 * area);
    for (let channel = 0; channel < 3; channel++) {
      for (let row = 0; row < size; row++) {
        for (let column = 0; column < size; column++) {
          const pixel = ((row + offset) * contextSize + column + offset) * 3 + channel;
          input[channel * area + row * size + column] = (resized[pixel] / 255 - mean[channel]) / std[channel];
        }
      }
    }
    const response = await session.run({
      [session.inputNames[0]]: new Tensor('float32', input, [1, 3, size, size]),
    });
    const logits = response[session.outputNames[0]].data;
    if (logits.length !== config.labels.length || !Array.from(logits).every(Number.isFinite)) {
      throw new Error('Unexpected plant classifier output.');
    }
    const peak = Math.max(...logits);
    const weights = Array.from(logits, value => Math.exp(value - peak));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return config.labels.map((label, index) => ({ ...label, probability: weights[index] / total }))
      .sort((left, right) => right.probability - left.probability);
  };
};
