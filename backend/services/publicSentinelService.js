const proj4 = require('proj4');

const catalog = 'https://earth-search.aws.element84.com/v1/search';
const assetHost = 'sentinel-cogs.s3.us-west-2.amazonaws.com';
const clearClasses = new Set([4, 5, 6]);
const bandKeys = ['red', 'nir', 'rededge1', 'nir08'];

function projectionGrid(bbox, size, epsg) {
  const [west, south, east, north] = bbox;
  const projection = proj4('EPSG:4326', `EPSG:${epsg}`);
  return Array.from({ length: size ** 2 }, (_, index) => projection.forward([
    west + (east - west) * (index % size + .5) / size,
    north - (north - south) * (Math.floor(index / size) + .5) / size,
  ]));
}

async function readBand(fromUrl, asset, points, signal) {
  const url = new URL(asset.href);
  if (url.origin !== `https://${assetHost}`) throw new Error('Unexpected Sentinel-2 asset host');
  const tiff = await fromUrl(url.href, { allowFullFile: false, blockSize: 65536, cacheSize: 16 }, signal);
  try {
    const image = await tiff.getImage();
    const [originX, originY] = image.getOrigin();
    const [stepX, stepY] = image.getResolution();
    const columns = points.map(([x]) => Math.floor((x - originX) / stepX));
    const rows = points.map(([, y]) => Math.floor((y - originY) / stepY));
    const left = Math.max(0, Math.min(...columns));
    const top = Math.max(0, Math.min(...rows));
    const right = Math.min(image.getWidth(), Math.max(...columns) + 1);
    const bottom = Math.min(image.getHeight(), Math.max(...rows) + 1);
    if (left >= right || top >= bottom) return new Uint16Array(points.length);
    if (right - left > 128 || bottom - top > 128) throw new Error('Unexpected Sentinel-2 raster bounds');
    const raster = await image.readRasters({ window: [left, top, right, bottom], interleave: true, signal });
    return columns.map((column, index) => {
      const row = rows[index];
      return column >= left && column < right && row >= top && row < bottom
        ? raster[(row - top) * (right - left) + column - left] : 0;
    });
  } finally {
    await tiff.close();
  }
}

async function readBandWithRetry(fromUrl, asset, points, signal) {
  try {
    return await readBand(fromUrl, asset, points, signal);
  } catch (error) {
    if (signal.aborted || !error.cause?.code) throw error;
    return readBand(fromUrl, asset, points, signal);
  }
}

function reflectance(value, asset) {
  const band = asset['raster:bands']?.[0];
  if (value === (band?.nodata ?? 0)) return NaN;
  return Math.max(0, value * (band?.scale ?? .0001) + (band?.offset ?? 0));
}

function encodeDifference(high, low) {
  const sum = high + low;
  return sum > 0 ? Math.round(127.5 * (1 + (high - low) / sum)) : NaN;
}

async function inspectPublicSentinel({ bbox, latitude, longitude, start, end, size }) {
  const signal = AbortSignal.timeout(35000);
  const query = new URLSearchParams({
    collections: 'sentinel-2-l2a', intersects: JSON.stringify({ type: 'Point', coordinates: [longitude, latitude] }),
    datetime: `${start.toISOString()}/${end.toISOString()}`, sortby: '-properties.datetime', limit: '8',
  });
  const response = await fetch(`${catalog}?${query}`, { signal });
  if (!response.ok) throw new Error('Sentinel-2 catalog is unavailable');
  const { features } = await response.json();
  const scenes = (features || []).filter(({ assets, properties }) =>
    properties?.['proj:epsg'] && properties.datetime && assets?.scl && bandKeys.every(key => assets[key]));
  if (!scenes.length) return null;

  const { fromUrl } = await import('geotiff');
  let best;
  let scanned = 0;
  let readFailure;
  // Check the scene classification at the plant, since tile-wide cloud cover can miss local cloud.
  for (let i = 0; i < scenes.length && !signal.aborted; i += 3) {
    const results = await Promise.allSettled(scenes.slice(i, i + 3).map(async ({ assets, properties }) => {
      const points = projectionGrid(bbox, size, properties['proj:epsg']);
      const classes = await readBandWithRetry(fromUrl, assets.scl, points, signal);
      const coverage = classes.filter(value => clearClasses.has(value)).length;
      return { assets, date: properties.datetime, points, classes, coverage };
    }));
    const candidates = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
    readFailure ??= results.find(result => result.status === 'rejected')?.reason;
    scanned += candidates.length;
    const mostlyClear = candidates.find(scene => scene.coverage >= size ** 2 * .75);
    if (mostlyClear) { best = mostlyClear; break; }
    for (const candidate of candidates) if (candidate.coverage > (best?.coverage ?? 0)) best = candidate;
  }
  if (!scanned) throw new Error('Sentinel-2 raster data is unavailable', { cause: readFailure });
  if (!best) return null;

  const { assets, points, classes, date } = best;
  const bands = await Promise.all(bandKeys.map(key => readBandWithRetry(fromUrl, assets[key], points, signal)));
  const pixels = Buffer.alloc(size ** 2 * 4);
  classes.forEach((value, index) => {
    if (!clearClasses.has(value)) return;
    const [red, nir, edge, narrowNir] = bands.map((band, channel) => reflectance(band[index], assets[bandKeys[channel]]));
    const ndvi = encodeDifference(nir, red);
    const ndre = encodeDifference(narrowNir, edge);
    if (!Number.isFinite(ndvi) || !Number.isFinite(ndre)) return;
    pixels[index * 4] = ndvi;
    pixels[index * 4 + 1] = ndre;
    pixels[index * 4 + 3] = 255;
  });
  return { pixels, date };
}

module.exports = { inspectPublicSentinel };
