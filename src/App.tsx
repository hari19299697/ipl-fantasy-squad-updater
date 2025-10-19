
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TournamentProvider } from "./contexts/TournamentContext";
import Landing from "./pages/Landing";
import Tournaments from "./pages/Tournaments";
import TournamentCreate from "./pages/TournamentCreate";
import TournamentDetail from "./pages/TournamentDetail";
import Masters from "./pages/Masters";
import Auction from "./pages/Auction";
import UpdatePoints from "./pages/UpdatePoints";
import Players from "./pages/Players";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TournamentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/new" element={<TournamentCreate />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/auction/:id" element={<Auction />} />
            <Route path="/update-points/:id" element={<UpdatePoints />} />
            <Route path="/players/:id" element={<Players />} />
            <Route path="/masters" element={<Masters />} />
            <Route path="/players" element={<Navigate to="/tournaments" replace />} />
            <Route path="/update-points" element={<Navigate to="/tournaments" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TournamentProvider>
  </QueryClientProvider>
);

export default App;
