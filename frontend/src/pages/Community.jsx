import { useRef, useState } from 'react'
import useApiData from '../hooks/useApiData'
import { api,mediaUrl } from '../services/api'
import EmptyState from '../components/EmptyState'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaUsers, FaPen, FaSearch, FaRegHeart, FaRegComment, FaReply, FaHashtag, FaLeaf, FaTint, FaHome, FaSeedling, FaShieldAlt, FaBug, FaTimes, FaCopy, FaTrashAlt } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import './Community.css'

const topics = [['Early blight', 128, FaLeaf], ['Watering', 96, FaTint], ['Indoor plants', 84, FaHome], ['Soil care', 76, FaSeedling], ['Fungicide', 62, FaShieldAlt], ['Pests', 59, FaBug]]

export default function Community() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const portalPath = location.pathname.startsWith('/dr/') ? '/dr/dashboard' : '/farm/dashboard'
  const {data:rawPosts,error:postError,reload} = useApiData('/community/posts')
  const [replyLists,setReplyLists] = useState({})
  const [actionError,setActionError] = useState('')
  const posts=rawPosts.map(post=>({...post,author:post.owner?.fullName || 'Plant grower',initials:(post.owner?.fullName || 'PG').slice(0,2),time:new Date(post.createdAt).toLocaleDateString(),likes:post.likedBy?.length || 0,liked:post.likedBy?.includes(user?.userId),mine:post.owner?.id===user?.userId || post.owner?._id===user?.userId,replies:post.replyCount,comments:replyLists[post.id],image:mediaUrl(post.image)}))
  const toggleLike=async post=>{try{await api(`/community/posts/${post.id}/like`,{method:'PUT',body:{liked:!post.liked}});await reload()}catch(err){setActionError(err.message)}}
  const [drafts,setDrafts]=useState({}),[replyLoading,setReplyLoading]=useState({}),[sending,setSending]=useState({}),[replyErrors,setReplyErrors]=useState({})
  const sendingIds=useRef(new Set())
  const loadReplies=async post=>{setReplyLoading(value=>({...value,[post.id]:true}));setReplyErrors(value=>({...value,[post.id]:''}));try{const comments=await api(`/community/posts/${post.id}/comments`);setReplyLists(value=>({...value,[post.id]:comments}))}catch(err){setReplyErrors(value=>({...value,[post.id]:err.message}))}finally{setReplyLoading(value=>({...value,[post.id]:false}))}}
  const showReplies=post=>{if(expanded===post.id){setExpanded(null);return}setExpanded(post.id);loadReplies(post)}
  const composeReply=post=>{if(expanded!==post.id){setExpanded(post.id);loadReplies(post)}setTimeout(()=>document.getElementById(`reply-${post.id}`)?.focus(),0)}
  const reply=async(event,post)=>{
    event.preventDefault();const body=(drafts[post.id]||'').trim();if(!body||sendingIds.current.has(post.id))return
    sendingIds.current.add(post.id);setSending(value=>({...value,[post.id]:true}));setReplyErrors(value=>({...value,[post.id]:''}))
    try{const comment=await api(`/community/posts/${post.id}/comments`,{method:'POST',body:{body}});setReplyLists(value=>({...value,[post.id]:[...(value[post.id]||[]),{...comment,owner:{id:user?.userId,fullName:user?.fullName||'You'}}]}));setDrafts(value=>({...value,[post.id]:''}));await reload()}
    catch(err){setReplyErrors(value=>({...value,[post.id]:err.message}))}
    finally{sendingIds.current.delete(post.id);setSending(value=>({...value,[post.id]:false}))}
  }
  const [editing,setEditing]=useState(null),[editBody,setEditBody]=useState(''),[confirmDelete,setConfirmDelete]=useState(null),[commentBusy,setCommentBusy]=useState(null),[copied,setCopied]=useState(null)
  const commentId=comment=>comment.id||comment._id
  const ownReply=comment=>String(comment.owner?.id||comment.owner?._id||comment.owner)===String(user?.userId)
  const changeReply=async(post,comment,remove=false)=>{
    const key=commentId(comment);if(commentBusy||(!remove&&!editBody.trim()))return;setCommentBusy(key)
    try{const result=await api(`/community/posts/${post.id}/comments/${key}`,{method:remove?'DELETE':'PATCH',...(remove?{}:{body:{body:editBody.trim()}})});setReplyLists(value=>({...value,[post.id]:remove?value[post.id].filter(item=>commentId(item)!==key):value[post.id].map(item=>commentId(item)===key?result:item)}));setEditing(null);setConfirmDelete(null);if(remove)await reload()}
    catch(err){setReplyErrors(value=>({...value,[post.id]:err.message}))}finally{setCommentBusy(null)}
  }
  const copyReply=async(post,comment)=>{try{await navigator.clipboard.writeText(comment.body);setCopied(commentId(comment));setTimeout(()=>setCopied(null),2000)}catch{setReplyErrors(value=>({...value,[post.id]:'Could not copy the message. Select the text to copy it.'}))}}
  const replyTo=(post,comment)=>{const quote=comment.body.split('\n').map(line=>`> ${line}`).join('\n');setDrafts(value=>({...value,[post.id]:`${value[post.id]||''}${value[post.id]?'\n\n':''}Replying to ${comment.owner?.fullName||'Plant grower'}:\n${quote}\n\n`.slice(0,2000)}));composeReply(post)}
  const [tab, setTab] = useState(location.state?.tab || 'For you')
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('')
  const [expanded, setExpanded] = useState(null)
  const visible = posts.filter(p => (tab !== 'My posts' || p.mine) && (tab !== 'Unanswered' || !p.replies) && (!topic || p.topic === topic) && `${p.title} ${p.body} ${p.category}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => tab === 'Recent' ? new Date(b.createdAt)-new Date(a.createdAt) : 0)
  return <DashboardLayout className="community-dashboard"><div className="community-page">
    <header className="community-header"><span className="community-title-icon"><FaUsers /></span><div><h1>Community</h1><p>Ask questions and learn from other plant lovers.</p></div><button className="community-primary" onClick={() => navigate(`${portalPath}/community/ask`)}><FaPen /> Ask a question</button></header>
    <div className="community-layout"><section className="community-feed" aria-label="Discussions">
      <div className="community-tabs">{['For you', 'Recent', 'Unanswered', 'My posts'].map(item => <button key={item} aria-pressed={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
      <div className="community-posts">{actionError && <p role="alert">{actionError}</p>}{topic && <button className="community-clear" onClick={() => setTopic('')}>{topic} <FaTimes /> Clear filter</button>}
      {visible.map(post => <article className="community-post" key={post.id}><span className="community-avatar">{post.initials}</span><div className="community-post-content"><div className="community-meta"><strong>{post.author}</strong><span>{post.time}</span><span className="community-tag">{post.category}</span></div><div className="community-post-body"><div><h2>{post.title}</h2><p>{post.body}</p><div className="community-actions"><button aria-label={`Like ${post.title}`} aria-pressed={Boolean(post.liked)} onClick={() => toggleLike(post)}><FaRegHeart />{post.likes}</button><button aria-label={`View replies to ${post.title}`} onClick={() => showReplies(post)}><FaRegComment />{post.replies || 0} {(post.replies || 0) === 1 ? 'reply' : 'replies'}</button><span /><button onClick={() => composeReply(post)}><FaReply />Reply</button></div></div>{post.image && <img src={post.image} alt={post.id === 5 ? 'Tomato leaf with dark spots' : 'Basil leaves'} />}</div>
      {expanded === post.id && <section className="community-replies" aria-label={`Replies to ${post.title}`}><header className="community-reply-heading"><strong>Conversation · {post.replies || 0}</strong><button type="button" className="community-text-button" onClick={()=>setExpanded(null)}>Hide replies</button></header>
      {replyLoading[post.id]?<p role="status">Loading replies…</p>:post.comments?.map(comment=><article className="community-reply" key={comment.id || comment._id}><span className="community-avatar">{(comment.owner?.fullName || 'PG').slice(0,2)}</span><div><header><strong>{comment.owner?.fullName || 'Plant grower'}</strong>{(comment.owner?.id || comment.owner?._id)===(post.owner?.id || post.owner?._id) && <span className="community-tag">Author</span>}{comment.createdAt && <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time>}</header>{editing===commentId(comment)?<form onSubmit={event=>{event.preventDefault();changeReply(post,comment)}}><textarea aria-label="Edit reply" maxLength={2000} value={editBody} disabled={!!commentBusy} onChange={event=>setEditBody(event.target.value)} /><div className="community-comment-actions"><button className="community-primary" disabled={!!commentBusy||!editBody.trim()}>{commentBusy?'Saving…':'Save changes'}</button><button type="button" disabled={!!commentBusy} onClick={()=>setEditing(null)}>Cancel</button></div></form>:<p>{comment.body}</p>}
<div className="community-comment-actions"><button type="button" onClick={()=>replyTo(post,comment)}><FaReply/>Reply to message</button><button type="button" onClick={()=>copyReply(post,comment)}><FaCopy/>{copied===commentId(comment)?'Copied':'Copy'}</button>{ownReply(comment)&&<><button type="button" disabled={!!commentBusy} onClick={()=>{setEditing(commentId(comment));setEditBody(comment.body);setConfirmDelete(null)}}><FaPen/>Edit</button><button type="button" disabled={!!commentBusy} onClick={()=>setConfirmDelete(commentId(comment))}><FaTrashAlt/>Delete</button></>}</div>
{confirmDelete===commentId(comment)&&<div className="community-delete-confirm"><span>Delete this reply?</span><button type="button" disabled={!!commentBusy} onClick={()=>changeReply(post,comment,true)}>{commentBusy?'Deleting…':'Delete reply'}</button><button type="button" disabled={!!commentBusy} onClick={()=>setConfirmDelete(null)}>Keep reply</button></div>}
</div></article>)}
      {!replyLoading[post.id]&&!replyErrors[post.id]&&!post.comments?.length && <p>Start the conversation. Share what has worked for your plants.</p>}
      {replyErrors[post.id] && <p className="community-reply-error" role="alert">{replyErrors[post.id]} <button type="button" className="community-text-button" onClick={()=>loadReplies(post)}>Retry loading</button></p>}
      <form onSubmit={event => reply(event,post)}><label htmlFor={`reply-${post.id}`}>Add to the conversation</label><textarea id={`reply-${post.id}`} name="reply" required rows={3} maxLength={2000} value={drafts[post.id]||''} disabled={sending[post.id]} onChange={event=>setDrafts(value=>({...value,[post.id]:event.target.value}))} placeholder="Share a care tip, ask a follow-up, or describe what you tried…" /><footer className="community-reply-footer"><span>{(drafts[post.id]||'').length}/2000</span><button className="community-primary" disabled={sending[post.id]||replyLoading[post.id]||!(drafts[post.id]||'').trim()}>{sending[post.id]?'Sending…':'Send reply'}</button></footer></form></section>}</div></article>)}
      {!visible.length && <EmptyState kind="community" title="Start a conversation" description={postError || 'Ask a question or share your growing experience.'} action="Ask a question" onAction={() => navigate(`${portalPath}/community/ask`)} />}
      </div>
    </section><aside className="community-info"><label className="community-search"><FaSearch /><input aria-label="Search discussions" placeholder="Search discussions..." value={search} onChange={event => setSearch(event.target.value)} /></label>
      <section className="community-card"><h2><FaUsers />Your community</h2><div className="community-stats"><div><strong>{posts.length}</strong><span>Posts</span></div><div><strong>{posts.reduce((sum,p) => sum + p.replies, 0)}</strong><span>Replies</span></div><div><strong>{new Set(posts.map(post=>post.owner?._id)).size}</strong><span>Members</span></div></div><p>A supportive community of plant lovers helping each other grow healthier plants.</p></section>
      <section className="community-card"><div className="community-card-heading"><h2><FaHashtag />Popular topics</h2><button onClick={() => {setTopic(''); setTab('For you'); setSearch('')}}>View all</button></div><div className="community-topics">{topics.map(([name,count,Icon]) => <button key={name} aria-pressed={topic === name} onClick={() => { setTopic(topic === name ? '' : name); setTab('For you') }}><Icon /><span><strong>{name}</strong><small>{count} posts</small></span></button>)}</div></section>
    </aside></div>
  </div></DashboardLayout>
}


