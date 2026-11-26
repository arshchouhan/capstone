const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

const directory = path.resolve(__dirname, '../models/ai/agrismart');
const base = 'https://raw.githubusercontent.com/Vatsal2008/AgriSmart-AI/main/models';
const files = {
  'models.json': '648d20786270528556e978b79666c4fca41607987ac28170ce543fdcfbfde57f',
  'core.onnx': '950a80eeac7982be5cd9965645f91aa8f78617455143996fe64cf5b98db78bdb',
  'india_v1.onnx': 'f6b0ad51ea7175a7426d40a08b2f56bade93f4de5c89da9ebe2540d3c81a27b4',
};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function download() {
  await fs.mkdir(directory, { recursive: true });
  for (const [file, expected] of Object.entries(files)) {
    const destination = path.join(directory, file);
    const existing = await fs.readFile(destination).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
    if (existing && digest(existing) === expected) continue;
    const response = await fetch(`${base}/${file}`, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Download failed for ${file} (HTTP ${response.status}).`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (digest(bytes) !== expected) throw new Error(`Checksum mismatch for ${file}.`);
    const temporary = `${destination}.${process.pid}.tmp`;
    await fs.writeFile(temporary, bytes);
    try { await fs.rename(temporary, destination); }
    finally { await fs.rm(temporary, { force: true }); }
  }
  console.log('AgriSmart model files verified.');
}

download().catch(error => { console.error(error.message); process.exitCode = 1; });
