import { useEffect, useRef, useState } from 'react'
import { Alert, Avatar, Box, Button, TextField, Typography } from '@mui/material'
import { FaArrowLeft, FaPaperPlane, FaRegCommentDots } from 'react-icons/fa'
import { api, mediaUrl } from '../services/api'

const dateLabel = value => new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' })
const timeLabel = value => new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export default function ExpertChat({ expert, owner, onClose }) {
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const thread = useRef(null)
  const resource = `/experts/${expert.id || expert._id}/messages`
  const conversation = owner ? `${resource}?owner=${encodeURIComponent(owner)}` : resource
  const initials = expert.name?.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setMessages([])
    api(conversation, { signal: controller.signal })
      .then(setMessages)
      .catch(err => { if (!controller.signal.aborted) setError(err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [conversation])

  useEffect(() => {
    if (thread.current) thread.current.scrollTop = thread.current.scrollHeight
  }, [messages])

  const send = async event => {
    event.preventDefault()
    const text = body.trim()
    if (!text || busy) return
    setError('')
    setBusy(true)
    try {
      const saved = await api(resource, { method: 'POST', body: { owner, body: text } })
      setMessages(previous => [...previous, { ...saved, isOwn: true }])
      setBody('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box className="expert-chat-panel" aria-label="Expert conversation">
      <Box className="expert-conversation-header">
        <Avatar src={mediaUrl(expert.avatarUrl)} alt="">{initials}</Avatar>
        <Box className="expert-conversation-identity">
          <Typography component="h3">{expert.name}</Typography>
          {expert.specialty && <Typography>{expert.specialty}</Typography>}
        </Box>
        {onClose && <Button variant="outlined" startIcon={<FaArrowLeft />} onClick={onClose}>Back to profile</Button>}
      </Box>
      {error && <Alert severity="error" className="expert-chat-error">{error}</Alert>}
      <Box className="expert-chat-thread" ref={thread} role="log" aria-label="Conversation messages">
        {loading ? (
          <Typography role="status" className="expert-chat-empty">Loading messages…</Typography>
        ) : messages.length ? messages.map((message, index) => {
          const day = dateLabel(message.createdAt)
          const newDay = index === 0 || day !== dateLabel(messages[index - 1].createdAt)
          return <Box key={message.id || message._id} className="expert-chat-message">
            {newDay && <Typography className="expert-chat-date">{day}</Typography>}
            <Box className={`expert-chat-bubble${message.isOwn ? ' outgoing' : ''}`}>
              <strong>{message.isOwn ? 'You' : message.sender?.fullName || expert.name}</strong>
              <Typography>{message.body}</Typography>
              <time dateTime={message.createdAt}>{timeLabel(message.createdAt)}</time>
            </Box>
          </Box>
        }) : !error && (
          <Box className="expert-chat-empty">
            <FaRegCommentDots aria-hidden="true" />
            <Typography>Start a conversation with {expert.name}.</Typography>
          </Box>
        )}
      </Box>
      <Box component="form" className="expert-chat-compose" onSubmit={send}>
        <TextField
          fullWidth multiline minRows={1} maxRows={4} size="small" placeholder="Write a message…"
          value={body} disabled={busy} onChange={event => setBody(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 2000, 'aria-label': 'Write a message' } }}
        />
        <Button type="submit" variant="contained" disableElevation endIcon={<FaPaperPlane />} disabled={loading || busy || !body.trim()}>
          {busy ? 'Sending…' : 'Send message'}
        </Button>
      </Box>
    </Box>
  )
}
