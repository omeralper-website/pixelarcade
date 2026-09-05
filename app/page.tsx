'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface LeaderboardScore {
  score: number;
  date: string;
}

export default function ArcadeHome() {
  const [activeGame, setActiveGame] = useState<'hub' | 'snake' | 'tictactoe' | 'rps' | 'flappy' | 'leaderboard'>('hub');

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
          onClick={() => setActiveGame('hub')}
          className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent cursor-pointer tracking-wider"
        >
          PixelArcade 🕹️
        </h1>
        <nav className="space-x-3 md:space-x-5 text-xs md:text-sm font-medium text-slate-300 overflow-x-auto">
          <button onClick={() => setActiveGame('hub')} className="hover:text-cyan-400 transition cursor-pointer">Ana Menü</button>
          <button onClick={() => setActiveGame('snake')} className="hover:text-cyan-400 transition cursor-pointer">Yılan</button>
          <button onClick={() => setActiveGame('flappy')} className="hover:text-cyan-400 transition cursor-pointer">Flappy Bird</button>
          <button onClick={() => setActiveGame('tictactoe')} className="hover:text-cyan-400 transition cursor-pointer">XOX</button>
          <button onClick={() => setActiveGame('rps')} className="hover:text-cyan-400 transition cursor-pointer">Taş Kağıt Makas</button>
          <button onClick={() => setActiveGame('leaderboard')} className="text-amber-400 hover:text-amber-300 transition cursor-pointer font-bold">🏆 Skor Salonu</button>
        </nav>
      </header>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col items-center justify-center">
        {activeGame === 'hub' && <GameHub onSelectGame={setActiveGame} />}
        {activeGame === 'snake' && <SnakeGame onBack={() => setActiveGame('hub')} onScore={(s) => saveScoreToLeaderboard('snake', s)} />}
        {activeGame === 'flappy' && <FlappyBirdGame onBack={() => setActiveGame('hub')} onScore={(s) => saveScoreToLeaderboard('flappy', s)} />}
        {activeGame === 'tictactoe' && <TicTacToeGame onBack={() => setActiveGame('hub')} onWin={() => saveScoreToLeaderboard('tictactoe', 1)} />}
        {activeGame === 'rps' && <RpsGame onBack={() => setActiveGame('hub')} onWin={(score) => saveScoreToLeaderboard('rps', score)} />}
        {activeGame === 'leaderboard' && <LeaderboardView onBack={() => setActiveGame('hub')} />}
      </main>
    </div>
  );
}

// Global Liderlik Tablosu
function LeaderboardView({ onBack }: { onBack: () => void }) {
  const [selectedTab, setSelectedTab] = useState<'snake' | 'flappy' | 'tictactoe' | 'rps'>('snake');
  const [scores, setScores] = useState<LeaderboardScore[]>([]);

  const gameTitles: Record<string, string> = {
    snake: 'Yılan Oyunu 🐍',
    flappy: 'Flappy Bird 🐥',
    tictactoe: 'XOX (Zeki AI) ❌',
    rps: 'Taş Kağıt Makas ✂️'
  };

  useEffect(() => {
    const saved = localStorage.getItem(`arcade_leaderboard_${selectedTab}`);
    if (saved) {
      try {
        setScores(JSON.parse(saved));
      } catch (e) {
        console.error(e);
        setScores([]);
      }
    } else {
      setScores([]);
    }
  }, [selectedTab]);

  return (
    <div className="space-y-6 text-center w-full max-w-lg pb-12">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="text-sm text-cyan-400 hover:underline cursor-pointer">← Menüye Dön</button>
        <h3 className="text-xl font-extrabold text-amber-400 flex items-center gap-1.5">🏆 Skor Salonu</h3>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
        {(['snake', 'flappy', 'tictactoe', 'rps'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedTab === tab 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab === 'snake' && '🐍 Yılan'}
            {tab === 'flappy' && '🐥 Flappy'}
            {tab === 'tictactoe' && '❌ XOX'}
            {tab === 'rps' && '✂️ Taş-Kağıt'}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 text-left">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h4 className="font-bold text-white text-sm">{gameTitles[selectedTab]} Liderlik Listesi</h4>
          <span className="text-xs text-slate-500">En İyi 10 Skor</span>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {scores.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-3xl">🎮</p>
              <p className="text-xs text-slate-500">Bu oyun için henüz kaydedilmiş bir skor bulunmuyor.</p>
            </div>
          ) : (
            scores.map((item, index) => {
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
              return (
                <div key={index} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-base w-6 text-center">{medal}</span>
                    <div>
                      <span className="text-[10px] text-slate-500">{item.date}</span>
                    </div>
                  </div>
                  <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-amber-400 font-extrabold">
                    {item.score} {selectedTab === 'tictactoe' ? 'Galibiyet' : 'Puan'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// 1. Oyun Hub
function GameHub({ onSelectGame }: { onSelectGame: (game: 'snake' | 'tictactoe' | 'rps' | 'flappy' | 'leaderboard') => void }) {
  return (
    <div className="space-y-8 text-center w-full py-8">
      <div className="space-y-3">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Klasik Retro Oyun Merkezi
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
          Tarayıcında hiçbir indirme yapmadan telefonda, tablette veya bilgisayarda anında oynayabileceğin efsane nostaljik oyunlar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        <GameCard 
          title="Yılan Oyunu 🐍" 
          desc="Yemleri topla, kuyruğunu büyütsen de duvara çarpma!" 
          onClick={() => onSelectGame('snake')}
          color="from-emerald-500/20 to-green-900/20 border-emerald-500/30 hover:border-emerald-400"
        />
        <GameCard 
          title="Flappy Bird 🐥" 
          desc="Boşluklardan geç, borulara çarpmadan rekor kır!" 
          onClick={() => onSelectGame('flappy')}
          color="from-amber-500/20 to-yellow-900/20 border-amber-500/30 hover:border-amber-400"
        />
        <GameCard 
          title="XOX (Zeki AI) ❌" 
          desc="Seni engellemeye çalışan akıllı yapay zekaya karşı kapış!" 
          onClick={() => onSelectGame('tictactoe')}
          color="from-indigo-500/20 to-blue-900/20 border-indigo-500/30 hover:border-indigo-400"
        />
        <GameCard 
          title="Taş Kağıt Makas ✂️" 
          desc="Skor tablosu ve anlık hamlelerle yapay zekaya karşı kapış!" 
          onClick={() => onSelectGame('rps')}
          color="from-purple-500/20 to-pink-900/20 border-purple-500/30 hover:border-purple-400"
        />
      </div>

      <div className="pt-2">
        <button 
          onClick={() => onSelectGame('leaderboard')}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 rounded-2xl font-black text-sm transition shadow-lg cursor-pointer inline-flex items-center gap-2"
        >
          🏆 Global Liderlik Tablosunu Görüntüle
        </button>
      </div>
    </div>
  );
}

function GameCard({ title, desc, onClick, color }: { title: string; desc: string; onClick: () => void; color: string }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-slate-900 border rounded-2xl p-6 text-left space-y-4 hover:scale-105 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between ${color}`}
    >
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      </div>
      <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">Oynamaya Başla →</span>
    </div>
  );
}

// Ortak Yorum Bileşeni
function GameReviews({ gameKey }: { gameKey: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    const saved = localStorage.getItem(`reviews_${gameKey}`);
    if (saved) {
      try {
        setReviews(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initialReviews: Review[] = [
        { id: '1', author: 'RetroSever', rating: 5, comment: 'Harika bir nostalji köşesi olmuş!', date: '05.09.2026' }
      ];
      setReviews(initialReviews);
      localStorage.setItem(`reviews_${gameKey}`, JSON.stringify(initialReviews));
    }
  }, [gameKey]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;

    const newReview: Review = {
      id: Date.now().toString(),
      author: author.trim(),
      rating,
      comment: comment.trim(),
      date: new Date().toLocaleDateString('tr-TR')
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem(`reviews_${gameKey}`, JSON.stringify(updated));

    setAuthor('');
    setComment('');
    setRating(5);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '5.0';

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-left shadow-xl mt-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h4 className="text-lg font-bold text-white">Oyuncu Yorumları & Puanlar</h4>
          <p className="text-xs text-slate-400">Bu oyun için toplam {reviews.length} değerlendirme yapıldı.</p>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
          <span className="text-amber-400 font-bold">★ {averageRating}</span>
          <span className="text-xs text-slate-500">/ 5.0</span>
        </div>
      </div>

      <form onSubmit={handleAddReview} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
        <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Sen De Yorum Yap</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input 
            type="text" 
            placeholder="Adın / Rumuzun" 
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            required
          />
          <select 
            value={rating} 
            onChange={(e) => setRating(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value={5}>⭐⭐⭐⭐⭐ Mükemmel (5/5)</option>
            <option value={4}>⭐⭐⭐⭐ Çok İyi (4/5)</option>
            <option value={3}>⭐⭐⭐ Orta (3/5)</option>
            <option value={2}>⭐⭐ Geliştirilmeli (2/5)</option>
            <option value={1}>⭐ Kötü (1/5)</option>
          </select>
        </div>
        <textarea 
          placeholder="Oyun hakkında düşüncelerini yaz..." 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
          required
        />
        <button 
          type="submit"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer"
        >
          Yorumu Gönder
        </button>
      </form>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{rev.author}</span>
                <div className="flex items-center gap-1">
                  <span className="text-amber-400">{'★'.repeat(rev.rating)}</span>
                  <span className="text-slate-600">{'★'.repeat(5 - rev.rating)}</span>
                  <span className="text-slate-500 ml-2">{rev.date}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 2. Flappy Bird (Mobil Dokunmatik Kontrollü)
function FlappyBirdGame({ onBack, onScore }: { onBack: () => void; onScore: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('flappy_highscore');
    if (saved) setHighScore(Number(saved));
  }, []);

  const jumpAction = useCallback((jumpFn: () => void) => {
    jumpFn();
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let birdY = 150;
    let birdVelocity = 0;
    const gravity = 0.35;
    const jumpStrength = -6.5;
    const birdX = 50;
    const birdRadius = 14;

    let pipes: { x: number; topHeight: number; bottomY: number; passed: boolean }[] = [];
    let pipeWidth = 52;
    let pipeGap = 120;
    let frameCount = 0;
    let currentScore = 0;
    let animationId: number;

    const doJump = () => {
      birdVelocity = jumpStrength;
    };

    // Global zıplama tetikleyicisini dışarı bağla
    (window as any).flappyJump = doJump;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        doJump();
      }
    };

    const handleClick = () => {
      doJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleClick);

    const loop = () => {
      frameCount++;
      birdVelocity += gravity;
      birdY += birdVelocity;

      if (frameCount % 90 === 0) {
        const minHeight = 50;
        const maxHeight = canvas.height - pipeGap - 50;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        pipes.push({
          x: canvas.width,
          topHeight,
          bottomY: topHeight + pipeGap,
          passed: false
        });
      }

      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= 2.5;

        if (!pipes[i].passed && pipes[i].x + pipeWidth < birdX) {
          pipes[i].passed = true;
          currentScore += 1;
          setScore(currentScore);
        }

        if (pipes[i].x + pipeWidth < 0) {
          pipes.splice(i, 1);
        }
      }

      if (birdY + birdRadius >= canvas.height - 30 || birdY - birdRadius <= 0) {
        endGame(currentScore);
        return;
      }

      for (let pipe of pipes) {
        if (
          birdX + birdRadius > pipe.x &&
          birdX - birdRadius < pipe.x + pipeWidth &&
          (birdY - birdRadius < pipe.topHeight || birdY + birdRadius > pipe.bottomY)
        ) {
          endGame(currentScore);
          return;
        }
      }

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#22c55e';
      for (let pipe of pipes) {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
      }

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, canvas.height - 30, canvas.width, 30);

      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(birdX, birdY, birdRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(birdX + 4, birdY - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(birdX + 5, birdY - 4, 1.5, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    const endGame = (finalScore: number) => {
      setIsPlaying(false);
      setIsGameOver(true);
      onScore(finalScore);
      setHighScore(prev => {
        const newMax = Math.max(prev, finalScore);
        localStorage.setItem('flappy_highscore', newMax.toString());
        return newMax;
      });
    };

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleClick);
      delete (window as any).flappyJump;
    };
  }, [isPlaying, onScore]);

  const triggerJump = () => {
    if ((window as any).flappyJump) {
      (window as any).flappyJump();
    }
  };

  return (
    <div className="space-y-4 text-center w-full max-w-md pb-12">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="text-sm text-cyan-400 hover:underline cursor-pointer">← Menüye Dön</button>
        <h3 className="text-xl font-bold">Flappy Bird 🐥</h3>
        <div className="text-sm font-bold text-amber-400">Rekor: {highScore}</div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col items-center">
        <div className="relative rounded-lg overflow-hidden border border-slate-800 shadow-inner">
          <canvas 
            ref={canvasRef} 
            width={320} 
            height={380} 
            className="bg-slate-950 cursor-pointer block"
          />

          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10">
              <p className="text-slate-300 text-xs px-6 text-center">Boşluk tuşuna, ekrana veya alttaki zıpla butonuna basarak kuşu uçur!</p>
              <button 
                onClick={startGame}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold transition shadow-lg cursor-pointer text-sm"
              >
                Oyunu Başlat
              </button>
            </div>
          )}

          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10">
              <p className="text-pink-500 font-extrabold text-lg">Oyun Bitti! 😢</p>
              <div className="text-sm text-slate-300 space-y-1">
                <p>Skorun: <span className="font-bold text-amber-400">{score}</span></p>
                <p>En Yüksek: <span className="font-bold text-emerald-400">{highScore}</span></p>
              </div>
              <button 
                onClick={startGame}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition shadow-lg cursor-pointer text-sm"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>

        {/* Flappy İçin Dokunmatik Zıpla Butonu */}
        {isPlaying && (
          <button 
            onClick={triggerJump}
            className="w-full mt-3 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-sm transition shadow-lg active:scale-95 cursor-pointer"
          >
            🚀 ZIPLA!
          </button>
        )}

        <p className="text-xs text-slate-500 mt-3">Kontrol: Bilgisayarda <b>Space</b>, mobilde ekrandaki ZIPLA butonu.</p>
      </div>

      <GameReviews gameKey="flappy" />
    </div>
  );
}

// 3. Yılan Oyunu (Mobil D-Pad Dokunmatik Kontrollü)
const GRID_SIZE = 20;

function SnakeGame({ onBack, onScore }: { onBack: () => void; onScore: (score: number) => void }) {
  const [snake, setSnake] = useState([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [dir, setDir] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Yön değiştirme fonksiyonu ref veya state ile güvenli çalışması için:
  const changeDirection = useCallback((newDir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    setDir(prevDir => {
      if (newDir === 'UP' && prevDir === 'DOWN') return prevDir;
      if (newDir === 'DOWN' && prevDir === 'UP') return prevDir;
      if (newDir === 'LEFT' && prevDir === 'RIGHT') return prevDir;
      if (newDir === 'RIGHT' && prevDir === 'LEFT') return prevDir;
      return newDir;
    });
  }, []);

  const spawnFood = useCallback(() => {
    let newFood: { x: number; y: number };
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const collision = snake.some(part => part.x === newFood.x && part.y === newFood.y);
      if (!collision) break;
    }
    return newFood;
  }, [snake]);

  const startGame = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ]);
    setDir('UP');
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    setFood({ x: 5, y: 5 });
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!isPlaying) return;

      if (e.key === 'ArrowUp') changeDirection('UP');
      if (e.key === 'ArrowDown') changeDirection('DOWN');
      if (e.key === 'ArrowLeft') changeDirection('LEFT');
      if (e.key === 'ArrowRight') changeDirection('RIGHT');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, changeDirection]);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };

        if (dir === 'UP') head.y -= 1;
        if (dir === 'DOWN') head.y += 1;
        if (dir === 'LEFT') head.x -= 1;
        if (dir === 'RIGHT') head.x += 1;

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          setIsPlaying(false);
          onScore(score);
          return prevSnake;
        }

        if (prevSnake.some(part => part.x === head.x && part.y === head.y)) {
          setIsGameOver(true);
          setIsPlaying(false);
          onScore(score);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        if (head.x === food.x && head.y === food.y) {
          const updatedScore = score + 10;
          setScore(updatedScore);
          setFood(spawnFood());
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, dir, food, spawnFood, score, onScore]);

  return (
    <div className="space-y-4 text-center w-full max-w-md pb-12">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="text-sm text-cyan-400 hover:underline cursor-pointer">← Menüye Dön</button>
        <h3 className="text-xl font-bold">Yılan Oyunu 🐍</h3>
        <div className="text-sm font-bold text-emerald-400">Skor: {score}</div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col items-center">
        <div 
          className="relative bg-slate-950 border border-slate-800 rounded-lg grid focus:outline-none focus:border-cyan-500"
          style={{
            width: '280px',
            height: '280px',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          }}
          tabIndex={0}
          autoFocus
        >
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-3">
              <p className="text-slate-300 text-xs px-4">Yön tuşlarıyla ya da aşağıdaki ekrandan yönet!</p>
              <button 
                onClick={startGame}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg cursor-pointer text-sm"
              >
                Oyunu Başlat
              </button>
            </div>
          )}

          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-3">
              <p className="text-pink-500 font-extrabold text-lg">Oyun Bitti! 😢</p>
              <p className="text-slate-300 text-sm">Toplam Skorun: {score}</p>
              <button 
                onClick={startGame}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition shadow-lg cursor-pointer text-sm"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);

            const isSnakeHead = snake[0].x === x && snake[0].y === y;
            const isSnakeBody = snake.slice(1).some(part => part.x === x && part.y === y);
            const isFood = food.x === x && food.y === y;

            let bgClass = 'bg-transparent';
            if (isSnakeHead) bgClass = 'bg-emerald-400 rounded-sm shadow-sm';
            else if (isSnakeBody) bgClass = 'bg-emerald-600 rounded-xs';
            else if (isFood) bgClass = 'bg-pink-500 rounded-full animate-pulse shadow-md';

            return <div key={index} className={`${bgClass} transition-colors duration-75`} />;
          })}
        </div>

        {/* Mobil D-Pad Yön Tuşları */}
        {isPlaying && (
          <div className="mt-4 grid grid-cols-3 gap-2 w-48 mx-auto">
            <div />
            <button 
              onClick={() => changeDirection('UP')}
              className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-md cursor-pointer"
            >
              ⬆️
            </button>
            <div />
            <button 
              onClick={() => changeDirection('LEFT')}
              className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-md cursor-pointer"
            >
              ⬅️
            </button>
            <button 
              onClick={() => changeDirection('DOWN')}
              className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-md cursor-pointer"
            >
              ⬇️
            </button>
            <button 
              onClick={() => changeDirection('RIGHT')}
              className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-md cursor-pointer"
            >
              ➡️
            </button>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-3">Kontrol: Bilgisayarda ok tuşları, mobilde ekrandaki yön tuşları.</p>
      </div>

      <GameReviews gameKey="snake" />
    </div>
  );
}

// 4. XOX Oyunu
function TicTacToeGame({ onBack, onWin }: { onBack: () => void; onWin: () => void }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const calculateWinner = (squares: any[]) => {
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every((square) => square !== null);

  useEffect(() => {
    if (winner === 'X') {
      onWin();
    }
  }, [winner, onWin]);

  useEffect(() => {
    if (!isPlayerTurn && !winner && !isDraw) {
      const timer = setTimeout(() => {
        const newBoard = board.slice();
        let moveIndex = -1;

        for (let i = 0; i < lines.length; i++) {
          const [a, b, c] = lines[i];
          const testBoard = [...newBoard];
          if (testBoard[a] === null && testBoard[b] === 'O' && testBoard[c] === 'O') { moveIndex = a; break; }
          if (testBoard[b] === null && testBoard[a] === 'O' && testBoard[c] === 'O') { moveIndex = b; break; }
          if (testBoard[c] === null && testBoard[a] === 'O' && testBoard[b] === 'O') { moveIndex = c; break; }
        }

        if (moveIndex === -1) {
          for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            const testBoard = [...newBoard];
            if (testBoard[a] === null && testBoard[b] === 'X' && testBoard[c] === 'X') { moveIndex = a; break; }
            if (testBoard[b] === null && testBoard[a] === 'X' && testBoard[c] === 'X') { moveIndex = b; break; }
            if (testBoard[c] === null && testBoard[a] === 'X' && testBoard[b] === 'X') { moveIndex = c; break; }
          }
        }

        if (moveIndex === -1 && newBoard[4] === null) moveIndex = 4;

        if (moveIndex === -1) {
          const emptyIndices = newBoard
            .map((val, idx) => (val === null ? idx : null))
            .filter((val) => val !== null) as number[];

          if (emptyIndices.length > 0) {
            moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          }
        }

        if (moveIndex !== -1) {
          newBoard[moveIndex] = 'O';
          setBoard(newBoard);
          setIsPlayerTurn(true);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, board, winner, isDraw]);

  const handleClick = (index: number) => {
    if (!isPlayerTurn || board[index] || winner) return;

    const newBoard = board.slice();
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);
  };

  const status = winner 
    ? (winner === 'X' ? 'Tebrikler, Kazandın! 🎉' : 'Yapay Zeka Kazandı! 🤖') 
    : isDraw 
    ? 'Berabere! 🤝' 
    : (isPlayerTurn ? 'Sıra Sende (X)' : 'Yapay Zeka düşünüyor... (O)');

  return (
    <div className="space-y-6 text-center w-full max-w-sm pb-12">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="text-sm text-cyan-400 hover:underline cursor-pointer">← Menüye Dön</button>
        <h3 className="text-xl font-bold">XOX (Zeki AI)</h3>
        <div className="w-16" />
      </div>

      <div className="space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <p className={`text-base font-semibold ${winner === 'X' ? 'text-emerald-400' : winner === 'O' ? 'text-pink-500' : 'text-cyan-400'}`}>
          {status}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleClick(index)}
              className="h-20 bg-slate-950 border border-slate-800 rounded-xl text-3xl font-black text-white hover:border-cyan-500 transition flex items-center justify-center cursor-pointer shadow-inner"
            >
              <span className={cell === 'X' ? 'text-cyan-400' : 'text-pink-500'}>{cell}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => { setBoard(Array(9).fill(null)); setIsPlayerTurn(true); }}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition cursor-pointer"
        >
          Yeniden Başlat
        </button>
      </div>

      <GameReviews gameKey="tictactoe" />
    </div>
  );
}

// 5. Taş Kağıt Makas
function RpsGame({ onBack, onWin }: { onBack: () => void; onWin: (score: number) => void }) {
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [computerChoice, setComputerChoice] = useState<string | null>(null);
  const [result, setResult] = useState<string>('Seçimini yap ve şansını dene!');
  
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);

  const choices = ['Taş 🪨', 'Kağıt 📄', 'Makas ✂️'];

  const playGame = (choice: string) => {
    setPlayerChoice(choice);
    const comp = choices[Math.floor(Math.random() * choices.length)];
    setComputerChoice(comp);

    if (choice === comp) {
      setResult('Berabere! 🤝');
    } else if (
      (choice.includes('Taş') && comp.includes('Makas')) ||
      (choice.includes('Kağıt') && comp.includes('Taş')) ||
      (choice.includes('Makas') && comp.includes('Kağıt'))
    ) {
      setResult('Tebrikler, Bu Turu Kazandın! 🎉');
      // Skorun ve fonksiyonun güncel değerle tetiklenmesini garanti altına alıyoruz
      setPlayerScore(prev => {
        const updatedScore = prev + 1;
        onWin(updatedScore); // Dıştaki skor tablosuna da anında gönderiliyor
        return updatedScore;
      });
    } else {
      setResult('Bilgisayar Bu Turu Kazandı! 😢');
      setComputerScore(prev => prev + 1);
    }
  };

  const resetScores = () => {
    setPlayerScore(0);
    setComputerScore(0);
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult('Seçimini yap ve şansını dene!');
  };

  return (
    <div className="space-y-6 text-center w-full max-w-md pb-12">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="text-sm text-cyan-400 hover:underline cursor-pointer">← Menüye Dön</button>
        <h3 className="text-xl font-bold">Taş Kağıt Makas</h3>
        <div className="w-16" />
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-xl">
        <div className="flex justify-around items-center bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-sm">
          <div className="text-cyan-400 font-bold">Sen: {playerScore}</div>
          <div className="text-slate-500 text-xs uppercase tracking-wider">Skor</div>
          <div className="text-pink-500 font-bold">Bot: {computerScore}</div>
        </div>

        <p className="text-base font-bold text-slate-200 min-h-[28px] flex items-center justify-center">{result}</p>
        
        <div className="flex justify-around text-sm text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800/60">
          <div>Senin Seçimin: <span className="text-white font-bold block mt-1">{playerChoice || '-'}</span></div>
          <div className="border-r border-slate-800" />
          <div>Bilgisayar: <span className="text-white font-bold block mt-1">{computerChoice || '-'}</span></div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {choices.map((c) => (
            <button
              key={c}
              onClick={() => playGame(c)}
              className="py-3 bg-slate-800 hover:bg-cyan-600 hover:text-white rounded-xl font-medium transition cursor-pointer text-sm shadow-md"
            >
              {c}
            </button>
          ))}
        </div>

        <button
          onClick={resetScores}
          className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition border border-slate-800 cursor-pointer"
        >
          Skorları Sıfırla
        </button>
      </div>

      <GameReviews gameKey="rps" />
    </div>
  );
}