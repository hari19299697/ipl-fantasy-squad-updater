
import { Link, useLocation } from "react-router-dom";
import { Trophy, Users, Zap } from "lucide-react";

const Header = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-ipl-gold" />
          <span className="text-xl font-bold text-ipl-blue">IPL Fantasy</span>
        </Link>
        
        <nav className="flex items-center space-x-1">
          <Link 
            to="/" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/') 
                ? 'bg-ipl-light text-ipl-blue' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </Link>
          
          <Link 
            to="/players" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/players') 
                ? 'bg-ipl-light text-ipl-blue' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Players</span>
            </div>
          </Link>
          
          <Link 
            to="/update-points" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/update-points') 
                ? 'bg-ipl-light text-ipl-blue' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              <span>Update Points</span>
            </div>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
