const fs=require('node:fs'),path=require('node:path');
const merchants=require('./merchantListingService');
const ebayToken={value:'',expiresAt:0};

const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
const merchantSearch=(merchant,base,query)=>({
  id:`${merchant}-${encodeURIComponent(query)}`,
  merchant,
  title:`Search ${merchant} for ${query}`,
  description:'Compare suitable products, delivery options, and seller details before buying.',
  url:`${base}${encodeURIComponent(query)}`,
  external:true,
});
const merchantSources=[
  ['Amazon India','https://www.amazon.in/s?k='],
  ['Flipkart','https://www.flipkart.com/search?q='],
  ['eBay','https://www.ebay.com/sch/i.html?_nkw='],
];

const queryForDiagnosis=diagnosis=>{
  const text=compact(diagnosis).toLowerCase();
  if(/scab/.test(text))return 'apple scab fungicide plant care';
  if(/rust/.test(text))return 'plant rust fungicide treatment';
  if(/powdery mildew|mildew/.test(text))return 'powdery mildew fungicide plant care';
  if(/blight/.test(text))return 'plant blight fungicide treatment';
  if(/spot|leaf spot/.test(text))return 'leaf spot plant fungicide treatment';
  if(/pest|aphid|mite|scale/.test(text))return 'plant pest control neem oil';
  return 'plant care supplies soil test kit pruning shears';
};

const modelLabels=()=>{
  const configPath=path.resolve(__dirname,'../models/ai/plantaexa-ai-source/backend/config.py');
  try{
    const source=fs.readFileSync(configPath,'utf8');
    return [...source.matchAll(/^\s*"([^"]+)",?\s*$/gm)].map(match=>match[1]).filter(label=>label.includes('___')&&!label.startsWith('Background'));
  }catch{return [];}
};

const modelCatalog=()=>{
  const classes=modelLabels().map(raw=>{
    const [crop,condition]=raw.split('___');
    return {crop:crop.replaceAll('_',' ').replaceAll(',','').trim(),condition:condition.replaceAll('_',' ').replace(/[()]/g,'').trim(),raw};
  });
  const crops=[...new Set(classes.map(item=>item.crop))].sort();
  return {crops,classes};
};

const getEbayToken=async()=>{
  if(ebayToken.value&&Date.now()<ebayToken.expiresAt)return ebayToken.value;
  const clientId=process.env.EBAY_CLIENT_ID,clientSecret=process.env.EBAY_CLIENT_SECRET;
  if(!clientId||!clientSecret)return '';
  const response=await fetch('https://api.ebay.com/identity/v1/oauth2/token',{
    method:'POST',
    headers:{Authorization:`Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},
    body:'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
    signal:AbortSignal.timeout(12000),
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok||!payload.access_token){
    const liveStatus=payload.error==='invalid_client'||response.status===401?'credentials-rejected':'unavailable';
    throw Object.assign(new Error('eBay authorization failed.'),{liveStatus});
  }
  ebayToken.value=payload.access_token;
  ebayToken.expiresAt=Date.now()+Math.max(60,Number(payload.expires_in||7200)-120)*1000;
  return ebayToken.value;
};

const searchEbay=async query=>{
  const token=await getEbayToken();
  if(!token)return [];
  const response=await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=6`,{
    headers:{Authorization:`Bearer ${token}`,'X-EBAY-C-MARKETPLACE-ID':process.env.EBAY_MARKETPLACE_ID||'EBAY_US'},
    signal:AbortSignal.timeout(12000),
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    const liveStatus=[401,403].includes(response.status)?'access-denied':'unavailable';
    throw Object.assign(new Error('eBay product search failed.'),{liveStatus});
  }
  return (payload.itemSummaries||[]).filter(item=>item.itemId&&item.title&&item.itemWebUrl).map(item=>({
    id:item.itemId,
    merchant:'eBay',
    title:item.title,
    description:[item.condition,item.seller?.username&&`Sold by ${item.seller.username}`].filter(Boolean).join(' · '),
    price:item.price?.value?`${item.price.currency||'USD'} ${item.price.value}`:'See merchant price',
    image:item.image?.imageUrl||'',
    url:item.itemWebUrl,
    external:true,
  }));
};

const liveListings=async query=>{
  if(!process.env.EBAY_CLIENT_ID||!process.env.EBAY_CLIENT_SECRET){
    return {liveProducts:[],liveStatus:'not-configured'};
  }
  try{
    const liveProducts=await searchEbay(query);
    return {liveProducts,liveStatus:liveProducts.length?'live':'no-results'};
  }catch(error){
    return {liveProducts:[],liveStatus:error.liveStatus||'unavailable'};
  }
};

exports.forQuery=async({query,context}={})=>{
  query=compact(query)||'plant disease care supplies';
  const live=await liveListings(query);
  const products=live.liveProducts.length?live.liveProducts:merchantSources.map(([merchant,base])=>merchantSearch(merchant,base,query));
  return {provider:live.liveProducts.length?'eBay Marketplace':'Merchant searches',context:compact(context)||'Plant care',query,products,...live};
};

exports.forDiagnosis=diagnosis=>exports.forQuery({query:queryForDiagnosis(diagnosis),context:diagnosis});
exports.catalog=({crop}={})=>{
  const catalog=modelCatalog();
  const selectedCrop=compact(crop);
  const availableCrop=catalog.crops.find(item=>item.toLowerCase()===selectedCrop.toLowerCase());
  return {
    crops:catalog.crops,
    classes:availableCrop?catalog.classes.filter(item=>item.crop===availableCrop):catalog.classes,
    query:availableCrop?`${availableCrop} plant disease care supplies`:'plant disease care supplies',
    context:availableCrop?`${availableCrop} plant care`:'Plant disease care across supported crops',
  };
};

exports.merchantPreview=async ({merchant,crop,condition}={})=>{
  const catalog=exports.catalog({crop});
  const selected=catalog.crops.find(name=>name.toLowerCase()===compact(crop).toLowerCase());
  if(crop&&!selected)return {status:'no-results'};
  const entry=condition&&catalog.classes.find(item=>item.crop===selected&&item.condition.toLowerCase()===compact(condition).toLowerCase());
  if(condition&&!entry)return {status:'no-results'};
  const query=entry?`${entry.crop} ${entry.condition} plant care`:selected?`${selected} plant care`:'plant care supplies';
  return merchants.preview(merchant,query);
};

exports.forCatalog=async({crop}={})=>{
  const catalog=exports.catalog({crop});
  const selectedCrop=catalog.crops.find(item=>item.toLowerCase()===compact(crop).toLowerCase());
  const entries=catalog.classes
    .filter(item=>selectedCrop?item.crop===selectedCrop:true)
    .sort((a,b)=>a.crop.localeCompare(b.crop)||a.condition.localeCompare(b.condition));
  // Build every disease-specific browse option represented by the installed
  // model. Healthy labels are general care, not a disease-treatment listing.
  const visible=entries.filter(item=>!/^healthy$/i.test(item.condition));
  const products=visible.map(({crop,condition,raw},index)=>{
    const query=`${crop} ${condition} plant care supplies`;
    const [merchant,base]=merchantSources[index%merchantSources.length];
    return {
      ...merchantSearch(merchant,base,query),
      id:`${raw}-${merchant}`,
      title:`${crop} · ${condition}`,
      description:`Explore products relevant to ${crop} ${condition.toLowerCase()} care.`,
      category:crop,
      condition,
    };
  });
  const query=selectedCrop?`${selectedCrop} plant care`:'plant care supplies';
  const live=await liveListings(query);
  const merchantProducts=products.length?products:merchantSources.map(([merchant,base])=>merchantSearch(merchant,base,query));
  return {marketplaceMode:'model-catalog-v1',provider:live.liveProducts.length?'eBay Marketplace':'Merchant searches',context:catalog.context,query,products:merchantProducts,catalog,merchantPreviews:merchants.configured(),...live};
};
