import { useRef, useState } from 'react'
import { FaSearch, FaShoppingCart, FaRegImage, FaTimes } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import './Market.css'

const categories = ['All Products', 'Treatments', 'Fertilizers', 'Tools', 'Plants']
const products = Array.from({ length: 8 }, (_, index) => ({ id: index + 1, name: 'Product name', description: 'Short product description.', category: categories[index % 4 + 1] }))

export default function Market() {
  const cartDialog = useRef(null)
  const [category, setCategory] = useState('All Products')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('featured')
  const [cart, setCart] = useState({})
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const visibleProducts = products.filter(product => (category === 'All Products' || product.category === category) && `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'category' ? a.category.localeCompare(b.category) : a.id - b.id)

  return (
    <DashboardLayout className="market-dashboard">
      <section className="market-content" aria-labelledby="market-heading">
        <div className="market-heading-row"><div><h1 id="market-heading">Market</h1><p>Find the right care for every plant</p></div><button className="market-cart-button" onClick={() => cartDialog.current.showModal()}><FaShoppingCart /> Cart ({count})</button></div>
        <div className="market-toolbar">
          <div className="market-categories" aria-label="Product categories">{categories.map(item => <button key={item} aria-pressed={category === item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <div className="market-product-controls"><label className="market-search"><FaSearch /><input aria-label="Search products" placeholder="Search products..." value={search} onChange={event => setSearch(event.target.value)} /></label><select aria-label="Sort products" value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Sort by: Featured</option><option value="category">Sort by: Category</option></select></div>
        </div>
        <h2>Products</h2>
        <div className="market-product-grid">{visibleProducts.map(product => <article className="market-product-card" key={product.id}>
          <div className={`market-product-image ${product.id % 2 === 0 ? 'mint' : ''}`}><FaRegImage /><span>Product image</span></div>
          <h3>{product.name}</h3><p>{product.description}</p>
          <div className="market-product-bottom"><span className="market-price">₹---</span><button aria-label={`Add ${product.category.toLowerCase()} product ${product.id} to cart`} onClick={() => setCart(previous => ({ ...previous, [product.id]: (previous[product.id] || 0) + 1 }))}><FaShoppingCart />{cart[product.id] ? `Add more (${cart[product.id]})` : 'Add to Cart'}</button></div>
        </article>)}</div>
        {!visibleProducts.length && <div className="market-empty">No products found. Try another search or category.</div>}
        <span className="market-sr-only" role="status">{count} items in cart</span>
      </section>
      <dialog ref={cartDialog} className="market-cart-dialog"><div className="market-heading-row"><h2>Your cart ({count})</h2><button aria-label="Close cart" onClick={() => cartDialog.current.close()}><FaTimes /></button></div>{count ? <><p>Preview items — product details and prices are coming soon.</p>{products.filter(product => cart[product.id]).map(product => <div className="market-cart-item" key={product.id}><span>{product.category} · {product.name}<small>Quantity: {cart[product.id]}</small></span><button onClick={() => setCart(previous => { const next = { ...previous }; delete next[product.id]; return next })}>Remove</button></div>)}</> : <p>Your cart is empty. Explore products to add an item.</p>}</dialog>
    </DashboardLayout>
  )
}
