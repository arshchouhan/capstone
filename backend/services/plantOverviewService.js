const CACHE_TTL_MS=1000*60*60*24;
const cache=new Map();

const blockedNames=new Set(['plant','plant needs review','plant photo needed','not assessed']);
const normalise=value=>String(value||'').trim().replace(/\s+/g,' ');
const keyFor=result=>normalise(result?.name).toLowerCase();
const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const diagnosisFor=result=>{
  const label=normalise(result?.findings?.[0]?.label),crop=normalise(result?.name);
  if(!label||/no reliable diagnosis|clear plant photo|healthy/i.test(label))return '';
  return crop?normalise(label.replace(new RegExp(`^${escapeRegExp(crop)}\\s*[–-]\\s*`,'i'),'')):label;
};
const isConfirmed=result=>Boolean(
  result?.isPlant!==false&&
  normalise(result?.name)&&
  !blockedNames.has(keyFor(result))&&
  (result?.scientific==='PlantDoc dataset reference'||
    (Number(result?.confidence)>0&&!/needs review|needs better photo/i.test(result?.status||'')))
);
const request=async url=>{
  const response=await fetch(url,{headers:{'User-Agent':'Plantaexa/1.0 (botanical profile lookup)'},signal:AbortSignal.timeout(7000)});
  if(!response.ok)throw new Error(`Public reference request failed (${response.status}).`);
  return response.json();
};
const concise=value=>{
  const text=normalise(value).replace(/\s*\([^)]*\)/g,'');
  if(text.length<=520)return text;
  const end=text.lastIndexOf('. ',520);
  return `${text.slice(0,end>180?end+1:520).trim()}…`;
};

async function taxonomyFor(name){
  const url=`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`;
  const match=await request(url);
  if(!match?.usageKey||match.matchType==='NONE')return null;
  return {scientificName:normalise(match.scientificName),family:normalise(match.family),rank:normalise(match.rank)};
}

async function descriptionFor(...titles){
  const find=async title=>{
    if(!title)return '';
    const url=`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&titles=${encodeURIComponent(title)}`;
    const payload=await request(url);
    const page=Object.values(payload?.query?.pages||{})[0];
    return {overview:concise(page?.extract||''),title:normalise(page?.title)||title};
  };
  for(const title of [...new Set(titles.filter(Boolean))]){
    try{
      const description=await find(title);
      if(description.overview)return description;
    }catch{}
    try{
      const searchUrl=`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}&srlimit=1&format=json`;
      const search=await request(searchUrl);
      const resolvedTitle=normalise(search?.query?.search?.[0]?.title);
      if(resolvedTitle){
        const description=await find(resolvedTitle);
        if(description.overview)return description;
      }
    }catch{}
  }
  return {overview:'',title:''};
}

exports.isConfirmed=isConfirmed;
exports.forResult=async result=>{
  if(!isConfirmed(result))return null;
  const cropName=normalise(result.name),diagnosis=diagnosisFor(result),lookupName=diagnosis||cropName;
  const key=`${keyFor(result)}:${lookupName.toLowerCase()}`,cached=cache.get(key);
  if(cached&&cached.expiresAt>Date.now())return cached.profile;
  let taxonomy=null;
  try{taxonomy=await taxonomyFor(cropName)}catch{}
  const scientificName=taxonomy?.scientificName||'';
  const reference=await descriptionFor(lookupName,diagnosis&&`${cropName} ${diagnosis}`,scientificName,cropName);
  if(!reference.overview&&!scientificName)return null;
  const profile={
    commonName:lookupName,
    kind:diagnosis?'disease':'plant',
    scientificName,
    family:taxonomy?.family||'',
    growthForm:taxonomy?.rank?taxonomy.rank.toLowerCase():'',
    overview:reference.overview||`${lookupName} is the confirmed ${diagnosis?'plant condition':'crop class'}. A public description is temporarily unavailable.`,
    source:scientificName?'Live GBIF taxonomy and Wikipedia reference':'Live Wikipedia reference',
    sourceUrl:diagnosis||!scientificName?`https://en.wikipedia.org/wiki/${encodeURIComponent((reference.title||lookupName).replace(/\s+/g,'_'))}`:`https://www.gbif.org/species/search?q=${encodeURIComponent(scientificName)}`,
  };
  cache.set(key,{profile,expiresAt:Date.now()+CACHE_TTL_MS});
  return profile;
};
