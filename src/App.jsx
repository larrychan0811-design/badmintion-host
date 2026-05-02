import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, ArrowLeft, CalendarPlus, MapPin, Clock, Trophy, ArrowRight, ChevronLeft, ChevronRight, Activity, Trash2, Edit2, Check, X } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // --- 使用 Local Storage 來記憶資料 ---
  const [games, setGames] = useState(() => {
    const savedGames = localStorage.getItem('badminton_games');
    return savedGames ? JSON.parse(savedGames) : [];
  });

  const [joiners, setJoiners] = useState(() => {
    const savedJoiners = localStorage.getItem('badminton_joiners');
    return savedJoiners ? JSON.parse(savedJoiners) : [];
  });

  // 當 games 資料變動時，自動存入記憶體
  useEffect(() => {
    localStorage.setItem('badminton_games', JSON.stringify(games));
  }, [games]);

  // 當 joiners 資料變動時，自動存入記憶體
  useEffect(() => {
    localStorage.setItem('badminton_joiners', JSON.stringify(joiners));
  }, [joiners]);
  // ------------------------------------

  const [newGame, setNewGame] = useState({ date: getTodayStr(), time: '18:00', duration: 2, locationPreset: '坑口', customLocation: '', level: '初級' });
  const [newJoiner, setNewJoiner] = useState({ name: '', gameId: '' });
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [editingGameId, setEditingGameId] = useState(null);
  const [editGameData, setEditGameData] = useState({ date: '', time: '', duration: 2, level: '', location: '' });
  const [editingJoinerId, setEditingJoinerId] = useState(null);
  const [editJoinerName, setEditJoinerName] = useState('');

  const locationOptions = ['坑口', '將軍澳', '單車館', '調景嶺', '其他'];
  const levelOptions = ['初級', '初-近初中', '練習場'];
  const durationOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4];

  const timeOptions = [];
  for (let i = 7; i <= 22; i++) {
    timeOptions.push(`${i.toString().padStart(2, '0')}:00`);
  }

  // --- Handlers ---
  const handleCreateGame = (e) => {
    e.preventDefault();
    const finalLocation = newGame.locationPreset === '其他' ? newGame.customLocation : newGame.locationPreset;
    
    // 如果日期、時間、地點沒填寫，就不執行
    if (!newGame.date || !newGame.time || !finalLocation) return;
    
    const gameId = crypto.randomUUID();
    const game = { id: gameId, date: newGame.date, time: newGame.time, duration: newGame.duration, location: finalLocation, level: newGame.level };
    
    setGames([...games, game]);
    
    // 自動把 Larry 加入為第一位參加者
    const joinerId = crypto.randomUUID();
    setJoiners([...joiners, { id: joinerId, name: 'Larry', gameId: gameId }]);
    
    // 重設表單
    setNewGame({ date: newGame.date, time: '18:00', duration: 2, locationPreset: '坑口', customLocation: '', level: '初級' });
  };

  const handleAddJoiner = (e) => {
    e.preventDefault();
    if (!newJoiner.name || !newJoiner.gameId) return;
    if (getJoinerCount(newJoiner.gameId) >= 6) { 
      alert("This game is already full!"); 
      return; 
    }

    const joinerId = crypto.randomUUID();
    setJoiners([...joiners, { id: joinerId, ...newJoiner }]);
    setNewJoiner({ ...newJoiner, name: '' });
  };

  const handleRemoveJoiner = (id) => {
    setJoiners(joiners.filter(j => j.id !== id));
  };

  const startEditingJoiner = (joiner) => { 
    setEditingJoinerId(joiner.id); 
    setEditJoinerName(joiner.name); 
  };
  
  const saveEditingJoiner = (id) => {
    if (!editJoinerName.trim()) return;
    setJoiners(joiners.map(j => j.id === id ? { ...j, name: editJoinerName } : j));
    setEditingJoinerId(null);
  };
  
  const cancelEditingJoiner = () => { 
    setEditingJoinerId(null); 
    setEditJoinerName(''); 
  };

  const startEditingGame = (game) => {
    setEditingGameId(game.id);
    setEditGameData({ date: game.date, time: game.time, duration: game.duration || 2, level: game.level, location: game.location });
  };

  const saveEditingGame = (id) => {
    if (!editGameData.date || !editGameData.time || !editGameData.location) return;
    setGames(games.map(g => g.id === id ? { ...g, ...editGameData } : g));
    setEditingGameId(null);
  };

  const cancelEditingGame = () => setEditingGameId(null);

  const generateGoogleCalendarLink = (game) => {
    const dateStr = game.date.replace(/-/g, '');
    const timeStr = game.time.replace(':', '') + '00';
    const startDateTime = `${dateStr}T${timeStr}`;
    const endTimeFormatted = calculateEndTime(game.time, game.duration || 2).replace(':', '') + '00';
    const endDateTime = `${dateStr}T${endTimeFormatted}`;
    const title = encodeURIComponent(`${game.location} | ${game.level}`);
    const location = encodeURIComponent(game.location);
    const details = encodeURIComponent('Badminton game organized via Host Manager.');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
  };

  const getJoinerCount = (gameId) => joiners.filter(j => j.gameId === gameId).length;

  const calculateEndTime = (timeStr, duration = 2) => {
    if (!timeStr) return '';
    let [hours, mins] = timeStr.split(':').map(Number);
    const totalMins = hours * 60 + mins + duration * 60;
    const endHours = Math.floor(totalMins / 60) % 24;
    const endMins = totalMins % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // --- Sub-components (Views) ---
  const renderGamesList = (showSyncButton = true) => (
    <div className="space-y-4">
      {games.map(game => {
        const count = getJoinerCount(game.id);
        const isFull = count >= 6;
        
        return (
          <div key={game.id} className={`p-5 rounded-2xl border shadow-sm flex flex-col transition-all ${isFull ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
            {editingGameId === game.id ? (
              <div className="flex flex-col gap-3 w-full animate-in fade-in">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Date</label>
                    <input type="date" value={editGameData.date} onChange={e => setEditGameData({...editGameData, date: e.target.value})} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none focus:border-yellow-400 text-sm font-medium bg-slate-50 text-slate-900" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Time</label>
                    <select value={editGameData.time} onChange={e => setEditGameData({...editGameData, time: e.target.value})} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none focus:border-yellow-400 text-sm font-medium bg-slate-50 text-slate-900 appearance-none">
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Duration (hrs)</label>
                    <select value={editGameData.duration} onChange={e => setEditGameData({...editGameData, duration: parseFloat(e.target.value)})} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none focus:border-yellow-400 text-sm font-medium bg-slate-50 text-slate-900 appearance-none">
                      {durationOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Level</label>
                    <select value={editGameData.level} onChange={e => setEditGameData({...editGameData, level: e.target.value})} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none focus:border-yellow-400 text-sm font-medium bg-slate-50 text-slate-900 appearance-none">
                      {levelOptions.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Location</label>
                    <input type="text" value={editGameData.location} onChange={e => setEditGameData({...editGameData, location: e.target.value})} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none focus:border-yellow-400 text-sm font-medium bg-slate-50 text-slate-900" placeholder="Location" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={cancelEditingGame} className="flex items-center gap-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm transition-colors"><X size={16}/> Cancel</button>
                  <button onClick={() => saveEditingGame(game.id)} className="flex items-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-colors"><Check size={16}/> Save</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 text-lg flex items-center flex-wrap gap-2">
                    {game.date} <span className="text-slate-400 font-normal">|</span> {game.time} - {calculateEndTime(game.time, game.duration)}
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">{game.level}</span>
                    <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider ${isFull ? 'bg-orange-200 text-orange-900' : 'bg-blue-50 text-blue-700'}`}>
                      {count} / 6 Joined
                    </span>
                    {isFull && <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-bold tracking-wide uppercase">FULL</span>}
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${isFull ? 'text-orange-700' : 'text-slate-500'}`}>
                    <MapPin size={16} /> {game.location}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto mt-2 md:mt-0">
                  <button 
                    onClick={() => startEditingGame(game)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0"
                    title="Edit Game"
                  >
                    <Edit2 size={18} />
                  </button>
                  {showSyncButton && (
                    <a 
                      href={generateGoogleCalendarLink(game)} 
                      target="_blank" 
                      rel="noreferrer"
                      className={`${isFull ? 'bg-orange-200 text-orange-800 hover:bg-orange-300' : 'bg-slate-900 text-yellow-400 hover:bg-slate-800'} px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap`}
                    >
                      <CalendarPlus size={18} /> Sync Calendar
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const HomeView = () => (
    <div className="w-full animate-in fade-in duration-500">
      <div className={`flex flex-col gap-5 justify-center items-center w-full px-4 max-w-2xl mx-auto ${games.length === 0 ? 'min-h-[60vh]' : 'py-8'}`}>
        <button 
          onClick={() => setCurrentView('games')}
          className="group relative w-full p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border-2 border-slate-100 hover:border-yellow-400 flex items-center justify-between overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 shrink-0 bg-slate-900 text-yellow-400 rounded-2xl flex items-center justify-center shadow-sm border border-slate-800 group-hover:scale-105 transition-transform duration-300">
              <Calendar size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">New Games</h2>
          </div>
          <div className="relative z-10 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors">
            <ArrowRight size={20} className="text-slate-400 group-hover:text-slate-900" />
          </div>
        </button>

        <button 
          onClick={() => setCurrentView('joiners')}
          className="group relative w-full p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border-2 border-slate-100 hover:border-yellow-400 flex items-center justify-between overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 shrink-0 bg-yellow-400 text-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-yellow-500 group-hover:scale-105 transition-transform duration-300">
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">New Joiners</h2>
          </div>
          <div className="relative z-10 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-yellow-400 transition-colors">
            <ArrowRight size={20} className="text-slate-400 group-hover:text-yellow-400" />
          </div>
        </button>
      </div>

      {games.length > 0 && (
        <div className="max-w-2xl mx-auto mt-6 mb-8 px-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <h3 className="text-xl font-bold text-slate-900 mb-4 px-2">Upcoming Games</h3>
          {renderGamesList(true)}
        </div>
      )}
    </div>
  );

  const GamesView = () => (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
          <CalendarPlus size={28} className="text-yellow-400" />
          <h2 className="text-2xl font-semibold">Schedule a Game</h2>
        </div>
        <form onSubmit={handleCreateGame} className="p-8 space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Calendar size={18} className="text-slate-400"/> Select Date</label>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="p-2 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                <div className="font-bold text-slate-900 text-lg">
                  {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="p-2 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"><ChevronRight size={20}/></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-sm">
                {Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const d = i + 1;
                  const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const isSelected = newGame.date === dateStr;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNewGame({...newGame, date: dateStr})}
                      className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center transition-all ${isSelected ? 'bg-slate-900 text-yellow-400 font-bold shadow-md scale-110' : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900 font-medium'}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
            
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Clock size={18} className="text-slate-400"/> Select Time & Duration</label>
            <div className="relative flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <select 
                  required
                  value={newGame.time}
                  onChange={(e) => setNewGame({...newGame, time: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-0 focus:border-yellow-400 outline-none transition-all appearance-none bg-slate-50 font-medium text-slate-900 hover:bg-slate-100"
                >
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="relative w-full sm:w-1/3">
                <select 
                  required
                  value={newGame.duration}
                  onChange={(e) => setNewGame({...newGame, duration: parseFloat(e.target.value)})}
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-0 focus:border-yellow-400 outline-none transition-all appearance-none bg-slate-50 font-medium text-slate-900 hover:bg-slate-100"
                >
                  {durationOptions.map(d => <option key={d} value={d}>{d} hours</option>)}
                </select>
              </div>
              <div className="text-slate-500 text-sm font-medium whitespace-nowrap bg-white px-4 py-3 rounded-xl border-2 border-slate-100 w-full sm:w-auto text-center flex items-center justify-center">
                Ends at <span className="text-slate-900 font-bold ml-1">{calculateEndTime(newGame.time, newGame.duration)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Activity size={18} className="text-slate-400"/> Match Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {levelOptions.map(level => {
                const isSelected = newGame.level === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setNewGame({...newGame, level})}
                    className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 outline-none ${
                      isSelected 
                        ? 'border-yellow-400 bg-white shadow-sm' 
                        : 'border-transparent bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                      {level}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                        <Check size={14} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><MapPin size={18} className="text-slate-400"/> Location</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {locationOptions.map(loc => {
                const isSelected = newGame.locationPreset === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setNewGame({...newGame, locationPreset: loc})}
                    className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 outline-none ${
                      isSelected 
                        ? 'border-yellow-400 bg-white shadow-sm' 
                        : 'border-transparent bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                      {loc}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                        <Check size={14} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {newGame.locationPreset === '其他' && (
              <div className="pt-2">
                <input 
                  type="text" 
                  required
                  placeholder="Enter custom location..."
                  value={newGame.customLocation}
                  onChange={(e) => setNewGame({...newGame, customLocation: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-0 focus:border-yellow-400 outline-none transition-all bg-slate-50 font-medium text-slate-900"
                />
              </div>
            )}
          </div>

          <button 
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-4 rounded-2xl shadow-sm transition-colors flex justify-center items-center gap-2 text-lg mt-4"
          >
            <Plus size={24} /> Create Game
          </button>
        </form>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-4 px-2">Upcoming Games</h3>
      {games.length === 0 ? (
        <p className="text-center text-slate-500 py-8 font-medium">No games scheduled yet.</p>
      ) : (
        renderGamesList(true)
      )}
    </div>
  );

  const JoinersView = () => {
    const selectedGameIsFull = newJoiner.gameId ? getJoinerCount(newJoiner.gameId) >= 6 : false;

    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
            <Users size={28} className="text-yellow-400" />
            <h2 className="text-2xl font-semibold">Add New Joiner</h2>
          </div>
        
          {games.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 mb-4 font-medium">You need to create a game first before adding joiners.</p>
              <button 
                onClick={() => setCurrentView('games')}
                className="text-slate-900 font-bold hover:underline"
              >
                Go to Games
              </button>
            </div>
          ) : (
          <form onSubmit={handleAddJoiner} className="p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900">Select Game</label>
              <select 
                required
                value={newJoiner.gameId}
                onChange={(e) => setNewJoiner({...newJoiner, gameId: e.target.value})}
                className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-0 focus:border-yellow-400 outline-none transition-all appearance-none bg-slate-50 font-medium text-slate-900 hover:bg-slate-100"
              >
                <option value="" disabled>Choose a scheduled game...</option>
                {games.map(game => {
                  const isFull = getJoinerCount(game.id) >= 6;
                  return (
                    <option key={game.id} value={game.id} disabled={isFull}>
                      {game.date} | {game.time}-{calculateEndTime(game.time, game.duration)} | {game.level} | {game.location} {isFull ? '(FULL - Max 6)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {newJoiner.gameId && (
              <div className="bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl flex items-center justify-between">
                <span className="font-semibold text-sm">Current Headcount:</span>
                <span className="font-bold text-sm bg-white px-3 py-1 rounded-lg shadow-sm text-slate-900 border border-slate-100">
                  {getJoinerCount(newJoiner.gameId)} joined
                </span>
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900">Joiner Name</label>
              <input 
                type="text" 
                required
                disabled={selectedGameIsFull}
                placeholder={selectedGameIsFull ? "Game is full" : "e.g. John Doe"}
                value={newJoiner.name}
                onChange={(e) => setNewJoiner({...newJoiner, name: e.target.value})}
                className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-0 focus:border-yellow-400 outline-none transition-all font-medium disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-900 bg-slate-50 hover:bg-slate-100"
              />
            </div>

            <button 
              type="submit"
              disabled={selectedGameIsFull}
              className={`w-full font-bold py-4 rounded-2xl shadow-sm transition-colors flex justify-center items-center gap-2 text-lg mt-4 ${selectedGameIsFull ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900'}`}
            >
              <Plus size={24} /> Add Joiner
            </button>
          </form>
        )}
      </div>

      {games.length > 0 && (
        <>
          <h3 className="text-xl font-bold text-slate-900 mb-4 px-2">Rosters</h3>
          <div className="space-y-6">
            {games.map(game => {
              const gameJoiners = joiners.filter(j => j.gameId === game.id);
              if (gameJoiners.length === 0) return null;
              
              const isFull = gameJoiners.length >= 6;
              
              return (
                <div key={game.id} className={`rounded-3xl border shadow-sm overflow-hidden transition-all ${isFull ? 'border-orange-200' : 'border-slate-200 bg-white'}`}>
                  <div className={`border-b px-6 py-4 flex justify-between items-center ${isFull ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`font-bold flex items-center flex-wrap gap-2 ${isFull ? 'text-orange-900' : 'text-slate-900'}`}>
                      <span>{game.date} @ {game.time} - {calculateEndTime(game.time, game.duration)}</span>
                      <span className={`font-normal ${isFull ? 'text-orange-400' : 'text-slate-400'}`}>|</span>
                      <span className="flex items-center gap-1"><MapPin size={16}/> {game.location}</span>
                      <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider ${isFull ? 'bg-orange-200 text-orange-900' : 'bg-slate-200 text-slate-700'}`}>
                        {game.level}
                      </span>
                      {isFull && <span className="text-orange-600 text-xs font-bold uppercase tracking-wider">(FULL)</span>}
                    </div>
                    <div className={`text-sm px-3 py-1.5 rounded-lg font-bold whitespace-nowrap ${isFull ? 'bg-orange-200 text-orange-900' : 'bg-slate-200 text-slate-800'}`}>
                      Total: {gameJoiners.length} / 6
                    </div>
                  </div>
                  <ul className={`divide-y ${isFull ? 'divide-orange-100 bg-white' : 'divide-slate-100 bg-white'}`}>
                    {gameJoiners.map((joiner, index) => (
                      <li key={joiner.id} className="px-6 py-4 flex items-center justify-between gap-3 group hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4 w-full">
                          <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${isFull ? 'bg-orange-100 text-orange-700' : 'bg-slate-900 text-yellow-400'}`}>
                            {index + 1}
                          </div>
                          
                          {editingJoinerId === joiner.id ? (
                            <div className="flex items-center gap-2 flex-grow">
                              <input 
                                type="text" 
                                value={editJoinerName}
                                onChange={(e) => setEditJoinerName(e.target.value)}
                                className="px-4 py-2 border-2 border-yellow-400 rounded-xl outline-none focus:ring-0 text-slate-900 font-semibold w-full max-w-[250px]"
                                autoFocus
                              />
                              <button onClick={() => saveEditingJoiner(joiner.id)} className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-xl shadow-sm transition-colors">
                                <Check size={18} />
                              </button>
                              <button onClick={cancelEditingJoiner} className="p-2 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors">
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <span className={`font-semibold text-lg ${isFull ? 'text-orange-900' : 'text-slate-900'}`}>
                              {joiner.name}
                            </span>
                          )}
                        </div>
                        
                        {/* Actions (Edit / Delete) */}
                        {editingJoinerId !== joiner.id && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startEditingJoiner(joiner)}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                              title="Edit name"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleRemoveJoiner(joiner.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Remove joiner"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-yellow-200 selection:text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 text-slate-900 font-black text-2xl cursor-pointer tracking-tight"
            onClick={() => setCurrentView('home')}
          >
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Trophy className="text-yellow-400" size={20} />
            </div>
            <span>Badminton<span className="text-yellow-500">Host</span></span>
          </div>
          
          {currentView !== 'home' && (
            <button 
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl"
            >
              <ArrowLeft size={18} /> Back
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {currentView === 'home' && HomeView()}
        {currentView === 'games' && GamesView()}
        {currentView === 'joiners' && JoinersView()}
      </main>
    </div>
  );
}