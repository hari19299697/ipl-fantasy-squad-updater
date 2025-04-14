
export type TeamOwner = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  totalPoints: number;
  totalPlayers: number;
};

export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper';

export type IPLTeam = 
  | 'CSK' | 'DC' | 'GT' | 'KKR' 
  | 'LSG' | 'MI' | 'PBKS' | 'RR' 
  | 'RCB' | 'SRH';

export type Player = {
  id: string;
  name: string;
  role: PlayerRole;
  iplTeam: IPLTeam;
  owner: string; // Owner ID
  price?: number;
  totalPoints: number;
  matchPoints: Record<string, number>; // matchId -> points
};

export type Match = {
  id: string;
  matchNumber: number;
  team1: IPLTeam;
  team2: IPLTeam;
  date: string;
  venue: string;
  isCompleted: boolean;
};

export type PointsCategory = {
  id: string;
  name: string;
  pointsValue: number;
  forRole?: PlayerRole[];
};
