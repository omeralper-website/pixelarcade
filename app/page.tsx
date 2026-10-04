"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  Trophy, Play, Pause, RotateCcw, Volume2, VolumeX, 
  Gamepad2, Info, Zap, ShieldAlert, Sparkles, Target, Activity
} from 'lucide-react';

export default function FootballGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<'match' | 'penalty' | 'practice'>('match');
  const [half, setHalf] = useState<1 | 2>(1);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [matchTime, setMatchTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [power, setPower] = useState(0);
  const [stamina, setStamina] = useState(100);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [commentary, setCommentary] = useState("Maça başlamak için mod seçip 'Başlat' butonuna basın.");
  const [goalBanner, setGoalBanner] = useState(false);

  // Ses Sentezleyicisi (Web Audio API)
  const playSound = (type: 'whistle' | 'kick' | 'goal' | 'tackle' | 'post' | 'foul') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'whistle' || type === 'foul') {
        osc.frequency.setValueAtTime(type === 'foul' ? 900 : 800, ctx.currentTime);
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
      } else if (type === 'post') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'goal') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(650, ctx.currentTime + 0.7);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);
        osc.start();
        osc.stop(ctx.currentTime + 0.9);
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
    let staminaValue = 100;

    // Konfeti parçacıkları
    const confettis: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number }> = [];

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
      passTarget: null as any,
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
      yellowCards: number;
    }

    const players: Player[] = [
      // Mavi Takım
      { id: 1, x: 100, y: 300, vx: 0, vy: 0, radius: 14, speed: 4.0, team: 'home', role: 'GK', lastMoveDir: { x: 1, y: 0 }, yellowCards: 0 },
      { id: 2, x: 300, y: 180, vx: 0, vy: 0, radius: 14, speed: 4.2, team: 'home', role: 'DEF', lastMoveDir: { x: 1, y: 0 }, yellowCards: 0 },
      { id: 3, x: 300, y: 420, vx: 0, vy: 0, radius: 14, speed: 4.2, team: 'home', role: 'DEF', lastMoveDir: { x: 1, y: 0 }, yellowCards: 0 },
      { id: 4, x: 480, y: 300, vx: 0, vy: 0, radius: 14, speed: 4.6, team: 'home', isUser: true, role: 'ATT', lastMoveDir: { x: 1, y: 0 }, yellowCards: 0 },

      // Kırmızı Takım
      { id: 5, x: 900, y: 300, vx: 0, vy: 0, radius: 14, speed: 3.2, team: 'away', role: 'GK', lastMoveDir: { x: -1, y: 0 }, yellowCards: 0 },
      { id: 6, x: 700, y: 180, vx: 0, vy: 0, radius: 14, speed: 3.3, team: 'away', role: 'DEF', lastMoveDir: { x: -1, y: 0 }, yellowCards: 0 },
      { id: 7, x: 700, y: 420, vx: 0, vy: 0, radius: 14, speed: 3.3, team: 'away', role: 'DEF', lastMoveDir: { x: -1, y: 0 }, yellowCards: 0 },
      { id: 8, x: 550, y: 300, vx: 0, vy: 0, radius: 14, speed: 3.5, team: 'away', role: 'ATT', lastMoveDir: { x: -1, y: 0 }, yellowCards: 0 },
    ];

    const getUserPlayer = () => players.find(p => p.isUser) || players[3];

    const switchUserControlTo = (newPlayer: Player) => {
      if (newPlayer.team !== 'home' || newPlayer.role === 'GK') return;
      players.forEach(p => (p.isUser = false));
      newPlayer.isUser = true;
    };

    const triggerGoalCelebration = (teamName: string) => {
      setGoalBanner(true);
      playSound('goal');
      for (let i = 0; i < 80; i++) {
        confettis.push({
          x: field.width / 2,
          y: field.height / 2,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16,
          color: ['#fbc02d', '#e53935', '#1e88e5', '#4caf50', '#ab47bc'][Math.floor(Math.random() * 5)],
          size: Math.random() * 6 + 4
        });
      }
      setTimeout(() => setGoalBanner(false), 2000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === 'Shift') keys['shift'] = true;

      const userPlayer = getUserPlayer();

      if (e.code === 'Space' && ball.owner === userPlayer) {
        isPoweringUp = true;
      }

      // Müdahale & Faul Mekaniği (E)
      if (e.key.toLowerCase() === 'e') {
        let tackled = false;
        players.forEach(p => {
          if (p.team === 'away' && ball.owner === p) {
            const dist = Math.hypot(userPlayer.x - p.x, userPlayer.y - p.y);
            if (dist < 45) {
              // %25 İhtimalle Sert Müdahale & Faul
              if (Math.random() < 0.25) {
                playSound('foul');
                userPlayer.yellowCards += 1;
                if (userPlayer.yellowCards >= 2) {
                  setCommentary("🟥 KIRMIZI KART! Sert müdahale sonrası 2. Sarı karttan atıldın!");
                } else {
                  setCommentary("🟨 SARI KART & FAUL! Hakem dahi sert müdahaleyi affetmedi!");
                }
                // Serbest vuruş için pozisyon sıfırlama
                ball.owner = p;
                ball.vx = 0; ball.vy = 0;
              } else {
                ball.owner = userPlayer;
                ball.passTarget = null;
                playSound('tackle');
                setCommentary("Harika müdahale! Topu temiz bir şekilde söktün!");
              }
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

      // Pas (K)
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
          ball.passTarget = bestTarget;
          passCooldown = 15;
          playSound('kick');
          setCommentary("İsabetli harika bir pas!");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
      if (e.key === 'Shift') keys['shift'] = false;

      const userPlayer = getUserPlayer();

      if (e.code === 'Space' && ball.owner === userPlayer) {
        isPoweringUp = false;
        const roleBonus = userPlayer.role === 'ATT' ? 1.2 : 1.0;
        const shootPower = Math.max(10, (powerValue / 100) * 18 * roleBonus);
        
        // Kale Hedefi (Devreye Göre Yön Değişir)
        const targetX = half === 1 ? (field.width - field.padding) : field.padding;
        const targetY = field.height / 2;
        const angle = Math.atan2(targetY - userPlayer.y, targetX - userPlayer.x);

        ball.owner = null;
        ball.passTarget = null;
        passCooldown = 20;
        ball.vx = Math.cos(angle) * shootPower;
        ball.vy = Math.sin(angle) * shootPower;
        playSound('kick');
        setCommentary("Mükemmel bir şut!");
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

      // Ceza Sahaları
      ctx.strokeRect(p, field.height / 2 - 120, 130, 240);
      ctx.strokeRect(field.width - p - 130, field.height / 2 - 120, 130, 240);

      // Kaleler
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(p - 25, field.height / 2 - 60, 25, 120);
      ctx.strokeRect(p - 25, field.height / 2 - 60, 25, 120);
      ctx.fillRect(field.width - p, field.height / 2 - 60, 25, 120);
      ctx.strokeRect(field.width - p, field.height / 2 - 60, 25, 120);

      // Kale Direkleri Çizimi (Açık Beyaz Noktalar)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p, field.height / 2 - 60, 5, 0, Math.PI * 2);
      ctx.arc(p, field.height / 2 + 60, 5, 0, Math.PI * 2);
      ctx.arc(field.width - p, field.height / 2 - 60, 5, 0, Math.PI * 2);
      ctx.arc(field.width - p, field.height / 2 + 60, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    // Mini Harita (Radar)
    const drawRadar = () => {
      const rx = field.width - 160;
      const ry = field.height - 110;
      const rw = 150;
      const rh = 100;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);

      // Top Radarda
      const bx = rx + (ball.x / field.width) * rw;
      const by = ry + (ball.y / field.height) * rh;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();

      // Oyuncular Radarda
      players.forEach(p => {
        const px = rx + (p.x / field.width) * rw;
        const py = ry + (p.y / field.height) * rh;
        ctx.fillStyle = p.team === 'home' ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.arc(px, py, p.isUser ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
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

      // Stamina & Sprint Hesabı
      let currentSpeed = userPlayer.speed;
      if (keys['shift'] && staminaValue > 2) {
        currentSpeed *= 1.45;
        staminaValue = Math.max(0, staminaValue - 0.7);
      } else {
        staminaValue = Math.min(100, staminaValue + 0.3);
      }
      setStamina(staminaValue);

      // Zorluk Derecesi Ayarları
      const diffMultiplier = difficulty === 'easy' ? 0.7 : difficulty === 'medium' ? 0.85 : 1.05;
      const tackleChance = difficulty === 'easy' ? 0.015 : difficulty === 'medium' ? 0.03 : 0.06;
      const tackleDist = difficulty === 'hard' ? 28 : 22;

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
        userPlayer.x += (moveX / len) * currentSpeed;
        userPlayer.y += (moveY / len) * currentSpeed;
      }

      // AI Davranışları
      players.forEach(p => {
        if (p.isUser) return;

        let targetX = p.x;
        let targetY = p.y;

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
            }
          } else {
            targetY = Math.max(field.height / 2 - 45, Math.min(field.height / 2 + 45, ball.y));
            targetX = p.team === 'home' ? field.padding + 30 : field.width - field.padding - 30;
          }
        } else if (p.team === 'home') {
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
              setCommentary("Takım arkadaşın şutunu çekti!");
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
                setCommentary("Takım arkadaşın savunmada topu kaptı!");
              }
            }
          }
        } else if (p.team === 'away') {
          if (gameMode === 'practice') {
            targetX = 850; targetY = p.y; // Antrenman modunda dururlar
          } else if (ball.owner === p) {
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
              setCommentary("Rakip kaleyi sert bir şutla denedi!");
            }
          } else {
            targetX = ball.x;
            targetY = ball.y;

            if (ball.owner && ball.owner.team === 'home') {
              const distToHome = Math.hypot(p.x - ball.owner.x, p.y - ball.owner.y);
              if (distToHome < tackleDist && Math.random() < tackleChance) {
                ball.owner = p;
                ball.passTarget = null;
                playSound('tackle');
                setCommentary("Rakip müdahale ederek topu aldı!");
              }
            }
          }
        }

        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 4) {
          const currentSpeedMultiplier = p.team === 'away' ? diffMultiplier : 0.85;
          p.x += (dx / dist) * p.speed * currentSpeedMultiplier;
          p.y += (dy / dist) * p.speed * currentSpeedMultiplier;
          p.lastMoveDir = { x: dx / dist, y: dy / dist };
        }
      });

      // Saha İçi Sınırlar
      players.forEach(p => {
        p.x = Math.max(field.padding + p.radius + 5, Math.min(field.width - field.padding - p.radius - 5, p.x));
        p.y = Math.max(field.padding + p.radius + 5, Math.min(field.height - field.padding - p.radius - 5, p.y));
      });

      // Top Fiziği & Pas Mekaniği
      if (ball.owner) {
        const p = ball.owner;
        const angle = Math.atan2(p.lastMoveDir.y, p.lastMoveDir.x);
        ball.x = p.x + Math.cos(angle) * 16;
        ball.y = p.y + Math.sin(angle) * 16;
        ball.vx = 0;
        ball.vy = 0;
      } else if (ball.passTarget) {
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
          const passSpeed = 8;
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

      // Direkten Dönen Toplar Fizik Algoritması
      const pPadding = field.padding;
      const topPostY = field.height / 2 - 60;
      const bottomPostY = field.height / 2 + 60;

      // Sağ Kale Direkleri
      const distRightTopPost = Math.hypot(ball.x - (field.width - pPadding), ball.y - topPostY);
      const distRightBottomPost = Math.hypot(ball.x - (field.width - pPadding), ball.y - bottomPostY);
      // Sol Kale Direkleri
      const distLeftTopPost = Math.hypot(ball.x - pPadding, ball.y - topPostY);
      const distLeftBottomPost = Math.hypot(ball.x - pPadding, ball.y - bottomPostY);

      if (distRightTopPost < 12 || distRightBottomPost < 12 || distLeftTopPost < 12 || distLeftBottomPost < 12) {
        ball.vx *= -0.85;
        ball.vy *= -0.85;
        playSound('post');
        setCommentary("İnanılmaz! Top direkten döndü!");
      }

      // Duvar Yansımaları
      if (ball.y - ball.radius <= pPadding || ball.y + ball.radius >= field.height - pPadding) {
        ball.vy *= -0.7;
        ball.y = ball.y - ball.radius <= pPadding ? pPadding + ball.radius : field.height - pPadding - ball.radius;
      }

      const isGoalY = ball.y > field.height / 2 - 60 && ball.y < field.height / 2 + 60;
      if (!isGoalY) {
        if (ball.x - ball.radius <= pPadding || ball.x + ball.radius >= field.width - pPadding) {
          ball.vx *= -0.7;
          ball.x = ball.x - ball.radius <= pPadding ? pPadding + ball.radius : field.width - pPadding - ball.radius;
        }
      }

      // Gol Çizgisi Kontrolleri
      if (ball.x > field.width - pPadding + 5 && isGoalY) {
        setScore(prev => ({ ...prev, home: prev.home + 1 }));
        triggerGoalCelebration("MAVİ");
        setCommentary("GOOOOLLLL! Mükemmel bir gol!");
        resetPositions();
      }

      if (ball.x < pPadding - 5 && isGoalY) {
        setScore(prev => ({ ...prev, away: prev.away + 1 }));
        triggerGoalCelebration("KIRMIZI");
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

      // Oyuncuları Çiz
      players.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.team === 'home' ? '#1e88e5' : '#e53935';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Seçili Oyuncu Halkası
        if (p.isUser) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#fbc02d';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Oyuncu Rolü
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.role, p.x, p.y + 4);
      });

      // Konfeti Animasyonu
      confettis.forEach((c, idx) => {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.2;
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, c.size, c.size);
        if (c.y > field.height) confettis.splice(idx, 1);
      });

      drawRadar();

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isMuted, difficulty, gameMode, half]);

  // Devre Kontrolü & Zamanlayıcı
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setMatchTime(prev => {
          if (prev === 45 && half === 1) {
            setHalf(2);
            playSound('whistle');
            setCommentary("İLK YARI BİTTİ! İkinci yarı başlıyor, takımlar kale değiştiriyor.");
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, half]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 font-sans selection:bg-none">
      
      {/* Üst Skor & Bilgi Paneli */}
      <div className="w-full max-w-[1000px] bg-slate-800 rounded-t-xl p-4 flex items-center justify-between border-b border-slate-700 shadow-lg">
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-400 w-7 h-7" />
          <span className="font-bold text-xl tracking-wider">NEXT.JS CANVAS FOOTBALL PRO</span>
        </div>

        {/* Skor & Devre */}
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
            <div className="text-xs text-slate-400">{half}. YARI</div>
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

      {/* Oyun Sahası & Canvas */}
      <div className="relative border-4 border-slate-800 rounded-b-xl overflow-hidden shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="block cursor-crosshair"
        />

        {/* Gol Banner Efekti */}
        {goalBanner && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center animate-bounce pointer-events-none">
            <h1 className="text-7xl font-black text-yellow-400 tracking-widest drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              ⚽ GOOOOLLLL! ⚽
            </h1>
          </div>
        )}

        {/* Oyun Başlangıç ve Mod Seçim Menüsü */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-yellow-400">
              FUTBOL EFSANESİ BAŞLIYOR
            </h1>

            {/* Mod Seçimi */}
            <div className="flex items-center gap-3 my-1">
              <button
                onClick={() => setGameMode('match')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${
                  gameMode === 'match' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Trophy className="w-4 h-4" /> Normal Maç
              </button>
              <button
                onClick={() => setGameMode('penalty')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${
                  gameMode === 'penalty' ? 'bg-yellow-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Target className="w-4 h-4" /> Penaltı Modu
              </button>
              <button
                onClick={() => setGameMode('practice')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${
                  gameMode === 'practice' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Activity className="w-4 h-4" /> Antrenman
              </button>
            </div>

            {/* Zorluk Ayarı */}
            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-700">
              <ShieldAlert className="w-4 h-4 text-yellow-400 ml-2" />
              <span className="text-xs font-semibold text-slate-300 mr-2">ZORLUK:</span>
              <button
                onClick={() => setDifficulty('easy')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  difficulty === 'easy' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400'
                }`}
              >
                KOLAY
              </button>
              <button
                onClick={() => setDifficulty('medium')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  difficulty === 'medium' ? 'bg-yellow-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400'
                }`}
              >
                ORTA
              </button>
              <button
                onClick={() => setDifficulty('hard')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  difficulty === 'hard' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                }`}
              >
                ZOR
              </button>
            </div>

            <button
              onClick={() => {
                setIsPlaying(true);
                playSound('whistle');
              }}
              className="mt-3 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 transition transform"
            >
              <Play className="fill-current w-5 h-5" /> Başlat
            </button>
          </div>
        )}
      </div>

      {/* Şut Gücü & Enerji (Stamina) Barları */}
      <div className="w-full max-w-[1000px] mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Şut Gücü */}
        <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3 border border-slate-700">
          <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 shrink-0">
            <Zap className="w-4 h-4" /> ŞUT GÜCÜ:
          </div>
          <div className="flex-1 bg-slate-900 rounded-full h-3.5 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 h-full transition-all duration-75"
              style={{ width: `${power}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 w-8 text-right">%{Math.round(power)}</span>
        </div>

        {/* Stamina / Enerji Barı */}
        <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3 border border-slate-700">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 shrink-0">
            <Sparkles className="w-4 h-4" /> ENERJİ (SHIFT):
          </div>
          <div className="flex-1 bg-slate-900 rounded-full h-3.5 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-75 ${
                stamina < 30 ? 'bg-red-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${stamina}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 w-8 text-right">%{Math.round(stamina)}</span>
        </div>
      </div>

      {/* Anlatım & Spiker Paneli */}
      <div className="w-full max-w-[1000px] mt-2 bg-slate-800/60 rounded-lg p-2.5 text-center text-sm text-emerald-300 border border-slate-700/50 font-medium">
        🎙️️ {commentary}
      </div>

      {/* Tuş Takımı Rehberi */}
      <div className="w-full max-w-[1000px] mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-slate-400">
        <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span><b>WASD:</b> Hareket</span>
        </div>
        <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span><b>SHIFT:</b> Depar (Sprint)</span>
        </div>
        <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
          <span><b>SPACE:</b> Şut Çek</span>
        </div>
        <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span><b>K Tuşu:</b> Pas At</span>
        </div>
        <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
          <Info className="w-4 h-4 text-red-400 shrink-0" />
          <span><b>E Tuşu:</b> Top Kap / Müdahale</span>
        </div>
      </div>
    </div>
  );
}