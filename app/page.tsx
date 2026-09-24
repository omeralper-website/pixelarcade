"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  Trophy, Play, Pause, RotateCcw, Volume2, VolumeX, 
  Gamepad2, Info, Zap
} from 'lucide-react';

export default function FootballGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [matchTime, setMatchTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [power, setPower] = useState(0);
  const [commentary, setCommentary] = useState("Maç başlamak üzere! 'Başlat' butonuna basın.");

  const playSound = (type: 'whistle' | 'kick' | 'goal' | 'tackle') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'whistle') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'kick') {
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'goal') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } else if (type === 'tackle') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isPoweringUp = false;
    let powerValue = 0;
    let passCooldown = 0;

    const keys: { [key: string]: boolean } = {};

    const field = {
      width: 1000,
      height: 600,
      padding: 50,
    };

    const ball = {
      x: field.width / 2,
      y: field.height / 2,
      vx: 0,
      vy: 0,
      radius: 8,
      friction: 0.985,
      owner: null as any,
      passTarget: null as any, // Pas verilen hedef oyuncu
    };

    interface Player {
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: 14;
      speed: number;
      team: 'home' | 'away';
      isUser?: boolean;
      role: 'GK' | 'DEF' | 'MID' | 'ATT';
      lastMoveDir: { x: number; y: number };
    }

    const players: Player[] = [
      // Mavi Takım (Biz)
      { id: 1, x: 100, y: 300, vx: 0, vy: 0, radius: 14, speed: 4.0, team: 'home', role: 'GK', lastMoveDir: { x: 1, y: 0 } },
      { id: 2, x: 300, y: 180, vx: 0, vy: 0, radius: 14, speed: 4.1, team: 'home', role: 'DEF', lastMoveDir: { x: 1, y: 0 } },
      { id: 3, x: 300, y: 420, vx: 0, vy: 0, radius: 14, speed: 4.1, team: 'home', role: 'DEF', lastMoveDir: { x: 1, y: 0 } },
      { id: 4, x: 480, y: 300, vx: 0, vy: 0, radius: 14, speed: 4.5, team: 'home', isUser: true, role: 'ATT', lastMoveDir: { x: 1, y: 0 } },

      // Kırmızı Takım (Rakip)
      { id: 5, x: 900, y: 300, vx: 0, vy: 0, radius: 14, speed: 3.2, team: 'away', role: 'GK', lastMoveDir: { x: -1, y: 0 } },
      { id: 6, x: 700, y: 180, vx: 0, vy: 0, radius: 14, speed: 3.3, team: 'away', role: 'DEF', lastMoveDir: { x: -1, y: 0 } },
      { id: 7, x: 700, y: 420, vx: 0, vy: 0, radius: 14, speed: 3.3, team: 'away', role: 'DEF', lastMoveDir: { x: -1, y: 0 } },
      { id: 8, x: 550, y: 300, vx: 0, vy: 0, radius: 14, speed: 3.5, team: 'away', role: 'ATT', lastMoveDir: { x: -1, y: 0 } },
    ];

    const getUserPlayer = () => players.find(p => p.isUser) || players[3];

    // Kontrolü Mavi Takımda Topu Alan Oyuncuya Ver
    const switchUserControlTo = (newPlayer: Player) => {
      if (newPlayer.team !== 'home' || newPlayer.role === 'GK') return;
      players.forEach(p => (p.isUser = false));
      newPlayer.isUser = true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      const userPlayer = getUserPlayer();

      if (e.code === 'Space' && ball.owner === userPlayer) {
        isPoweringUp = true;
      }

      // Top Kapma (E)
      if (e.key.toLowerCase() === 'e') {
        let tackled = false;
        players.forEach(p => {
          if (p.team === 'away' && ball.owner === p) {
            const dist = Math.hypot(userPlayer.x - p.x, userPlayer.y - p.y);
            if (dist < 45) {
              ball.owner = userPlayer;
              ball.passTarget = null;
              playSound('tackle');
              setCommentary("Harika müdahale! Topu kaptın!");
              tackled = true;
            }
          }
        });
        if (!tackled && ball.owner === null) {
          const distToBall = Math.hypot(userPlayer.x - ball.x, userPlayer.y - ball.y);
          if (distToBall < 40) {
            ball.owner = userPlayer;
            ball.passTarget = null;
            playSound('tackle');
          }
        }
      }

      // Pas (K) - Doğrudan Arkadaşa Gidecek
      if (e.key.toLowerCase() === 'k' && ball.owner === userPlayer) {
        const teammates = players.filter(p => p.team === 'home' && p.id !== userPlayer.id && p.role !== 'GK');
        let bestTarget = teammates[0];
        let maxDist = -1;

        teammates.forEach(t => {
          const d = Math.hypot(t.x - userPlayer.x, t.y - userPlayer.y);
          if (d > maxDist) {
            maxDist = d;
            bestTarget = t;
          }
        });

        if (bestTarget) {
          ball.owner = null;
          ball.passTarget = bestTarget; // Pas hedefini kaydet
          passCooldown = 15;
          playSound('kick');
          setCommentary("Şık bir pas gönderildi!");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
      const userPlayer = getUserPlayer();

      if (e.code === 'Space' && ball.owner === userPlayer) {
        isPoweringUp = false;
        const shootPower = Math.max(10, (powerValue / 100) * 18);
        
        // Şut Düzeltmesi: Daima Rakip Kalenin Ortasına Doğru
        const targetX = field.width - field.padding;
        const targetY = field.height / 2;
        const angle = Math.atan2(targetY - userPlayer.y, targetX - userPlayer.x);

        ball.owner = null;
        ball.passTarget = null;
        passCooldown = 20;
        ball.vx = Math.cos(angle) * shootPower;
        ball.vy = Math.sin(angle) * shootPower;
        playSound('kick');
        setCommentary("Sert bir şut!");
        powerValue = 0;
        setPower(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const drawField = () => {
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(0, 0, field.width, field.height);

      ctx.fillStyle = '#338a37';
      for (let i = 0; i < field.width; i += 80) {
        if ((i / 80) % 2 === 0) ctx.fillRect(i, 0, 80, field.height);
      }

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;

      const p = field.padding;
      const w = field.width - p * 2;
      const h = field.height - p * 2;
      ctx.strokeRect(p, p, w, h);

      ctx.beginPath();
      ctx.moveTo(field.width / 2, p);
      ctx.lineTo(field.width / 2, field.height - p);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(field.width / 2, field.height / 2, 70, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeRect(p, field.height / 2 - 120, 130, 240);
      ctx.strokeRect(field.width - p - 130, field.height / 2 - 120, 130, 240);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(p - 25, field.height / 2 - 60, 25, 120);
      ctx.strokeRect(p - 25, field.height / 2 - 60, 25, 120);
      ctx.fillRect(field.width - p, field.height / 2 - 60, 25, 120);
      ctx.strokeRect(field.width - p, field.height / 2 - 60, 25, 120);
    };

    const resetPositions = () => {
      ball.x = field.width / 2;
      ball.y = field.height / 2;
      ball.vx = 0;
      ball.vy = 0;
      ball.owner = null;
      ball.passTarget = null;
      passCooldown = 0;

      players[0].x = 100; players[0].y = 300;
      players[1].x = 300; players[1].y = 180;
      players[2].x = 300; players[2].y = 420;
      players[3].x = 480; players[3].y = 300;

      players[4].x = 900; players[4].y = 300;
      players[5].x = 700; players[5].y = 180;
      players[6].x = 700; players[6].y = 420;
      players[7].x = 550; players[7].y = 300;

      switchUserControlTo(players[3]);
    };

    const update = () => {
      if (!isPlaying) return;

      const userPlayer = getUserPlayer();
      if (passCooldown > 0) passCooldown--;

      if (isPoweringUp) {
        powerValue = Math.min(100, powerValue + 3.5);
        setPower(powerValue);
      }

      // Kullanıcı Hareketi
      let moveX = 0;
      let moveY = 0;
      if (keys['w'] || keys['arrowup']) moveY -= 1;
      if (keys['s'] || keys['arrowdown']) moveY += 1;
      if (keys['a'] || keys['arrowleft']) moveX -= 1;
      if (keys['d'] || keys['arrowright']) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        userPlayer.lastMoveDir = { x: moveX, y: moveY };
        const len = Math.hypot(moveX, moveY);
        userPlayer.x += (moveX / len) * userPlayer.speed;
        userPlayer.y += (moveY / len) * userPlayer.speed;
      }

      // AI Davranışları ve Pozisyon Güncellemeleri
      players.forEach(p => {
        if (p.isUser) return;

        let targetX = p.x;
        let targetY = p.y;

        // KALECİLER MANTIĞI
        if (p.role === 'GK') {
          if (ball.owner === p) {
            const teammates = players.filter(t => t.team === p.team && t.role !== 'GK');
            let closestTeammate = teammates[0];
            let minDist = Infinity;

            teammates.forEach(t => {
              const d = Math.hypot(t.x - p.x, t.y - p.y);
              if (d < minDist) {
                minDist = d;
                closestTeammate = t;
              }
            });

            if (closestTeammate) {
              ball.owner = null;
              ball.passTarget = closestTeammate;
              passCooldown = 20;
              playSound('kick');

              if (p.team === 'home') {
                setCommentary("Kalecin topu en yakındaki takım arkadaşına aktardı!");
              } else {
                setCommentary("Rakip kaleci pasla oyunu başlattı.");
              }
            }
          } else {
            targetY = Math.max(field.height / 2 - 45, Math.min(field.height / 2 + 45, ball.y));
            targetX = p.team === 'home' ? field.padding + 30 : field.width - field.padding - 30;
          }
        } 
        // TAKIM ARKADAŞLARI
        else if (p.team === 'home') {
          if (ball.owner === p) {
            targetX = field.width - field.padding - 40;
            targetY = field.height / 2;

            const distToGoal = Math.hypot(p.x - (field.width - field.padding), p.y - (field.height / 2));
            if (distToGoal < 300) {
              ball.owner = null;
              ball.passTarget = null;
              passCooldown = 20;
              const angle = Math.atan2((field.height / 2) - p.y, (field.width - field.padding) - p.x);
              ball.vx = Math.cos(angle) * 15;
              ball.vy = Math.sin(angle) * 15;
              playSound('kick');
              setCommentary("Takım arkadaşın kaleye vurdu!");
            }
          } else if (ball.owner === userPlayer) {
            targetX = Math.min(field.width - 150, userPlayer.x + 160);
            targetY = p.id === 2 ? 160 : 440;
          } else {
            targetX = ball.x;
            targetY = ball.y;

            if (ball.owner && ball.owner.team === 'away') {
              const distToEnemy = Math.hypot(p.x - ball.owner.x, p.y - ball.owner.y);
              if (distToEnemy < 25 && Math.random() < 0.08) {
                ball.owner = p;
                ball.passTarget = null;
                switchUserControlTo(p);
                playSound('tackle');
                setCommentary("Takım arkadaşın topu söktü aldı!");
              }
            }
          }
        } 
        // RAKİP TAKIM
        else if (p.team === 'away') {
          if (ball.owner === p) {
            targetX = field.padding + 40;
            targetY = field.height / 2;

            const distToGoal = Math.hypot(p.x - field.padding, p.y - (field.height / 2));
            if (distToGoal < 320 && Math.random() < 0.03) {
              ball.owner = null;
              ball.passTarget = null;
              passCooldown = 20;
              const angle = Math.atan2((field.height / 2) - p.y, field.padding - p.x);
              ball.vx = Math.cos(angle) * 13;
              ball.vy = Math.sin(angle) * 13;
              playSound('kick');
              setCommentary("Rakip kaleyi karşıdan gördü ve vurdu!");
            }
          } else {
            targetX = ball.x;
            targetY = ball.y;

            if (ball.owner && ball.owner.team === 'home') {
              const distToHome = Math.hypot(p.x - ball.owner.x, p.y - ball.owner.y);
              if (distToHome < 22 && Math.random() < 0.03) {
                ball.owner = p;
                ball.passTarget = null;
                playSound('tackle');
                setCommentary("Rakip topa müdahale etti.");
              }
            }
          }
        }

        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 4) {
          p.x += (dx / dist) * p.speed * 0.85;
          p.y += (dy / dist) * p.speed * 0.85;
          p.lastMoveDir = { x: dx / dist, y: dy / dist };
        }
      });

      // Saha Sınırları
      players.forEach(p => {
        p.x = Math.max(field.padding + p.radius + 5, Math.min(field.width - field.padding - p.radius - 5, p.x));
        p.y = Math.max(field.padding + p.radius + 5, Math.min(field.height - field.padding - p.radius - 5, p.y));
      });

      // Top Fiziği & Pas Takibi
      if (ball.owner) {
        const p = ball.owner;
        const angle = Math.atan2(p.lastMoveDir.y, p.lastMoveDir.x);
        ball.x = p.x + Math.cos(angle) * 16;
        ball.y = p.y + Math.sin(angle) * 16;
        ball.vx = 0;
        ball.vy = 0;
      } else if (ball.passTarget) {
        // Pas verilmişse top direkt olarak hedefe doğru ideal hızda yönlenir
        const dx = ball.passTarget.x - ball.x;
        const dy = ball.passTarget.y - ball.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 15) {
          ball.owner = ball.passTarget;
          if (ball.passTarget.team === 'home' && ball.passTarget.role !== 'GK') {
            switchUserControlTo(ball.passTarget);
          }
          ball.passTarget = null;
        } else {
          const passSpeed = 8; // İdeal pas hızı
          ball.x += (dx / dist) * passSpeed;
          ball.y += (dy / dist) * passSpeed;
        }
      } else {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= ball.friction;
        ball.vy *= ball.friction;

        if (passCooldown === 0) {
          players.forEach(p => {
            const dist = Math.hypot(p.x - ball.x, p.y - ball.y);
            if (dist < p.radius + ball.radius + 5) {
              ball.owner = p;
              if (p.team === 'home' && p.role !== 'GK') switchUserControlTo(p);
            }
          });
        }
      }

      // Duvar Yansımaları
      const p = field.padding;
      if (ball.y - ball.radius <= p || ball.y + ball.radius >= field.height - p) {
        ball.vy *= -0.7;
        ball.y = ball.y - ball.radius <= p ? p + ball.radius : field.height - p - ball.radius;
      }

      const isGoalY = ball.y > field.height / 2 - 60 && ball.y < field.height / 2 + 60;
      if (!isGoalY) {
        if (ball.x - ball.radius <= p || ball.x + ball.radius >= field.width - p) {
          ball.vx *= -0.7;
          ball.x = ball.x - ball.radius <= p ? p + ball.radius : field.width - p - ball.radius;
        }
      }

      // Gol Kontrolleri
      if (ball.x > field.width - p + 5 && isGoalY) {
        setScore(prev => ({ ...prev, home: prev.home + 1 }));
        playSound('goal');
        setCommentary("GOOOOLLLL! Mükemmel bir gol!");
        resetPositions();
      }

      if (ball.x < p - 5 && isGoalY) {
        setScore(prev => ({ ...prev, away: prev.away + 1 }));
        playSound('goal');
        setCommentary("GOL! Top ağlarımızda...");
        resetPositions();
      }

      drawField();

      // Top Çizimi
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Oyuncu Çizimleri
      players.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.team === 'home' ? '#1e88e5' : '#e53935';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (p.isUser) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#fbc02d';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.role, p.x, p.y + 4);
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isMuted]);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setMatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 font-sans selection:bg-none">
      <div className="w-full max-w-[1000px] bg-slate-800 rounded-t-xl p-4 flex items-center justify-between border-b border-slate-700 shadow-lg">
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-400 w-7 h-7" />
          <span className="font-bold text-xl tracking-wider">NEXT.JS CANVAS FOOTBALL</span>
        </div>

        <div className="flex items-center gap-6 bg-slate-900 px-6 py-2 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="font-semibold text-lg">MAVİ</span>
          </div>
          <span className="text-3xl font-black text-yellow-400">{score.home} - {score.away}</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">KIRMIZI</span>
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">MAÇ SÜRESİ</div>
            <div className="font-mono text-xl font-bold text-emerald-400">
              {Math.floor(matchTime / 60).toString().padStart(2, '0')}:{(matchTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      <div className="relative border-4 border-slate-800 rounded-b-xl overflow-hidden shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="block cursor-crosshair"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              SAHAYA ÇIKMAYA HAZIR MISIN?
            </h1>
            <p className="text-slate-300 max-w-md text-center text-sm">
              Sarı halkalı oyuncuyu sen yönetiyorsun. Pas attığında veya arkadaşın topu kaptığında kontrol otomatik olarak ona geçer!
            </p>
            <button
              onClick={() => {
                setIsPlaying(true);
                playSound('whistle');
              }}
              className="mt-2 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 transition transform"
            >
              <Play className="fill-current w-5 h-5" /> Maçı Başlat
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-[1000px] mt-3 bg-slate-800 rounded-lg p-3 flex items-center gap-4 border border-slate-700">
        <div className="flex items-center gap-2 text-xs font-bold text-yellow-400">
          <Zap className="w-4 h-4" /> ŞUT GÜCÜ:
        </div>
        <div className="flex-1 bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-700">
          <div
            className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 h-full transition-all duration-75"
            style={{ width: `${power}%` }}
          />
        </div>
        <span className="text-xs font-mono text-slate-400 w-10 text-right">%{Math.round(power)}</span>
      </div>

      <div className="w-full max-w-[1000px] mt-2 bg-slate-800/60 rounded-lg p-2.5 text-center text-sm text-emerald-300 border border-slate-700/50 font-medium">
        🎙️ {commentary}
      </div>

      <div className="w-full max-w-[1000px] mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-400">
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-blue-400 shrink-0" />
          <span><b>WASD / Yön Tuşları:</b> Hareket Et</span>
        </div>
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400 shrink-0" />
          <span><b>SPACE (Basılı Tut):</b> Şut Çek</span>
        </div>
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-400 shrink-0" />
          <span><b>K Tuşu:</b> Takım Arkadaşına Pas At</span>
        </div>
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 flex items-center gap-2">
          <Info className="w-5 h-5 text-red-400 shrink-0" />
          <span><b>E Tuşu:</b> Top Kap / Müdahale Et</span>
        </div>
      </div>
    </div>
  );
}