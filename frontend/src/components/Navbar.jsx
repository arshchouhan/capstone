import {Link} from 'react-router-dom'
import {FaLeaf} from 'react-icons/fa'
import '../pages/PublicTheme.css'
export default function Navbar(){return <header className="public-nav"><Link to="/" className="public-brand"><FaLeaf/>Plantaexa</Link><nav aria-label="Main navigation"><Link to="/#workspaces">Choose your portal</Link><Link to="/grower/login">Grower login</Link><Link to="/doctor/login">Doctor login</Link></nav></header>}
