
import { Link, useLocation } from "react-router-dom";
import { Trophy, List, Settings } from "lucide-react";

const Header = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-10 bg-card border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">Fantasy League</span>
        </Link>
        
        <nav className="flex items-center space-x-1">
          <Link 
            to="/" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/') 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4" />
              <span>Home</span>
            </div>
          </Link>
          
          <Link 
            to="/tournaments" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/tournaments') || location.pathname.startsWith('/tournaments')
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <List className="h-4 w-4" />
              <span>Tournaments</span>
            </div>
          </Link>
          
          <Link 
            to="/masters" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/masters') 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Settings className="h-4 w-4" />
              <span>Masters</span>
            </div>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
