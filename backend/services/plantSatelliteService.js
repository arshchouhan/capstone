const sharp = require('sharp');
const { inspectPublicSentinel } = require('./publicSentinelService');

const tokenUrl = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const processUrl = 'https://sh.dataspace.copernicus.eu/process/v1';
const imageSize = 32;
const palette = [[153, 58, 49], [231, 172, 81], [190, 212, 112], [28, 116, 65]];
let cachedToken;

const evalscript = `//VERSION=3
function setup() {
  return {
    input: ['B04', 'B05', 'B08', 'B8A', 'SCL', 'dataMask'],
    output: { bands: 4, sampleType: 'UINT8' },
    mosaicking: 'ORBIT'
  };
}
function encode(index) {
  return Math.round(127.5 * (1 + Math.max(-1, Math.min(1, index))));
}
function evaluatePixel(samples) {
  for (const s of samples) {
    if (!s.dataMask || ![4, 5, 6].includes(s.SCL)) continue;
    if (s.B08 + s.B04 <= 0 || s.B8A + s.B05 <= 0) continue;
    return [encode((s.B08 - s.B04) / (s.B08 + s.B04)),
      encode((s.B8A - s.B05) / (s.B8A + s.B05)), 0, 255];
  }
  return [0, 0, 0, 0];
}`;

async function getToken(clientId, clientSecret) {
  if (cachedToken?.expiresAt > Date.now() + 30000 && cachedToken.clientId === clientId) return cachedToken.value;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Copernicus authentication failed');
  const { access_token: value, expires_in: expiresIn } = await response.json();
  if (!value) throw new Error('Copernicus did not return a token');
  cachedToken = { clientId, value, expiresAt: Date.now() + expiresIn * 1000 };
  return value;
}

async function renderIndex(pixels, channel, width, height, validPixels) {
  const colors = Buffer.alloc(pixels.length);
  let total = 0;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (!pixels[offset + 3]) continue;
    const fraction = pixels[offset + channel] / 255;
    total += fraction * 2 - 1;
    const scaled = fraction * (palette.length - 1);
    const start = Math.min(Math.floor(scaled), palette.length - 2);
    for (let component = 0; component < 3; component++) {
      colors[offset + component] = Math.round(palette[start][component] +
        (palette[start + 1][component] - palette[start][component]) * (scaled - start));
    }
    colors[offset + 3] = 255;
  }
  const png = await sharp(colors, { raw: { width, height, channels: 4 } }).png().toBuffer();
  return { average: Number((total / validPixels).toFixed(2)), image: `data:image/png;base64,${png.toString('base64')}` };
}

async function copernicusRaster(bbox, start, end, clientId, clientSecret) {
  const token = await getToken(clientId, clientSecret);
  const response = await fetch(processUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'image/png' },
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify({
      input: {
        bounds: { bbox, properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' } },
        data: [{ type: 'sentinel-2-l2a', dataFilter: { timeRange: { from: start.toISOString(), to: end.toISOString() }, mosaickingOrder: 'mostRecent' } }],
      },
      output: { width: imageSize, height: imageSize, responses: [{ identifier: 'default', format: { type: 'image/png' } }] },
      evalscript,
    }),
  });
  if (response.status === 401) cachedToken = undefined;
  if (!response.ok) throw new Error('Copernicus processing failed');
  const { data, info } = await sharp(Buffer.from(await response.arrayBuffer()), { limitInputPixels: imageSize ** 2 })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== imageSize || info.height !== imageSize || info.channels !== 4) throw new Error('Unexpected Copernicus raster size');
  return data;
}

async function summarize(pixels, from, to, source) {
  let validPixels = 0;
  for (let alpha = 3; alpha < pixels.length; alpha += 4) if (pixels[alpha]) validPixels++;
  if (!validPixels) return { status: 'no-data' };
  const [ndvi, ndre] = await Promise.all([0, 1].map(channel => renderIndex(pixels, channel, imageSize, imageSize, validPixels)));
  return { status: 'available', ndvi, ndre, from, to, source, coverage: Math.round(validPixels / imageSize ** 2 * 100) };
}

async function inspectPlantLocation({ latitude, longitude }) {
  // A roughly 320 m square gives field context at Sentinel-2's 10–20 m resolution.
  const deltaLat = .00144;
  const deltaLon = deltaLat / Math.cos(latitude * Math.PI / 180);
  const bbox = [longitude - deltaLon, latitude - deltaLat, longitude + deltaLon, latitude + deltaLat];
  if (latitude < -80 || latitude > 84 || bbox[0] < -180 || bbox[2] > 180) return { status: 'outside-coverage' };
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 86400000);

  const { CDSE_CLIENT_ID: clientId, CDSE_CLIENT_SECRET: clientSecret } = process.env;
  if (clientId && clientSecret) {
    try {
      const pixels = await copernicusRaster(bbox, start, end, clientId, clientSecret);
      const result = await summarize(pixels, start.toISOString(), end.toISOString(), 'Copernicus Data Space');
      if (result.status === 'available') return result;
    } catch {
      // Try the public collection when the configured provider is unavailable.
    }
  }
  const scene = await inspectPublicSentinel({ bbox, latitude, longitude, start, end, size: imageSize });
  return scene ? summarize(scene.pixels, scene.date, scene.date, 'Earth Search') : { status: 'no-data' };
}

module.exports = { inspectPlantLocation };
