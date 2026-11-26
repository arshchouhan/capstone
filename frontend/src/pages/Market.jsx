import { useEffect, useRef, useState } from 'react'
import { FaExternalLinkAlt, FaShoppingCart, FaLeaf } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import useApiData from '../hooks/useApiData'
import { api } from '../services/api'
import './Market.css'

const modelCrops=['Apple','Blueberry','Cherry','Corn','Grape','Orange','Peach','Pepper bell','Potato','Raspberry','Soybean','Squash','Strawberry','Tomato']
const modelDiseaseClasses=[
  ['Apple','Apple scab'],['Apple','Black rot'],['Apple','Cedar apple rust'],['Cherry','Powdery mildew'],['Corn','Cercospora leaf spot'],['Corn','Common rust'],['Corn','Northern leaf blight'],['Grape','Black rot'],['Grape','Esca black measles'],['Grape','Leaf blight'],['Orange','Citrus greening'],['Peach','Bacterial spot'],['Pepper bell','Bacterial spot'],['Potato','Early blight'],['Potato','Late blight'],['Squash','Powdery mildew'],['Strawberry','Leaf scorch'],['Tomato','Bacterial spot'],['Tomato','Early blight'],['Tomato','Late blight'],['Tomato','Leaf mold'],['Tomato','Septoria leaf spot'],['Tomato','Spider mites'],['Tomato','Target spot'],['Tomato','Tomato mosaic virus'],['Tomato','Tomato yellow leaf curl virus'],
]
const merchantSources=[['Amazon India','https://www.amazon.in/s?k='],['Flipkart','https://www.flipkart.com/search?q='],['eBay','https://www.ebay.com/sch/i.html?_nkw=']]
const liveStatusMessages = {
  'not-configured': 'Connect eBay in the backend to see live prices and photos.',
  'credentials-rejected': 'eBay rejected the Production keys. Check the App ID and Cert ID in the backend configuration.',
  'access-denied': 'eBay denied access to live search. Check Browse API access for the Production keyset.',
  'no-results': 'No live eBay listings matched this search.',
  unavailable: 'Live eBay search is temporarily unavailable.',
}
const modelFallbackProducts = crop => modelDiseaseClasses.filter(([item])=>!crop||item===crop).map(([item,condition],index)=>{
  const [merchant,base]=merchantSources[index%merchantSources.length]
  const query=`${item} ${condition} plant care supplies`
  return {id:`${item}-${condition}-${merchant}`,merchant,title:`${item} · ${condition}`,description:`Explore products relevant to ${item} ${condition.toLowerCase()} care.`,url:`${base}${encodeURIComponent(query)}`,category:item,condition,external:true}
})

const previewCache = new Map()

function MerchantPreview({ product, crop, enabled }) {
  const anchor = useRef(null)
  const [listing, setListing] = useState(null)
  const category = product.category || crop
  const condition = product.condition || ''
  const path = `/market/recommendations?${new URLSearchParams({ preview: '1', merchant: product.merchant, crop: category, condition })}`

  useEffect(() => {
    if (!enabled) return
    let active = true
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      if (!previewCache.has(path)) {
        previewCache.set(path, api(path).then(result => {
          if (!['live', 'no-results'].includes(result.status)) previewCache.delete(path)
          return result.product
        }).catch(() => { previewCache.delete(path) }))
      }
      previewCache.get(path).then(item => { if (active) setListing(item || null) })
    })
    observer.observe(anchor.current)
    return () => { active = false; observer.disconnect() }
  }, [enabled, path])

  return <div ref={anchor}>
    {listing ? (
      <a href={listing.url} target="_blank" rel="noreferrer" aria-label={`View ${listing.title} on ${listing.merchant}`}>
        <div className="market-product-image mint"><img src={listing.image} alt="" loading="lazy" /></div>
        <span className="market-listing-caption" title={listing.title}>{listing.merchant} · {listing.title}</span>
      </a>
    ) : (
      <div className="market-product-image mint"><FaShoppingCart aria-hidden="true" /></div>
    )}
  </div>
}

function ProductGrid({ products, merchantSearch = false, previewMerchants = {}, crop = '' }) {
  return <div className="market-product-grid market-recommendation-grid">{products.map(product => (
    <article className="market-product-card market-merchant-product" key={product.id}>
      {merchantSearch ? <MerchantPreview key={`${product.id}-${crop}`} product={product} crop={crop} enabled={previewMerchants[product.merchant]} /> : (
        <div className="market-product-image mint">{product.image ? <img src={product.image} alt="" loading="lazy" /> : <FaShoppingCart />}</div>
      )}
      <h3>{product.title}</h3>
      <p>{product.description}</p>
      <div className="market-product-bottom">
        <span className="market-price">{product.price || product.merchant}</span>
        <a className="market-external-action" href={product.url} target="_blank" rel="noreferrer" aria-label={`${merchantSearch ? 'Search' : 'View'} ${product.title} on ${product.merchant || 'eBay'}`}>
          {merchantSearch ? 'Search' : 'View'} <FaExternalLinkAlt aria-hidden="true" />
        </a>
      </div>
    </article>
  ))}</div>
}

export default function Market() {
  const [crop,setCrop] = useState('')
  const recommendationsPath = `/market/recommendations${crop?`?crop=${encodeURIComponent(crop)}`:''}`
  const {data:recommendations,reload:reloadRecommendations,loading:recommendationsLoading,error:recommendationsError} = useApiData(recommendationsPath,null)
  const catalogCrops = recommendations?.catalog?.crops?.length ? recommendations.catalog.crops : modelCrops
  const hasCurrentCatalog = Boolean(recommendations?.catalog?.crops?.length)
  const merchantRecommendations = recommendations?.marketplaceMode==='model-catalog-v1' && recommendations?.products?.length ? recommendations.products : modelFallbackProducts(crop)
  const liveProducts = recommendationsError ? [] : recommendations?.liveProducts || []
  const liveMessage = recommendationsError ? 'Live listings couldn’t load. You can still search merchants below.' : liveStatusMessages[recommendations?.liveStatus]
  const recommendationTitle = recommendations?.personalized ? `Relevant to ${recommendations.context}` : (hasCurrentCatalog ? recommendations.context : 'Browse care supplies for every crop covered by the plant-disease model.')

  return (
    <DashboardLayout className="market-dashboard">
      <section className="market-content" aria-labelledby="market-heading">
        <div className="market-heading-row"><div><h1 id="market-heading">Market</h1><p>Explore relevant plant-care products from external merchants.</p></div></div>
        <section className="market-recommendations" aria-labelledby="recommendations-heading">
          <div className="market-recommendations-heading"><div><span className="market-recommendations-kicker"><FaLeaf /> Model-supported crop care</span><h2 id="recommendations-heading">Plant-care marketplace</h2><p>{recommendationTitle}</p></div><button type="button" className="market-refresh-button" onClick={reloadRecommendations} disabled={recommendationsLoading}>{recommendationsLoading?'Refreshing…':'Refresh'}</button></div>
          <div className="market-crop-filters" aria-label="Browse marketplace by crop"><button type="button" className={!crop?'selected':''} aria-pressed={!crop} onClick={()=>setCrop('')}>All crops</button>{catalogCrops.map(item=><button type="button" key={item} className={crop===item?'selected':''} aria-pressed={crop===item} onClick={()=>setCrop(item)}>{item}</button>)}</div>
          {recommendationsLoading ? <div className="market-recommendation-loading" role="status">Finding relevant products…</div> : (
            <>
              {liveProducts.length > 0 && <>
                <div className="market-recommendation-source">Live eBay listings</div>
                <ProductGrid products={liveProducts} />
              </>}
              {liveMessage && <p className="market-recommendation-status" role="status">{liveMessage}</p>}
              <div className="market-recommendation-source">Merchant searches</div>
              <ProductGrid products={merchantRecommendations} merchantSearch previewMerchants={recommendations?.merchantPreviews} crop={crop} />
            </>
          )}
        </section>
      </section>
    </DashboardLayout>
  )
}
