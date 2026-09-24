'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE BAĞLANTISI ---
const supabaseUrl = 'https://nfeukyfjfcexackiawuv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZXVreWZqZmNleGFja2lhd3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTYyMTAsImV4cCI6MjEwNDE5MjIxMH0.M9cZ9TFVo5lbACSO5TqVEnOdtnuc8iDbwFIeZ5IFWHY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- TİP TANIMLAMALARI ---
export interface Country {
  id: string;
  name: string;
  code: string;
  flag: string;
  groupName: string;
  fifaRank: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface Match {
  id: string;
  homeTeam: string;
  homeFlag: string;
  homeScore?: number;
  awayTeam: string;
  awayFlag: string;
  awayScore?: number;
  date: string;
  time: string;
  stadium: string;
  status: 'Yaklaşıyor' | 'Canlı' | 'Tamamlandı';
  stage: 'Grup' | 'Son 16' | 'Çeyrek Final' | 'Yarı Final' | 'Final';
}

export interface Review {
  id: string;
  game_key: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface LeaderboardScore {
  score: number;
  date: string;
}

// --- STATİK TURNUVA VERİLERİ ---
const INITIAL_COUNTRIES: Country[] = [
  { id: 'tr', name: 'Türkiye', code: 'TR', flag: '🇹🇷', groupName: 'Grup A', fifaRank: 26, matchesPlayed: 3, wins: 2, draws: 1, losses: 0, goalsFor: 6, goalsAgainst: 2, points: 7 },
  { id: 'br', name: 'Brezilya', code: 'BR', flag: '🇧🇷', groupName: 'Grup A', fifaRank: 5, matchesPlayed: 3, wins: 2, draws: 0, losses: 1, goalsFor: 7, goalsAgainst: 3, points: 6 },
  { id: 'fr', name: 'Fransa', code: 'FR', flag: '🇫🇷', groupName: 'Grup A', fifaRank: 2, matchesPlayed: 3, wins: 1, draws: 1, losses: 1, goalsFor: 4, goalsAgainst: 4, points: 4 },
  { id: 'jp', name: 'Japonya', code: 'JP', flag: '🇯🇵', groupName: 'Grup A', fifaRank: 18, matchesPlayed: 3, wins: 0, draws: 0, losses: 3, goalsFor: 1, goalsAgainst: 9, points: 0 },

  { id: 'ar', name: 'Arjantin', code: 'AR', flag: '🇦🇷', groupName: 'Grup B', fifaRank: 1, matchesPlayed: 3, wins: 3, draws: 0, losses: 0, goalsFor: 8, goalsAgainst: 1, points: 9 },
  { id: 'de', name: 'Almanya', code: 'DE', flag: '🇩🇪', groupName: 'Grup B', fifaRank: 16, matchesPlayed: 3, wins: 2, draws: 0, losses: 1, goalsFor: 5, goalsAgainst: 3, points: 6 },
  { id: 'sn', name: 'Senegal', code: 'SN', flag: '🇸🇳', groupName: 'Grup B', fifaRank: 17, matchesPlayed: 3, wins: 1, draws: 0, losses: 2, goalsFor: 3, goalsAgainst: 5, points: 3 },
  { id: 'au', name: 'Avustralya', code: 'AU', flag: '🇦🇺', groupName: 'Grup B', fifaRank: 23, matchesPlayed: 3, wins: 0, draws: 0, losses: 3, goalsFor: 1, goalsAgainst: 8, points: 0 },

  { id: 'es', name: 'İspanya', code: 'ES', flag: '🇪🇸', groupName: 'Grup C', fifaRank: 8, matchesPlayed: 3, wins: 2, draws: 1, losses: 0, goalsFor: 6, goalsAgainst: 1, points: 7 },
  { id: 'pt', name: 'Portekiz', code: 'PT', flag: '🇵🇹', groupName: 'Grup C', fifaRank: 6, matchesPlayed: 3, wins: 2, draws: 0, losses: 1, goalsFor: 5, goalsAgainst: 3, points: 6 },
  { id: 'kr', name: 'Güney Kore', code: 'KR', flag: '🇰🇷', groupName: 'Grup C', fifaRank: 22, matchesPlayed: 3, wins: 1, draws: 1, losses: 1, goalsFor: 3, goalsAgainst: 4, points: 4 },
  { id: 'ca', name: 'Kanada', code: 'CA', flag: '🇨🇦', groupName: 'Grup C', fifaRank: 48, matchesPlayed: 3, wins: 0, draws: 0, losses: 3, goalsFor: 1, goalsAgainst: 7, points: 0 },

  { id: 'gb', name: 'İngiltere', code: 'GB', flag: '🇬🇧', groupName: 'Grup D', fifaRank: 4, matchesPlayed: 3, wins: 2, draws: 1, losses: 0, goalsFor: 7, goalsAgainst: 2, points: 7 },
  { id: 'nl', name: 'Hollanda', code: 'NL', flag: '🇳🇱', groupName: 'Grup D', fifaRank: 7, matchesPlayed: 3, wins: 2, draws: 0, losses: 1, goalsFor: 6, goalsAgainst: 4, points: 6 },
  { id: 'mx', name: 'Meksika', code: 'MX', flag: '🇲🇽', groupName: 'Grup D', fifaRank: 15, matchesPlayed: 3, wins: 1, draws: 1, losses: 1, goalsFor: 3, goalsAgainst: 4, points: 4 },
  { id: 'ma', name: 'Fas', code: 'MA', flag: '🇲🇦', groupName: 'Grup D', fifaRank: 13, matchesPlayed: 3, wins: 0, draws: 0, losses: 3, goalsFor: 1, goalsAgainst: 7, points: 0 },
];

const INITIAL_MATCHES: Match[] = [
  { id: 'm1', homeTeam: 'Türkiye', homeFlag: '🇹🇷', homeScore: 2, awayTeam: 'Brezilya', awayFlag: '🇧🇷', awayScore: 1, date: '12 Haziran 2026', time: '21:00', stadium: 'Atatürk Olimpiyat Stadı', status: 'Tamamlandı', stage: 'Grup' },
  { id: 'm2', homeTeam: 'Fransa', homeFlag: '🇫🇷', homeScore: 1, awayTeam: 'Japonya', awayFlag: '🇯🇵', awayScore: 0, date: '12 Haziran 2026', time: '18:00', stadium: 'Ali Sami Yen Spor Kompleksi', status: 'Tamamlandı', stage: 'Grup' },
  { id: 'm3', homeTeam: 'Arjantin', homeFlag: '🇦🇷', homeScore: 3, awayTeam: 'Almanya', awayFlag: '🇩🇪', awayScore: 1, date: '13 Haziran 2026', time: '21:00', stadium: 'Wembley Stadyumu', status: 'Tamamlandı', stage: 'Grup' },
  { id: 'm4', homeTeam: 'İspanya', homeFlag: '🇪🇸', homeScore: 2, awayTeam: 'Portekiz', awayFlag: '🇵🇹', awayScore: 1, date: '14 Haziran 2026', time: '22:00', stadium: 'Santiago Bernabéu', status: 'Canlı', stage: 'Grup' },
  { id: 'm5', homeTeam: 'İngiltere', homeFlag: '🇬🇧', homeScore: undefined, awayTeam: 'Hollanda', awayFlag: '🇳🇱', awayScore: undefined, date: '15 Haziran 2026', time: '20:00', stadium: 'Allianz Arena', status: 'Yaklaşıyor', stage: 'Grup' },
  { id: 'm6', homeTeam: 'Türkiye', homeFlag: '🇹🇷', homeScore: undefined, awayTeam: 'Fransa', awayFlag: '🇫🇷', awayScore: undefined, date: '19 Haziran 2026', time: '21:00', stadium: 'Atatürk Olimpiyat Stadı', status: 'Yaklaşıyor', stage: 'Grup' },
  { id: 'm7', homeTeam: 'Arjantin', homeFlag: '🇦🇷', homeScore: undefined, awayTeam: 'Brezilya', awayFlag: '🇧🇷', awayScore: undefined, date: '28 Haziran 2026', time: '21:00', stadium: 'Maracanã Stadyumu', status: 'Yaklaşıyor', stage: 'Son 16' },
  { id: 'm8', homeTeam: 'İngiltere', homeFlag: '🇬🇧', homeScore: undefined, awayTeam: 'İspanya', awayFlag: '🇪🇸', awayScore: undefined, date: '4 Temmuz 2026', time: '22:00', stadium: 'Wembley Stadyumu', status: 'Yaklaşıyor', stage: 'Çeyrek Final' },
];

// --- ANA COMPONENT ---
export default function ArcadeHome() {
  const [activeTab, setActiveTab] = useState<'hub' | 'worldcup' | 'snake' | 'tictactoe' | 'rps' | 'flappy' | 'leaderboard' | 'football'>('hub');
  const [activeWcTab, setActiveWcTab] = useState<'overview' | 'groups' | 'matches' | 'bracket' | 'stats'>('overview');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const saveScoreToLeaderboard = (gameKey: string, scoreValue: number) => {
    if (scoreValue <= 0) return;
    try {
      const storageKey = `arcade_leaderboard_${gameKey}`;
      const existing = localStorage.getItem(storageKey);
      const scores: LeaderboardScore[] = existing ? JSON.parse(existing) : [];
      
      scores.push({
        score: scoreValue,
        date: new Date().toLocaleDateString('tr-TR')
      });

      scores.sort((a, b) => b.score - a.score);
      localStorage.setItem(storageKey, JSON.stringify(scores.slice(0, 10)));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Üst Menü */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <h1 
          onClick={() => setActiveTab('hub')}
          className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent cursor-pointer tracking-wider flex items-center gap-2"
        >
          <span>PixelArcade</span>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">Pro 2026</span>
        </h1>
        <nav className="space-x-2 md:space-x-4 text-xs md:text-sm font-medium text-slate-300 overflow-x-auto flex items-center">
          <button onClick={() => setActiveTab('hub')} className={`hover:text-cyan-400 transition cursor-pointer px-3 py-1.5 rounded-lg ${activeTab === 'hub' ? 'bg-slate-800 text-cyan-400 font-bold' : ''}`}>Ana Menü</button>
          <button onClick={() => setActiveTab('worldcup')} className={`hover:text-emerald-400 transition cursor-pointer px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${activeTab === 'worldcup' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-emerald-400/90'}`}>
            <span>🌍</span> Dünya Kupası
          </button>
          <button onClick={() => setActiveTab('snake')} className={`hover:text-cyan-400 transition cursor-pointer px-2.5 py-1.5 rounded-lg ${activeTab === 'snake' ? 'bg-slate-800 text-cyan-400 font-bold' : ''}`}>Yılan</button>
          <button onClick={() => setActiveTab('flappy')} className={`hover:text-cyan-400 transition cursor-pointer px-2.5 py-1.5 rounded-lg ${activeTab === 'flappy' ? 'bg-slate-800 text-cyan-400 font-bold' : ''}`}>Flappy</button>
          <button onClick={() => setActiveTab('tictactoe')} className={`hover:text-cyan-400 transition cursor-pointer px-2.5 py-1.5 rounded-lg ${activeTab === 'tictactoe' ? 'bg-slate-800 text-cyan-400 font-bold' : ''}`}>XOX</button>
          <button onClick={() => setActiveTab('rps')} className={`hover:text-cyan-400 transition cursor-pointer px-2.5 py-1.5 rounded-lg ${activeTab === 'rps' ? 'bg-slate-800 text-cyan-400 font-bold' : ''}`}>Taş-Kağıt</button>
          <button onClick={() => setActiveTab('football')} className={`hover:text-cyan-400 transition cursor-pointer px-2.5 py-1.5 rounded-lg ${activeTab === 'football' ? 'bg-slate-800 text-cyan-400 font-bold' : ''}`}>Penaltı ⚽</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`text-amber-400 hover:text-amber-300 transition cursor-pointer font-bold px-2.5 py-1.5 rounded-lg ${activeTab === 'leaderboard' ? 'bg-amber-500/20 border border-amber-500/30' : ''}`}>🏆 Skor</button>
        </nav>
      </header>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col items-center justify-start">
        {activeTab === 'hub' && <GameHub onSelectTab={setActiveTab} />}
        {activeTab === 'worldcup' && (
          <WorldCupModule 
            activeWcTab={activeWcTab} 
            setActiveWcTab={setActiveWcTab} 
            countries={INITIAL_COUNTRIES} 
            matches={INITIAL_MATCHES}
            onSelectCountry={(country) => setSelectedCountry(country)}
          />
        )}
        {activeTab === 'snake' && <SnakeGame onBack={() => setActiveTab('hub')} onScore={(s) => saveScoreToLeaderboard('snake', s)} />}
        {activeTab === 'flappy' && <FlappyBirdGame onBack={() => setActiveTab('hub')} onScore={(s) => saveScoreToLeaderboard('flappy', s)} />}
        {activeTab === 'tictactoe' && <TicTacToeGame onBack={() => setActiveTab('hub')} onWin={() => saveScoreToLeaderboard('tictactoe', 1)} />}
        {activeTab === 'rps' && <RpsGame onBack={() => setActiveTab('hub')} onWin={(score) => saveScoreToLeaderboard('rps', score)} />}
        {activeTab === 'football' && <FootballTournamentGame onBack={() => setActiveTab('hub')} onScore={(s) => saveScoreToLeaderboard('football', s)} />}
        {activeTab === 'leaderboard' && <LeaderboardView onBack={() => setActiveTab('hub')} />}
      </main>

      {/* Ülke Detay Modal */}
      {selectedCountry && (
        <CountryModal country={selectedCountry} onClose={() => setSelectedCountry(null)} />
      )}
    </div>
  );
}

// --- 🌍 DÜNYA KUPASI MODÜLÜ ---
function WorldCupModule({ 
  activeWcTab, 
  setActiveWcTab, 
  countries, 
  matches,
  onSelectCountry 
}: { 
  activeWcTab: 'overview' | 'groups' | 'matches' | 'bracket' | 'stats';
  setActiveWcTab: (tab: 'overview' | 'groups' | 'matches' | 'bracket' | 'stats') => void;
  countries: Country[];
  matches: Match[];
  onSelectCountry: (country: Country) => void;
}) {
  return (
    <div className="w-full space-y-6 pb-12 animate-fadeIn">
      <div className="flex items-center justify-center bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-lg backdrop-blur overflow-x-auto">
        <button 
          onClick={() => setActiveWcTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer whitespace-nowrap ${activeWcTab === 'overview' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          Genel Bakış
        </button>
        <button 
          onClick={() => setActiveWcTab('groups')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer whitespace-nowrap ${activeWcTab === 'groups' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          Gruplar
        </button>
        <button 
          onClick={() => setActiveWcTab('matches')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer whitespace-nowrap ${activeWcTab === 'matches' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          Maçlar
        </button>
        <button 
          onClick={() => setActiveWcTab('bracket')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer whitespace-nowrap ${activeWcTab === 'bracket' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          Turnuva Ağacı
        </button>
        <button 
          onClick={() => setActiveWcTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer whitespace-nowrap ${activeWcTab === 'stats' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          İstatistikler
        </button>
      </div>

      {activeWcTab === 'overview' && <WorldCupHero onExplore={() => setActiveWcTab('groups')} onMatches={() => setActiveWcTab('matches')} />}
      {activeWcTab === 'groups' && <GroupStage countries={countries} onSelectCountry={onSelectCountry} />}
      {activeWcTab === 'matches' && <MatchList matches={matches} />}
      {activeWcTab === 'bracket' && <KnockoutBracket />}
      {activeWcTab === 'stats' && <TournamentStats countries={countries} onSelectCountry={onSelectCountry} />}
    </div>
  );
}

// --- 🌟 HERO ALANI ---
function WorldCupHero({ onExplore, onMatches }: { onExplore: () => void; onMatches: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/20 p-8 md:p-14 shadow-2xl flex flex-col items-center text-center space-y-6">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase animate-pulse">
        <span>🏆</span> FIFA Dünya Kupası 2026 Resmi Merkezi
      </div>

      <div className="space-y-3 max-w-2xl">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white">
          DÜNYA <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">KUPASI</span>
        </h2>
        <p className="text-slate-300 text-sm md:text-base leading-relaxed">
          Gezegenin en büyük futbol şöleninde milli takımların grup maçlarını takip et, turnuva ağacını incele ve şampiyonluk yolculuğuna tanık ol.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button 
          onClick={onExplore}
          className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer text-sm flex items-center gap-2"
        >
          <span>✨</span> Turnuvayı Keşfet
        </button>
        <button 
          onClick={onMatches}
          className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-white font-bold rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer text-sm flex items-center gap-2 shadow-lg"
        >
          <span>⚽</span> Maçları Gör
        </button>
      </div>

      <div className="pt-8 grid grid-cols-4 sm:grid-cols-8 gap-3 w-full max-w-3xl">
        {['🇹🇷 Türkiye', '🇧🇷 Brezilya', '🇦🇷 Arjantin', '🇩🇪 Almanya', '🇫🇷 Fransa', '🇪🇸 İspanya', '🇵🇹 Portekiz', '🇬🇧 İngiltere'].map((item, idx) => {
          const [flag, name] = item.split(' ');
          return (
            <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 hover:border-emerald-500/40 transition">
              <span className="text-2xl">{flag}</span>
              <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- 📊 GRUP AŞAMASI ---
function GroupStage({ countries, onSelectCountry }: { countries: Country[]; onSelectCountry: (c: Country) => void }) {
  const groups = ['Grup A', 'Grup B', 'Grup C', 'Grup D'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span>📋</span> Grup Puan Durumları
          </h3>
          <p className="text-xs text-slate-400 mt-1">Takımların detaylı performansını görmek için üzerlerine tıklayabilirsin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((groupName) => {
          const groupTeams = countries
            .filter((c) => c.groupName === groupName)
            .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));

          return (
            <div key={groupName} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {groupName}
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/60">
                      <th className="py-2 px-2 font-semibold">Sıra / Ülke</th>
                      <th className="py-2 px-1 font-semibold text-center">O</th>
                      <th className="py-2 px-1 font-semibold text-center">G</th>
                      <th className="py-2 px-1 font-semibold text-center">B</th>
                      <th className="py-2 px-1 font-semibold text-center">M</th>
                      <th className="py-2 px-1 font-semibold text-center">AG</th>
                      <th className="py-2 px-2 font-semibold text-right">P</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {groupTeams.map((team, idx) => (
                      <tr 
                        key={team.id} 
                        onClick={() => onSelectCountry(team)}
                        className="hover:bg-slate-800/50 transition cursor-pointer group"
                      >
                        <td className="py-2.5 px-2 flex items-center gap-2">
                          <span className={`w-4 text-[10px] font-bold ${idx < 2 ? 'text-emerald-400' : 'text-slate-500'}`}>#{idx + 1}</span>
                          <span className="text-base">{team.flag}</span>
                          <span className="font-bold text-slate-200 group-hover:text-emerald-400 transition">{team.name}</span>
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-400">{team.matchesPlayed}</td>
                        <td className="py-2.5 px-1 text-center text-slate-400">{team.wins}</td>
                        <td className="py-2.5 px-1 text-center text-slate-400">{team.draws}</td>
                        <td className="py-2.5 px-1 text-center text-slate-400">{team.losses}</td>
                        <td className="py-2.5 px-1 text-center text-slate-400">{team.goalsFor}</td>
                        <td className="py-2.5 px-2 text-right font-black text-emerald-400 text-sm">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- ⚽ MAÇLAR LİSTESİ ---
function MatchList({ matches }: { matches: Match[] }) {
  const [filter, setFilter] = useState<'Tümü' | 'Canlı' | 'Yaklaşıyor' | 'Tamamlandı'>('Tümü');

  const filteredMatches = matches.filter(m => {
    if (filter === 'Tümü') return true;
    return m.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span>⚽</span> Turnuva Maç Takvimi
          </h3>
          <p className="text-xs text-slate-400 mt-1">Canlı karşılaşmaları ve tüm maç detaylarını anlık olarak takip edin.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {(['Tümü', 'Canlı', 'Yaklaşıyor', 'Tamamlandı'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filter === item ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
            >
              {item === 'Canlı' && '🔴 '} {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMatches.map((match) => {
          const isLive = match.status === 'Canlı';
          return (
            <div 
              key={match.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between space-y-4 ${
                isLive ? 'border-red-500/50 bg-gradient-to-r from-slate-900 via-red-950/20 to-slate-900' : 'border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {match.stage} Aşaması
                </span>
                {isLive ? (
                  <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-400 font-extrabold px-3 py-1 rounded-full animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> CANLI
                  </span>
                ) : (
                  <span className="text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                    {match.date} - {match.time}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-3xl">{match.homeFlag}</span>
                  <span className="font-extrabold text-white text-sm">{match.homeTeam}</span>
                </div>
                <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                  <span className={`text-xl font-black ${isLive ? 'text-red-400 animate-pulse text-2xl' : 'text-white'}`}>{match.homeScore ?? '-'}</span>
                  <span className="text-slate-600">:</span>
                  <span className={`text-xl font-black ${isLive ? 'text-red-400 animate-pulse text-2xl' : 'text-white'}`}>{match.awayScore ?? '-'}</span>
                </div>
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className="font-extrabold text-white text-sm text-right">{match.awayTeam}</span>
                  <span className="text-3xl">{match.awayFlag}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                📍 {match.stadium}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- 🌲 TURNUVA AĞACI ---
function KnockoutBracket() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <span>🌲</span> Modern Turnuva Ağacı (Bracket)
        </h3>
      </div>
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl overflow-x-auto shadow-xl">
        <div className="min-w-[800px] flex items-center justify-between gap-6 py-4">
          <div className="space-y-4 flex-1">
            <h4 className="text-xs font-bold text-emerald-400 uppercase text-center mb-4">Son 16</h4>
            <BracketCard team1="Türkiye 🇹🇷" team2="Japonya 🇯🇵" score="2 - 0" status="Oynandı" />
            <BracketCard team1="Brezilya 🇧🇷" team2="Fransa 🇫🇷" score="3 - 1" status="Oynandı" />
          </div>
          <div className="space-y-8 flex-1">
            <h4 className="text-xs font-bold text-cyan-400 uppercase text-center mb-4">Çeyrek Final</h4>
            <BracketCard team1="Türkiye 🇹🇷" team2="Brezilya 🇧🇷" score="2 - 1" status="Oynandı" />
          </div>
          <div className="space-y-16 flex-1">
            <h4 className="text-xs font-bold text-amber-400 uppercase text-center mb-4">Yarı Final</h4>
            <BracketCard team1="Türkiye 🇹🇷" team2="Arjantin 🇦🇷" score="15 Tem" status="Yaklaşıyor" />
          </div>
          <div className="space-y-4 flex-1">
            <h4 className="text-xs font-bold text-yellow-400 uppercase text-center mb-4">🏆 FİNAL</h4>
            <div className="bg-gradient-to-br from-amber-500/20 via-slate-950 to-slate-950 border border-amber-500/40 p-4 rounded-xl text-center">
              <div className="text-sm font-extrabold text-white">Kazanan 1 vs Kazanan 2</div>
              <div className="text-xs text-slate-400 mt-1">18 Temmuz 2026 - Wembley</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BracketCard({ team1, team2, score, status }: { team1: string; team2: string; score: string; status: string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-200">{team1}</span>
        <span className="text-[10px] text-slate-500">{status === 'Oynandı' ? score : ''}</span>
      </div>
      <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-1.5">
        <span className="font-bold text-slate-200">{team2}</span>
        <span className="text-[10px] font-bold text-emerald-400">{status}</span>
      </div>
    </div>
  );
}

// --- 📈 İSTATİSTİKLER ---
function TournamentStats({ countries, onSelectCountry }: { countries: Country[]; onSelectCountry: (c: Country) => void }) {
  const topScorer = [...countries].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const mostWins = [...countries].sort((a, b) => b.wins - a.wins)[0];
  const bestDefense = [...countries].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
  const leader = [...countries].sort((a, b) => b.points - a.points)[0];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-xl font-black text-white">Turnuva İstatistikleri ve Dashboard</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard title="⚽ En Çok Gol Atan Takım" team={topScorer} statValue={`${topScorer.goalsFor} Gol`} onSelect={onSelectCountry} />
        <StatCard title="🏆 En Çok Galibiyet Alan" team={mostWins} statValue={`${mostWins.wins} Galibiyet`} onSelect={onSelectCountry} />
        <StatCard title="🥅 En Az Gol Yiyen" team={bestDefense} statValue={`${bestDefense.goalsAgainst} Gol`} onSelect={onSelectCountry} />
        <StatCard title="👑 Turnuvanın Lideri" team={leader} statValue={`${leader.points} Puan`} onSelect={onSelectCountry} />
      </div>
    </div>
  );
}

function StatCard({ title, team, statValue, onSelect }: { title: string; team: Country; statValue: string; onSelect: (c: Country) => void }) {
  return (
    <div onClick={() => onSelect(team)} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 cursor-pointer">
      <div className="space-y-1">
        <span className="text-xs font-bold text-emerald-400 uppercase">{title}</span>
        <div className="flex items-center gap-3 pt-2">
          <span className="text-3xl">{team.flag}</span>
          <h4 className="font-extrabold text-white text-base">{team.name}</h4>
        </div>
      </div>
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between text-xs">
        <span className="text-slate-400">Performans</span>
        <span className="font-black text-emerald-400">{statValue}</span>
      </div>
    </div>
  );
}

// --- 🔍 ÜLKE DETAY MODALI ---
function CountryModal({ country, onClose }: { country: Country; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-950 p-2 rounded-full border border-slate-800 cursor-pointer text-xs">✕</button>
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <span className="text-5xl">{country.flag}</span>
          <div>
            <h3 className="text-2xl font-black text-white">{country.name}</h3>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">{country.groupName}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800"><span className="text-slate-500 block">Maç</span><span className="font-extrabold text-white text-base">{country.matchesPlayed}</span></div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800"><span className="text-slate-500 block">Puan</span><span className="font-extrabold text-emerald-400 text-lg">{country.points}</span></div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800"><span className="text-slate-500 block">Galibiyet</span><span className="font-extrabold text-white text-base">{country.wins}</span></div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800"><span className="text-slate-500 block">Atılan Gol</span><span className="font-extrabold text-white text-base">{country.goalsFor}</span></div>
        </div>
        <button onClick={onClose} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer">Kapat</button>
      </div>
    </div>
  );
}

// --- 🎮 OYUN HUB ---
function GameHub({ onSelectTab }: { onSelectTab: (tab: any) => void }) {
  return (
    <div className="space-y-8 text-center w-full py-8">
      <div className="space-y-3">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">PixelArcade & Spor Merkezi</h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm">Dünya Kupası turnuvasını takip et ve mini oyunlarla eğlen.</p>
      </div>

      <div 
        onClick={() => onSelectTab('worldcup')}
        className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 rounded-3xl p-8 text-left space-y-4 hover:scale-[1.01] transition cursor-pointer shadow-2xl relative"
      >
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">✨ Öne Çıkan Modül</div>
        <div className="space-y-2 max-w-lg">
          <h3 className="text-3xl font-black text-white">Dünya Kupası 2026 🏆</h3>
          <p className="text-sm text-slate-300">Grup puan durumları, canlı maç takvimi, turnuva ağacı ve ülke istatistikleri.</p>
        </div>
        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">Hemen İncele →</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div onClick={() => onSelectTab('snake')} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-3 cursor-pointer hover:border-emerald-400 transition">
          <h3 className="text-xl font-bold text-white">Yılan Oyunu 🐍</h3>
          <p className="text-xs text-slate-400">Yemleri topla, kuyruğunu büyüt!</p>
        </div>
        <div onClick={() => onSelectTab('flappy')} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-3 cursor-pointer hover:border-amber-400 transition">
          <h3 className="text-xl font-bold text-white">Flappy Bird 🐥</h3>
          <p className="text-xs text-slate-400">Borulardan geçerek rekor kır.</p>
        </div>
        <div onClick={() => onSelectTab('football')} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-3 cursor-pointer hover:border-cyan-400 transition">
          <h3 className="text-xl font-bold text-white">Penaltı Turnuvası ⚽</h3>
          <p className="text-xs text-slate-400">Penaltı atışlarıyla kupayı kaldır.</p>
        </div>
      </div>
    </div>
  );
}

// --- DİĞER MİNİ OYUNLAR (SNAKE, FLAPPY, XOX, RPS, FOOTBALL, LEADERBOARD, REVIEWS) ---
function SnakeGame({ onBack, onScore }: { onBack: () => void; onScore: (s: number) => void }) { return <div className="p-8 text-center"><button onClick={onBack} className="text-cyan-400">← Geri</button><h3 className="text-xl mt-4">Yılan Oyunu</h3></div>; }
function FlappyBirdGame({ onBack, onScore }: { onBack: () => void; onScore: (s: number) => void }) { return <div className="p-8 text-center"><button onClick={onBack} className="text-cyan-400">← Geri</button><h3 className="text-xl mt-4">Flappy Bird</h3></div>; }
function TicTacToeGame({ onBack, onWin }: { onBack: () => void; onWin: () => void }) { return <div className="p-8 text-center"><button onClick={onBack} className="text-cyan-400">← Geri</button><h3 className="text-xl mt-4">XOX</h3></div>; }
function RpsGame({ onBack, onWin }: { onBack: () => void; onWin: (s: number) => void }) { return <div className="p-8 text-center"><button onClick={onBack} className="text-cyan-400">← Geri</button><h3 className="text-xl mt-4">Taş Kağıt Makas</h3></div>; }
function FootballTournamentGame({ onBack, onScore }: { onBack: () => void; onScore: (s: number) => void }) { return <div className="p-8 text-center"><button onClick={onBack} className="text-cyan-400">← Geri</button><h3 className="text-xl mt-4">Penaltı Turnuvası</h3></div>; }
function LeaderboardView({ onBack }: { onBack: () => void }) { return <div className="p-8 text-center"><button onClick={onBack} className="text-cyan-400">← Geri</button><h3 className="text-xl mt-4">Liderlik Tablosu</h3></div>; }