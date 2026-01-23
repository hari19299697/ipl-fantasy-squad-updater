
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Trophy, List, Settings, LogIn, LogOut, ShieldCheck, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut, isLoading } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-10 bg-card border-b shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <span className="text-base sm:text-xl font-bold text-foreground hidden xs:inline">Fantasy League</span>
          <span className="text-base sm:text-xl font-bold text-foreground xs:hidden">FL</span>
        </Link>
        
        <nav className="flex items-center space-x-0.5 sm:space-x-1">
          <Link 
            to="/" 
            className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
              isActive('/') 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </div>
          </Link>
          
          <Link 
            to="/tournaments" 
            className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
              isActive('/tournaments') || location.pathname.startsWith('/tournaments')
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Tournaments</span>
            </div>
          </Link>
          
          {/* Only show Masters link for admins */}
          {isAdmin && (
            <Link 
              to="/masters" 
              className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
                isActive('/masters') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Masters</span>
              </div>
            </Link>
          )}

          {/* Auth section */}
          {!isLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={isAdmin ? "bg-primary text-primary-foreground" : "bg-muted"}>
                          {isAdmin ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <Badge variant={isAdmin ? "default" : "secondary"} className="w-fit">
                          {isAdmin ? "Admin" : "Viewer"}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="ml-2"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
