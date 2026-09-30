import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaUsers, FaPen, FaSearch, FaRegHeart, FaRegComment, FaReply, FaHashtag, FaLeaf, FaTint, FaHome, FaSeedling, FaShieldAlt, FaBug, FaTimes } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import tomato from '../assets/early_blight_leaf.jpg'
import basil from '../assets/plant_basil.jpg'
import './Community.css'

const examples = [
  { id: 5, author: 'Sarah P.', initials: 'SP', time: '2 hours ago', category: 'Plant Health', topic: 'Early blight', title: 'Are these spots on my tomato leaves early blight?', body: 'I noticed these dark circular spots with yellow halos on my tomato leaves. Is this early blight? Should I remove the affected leaves or treat with a fungicide?', likes: 12, replies: 8, image: tomato },
  { id: 4, author: 'Mike J.', initials: 'MJ', time: '1 day ago', category: 'Treatment', topic: 'Fungicide', title: 'How often should I re-scan after fungicide?', body: 'I just applied copper-based fungicide to my tomato plants for early blight. How many days should I wait before scanning again to check if it’s improving?', likes: 7, replies: 5 },
  { id: 3, author: 'Emma L.', initials: 'EL', time: '2 days ago', category: 'Indoor Plants', topic: 'Indoor plants', title: 'Why are my basil leaves turning yellow?', body: 'My indoor basil looks healthy overall but the lower leaves are turning yellow. I water when the top inch of soil is dry. Could this be overwatering or a nutrient issue?', likes: 15, replies: 11, image: basil },
  { id: 2, author: 'Daniel K.', initials: 'DK', time: '3 days ago', category: 'Growing Tips', topic: 'Soil care', title: 'Best companion plants for tomatoes?', body: 'I’m planning my garden for this season. What are some good companion plants for tomatoes that help with pests and overall plant health?', likes: 9, replies: 6 },
  { id: 1, author: 'Priya R.', initials: 'PR', time: '4 days ago', category: 'Plant Health', topic: 'Watering', title: 'How do you adjust watering during rainy weeks?', body: 'My balcony pots are staying damp longer than usual. What signs do you look for before watering again?', likes: 3, replies: 0 },
]
const topics = [['Early blight', 128, FaLeaf], ['Watering', 96, FaTint], ['Indoor plants', 84, FaHome], ['Soil care', 76, FaSeedling], ['Fungicide', 62, FaShieldAlt], ['Pests', 59, FaBug]]
export const communityPostsKey = 'plantaexa-community-posts'
export const getCommunityPosts = () => {
  try { const saved = JSON.parse(sessionStorage.getItem(communityPostsKey)); return Array.isArray(saved) ? saved : examples } catch { return examples }
}

export default function Community() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [posts, setPosts] = useState(getCommunityPosts)
  const [tab, setTab] = useState(location.state?.tab || 'For you')
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('')
  const [expanded, setExpanded] = useState(null)
  const author = user?.name || user?.fullName || 'You'
  const visible = posts.filter(p => (tab !== 'My posts' || p.mine) && (tab !== 'Unanswered' || !p.replies) && (!topic || p.topic === topic) && `${p.title} ${p.body} ${p.category}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => tab === 'Recent' ? b.id - a.id : 0)
  return <DashboardLayout className="community-dashboard"><div className="community-page">
    <header className="community-header"><span className="community-title-icon"><FaUsers /></span><div><h1>Community</h1><p>Ask questions and learn from other plant lovers.</p></div><button className="community-primary" onClick={() => navigate('/farm/dashboard/community/ask')}><FaPen /> Ask a question</button></header>
    <div className="community-layout"><section className="community-feed" aria-label="Discussions">
      <div className="community-tabs">{['For you', 'Recent', 'Unanswered', 'My posts'].map(item => <button key={item} aria-pressed={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
      <div className="community-posts">{topic && <button className="community-clear" onClick={() => setTopic('')}>{topic} <FaTimes /> Clear filter</button>}
      {visible.map(post => <article className="community-post" key={post.id}><span className="community-avatar">{post.initials}</span><div className="community-post-content"><div className="community-meta"><strong>{post.author}</strong><span>{post.time}</span><span className="community-tag">{post.category}</span></div><div className="community-post-body"><div><h2>{post.title}</h2><p>{post.body}</p><div className="community-actions"><button aria-label={`Like ${post.title}`} aria-pressed={Boolean(post.liked)} onClick={() => setPosts(previous => previous.map(p => p.id === post.id ? {...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1)} : p))}><FaRegHeart />{post.likes}</button><button aria-label={`View replies to ${post.title}`} onClick={() => setExpanded(expanded === post.id ? null : post.id)}><FaRegComment />{post.replies}</button><span /><button onClick={() => setExpanded(expanded === post.id ? null : post.id)}><FaReply />Reply</button></div></div>{post.image && <img src={post.image} alt={post.id === 5 ? 'Tomato leaf with dark spots' : 'Basil leaves'} />}</div>
      {expanded === post.id && <div className="community-replies">{post.comments?.map((comment,index) => <div key={index}><strong>{author}</strong><p>{comment}</p></div>)}{!post.comments?.length && <p>{post.replies ? 'Example replies are not included in this preview.' : 'Be the first to reply.'}</p>}<form onSubmit={event => { event.preventDefault(); const text = new FormData(event.currentTarget).get('reply').trim(); if (!text) return; setPosts(previous => previous.map(p => p.id === post.id ? {...p, replies: p.replies + 1, comments: [...(p.comments || []), text]} : p)); event.currentTarget.reset() }}><label htmlFor={`reply-${post.id}`}>Your reply</label><textarea id={`reply-${post.id}`} name="reply" required maxLength={2000} placeholder="Share your experience…" /><button className="community-primary">Add reply</button></form></div>}</div></article>)}
      {!visible.length && <div className="community-empty"><FaRegComment /><h2>No discussions yet</h2><p>Try another filter or ask your first question.</p></div>}
      </div>
    </section><aside className="community-info"><label className="community-search"><FaSearch /><input aria-label="Search discussions" placeholder="Search discussions..." value={search} onChange={event => setSearch(event.target.value)} /></label>
      <section className="community-card"><h2><FaUsers />Your community</h2><div className="community-stats"><div><strong>{(1482 + posts.filter(p => p.mine).length).toLocaleString()}</strong><span>Posts</span></div><div><strong>{312 + posts.reduce((sum,p) => sum + (p.comments?.length || 0), 0)}</strong><span>Replies</span></div><div><strong>892</strong><span>Members</span></div></div><p>A supportive community of plant lovers helping each other grow healthier plants.</p><small className="community-preview">Preview community · sample discussions</small></section>
      <section className="community-card"><div className="community-card-heading"><h2><FaHashtag />Popular topics</h2><button onClick={() => {setTopic(''); setTab('For you'); setSearch('')}}>View all</button></div><div className="community-topics">{topics.map(([name,count,Icon]) => <button key={name} aria-pressed={topic === name} onClick={() => { setTopic(topic === name ? '' : name); setTab('For you') }}><Icon /><span><strong>{name}</strong><small>{count} posts</small></span></button>)}</div></section>
    </aside></div>
  </div></DashboardLayout>
}
