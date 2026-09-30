import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, Chip, CssBaseline, FormControl, InputLabel, MenuItem, Select, Stack, TextField, ThemeProvider, ToggleButton, ToggleButtonGroup, Typography, createTheme } from '@mui/material'
import { FaArrowLeft, FaBold, FaImage, FaItalic, FaLink, FaListUl, FaPaperclip, FaPen, FaQuoteRight } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import { communityPostsKey, getCommunityPosts } from './Community'

const theme = createTheme({ palette: { primary: { main: '#008b73' }, background: { default: '#fff', paper: '#fff' }, text: { primary: '#172846', secondary: '#71819c' } }, shape: { borderRadius: 10 }, typography: { fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: 13, h4: { fontSize: '28px', lineHeight: 1.15 } } })
const categories = ['Plant Health', 'Treatment', 'Indoor Plants', 'Growing Tips']

export default function CommunityQuestion() {
  const navigate = useNavigate()
  const input = useRef(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Plant Health')
  const [details, setDetails] = useState('')
  const [image, setImage] = useState(null)
  const [format, setFormat] = useState([])
  const canPost = title.trim().length > 4 && details.trim().length > 9
  const uploadImage = event => { const file = event.target.files?.[0]; if (file) setImage({ name: file.name, url: URL.createObjectURL(file) }) }
  const post = () => {
    if (!canPost) return
    const item = { id: Date.now(), author: 'You', initials: 'YO', time: 'Just now', category, title: title.trim(), body: details.trim(), likes: 0, replies: 0, mine: true, image: image?.url }
    try { sessionStorage.setItem(communityPostsKey, JSON.stringify([item, ...getCommunityPosts()])) } catch { /* Keep the form flow usable if storage is unavailable. */ }
    navigate('/farm/dashboard/community', { state: { tab: 'My posts' } })
  }
  return <DashboardLayout className="community-dashboard" dashboardPath="/farm/dashboard"><ThemeProvider theme={theme}><CssBaseline /><Box className="community-question-page">
    <Stack className="community-question-header" direction="row" alignItems="center" justifyContent="space-between"><Box><Button size="small" startIcon={<FaArrowLeft />} onClick={() => navigate('/farm/dashboard/community')} sx={{ px: 0, mb: .5, textTransform: 'none', fontWeight: 700, fontSize: 12 }}>Back to Community</Button><Typography variant="h4" fontWeight={800}>Ask the community</Typography><Typography color="text.secondary" sx={{ mt: .25, fontSize: 13 }}>Share plant details so the community can give practical advice.</Typography></Box><Chip icon={<FaPen />} label="New discussion" color="primary" variant="outlined" size="small" /></Stack>
    <Card className="community-question-form" variant="outlined" sx={{ p: 2, borderColor: '#e3eaf2', '& .MuiInputBase-input, & .MuiSelect-select': { fontSize: 13 }, '& .MuiInputLabel-root, & .MuiFormHelperText-root': { fontSize: 11 } }}><Stack spacing={1.5}>
      <TextField size="small" label="Question title" placeholder="What would you like to know?" value={title} onChange={event => setTitle(event.target.value)} inputProps={{ maxLength: 160 }} helperText={`${title.length}/160`} fullWidth required />
      <FormControl size="small" fullWidth><InputLabel id="question-category-label">Category</InputLabel><Select labelId="question-category-label" label="Category" value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
      <Box className="community-editor"><Typography variant="subtitle2" fontWeight={700} mb={.5}>Details</Typography><ToggleButtonGroup value={format} onChange={(_, value) => setFormat(value)} size="small" aria-label="Editor formatting" sx={{ mb: .5, '& .MuiToggleButton-root': { borderColor: '#dce6ed', color: '#557087', py: .45 } }}><ToggleButton value="bold" aria-label="Bold"><FaBold /></ToggleButton><ToggleButton value="italic" aria-label="Italic"><FaItalic /></ToggleButton><ToggleButton value="list" aria-label="List"><FaListUl /></ToggleButton><ToggleButton value="quote" aria-label="Quote"><FaQuoteRight /></ToggleButton><ToggleButton value="link" aria-label="Link"><FaLink /></ToggleButton></ToggleButtonGroup><TextField size="small" placeholder="Describe what you are seeing, your plant type, care routine, and anything you have already tried…" value={details} onChange={event => setDetails(event.target.value)} multiline minRows={4} inputProps={{ maxLength: 3000 }} helperText={`${details.length}/3000`} fullWidth required /></Box>
      <Box><input ref={input} type="file" accept="image/*" hidden onChange={uploadImage} /><Button variant="outlined" startIcon={<FaImage />} onClick={() => input.current?.click()} sx={{ textTransform: 'none', fontWeight: 700 }}>Add a photo</Button><Button variant="text" startIcon={<FaPaperclip />} sx={{ ml: 1, textTransform: 'none' }}>Attach details</Button>{image && <Stack direction="row" spacing={1.5} alignItems="center" mt={1.5}><Box component="img" src={image.url} alt="Selected attachment preview" sx={{ width: 74, height: 58, objectFit: 'cover', borderRadius: 1 }} /><Typography variant="body2" color="text.secondary">{image.name}</Typography><Button size="small" color="inherit" onClick={() => setImage(null)}>Remove</Button></Stack>}</Box>
      <Stack direction="row" justifyContent="flex-end" spacing={1.5} pt={1} borderTop="1px solid #edf1f4"><Button onClick={() => navigate('/farm/dashboard/community')} color="inherit">Cancel</Button><Button variant="contained" disabled={!canPost} onClick={post} startIcon={<FaPen />} sx={{ textTransform: 'none', fontWeight: 700, px: 2 }}>Post question</Button></Stack>
    </Stack></Card>
  </Box></ThemeProvider></DashboardLayout>
}
