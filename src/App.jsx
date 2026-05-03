import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, ArrowLeft, CalendarPlus, MapPin, Clock, Trophy, ArrowRight, Activity, Trash2, Edit2, Check, X, Hash, ChevronLeft, ChevronRight } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'games', 'joiners'
  
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 安全的日期與字串格式化 (防呆機制)
  const getWeekday = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekdays[date.getDay()];
  };

  const formatLocation = (loc) => {
    if (!loc || typeof loc !== 'string') return '未指定地點';
    return loc.endsWith('體育館') ? loc : `${loc}體育館`;
  };

  const formatLevel = (lvl) => {
    if (!lvl || typeof lvl !== 'string') return '';
    return lvl.endsWith('雙打') ? lvl : `${lvl}雙打`;
  };

  // 安全的排序機制
  const sortGamesAsc = (a, b) => {
    const strA = `${a.date || ''}T${a.time || ''}`;
    const strB = `${b.date || ''}T${b.time || ''}`;
    return strA < strB ? -1 : (strA > strB ? 1 : 0);
  };

  // 雙週日曆的起始日狀態 (預設為本週日)
  const [calendarStart, setCalendarStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // 回推到本週的星期日
    return d;
  });

  const handlePrevWeeks = () => {
    const newDate = new Date(calendarStart);
    newDate.setDate(newDate.getDate() - 14);
    setCalendarStart(newDate);
  };

  const handleNextWeeks = () => {
    const newDate = new Date(calendarStart);
    newDate.setDate(newDate.getDate() + 14);
    setCalendarStart(newDate);
  };

  // 產生 14 天的日曆資料
  const twoWeeks = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(calendarStart);
    d.setDate(calendarStart.getDate() + i);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 歸零時間以純比較日期
    const isPast = d < today;

    return {
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      date: d.getDate(),
      isToday: d.toDateString() === new Date().toDateString(),
      isPast: isPast
    };
  });

  // 計算日曆頂部的年月顯示
  const endOfWeek = new Date(calendarStart);
  endOfWeek.setDate(calendarStart.getDate() + 13);
  const startMonth = calendarStart.getMonth() + 1;
  const endMonth = endOfWeek.getMonth() + 1;
  const startYear = calendarStart.getFullYear();
  const endYear = endOfWeek.getFullYear();

  let monthDisplay;
  if (startYear !== endYear) {
    monthDisplay = `${startYear}年${startMonth}月 - ${endYear}年${endMonth}月`;
  } else if (startMonth !== endMonth) {
    monthDisplay = `${startYear}年 ${startMonth}月 - ${endMonth}月`;
  } else {
    monthDisplay = `${startYear}年 ${startMonth}月`;
  }

  // --- 使用 Local Storage ---
  const [games, setGames] = useState(() => {
    try {
      const savedGames = localStorage.getItem('badminton_games');
      if (savedGames) {
        const parsed = JSON.parse(savedGames);
        if (Array.isArray(parsed)) {
          return parsed.filter(g => g && typeof g === 'object' && g.id).sort(sortGamesAsc);
        }
      }
    } catch (e) {
      console.error("Games 解析失敗", e);
    }
    return [];
  });

  const [joiners, setJoiners] = useState(() => {
    try {
      const savedJoiners = localStorage.getItem('badminton_joiners');
      if (savedJoiners) {
        const parsed = JSON.parse(savedJoiners);
        if (Array.isArray(parsed)) {
          return parsed.filter(j => j && typeof j === 'object' && j.id);
        }
      }
    } catch (e) {
      console.error("Joiners 解析失敗", e);
    }
    return [];
  });

  useEffect(() => {
    const sortedGames = [...games].sort(sortGamesAsc);
    localStorage.setItem('badminton_games', JSON.stringify(sortedGames));
  }, [games]);

  useEffect(() => {
    localStorage.setItem('badminton_joiners', JSON.stringify(joiners));
  }, [joiners]);
  // ------------------------------------

  // 自動過濾出今天以後的比賽
  const todayStr = getTodayStr();
  const upcomingGames = games.filter(g => g && typeof g.date === 'string' && g.date >= todayStr);

  const [newGame, setNewGame] = useState({ date: getTodayStr(), time: '18:00', duration: 2, locationPreset: '坑口', customLocation: '', courtPreset: '1', customCourt: '', level: '初級' });
  const [newJoiner, setNewJoiner] = useState({ name: '', gameId: '' });

  useEffect(() => {
    if (newGame.date < getTodayStr()) {
      setNewGame(prev => ({ ...prev, date: getTodayStr() }));
    }
  }, []);

  const [editingGameId, setEditingGameId] = useState(null);
  const [editGameData, setEditGameData] = useState({ date: '', time: '', duration: 2, level: '', location: '', courtNumber: '' });
  const [confirmDeleteGameId, setConfirmDeleteGameId] = useState(null);
  const [editingJoinerId, setEditingJoinerId] = useState(null);
  const [editJoinerName, setEditJoinerName] = useState('');

  const locationOptions = ['坑口', '寶琳', '將軍澳', '單車館', '調景嶺', '其他'];
  const levelOptions = ['初級', '初-近初中', '練習場'];
  const durationOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4];
  const courtOptions = [1, 2, 3, 4, 5, 6, 7, 8, '自定'];

  // 生成時間選項 (僅保留整點)
  const timeOptions = [];
  for (let i = 7; i <= 23; i++) {
    timeOptions.push(`${i.toString().padStart(2, '0')}:00`);
  }

  // --- Handlers ---
  const handleCreateGame = (e) => {
    e.preventDefault();
    const finalLocation = newGame.locationPreset === '其他' ? newGame.customLocation : newGame.locationPreset;
    const finalCourt = newGame.courtPreset === '自定' ? newGame.customCourt : newGame.courtPreset;

    if (!newGame.date || !newGame.time || !finalLocation || !finalCourt) return;
    
    const gameId = crypto.randomUUID();
    const game = { id: gameId, date: newGame.date, time: newGame.time, duration: newGame.duration, location: finalLocation, courtNumber: finalCourt, level: newGame.level };
    
    const updatedGames = [...games, game].sort(sortGamesAsc);
    setGames(updatedGames);
    
    const joinerId = crypto.randomUUID();
    setJoiners([...joiners, { id: joinerId, name: 'Larry', gameId: gameId }]);
    
    setNewGame({ date: newGame.date, time: '18:00', duration: 2, locationPreset: '坑口', customLocation: '', courtPreset: '1', customCourt: '', level: '初級' });
  };

  const handleDeleteGame = (id) => {
    setGames(games.filter(g => g.id !== id));
    setJoiners(joiners.filter(j => j.gameId !== id));
    setConfirmDeleteGameId(null);
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
    setEditGameData({
      date: game.date || '',
      time: game.time || '',
      duration: game.duration || 2,
      level: game.level || '',
      location: game.location || '',
      courtNumber: game.courtNumber || ''
    });
  };

  const saveEditingGame = (id) => {
    if (!editGameData.date || !editGameData.time || !editGameData.location) return;
    const updatedGames = games.map(g => g.id === id ? { ...g, ...editGameData } : g);
    setGames(updatedGames.sort(sortGamesAsc));
    setEditingGameId(null);
  };

  const cancelEditingGame = () => {
    setEditingGameId(null);
  };

  const handleGoToRoster = (gameId) => {
    setCurrentView('joiners');
    setTimeout(() => {
      const element = document.getElementById(`roster-${gameId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-yellow-400', 'border-yellow-400');
        setTimeout(() => element.classList.remove('ring-4', 'ring-yellow-400', 'border-yellow-400'), 2000);
      }
    }, 150);
  };

  const generateGoogleCalendarLink = (game) => {
    if (!game) return '#';
    const dateStr = (game.date && typeof game.date === 'string') ? game.date.replace(/-/g, '') : '';
    const timeStr = (game.time && typeof game.time === 'string') ? game.time.replace(':', '') + '00' : '';
    const startDateTime = `${dateStr}T${timeStr}`;
    const endTimeFormatted = calculateEndTime(game.time, game.duration || 2).replace(':', '') + '00';
    const endDateTime = `${dateStr}T${endTimeFormatted}`;

    const displayLocation = formatLocation(game.location);
    const displayLevel = formatLevel(game.level);

    const title = encodeURIComponent(`${displayLocation} ${game.courtNumber ? `(場號:${game.courtNumber})` : ''} | ${displayLevel}`);
    const location = encodeURIComponent(displayLocation);
    const details = encodeURIComponent('Badminton game organized via Field & Shuttle.');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
  };

  const getJoinerCount = (gameId) => {
    return joiners.filter(j => j && j.gameId === gameId).length;
  };

  const calculateEndTime = (timeStr, duration = 2) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return '';
    let parts = timeStr.split(':');
    let hours = Number(parts[0]) || 0;
    let mins = Number(parts[1]) || 0;
    const totalMins = hours * 60 + mins + Number(duration) * 60;
    const endHours = Math.floor(totalMins / 60) % 24;
    const endMins = totalMins % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // --- Sub-components (Views) ---

  const renderGamesList = (gamesArray, showSyncButton = true, isClickableOnHome = false) => (
    <div className="space-y-3">
      {gamesArray.map(game => {
        if (!game) return null;
        const count = getJoinerCount(game.id);
        const isFull = count >= 6;
        const displayLocation = formatLocation(game.location);
        const displayLevel = formatLevel(game.level);
        
        return (
          <div 
            key={game.id} 
            onClick={() => isClickableOnHome && handleGoToRoster(game.id)}
            className={`p-4 rounded-2xl border shadow-sm flex flex-col transition-all ${isFull ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'} ${isClickableOnHome ? 'cursor-pointer hover:border-yellow-400 hover:shadow-md active:scale-[0.98]' : ''}`}
          >
            {editingGameId === game.id ? (
              <div className="flex flex-col gap-3 w-full animate-in fade-in" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
                    <label className="text-xs font-bold text-slate-500">Court</label>
                    <input type="text" value={editGameData.courtNumber} onChange={e => setEditGameData({...editGameData, courtNumber: e.target.value})} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none focus:border-yellow-400 text-sm font-medium bg-slate-50 text-slate-900" placeholder="Court" />
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
              <div className="flex flex-col gap-2.5 w-full">
                
                <div className={`text-[15px] sm:text-base tracking-tight leading-snug font-bold ${isFull ? 'text-orange-900' : 'text-slate-900'}`}>
                  {game.date} {getWeekday(game.date)} <span className="text-slate-300 font-normal mx-1.5">|</span> {game.time} - {calculateEndTime(game.time, game.duration)}
                </div>
                
                <div className="flex items-center flex-wrap gap-2 text-[13px] sm:text-sm mt-1 text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin size={14} className="text-slate-400"/> {displayLocation}
                  </span>
                  {game.courtNumber && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="text-yellow-600 font-bold">場號: {game.courtNumber}</span>
                    </>
                  )}
                  {displayLevel && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ml-1 ${isFull ? 'bg-orange-200 text-orange-900' : 'bg-slate-100 text-slate-700'}`}>
                      {displayLevel}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between w-full pt-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider ${isFull ? 'bg-orange-200 text-orange-900' : 'bg-blue-50 text-blue-700'}`}>
                      {count} / 6 JOINED
                    </span>
                    {isFull && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">FULL</span>}
                  </div>
                  
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEditingGame(game); }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                      title="Edit Game"
                    >
                      <Edit2 size={16} />
                    </button>

                    {confirmDeleteGameId === game.id ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteGame(game.id); }}
                        className="px-2 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm text-xs"
                      >
                        <Trash2 size={15} /> 確定
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setConfirmDeleteGameId(game.id); 
                          setTimeout(() => setConfirmDeleteGameId(current => current === game.id ? null : current), 3000); 
                        }}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                        title="Delete Game"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    {showSyncButton && (
                      <a 
                        href={generateGoogleCalendarLink(game)} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className={`p-2 rounded-lg transition-colors shadow-sm ${isFull ? 'bg-orange-200 text-orange-800 hover:bg-orange-300' : 'bg-slate-900 text-yellow-400 hover:bg-slate-800'}`}
                      >
                        <CalendarPlus size={16} />
                      </a>
                    )}
                  </div>
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
      <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center w-full px-4 max-w-2xl mx-auto ${upcomingGames.length === 0 ? 'min-h-[50vh]' : 'py-6'}`}>
        
        <button 
          onClick={() => setCurrentView('games')}
          className="group w-full p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-yellow-400 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 bg-slate-900 text-yellow-400 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Calendar size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">New Games</h2>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors">
            <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-900" />
          </div>
        </button>

        <button 
          onClick={() => setCurrentView('joiners')}
          className="group w-full p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-yellow-400 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 bg-yellow-400 text-slate-900 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Users size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">New Joiners</h2>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-yellow-400 transition-colors">
            <ArrowRight size={16} className="text-slate-400 group-hover:text-yellow-400" />
          </div>
        </button>

      </div>

      {upcomingGames.length > 0 && (
        <div className="max-w-2xl mx-auto mb-8 px-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="flex justify-between items-end mb-3 px-2">
            <h3 className="text-xl font-bold text-slate-900">Upcoming Games</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Click card to view roster</span>
          </div>
          {renderGamesList(upcomingGames, true, true)}
        </div>
      )}
    </div>
  );

  const GamesView = () => (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-900 p-5 sm:p-6 text-white flex items-center gap-3">
          <CalendarPlus size={26} className="text-yellow-400" />
          <h2 className="text-xl sm:text-2xl font-semibold">Schedule a Game</h2>
        </div>
        <form onSubmit={handleCreateGame} className="p-5 sm:p-8 space-y-5 sm:space-y-6">
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Calendar size={18} className="text-slate-400"/> Select Date</label>
            {/* 雙週日曆 (僅顯示 14 天) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={handlePrevWeeks} className="p-2 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                <div className="font-bold text-slate-900 text-[15px] sm:text-lg tracking-wide">
                  {monthDisplay}
                </div>
                <button type="button" onClick={handleNextWeeks} className="p-2 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"><ChevronRight size={20}/></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[13px] sm:text-sm">
                {twoWeeks.map((dayObj) => {
                  const isSelected = newGame.date === dayObj.dateStr;
                  return (
                    <button
                      key={dayObj.dateStr}
                      type="button"
                      disabled={dayObj.isPast}
                      onClick={() => setNewGame({...newGame, date: dayObj.dateStr})}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full mx-auto flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-slate-900 text-yellow-400 font-bold shadow-md scale-110' 
                          : dayObj.isPast
                            ? 'text-slate-300 cursor-not-allowed bg-transparent'
                            : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900 font-medium'
                      } ${dayObj.isToday && !isSelected ? 'ring-2 ring-yellow-400 ring-inset' : ''}`}
                    >
                      {dayObj.date}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
            
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Clock size={18} className="text-slate-400"/> Time & Duration</label>
            <div className="flex flex-row items-center gap-2">
              <div className="relative flex-1">
                <select 
                  required
                  value={newGame.time}
                  onChange={(e) => setNewGame({...newGame, time: e.target.value})}
                  className="w-full px-2 sm:px-3 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-yellow-400 outline-none transition-all appearance-none bg-slate-50 font-medium text-slate-900 hover:bg-slate-100 text-[13px] sm:text-sm"
                >
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="relative flex-1">
                <select 
                  required
                  value={newGame.duration}
                  onChange={(e) => setNewGame({...newGame, duration: parseFloat(e.target.value)})}
                  className="w-full px-2 sm:px-3 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-yellow-400 outline-none transition-all appearance-none bg-slate-50 font-medium text-slate-900 hover:bg-slate-100 text-[13px] sm:text-sm"
                >
                  {durationOptions.map(d => <option key={d} value={d}>{d} hrs</option>)}
                </select>
              </div>
              <div className="text-slate-500 text-[11px] sm:text-xs font-medium bg-white px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl border-2 border-slate-100 shrink-0 text-center flex flex-col sm:flex-row items-center justify-center leading-tight">
                <span>Ends at</span>
                <span className="text-slate-900 font-bold sm:ml-1">{calculateEndTime(newGame.time, newGame.duration)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><MapPin size={18} className="text-slate-400"/> Location & Court</label>
            <div className="grid grid-cols-3 gap-2">
              {locationOptions.map(loc => {
                const isSelected = newGame.locationPreset === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setNewGame({...newGame, locationPreset: loc})}
                    className={`relative flex items-center justify-center sm:justify-between p-2 sm:p-2.5 rounded-xl border-2 transition-all duration-200 outline-none ${
                      isSelected ? 'border-yellow-400 bg-white shadow-sm' : 'border-transparent bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`font-semibold text-[13px] sm:text-sm ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                      {loc}
                    </span>
                    {isSelected && (
                      <div className="hidden sm:flex w-5 h-5 rounded-full bg-slate-900 items-center justify-center shrink-0">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {newGame.locationPreset === '其他' && (
              <div className="pt-1.5">
                <input 
                  type="text" 
                  required
                  placeholder="Enter custom location..."
                  value={newGame.customLocation}
                  onChange={(e) => setNewGame({...newGame, customLocation: e.target.value})}
                  className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-yellow-400 outline-none transition-all bg-slate-50 font-medium text-slate-900 text-sm"
                />
              </div>
            )}
            
            <div className="pt-1.5 flex flex-row gap-2">
              <div className="relative w-1/2 sm:w-[40%]">
                <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                  <Hash size={16} className="text-slate-400"/>
                </div>
                <select 
                  required
                  value={newGame.courtPreset}
                  onChange={(e) => setNewGame({...newGame, courtPreset: e.target.value})}
                  className="w-full pl-8 sm:pl-10 pr-2 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-yellow-400 outline-none transition-all appearance-none bg-slate-50 font-medium text-slate-900 hover:bg-slate-100 text-sm"
                >
                  {courtOptions.map(c => <option key={c} value={c}>{c === '自定' ? '自定場號' : `場號 ${c}`}</option>)}
                </select>
              </div>
              {newGame.courtPreset === '自定' && (
                <div className="w-1/2 sm:flex-1">
                  <input 
                    type="text" 
                    required
                    placeholder="自定(例:A場)..."
                    value={newGame.customCourt}
                    onChange={(e) => setNewGame({...newGame, customCourt: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-yellow-400 outline-none transition-all bg-slate-50 font-medium text-slate-900 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2"><Activity size={18} className="text-slate-400"/> Match Level</label>
            <div className="grid grid-cols-3 gap-2">
              {levelOptions.map(level => {
                const isSelected = newGame.level === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setNewGame({...newGame, level})}
                    className={`relative flex items-center justify-center sm:justify-between p-2 sm:p-2.5 rounded-xl border-2 transition-all duration-200 outline-none tracking-tighter sm:tracking-normal ${
                      isSelected ? 'border-yellow-400 bg-white shadow-sm' : 'border-transparent bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`font-semibold text-[12px] sm:text-sm ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                      {level}
                    </span>
                    {isSelected && (
                      <div className="hidden sm:flex w-5 h-5 rounded-full bg-slate-900 items-center justify-center shrink-0">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3.5 rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2 text-[15px] sm:text-lg mt-2"
          >
            <Plus size={20} /> Create Game
          </button>
        </form>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-4 px-2">Upcoming Games</h3>
      {upcomingGames.length === 0 ? (
        <p className="text-center text-slate-500 py-8 font-medium">No games scheduled yet.</p>
      ) : (
        renderGamesList(upcomingGames, true, false)
      )}
    </div>
  );

  const JoinersView = () => {
    const selectedGameIsFull = newJoiner.gameId ? getJoinerCount(newJoiner.gameId) >= 6 : false;

    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-900 p-5 text-white flex items-center gap-3">
            <Users size={24} className="text-yellow-400" />
            <h2 className="text-xl font-semibold">Add New Joiner</h2>
          </div>
        
          {upcomingGames.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-slate-500 mb-3 font-medium">You need to create a game first before adding joiners.</p>
              <button 
                onClick={() => setCurrentView('games')}
                className="text-slate-900 font-bold hover:underline"
              >
                Go to Games
              </button>
            </div>
          ) : (
          <form onSubmit={handleAddJoiner} className="p-5 sm:p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-slate-900">Select Game</label>
              <select 
                required
                value={newJoiner.gameId}
                onChange={(e) => setNewJoiner({...newJoiner, gameId: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-yellow-400 outline-none transition-all appearance-none bg-slate-50 font-medium text-slate-900 hover:bg-slate-100 text-sm"
              >
                <option value="" disabled>Choose a scheduled game...</option>
                {upcomingGames.map(game => {
                  const isFull = getJoinerCount(game.id) >= 6;
                  const displayLocation = formatLocation(game.location);
                  const displayLevel = formatLevel(game.level);

                  return (
                    <option key={game.id} value={game.id} disabled={isFull}>
                      {game.date} | {game.time}-{calculateEndTime(game.time, game.duration)} {game.courtNumber ? `(場:${game.courtNumber})` : ''} | {displayLocation} {isFull ? '(FULL)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {newJoiner.gameId && (
              <div className="bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl flex items-center justify-between mt-2">
                <span className="font-semibold text-xs sm:text-sm">Current Headcount:</span>
                <span className="font-bold text-xs sm:text-sm bg-white px-2.5 py-1 rounded-lg shadow-sm text-slate-900 border border-slate-100">
                  {getJoinerCount(newJoiner.gameId)} joined
                </span>
              </div>
            )}
            
            <div className="space-y-2 pt-1">
              <label className="text-xs sm:text-sm font-bold text-slate-900">Joiner Name</label>
              <input 
                type="text" 
                required
                disabled={selectedGameIsFull}
                placeholder={selectedGameIsFull ? "Game is full" : "e.g. John Doe"}
                value={newJoiner.name}
                onChange={(e) => setNewJoiner({...newJoiner, name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-yellow-400 outline-none transition-all font-medium disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-900 bg-slate-50 hover:bg-slate-100 text-sm"
              />
            </div>

            <button 
              type="submit"
              disabled={selectedGameIsFull}
              className={`w-full font-bold py-3 sm:py-3.5 rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2 text-[15px] sm:text-base mt-2 ${selectedGameIsFull ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900'}`}
            >
              <Plus size={20} /> Add Joiner
            </button>
          </form>
        )}
      </div>

      {upcomingGames.length > 0 && (
        <>
          <h3 className="text-xl font-bold text-slate-900 mb-4 px-2">Rosters</h3>
          <div className="space-y-5 pb-12">
            {upcomingGames.map(game => {
              const gameJoiners = joiners.filter(j => j.gameId === game.id);
              if (gameJoiners.length === 0) return null;
              
              const isFull = gameJoiners.length >= 6;
              const displayLocation = formatLocation(game.location);
              const displayLevel = formatLevel(game.level);
              
              return (
                <div id={`roster-${game.id}`} key={game.id} className={`rounded-3xl border shadow-sm overflow-hidden transition-all duration-500 ${isFull ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-white'}`}>
                  <div className={`border-b px-4 py-3 sm:px-5 sm:py-3.5 flex justify-between items-start ${isFull ? 'border-orange-200' : 'border-slate-200'}`}>
                    
                    <div className="flex flex-col gap-0.5 w-full pr-2">
                      <div className={`font-bold text-[15px] sm:text-base ${isFull ? 'text-orange-900' : 'text-slate-900'}`}>
                        {game.date} {getWeekday(game.date)}
                      </div>
                      <div className="font-bold text-sm sm:text-[15px] text-blue-600 flex items-center gap-1.5 flex-wrap mt-0.5">
                        <Clock size={14} className="inline-block text-blue-500"/>
                        <span>{game.time} - {calculateEndTime(game.time, game.duration)}</span>
                        {game.courtNumber && (
                          <>
                            <span className="text-slate-300 font-normal">|</span>
                            <span className={isFull ? 'text-orange-700' : 'text-yellow-600'}>場號: {game.courtNumber}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 text-[13px] sm:text-sm text-slate-500 font-medium mt-1">
                        <span className="flex items-center gap-1 text-slate-600"><MapPin size={14}/> {displayLocation}</span>
                        {displayLevel && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-0.5 ${isFull ? 'bg-orange-200 text-orange-900' : 'bg-slate-200 text-slate-700'}`}>
                            {displayLevel}
                          </span>
                        )}
                        {isFull && <span className="text-orange-600 text-[10px] font-bold uppercase tracking-wider">(FULL)</span>}
                      </div>
                    </div>

                    <div className={`text-xs sm:text-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-bold whitespace-nowrap shrink-0 mt-0.5 ${isFull ? 'bg-orange-200 text-orange-900' : 'bg-slate-200 text-slate-800'}`}>
                      {gameJoiners.length} / 6
                    </div>
                  </div>
                  <ul className={`divide-y ${isFull ? 'divide-orange-100 bg-white' : 'divide-slate-100 bg-white'}`}>
                    {gameJoiners.map((joiner, index) => (
                      <li key={joiner.id} className="px-5 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-[13px] sm:text-sm ${isFull ? 'bg-orange-100 text-orange-700' : 'bg-slate-900 text-yellow-400'}`}>
                            {index + 1}
                          </div>
                          
                          {editingJoinerId === joiner.id ? (
                            <div className="flex items-center gap-2 flex-grow">
                              <input 
                                type="text" 
                                value={editJoinerName}
                                onChange={(e) => setEditJoinerName(e.target.value)}
                                className="px-3 py-1.5 border-2 border-yellow-400 rounded-lg outline-none focus:ring-0 text-slate-900 font-semibold w-full max-w-[200px] text-sm"
                                autoFocus
                              />
                              <button onClick={() => saveEditingJoiner(joiner.id)} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm transition-colors">
                                <Check size={16} />
                              </button>
                              <button onClick={cancelEditingJoiner} className="p-1.5 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className={`font-semibold text-[15px] sm:text-base ${isFull ? 'text-orange-900' : 'text-slate-900'}`}>
                              {joiner.name}
                            </span>
                          )}
                        </div>
                        
                        {/* Actions (Edit / Delete) */}
                        {editingJoinerId !== joiner.id && (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startEditingJoiner(joiner)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit name"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleRemoveJoiner(joiner.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove joiner"
                            >
                              <Trash2 size={16} />
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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-yellow-200 selection:text-slate-900">
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 sm:gap-3 text-slate-900 font-black text-xl sm:text-2xl cursor-pointer tracking-tight"
            onClick={() => setCurrentView('home')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Trophy className="text-yellow-400" size={18} />
            </div>
            <span>Field <span className="text-yellow-500">&</span> Shuttle</span>
          </div>
          
          {currentView !== 'home' && (
            <button 
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-1.5 sm:gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {currentView === 'home' && HomeView()}
        {currentView === 'games' && GamesView()}
        {currentView === 'joiners' && JoinersView()}
      </main>
    </div>
  );
}