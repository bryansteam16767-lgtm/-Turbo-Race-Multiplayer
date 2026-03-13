/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { socket } from './services/socket';
import { Player } from './types';

export default function App() {
  const [view, setView] = useState<'landing' | 'lobby' | 'game'>('landing');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [isHost, setIsHost] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [activeRooms, setActiveRooms] = useState<{id: string, playerCount: number, status: string}[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [error, setError] = useState('');

  const [missions, setMissions] = useState([
    { id: 1, title: 'Primeros Pasos', description: 'Completa tu primera carrera', reward: '50 XP', completed: false },
    { id: 2, title: 'Velocidad Pura', description: 'Alcanza la velocidad máxima', reward: '100 XP', completed: false },
    { id: 3, title: 'Maestro del Nitro', description: 'Usa el nitro 5 veces en una carrera', reward: '75 XP', completed: false },
    { id: 4, title: 'Persistencia', description: 'Completa 10 vueltas totales', reward: '200 XP', completed: false },
  ]);

  const UPDATES = [
    { date: '13 Mar 2026', title: 'Sistema de Misiones', description: '¡Nuevos desafíos diarios para ganar recompensas!' },
    { date: '13 Mar 2026', title: 'Monitor en Vivo', description: 'El creador ahora puede supervisar todas las carreras activas.' },
    { date: '13 Mar 2026', title: 'Modo Creador', description: 'Acceso especial para bryansteam16767@gmail.com.' },
    { date: '13 Mar 2026', title: 'Sistema de Login', description: 'Ahora puedes identificarte con tu correo electrónico.' },
    { date: '12 Mar 2026', title: 'Lanzamiento Turbo Race', description: '¡El juego de carreras multijugador definitivo!' },
  ];

  const CREATOR_EMAIL = 'bryansteam16767@gmail.com';

  useEffect(() => {
    if (isCreator) {
        const interval = setInterval(() => {
            socket.emit('getRooms');
        }, 3000);
        return () => clearInterval(interval);
    }
  }, [isCreator]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.includes('@')) {
        setError('Por favor ingresa un correo válido');
        return;
    }
    setUserEmail(loginInput);
    setIsCreator(loginInput.toLowerCase() === CREATOR_EMAIL.toLowerCase());
    setShowLogin(false);
    setError('');
  };

  useEffect(() => {
    socket.on('roomCreated', ({ roomId, players, isHost }) => {
      setRoomCode(roomId);
      setPlayers(players);
      setIsHost(isHost);
      setIsSpectator(false);
      setGameInProgress(false);
      setView('lobby');
      setError('');
    });

    socket.on('roomJoined', ({ roomId, players, isHost, gameInProgress }) => {
      setRoomCode(roomId);
      setPlayers(players);
      setIsHost(isHost);
      setGameInProgress(gameInProgress);
      
      if (gameInProgress) {
          setIsSpectator(true);
          setView('game');
      } else {
          setIsSpectator(false);
          setView('lobby');
      }
      setError('');
    });

    socket.on('playerJoinedRoom', (player) => {
      setPlayers((prev) => ({ ...prev, [player.id]: player }));
    });

    socket.on('playerDisconnected', (id) => {
      setPlayers((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    socket.on('gameStarted', (initialPlayers) => {
      setPlayers(initialPlayers);
      setIsSpectator(false);
      setGameInProgress(true);
      setView('game');
    });

    socket.on('error', (msg) => {
      setError(msg);
    });
    
    socket.on('hostMigrated', (newHostId) => {
        if (socket.id === newHostId) {
            setIsHost(true);
        }
    });

    socket.on('roomList', (list) => {
        setActiveRooms(list);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('playerJoinedRoom');
      socket.off('playerDisconnected');
      socket.off('gameStarted');
      socket.off('error');
      socket.off('hostMigrated');
      socket.off('roomList');
    };
  }, []);

  const handleCreate = () => {
    socket.emit('createRoom');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || joinCode.length !== 6) {
        setError('Please enter a valid 6-character room code');
        return;
    }
    socket.emit('joinRoom', { roomId: joinCode.toUpperCase() });
  };

  const handleStartGame = () => {
    socket.emit('startGame');
  };

  return (
    <div className={`min-h-screen bg-slate-900 flex flex-col items-center ${view === 'game' ? 'justify-start' : 'justify-center'} font-sans text-slate-100 overflow-x-hidden`}>
      <header className={`w-full max-w-4xl mx-auto ${view === 'game' ? 'p-2' : 'p-4 md:p-6'} flex justify-between items-center transition-all`}>
        <h1 className={`${view === 'game' ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'} font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 transform -skew-x-12 transition-all`}>
          TURBO RACE
        </h1>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowUpdates(true)}
                className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-black px-3 py-1.5 rounded border border-blue-500/30 transition-all uppercase tracking-wider"
            >
                Actualizaciones
            </button>
            {isCreator && (
                <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded italic uppercase animate-pulse">
                    MODO CREADOR
                </span>
            )}
            {userEmail ? (
                <div className="text-right">
                    <div className="text-xs text-slate-400">Sesión iniciada</div>
                    <div className="text-sm font-bold text-white truncate max-w-[150px]">{userEmail}</div>
                </div>
            ) : (
                <button 
                    onClick={() => setShowLogin(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2 rounded-lg border border-slate-700 transition-colors"
                >
                    INICIAR SESIÓN
                </button>
            )}
        </div>
      </header>

      <main className={`flex-1 w-full flex flex-col items-center ${view === 'game' ? 'p-0' : 'p-2 md:p-4'} transition-all`}>
        {view === 'landing' && (
          <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 items-start justify-center px-4">
            {/* Left Column: Missions (Only if logged in) */}
            {userEmail && (
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 w-full lg:w-72 backdrop-blur-sm order-2 lg:order-1">
                    <h3 className="font-black text-white uppercase tracking-tighter text-lg italic mb-4 flex items-center gap-2">
                        <span className="text-yellow-500">★</span> Misiones
                    </h3>
                    <div className="space-y-3">
                        {missions.map(mission => (
                            <div key={mission.id} className={`p-3 rounded-xl border ${mission.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-black/20 border-white/5'} transition-all`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-black uppercase ${mission.completed ? 'text-green-400' : 'text-slate-500'}`}>
                                        {mission.completed ? 'Completada' : 'En curso'}
                                    </span>
                                    <span className="text-[10px] font-bold text-yellow-500">{mission.reward}</span>
                                </div>
                                <div className="text-xs font-bold text-white mb-1">{mission.title}</div>
                                <div className="text-[10px] text-slate-400 leading-tight">{mission.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Middle Column: Main Menu */}
            <div className="bg-slate-800 p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full order-1 lg:order-2">
                {showLogin ? (
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">Identifícate</h2>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-400 uppercase font-bold mb-2">Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={loginInput}
                                    onChange={(e) => setLoginInput(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                            {error && <div className="text-red-400 text-xs text-center">{error}</div>}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowLogin(false)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-colors"
                                >
                                    ENTRAR
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">Start Your Engines</h2>
                        
                        <div className="space-y-6">
                        {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{error}</div>}

                        <div className="grid grid-cols-1 gap-4">
                            <button
                            onClick={handleCreate}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black font-bold py-3 rounded-lg shadow-lg transition-transform active:scale-95"
                            >
                            CREATE RACE
                            </button>
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-slate-800 text-slate-500">Or join a friend</span>
                                </div>
                            </div>

                            <form onSubmit={handleJoin} className="flex gap-2">
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white uppercase tracking-widest font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="CODE"
                                    maxLength={6}
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg shadow-lg transition-transform active:scale-95"
                                >
                                    JOIN
                                </button>
                            </form>
                        </div>
                        </div>
                    </>
                )}
            </div>

            {isCreator && (
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-yellow-500/30 w-full lg:w-80 backdrop-blur-sm order-3">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
                        <h3 className="font-black text-yellow-500 uppercase tracking-tighter text-lg italic">Monitor en Vivo</h3>
                    </div>
                    
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {activeRooms.length === 0 ? (
                            <div className="text-slate-500 text-sm italic py-4 text-center">No hay carreras activas en este momento...</div>
                        ) : (
                            activeRooms.map(room => (
                                <div key={room.id} className="bg-black/40 p-4 rounded-xl border border-white/5 flex justify-between items-center hover:border-yellow-500/50 transition-colors group">
                                    <div>
                                        <div className="font-mono text-yellow-400 font-bold">{room.id}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-2">
                                            <span>{room.playerCount} Corredores</span>
                                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                            <span className={room.status === 'racing' ? 'text-green-400' : 'text-blue-400'}>
                                                {room.status === 'racing' ? 'EN CARRERA' : 'EN LOBBY'}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => socket.emit('joinRoom', { roomId: room.id })}
                                        className="bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black px-3 py-2 rounded-lg transition-all transform group-hover:scale-105"
                                    >
                                        VER LIVE
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
          </div>
        )}

        {view === 'lobby' && (
            <div className="bg-slate-800 p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-lg md:text-xl text-slate-400 mb-2">Room Code</h2>
                    <div className="text-4xl md:text-6xl font-mono font-black tracking-widest text-yellow-400 bg-black/30 p-3 md:p-4 rounded-xl inline-block border-2 border-dashed border-slate-600 select-all">
                        {roomCode}
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 mt-2">Share this code with your friends!</p>
                </div>

                <div className="mb-8">
                    <h3 className="text-base md:text-lg font-bold mb-4 flex justify-between items-center">
                        <span>Racers ({Object.keys(players).length})</span>
                        {isHost && <span className="text-[10px] md:text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">You are Host</span>}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.values(players).map(p => (
                            <div key={p.id} className="bg-slate-700/50 p-3 rounded-lg flex items-center gap-3 border border-slate-600">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }}></div>
                                <span className="font-bold truncate text-sm md:text-base">{p.name}</span>
                                {p.id === socket.id && <span className="text-[10px] md:text-xs text-slate-400">(You)</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {isHost ? (
                    <button
                        onClick={handleStartGame}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 md:py-4 rounded-xl shadow-lg text-lg md:text-xl tracking-wide transition-transform active:scale-95 animate-pulse"
                    >
                        START RACE
                    </button>
                ) : (
                    <div className="text-center text-slate-400 italic animate-pulse text-sm md:text-base">
                        Waiting for host to start the race...
                    </div>
                )}
            </div>
        )}

        {view === 'game' && (
          <GameCanvas initialPlayers={players} isSpectator={isSpectator} />
        )}
      </main>

      {/* Updates Modal */}
      {showUpdates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-black italic text-white tracking-tighter uppercase">Historial de Actualizaciones</h2>
                    <button onClick={() => setShowUpdates(false)} className="text-white/70 hover:text-white text-2xl font-bold">×</button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
                    {UPDATES.map((update, idx) => (
                        <div key={idx} className="relative pl-6 border-l-2 border-slate-700">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-slate-900"></div>
                            <div className="text-[10px] font-black text-blue-400 uppercase mb-1">{update.date}</div>
                            <h3 className="text-lg font-bold text-white mb-1">{update.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{update.description}</p>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end">
                    <button 
                        onClick={() => setShowUpdates(false)}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-2 rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
