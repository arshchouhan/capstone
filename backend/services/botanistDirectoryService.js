const {fail}=require('../controllers/helpers');

const apiUrl='https://api.geoapify.com/v2/places';
const coordinate=value=>{const number=Number(value);return Number.isFinite(number)?number:null};

exports.findNearby=async({plant,disease,latitude,longitude})=>{
  const key=process.env.GEOAPIFY_API_KEY;
  if(!key)return {configured:false,providers:[]};
  const lat=coordinate(latitude),lng=coordinate(longitude);
  if(lat===null||lng===null||lat<-90||lat>90||lng<-180||lng>180)throw fail(400,'Allow location access to find real botanists near you.');
  const search=async({categories,name})=>{
    const query=new URL(apiUrl);
    query.searchParams.set('categories',categories);
    // Plant services are sparsely tagged in OpenStreetMap. Search a wider area,
    // then rank results by the grower's actual location.
    query.searchParams.set('filter',`circle:${lng},${lat},100000`);
    query.searchParams.set('bias',`proximity:${lng},${lat}`);
    query.searchParams.set('limit','20');
    query.searchParams.set('lang','en');
    if(name)query.searchParams.set('name',name);
    query.searchParams.set('apiKey',key);
    const response=await fetch(query,{signal:AbortSignal.timeout(12000)});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw fail(502,payload?.message||payload?.error?.message||'The botanist directory could not be reached. Please try again.');
    return payload.features||[];
  };
  // OSM categorisation is inconsistent for plant-care businesses. Combine the
  // specific categories with the common names people use for related services.
  // This intentionally stays plant-care focused rather than returning every
  // nearby commercial business.
  const plantCareTerms=['nursery','garden','plant','seed','fertilizer','pesticide','agriculture','florist'];
  const resultSets=await Promise.all([
    search({categories:'commercial.garden,office.government.agriculture'}),
    ...plantCareTerms.map(name=>search({categories:'commercial',name})),
  ]);
  const seen=new Set();
  const features=resultSets.flat().filter(feature=>{
    const place=feature.properties||{};
    const key=place.place_id||`${feature.geometry?.coordinates?.join(',')||''}:${place.name||''}`;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  }).sort((a,b)=>Number(a.properties?.distance||Infinity)-Number(b.properties?.distance||Infinity)).slice(0,12);
  return {
    configured:true,
    providers:features.map(feature=>{
      const place=feature.properties||{};
      const [longitudeValue,latitudeValue]=feature.geometry?.coordinates||[];
      const osmUrl=Number.isFinite(latitudeValue)&&Number.isFinite(longitudeValue)?`https://www.openstreetmap.org/?mlat=${latitudeValue}&mlon=${longitudeValue}#map=17/${latitudeValue}/${longitudeValue}`:'';
      const raw=place.datasource?.raw||{};
      const distance=Number(place.distance);
      return {
        id:place.place_id||place.datasource?.raw?.id||`${latitudeValue}-${longitudeValue}-${place.name||''}`,
        name:place.name||'Plant-care specialist',
        address:place.formatted||[place.address_line1,place.address_line2].filter(Boolean).join(', ')||'Address unavailable',
        categories:Array.isArray(place.categories)?place.categories.map(category=>category.replaceAll('.', ' · ')):[],
        distance:Number.isFinite(distance)&&distance>=0?distance:null,
        locality:place.city||place.county||place.state||'',
        country:place.country||'',
        openingHours:place.opening_hours||raw.opening_hours||'',
        rating:null,
        reviews:0,
        phone:place.contact?.phone||raw.phone||'',
        email:place.contact?.email||raw.email||'',
        website:place.website||place.contact?.website||raw.website||'',
        source:place.datasource?.sourcename||raw.source||'OpenStreetMap',
        mapsUrl:osmUrl,
      }
    }),
    source:'Geoapify · OpenStreetMap',
  };
};
