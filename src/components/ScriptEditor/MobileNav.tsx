import { Book, FileText, Lightbulb, Pencil } from "lucide-react";
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
      <Link href="/script-writing/generate-character">
        <div className="icon-circle"><Lightbulb size={22} /></div>
        <span className="nav-label">Figure Gen</span>
      </Link>
      <Link href="/script-writing/generate-cover">
        <div className="icon-circle"><Pencil size={22} /></div>
        <span className="nav-label">Cover Gen</span>
      </Link>
    </div>
  );
};

export default MobileNav;
