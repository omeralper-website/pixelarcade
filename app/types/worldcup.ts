// types/worldcup.ts

export interface Country {
    id: string;
    name: string;
    flag: string;
    code: string;
    fifaRank: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    form: ('W' | 'D' | 'L')[];
  }
  
  export interface Group {
    name: string;
    teams: Country[];
  }
  
  export interface Match {
    id: string;
    homeTeam: string;
    homeFlag: string;
    awayTeam: string;
    awayFlag: string;
    homeScore?: number;
    awayScore?: number;
    date: string;
    time: string;
    stadium: string;
    status: 'upcoming' | 'live' | 'completed';
    stage: 'group' | 'round16' | 'quarter' | 'semi' | 'final';
  }
  
  export interface KnockoutMatch {
    id: string;
    round: 'round16' | 'quarter' | 'semi' | 'final';
    team1: { name: string; flag: string; score?: string; winner?: boolean };
    team2: { name: string; flag: string; score?: string; winner?: boolean };
    date: string;
    status: 'upcoming' | 'live' | 'completed';
  }
  
  export interface TournamentStat {
    title: string;
    value: string;
    subtitle: string;
    icon: string;
    color: string;
  }