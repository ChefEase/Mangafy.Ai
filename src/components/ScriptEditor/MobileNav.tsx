import { Book, FileText, UserCircle, MessageCircle } from "lucide-react";
import Link from "next/link";
import "./MobileNav.css";

const MobileNav = () => {
  return (
    <div className="mobile-nav">
      <Link href="/script-writing">
        <div className="icon-circle"><Book size={22} /></div>
        <span className="nav-label">Script Box</span>
      </Link>
      <Link href="/script-writing/templates">
        <div className="icon-circle"><FileText size={22} /></div>
        <span className="nav-label">Templates</span>
      </Link>
      
      <Link href="/characters">
        <div className="icon-circle"><UserCircle size={22} /></div>
        <span className="nav-label">Characters</span>
      </Link>

      <Link href="/chat">
        <div className="icon-circle"><MessageCircle size={22} /></div>
        <span className="nav-label">Chatbot</span>
      </Link>
    </div>
  );
};

export default MobileNav;
