
import { IPLTeam, Match, Player, PlayerRole, PointsCategory, TeamOwner } from "../types";

export const teamOwners: TeamOwner[] = [
  { id: '1', name: 'Aman', shortName: 'AMN', color: '#FF5757', totalPoints: 0, totalPlayers: 0 },
  { id: '2', name: 'Anmol', shortName: 'ANM', color: '#4CAF50', totalPoints: 0, totalPlayers: 0 },
  { id: '3', name: 'Aryan', shortName: 'ARY', color: '#2196F3', totalPoints: 0, totalPlayers: 0 },
  { id: '4', name: 'Ayush', shortName: 'AYU', color: '#9C27B0', totalPoints: 0, totalPlayers: 0 },
  { id: '5', name: 'Kunal', shortName: 'KUN', color: '#FF9800', totalPoints: 0, totalPlayers: 0 },
  { id: '6', name: 'Palash', shortName: 'PAL', color: '#607D8B', totalPoints: 0, totalPlayers: 0 },
  { id: '7', name: 'Sanchit', shortName: 'SAN', color: '#F44336', totalPoints: 0, totalPlayers: 0 },
  { id: '8', name: 'Shobhit', shortName: 'SHO', color: '#673AB7', totalPoints: 0, totalPlayers: 0 },
  { id: '9', name: 'Utkarsh', shortName: 'UTK', color: '#795548', totalPoints: 0, totalPlayers: 0 },
];

export const samplePlayers: Player[] = [
  // Sample data based on your Google Sheet
  { 
    id: '1', 
    name: 'MS Dhoni', 
    role: 'Wicket Keeper', 
    iplTeam: 'CSK', 
    owner: '1', 
    price: 2.0, 
    totalPoints: 0,
    matchPoints: {} 
  },
  { 
    id: '2', 
    name: 'Virat Kohli', 
    role: 'Batsman', 
    iplTeam: 'RCB', 
    owner: '2', 
    price: 15.0, 
    totalPoints: 0,
    matchPoints: {} 
  },
  { 
    id: '3', 
    name: 'Rohit Sharma', 
    role: 'Batsman', 
    iplTeam: 'MI', 
    owner: '3', 
    price: 14.0, 
    totalPoints: 0,
    matchPoints: {} 
  },
  { 
    id: '4', 
    name: 'Jasprit Bumrah', 
    role: 'Bowler', 
    iplTeam: 'MI', 
    owner: '4', 
    price: 16.0, 
    totalPoints: 0,
    matchPoints: {} 
  },
  { 
    id: '5', 
    name: 'Jos Buttler', 
    role: 'Wicket Keeper', 
    iplTeam: 'RR', 
    owner: '5', 
    price: 14.0, 
    totalPoints: 0,
    matchPoints: {} 
  },
  { 
    id: '6', 
    name: 'Ravindra Jadeja', 
    role: 'All-Rounder', 
    iplTeam: 'CSK', 
    owner: '6', 
    price: 13.0, 
    totalPoints: 0,
    matchPoints: {} 
  },
  { 
    id: '7', 
    name: 'KL Rahul', 
    role: 'Wicket Keeper', 
    iplTeam: 'LSG', 
    owner: '7', 
    price: 12.0, 
    totalPoints: 0,
    matchPoints: {} 
  },
  { 
    id: '8', 
    name: 'Rishabh Pant', 
    role: 'Wicket Keeper', 
    iplTeam: 'DC', 
    owner: '8', 
    price: 13.0, 
    totalPoints: 0,
    matchPoints: {} 
  },
  { 
    id: '9', 
    name: 'Hardik Pandya', 
    role: 'All-Rounder', 
    iplTeam: 'MI', 
    owner: '9', 
    price: 15.0, 
    totalPoints: 0,
    matchPoints: {} 
  },
  // Add more players as needed
];

// These would typically come from your rules
export const pointsCategories: PointsCategory[] = [
  { id: '1', name: 'Run', pointsValue: 1 },
  { id: '2', name: 'Four', pointsValue: 1 },
  { id: '3', name: 'Six', pointsValue: 2 },
  { id: '4', name: 'Century', pointsValue: 16 },
  { id: '5', name: 'Half Century', pointsValue: 8 },
  { id: '6', name: 'Duck', pointsValue: -2, forRole: ['Batsman', 'All-Rounder', 'Wicket Keeper'] },
  { id: '7', name: 'Wicket', pointsValue: 25 },
  { id: '8', name: 'Maiden Over', pointsValue: 8 },
  { id: '9', name: 'Catch', pointsValue: 8 },
  { id: '10', name: 'Run Out/Stumping', pointsValue: 12 },
  { id: '11', name: 'Man of the Match', pointsValue: 20 },
];

export const sampleMatches: Match[] = [
  {
    id: 'm1',
    matchNumber: 1,
    team1: 'CSK',
    team2: 'RCB',
    date: '2024-03-22',
    venue: 'M. A. Chidambaram Stadium, Chennai',
    isCompleted: true,
  },
  {
    id: 'm2',
    matchNumber: 2,
    team1: 'PBKS',
    team2: 'DC',
    date: '2024-03-23',
    venue: 'Punjab Cricket Association Stadium, Mohali',
    isCompleted: true,
  },
  {
    id: 'm3',
    matchNumber: 3,
    team1: 'KKR',
    team2: 'SRH',
    date: '2024-03-23',
    venue: 'Eden Gardens, Kolkata',
    isCompleted: true,
  },
  {
    id: 'm4',
    matchNumber: 4,
    team1: 'RR',
    team2: 'LSG',
    date: '2024-03-24',
    venue: 'Sawai Mansingh Stadium, Jaipur',
    isCompleted: false,
  },
  {
    id: 'm5',
    matchNumber: 5,
    team1: 'GT',
    team2: 'MI',
    date: '2024-03-24',
    venue: 'Narendra Modi Stadium, Ahmedabad',
    isCompleted: false,
  },
];

// Initialize players and owners for the sample data
export function getInitializedData() {
  const owners = [...teamOwners];
  const players = [...samplePlayers];
  
  // Count players per owner
  const playerCounts: Record<string, number> = {};
  players.forEach(player => {
    playerCounts[player.owner] = (playerCounts[player.owner] || 0) + 1;
  });
  
  // Update owner stats
  owners.forEach(owner => {
    owner.totalPlayers = playerCounts[owner.id] || 0;
  });
  
  return { owners, players };
}
