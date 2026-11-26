const amazonMerchant = 'Amazon India';
const flipkartMerchant = 'Flipkart';
const amazonMarketplace = 'www.amazon.in';
let amazonToken;

exports.configured = () => ({
  [amazonMerchant]: Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET && process.env.AMAZON_PARTNER_TAG),
  [flipkartMerchant]: Boolean(process.env.FLIPKART_AFFILIATE_ID && process.env.FLIPKART_AFFILIATE_TOKEN),
});

async function request(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Merchant API returned HTTP ${response.status}`);
  return response.json();
}

function httpsUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}

function listing(merchant, title, imageUrl, detailUrl) {
  const image = httpsUrl(imageUrl);
  const url = httpsUrl(detailUrl);
  return title && image && url ? { merchant, title, image, url } : null;
}

async function amazonListing(keywords) {
  if (!amazonToken || amazonToken.expiresAt <= Date.now()) {
    const token = await request('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.AMAZON_CLIENT_ID,
        client_secret: process.env.AMAZON_CLIENT_SECRET,
        scope: 'creatorsapi::default',
      }),
    });
    if (!token.access_token) throw new Error('Amazon returned no application token');
    amazonToken = { value: token.access_token, expiresAt: Date.now() + Math.max(0, Number(token.expires_in) - 60) * 1000 };
  }
  const data = await request('https://creatorsapi.amazon/catalog/v1/searchItems', {
    method: 'POST',
    headers: { Authorization: `Bearer ${amazonToken.value}`, 'Content-Type': 'application/json', 'x-marketplace': amazonMarketplace },
    body: JSON.stringify({
      marketplace: amazonMarketplace, partnerTag: process.env.AMAZON_PARTNER_TAG,
      keywords, itemCount: 3, resources: ['images.primary.medium', 'itemInfo.title'],
    }),
  });
  return data.searchResult?.items
    ?.map(item => listing(amazonMerchant, item.itemInfo?.title?.displayValue, item.images?.primary?.medium?.url, item.detailPageURL))
    .find(Boolean);
}

async function flipkartListing(query) {
  const params = new URLSearchParams({ query, resultCount: '3' });
  const data = await request(`https://affiliate-api.flipkart.net/affiliate/1.0/search.json?${params}`, {
    headers: { 'Fk-Affiliate-Id': process.env.FLIPKART_AFFILIATE_ID, 'Fk-Affiliate-Token': process.env.FLIPKART_AFFILIATE_TOKEN },
  });
  return data.productInfoList?.map(item => {
    const info = item.productBaseInfoV1 || item.productBaseInfo?.productAttributes;
    return listing(flipkartMerchant, info?.title, info?.imageUrls?.['400x400'] || info?.imageUrls?.['275x275'], info?.productUrl);
  }).find(Boolean);
}

exports.preview = async (merchant, query) => {
  if (!Object.hasOwn(exports.configured(), merchant) || !exports.configured()[merchant]) return { status: 'not-configured' };
  try {
    const product = await (merchant === amazonMerchant ? amazonListing(query) : flipkartListing(query));
    return product ? { status: 'live', product } : { status: 'no-results' };
  } catch { return { status: 'unavailable' }; }
};
