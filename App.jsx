import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  X, 
  Check, 
  User, 
  Coffee, 
  Info, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  Settings,
  Trash2,
  Plus, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Bell,
  BellOff,
  Repeat
} from 'lucide-react';

// --- STYLES & THEME ---
const THEME = {
  background: 'bg-[#F9F7F2]',
  card: 'bg-[#FFFDF9]',
  textPrimary: 'text-[#4A3728]',
  textSecondary: 'text-[#8C7B6E]',
  accent: 'text-[#A67B5B]',
  border: 'border-[#E8E2D9]',
  fontFamily: 'font-serif', 
};

// --- UTILS ---
const calculateStreak = (logs) => {
  if (!logs || logs.length === 0) return 0;
  const uniqueLogs = [...new Set(logs)];
  const sorted = uniqueLogs.sort((a, b) => new Date(b) - new Date(a));
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let count = 0;
  let currentCheck = sorted[0] === today ? today : yesterday;
  const logSet = new Set(uniqueLogs);
  while (logSet.has(currentCheck)) {
    count++;
    const prev = new Date(new Date(currentCheck).getTime() - 86400000).toISOString().split('T')[0];
    currentCheck = prev;
  }
  return count;
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

export default function App() {
  // --- STATE ---
  const [view, setView] = useState('loading'); 
  const [user, setUser] = useState({ id: '', name: '', age: '' });
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState({}); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [draftHabits, setDraftHabits] = useState([]);
  
  // Pause/Delete Logic State
  const [confirmingDelete, setConfirmingDelete] = useState(null); 
  const [isSureAboutDelete, setIsSureAboutDelete] = useState(false);

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());

  const today = new Date().toISOString().split('T')[0];

  // --- PERSISTENCE ---
  useEffect(() => {
    const savedUser = localStorage.getItem('habit_user');
    const savedHabits = localStorage.getItem('habit_list');
    const savedLogs = localStorage.getItem('habit_logs');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedUser && savedHabits) setView('main');
    else setView('auth');
  }, []);

  useEffect(() => {
    if (view !== 'loading') {
      localStorage.setItem('habit_user', JSON.stringify(user));
      localStorage.setItem('habit_list', JSON.stringify(habits));
      localStorage.setItem('habit_logs', JSON.stringify(logs));
    }
  }, [user, habits, logs, view]);

  // --- ACTIONS ---
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (user.id && user.name) setView('onboarding_count');
  };

  const startOnboardingDetails = (count) => {
    setDraftHabits(Array.from({ length: count }, () => ({
      id: crypto.randomUUID(),
      name: '',
      frequency: 7,
      timeOfDay: 'Morning',
      wantsReminder: false
    })));
    setView('onboarding_details');
  };

  const finalizeHabits = () => {
    setHabits(draftHabits);
    setView('main');
  };

  const logActivity = (habitId, status) => {
    if (status === 'done') {
      const habitLogs = logs[habitId] || [];
      if (!habitLogs.includes(today)) {
        setLogs(prev => ({ ...prev, [habitId]: [...habitLogs, today] }));
      }
    }
    if (currentIndex < habits.length - 1) setCurrentIndex(prev => prev + 1);
    else setSessionCompleted(true);
  };

  const requestDelete = (id) => {
    setConfirmingDelete(id);
    setIsSureAboutDelete(false);
  };

  const executeDelete = () => {
    const filtered = habits.filter(h => h.id !== confirmingDelete);
    setHabits(filtered);
    setConfirmingDelete(null);
    setIsSureAboutDelete(false);
    if (currentIndex >= filtered.length && filtered.length > 0) setCurrentIndex(filtered.length - 1);
  };

  const addNewHabit = () => {
    setHabits([...habits, {
      id: crypto.randomUUID(),
      name: 'New Intention',
      frequency: 7,
      timeOfDay: 'Morning',
      wantsReminder: false
    }]);
  };

  // --- COMPONENTS ---

  const MonthlyCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const monthName = calendarDate.toLocaleString('default', { month: 'long' });

    const changeMonth = (offset) => {
      setCalendarDate(new Date(year, month + offset, 1));
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-[0.2em] opacity-50">Monthly Overview</h3>
          <div className="flex gap-4">
            <button onClick={() => changeMonth(-1)}><ChevronLeft size={16}/></button>
            <span className="text-xs italic lowercase">{monthName} {year}</span>
            <button onClick={() => changeMonth(1)}><ChevronRight size={16}/></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={`head-${d}`} className="text-center text-[8px] opacity-30 py-1">{d.charAt(0)}</div>
          ))}
          {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const totalDone = habits.reduce((acc, h) => (logs[h.id]?.includes(dateStr) ? acc + 1 : acc), 0);
            const intensity = habits.length > 0 ? (totalDone / habits.length) : 0;
            
            return (
              <div 
                key={`day-${dateStr}`} 
                className={`aspect-square border border-[#E8E2D9] flex items-center justify-center text-[10px] transition-colors
                  ${intensity > 0.7 ? 'bg-[#5B735B] text-white' : 
                    intensity > 0.3 ? 'bg-[#A67B5B] text-white' : 
                    intensity > 0 ? 'bg-[#F2EDE4]' : 'bg-transparent opacity-40'}
                `}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- VIEWS ---

  if (view === 'loading') return <div className={`min-h-screen ${THEME.background}`} />;

  if (view === 'auth') {
    return (
      <div className={`min-h-screen ${THEME.background} ${THEME.textPrimary} ${THEME.fontFamily} flex flex-col items-center justify-center p-8 animate-in fade-in duration-1000`}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-5xl italic font-light tracking-tight">Sanctuary</h1>
            <p className={`${THEME.textSecondary} text-[10px] uppercase tracking-[0.4em]`}>Digital habit journal</p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-6 mt-12">
            <input className="w-full bg-transparent border-b border-[#D1C7BD] py-3 px-1 focus:outline-none" placeholder="Username" value={user.id} onChange={e => setUser({...user, id: e.target.value})} required />
            <input className="w-full bg-transparent border-b border-[#D1C7BD] py-3 px-1 focus:outline-none" placeholder="Full Name" value={user.name} onChange={e => setUser({...user, name: e.target.value})} required />
            <button className="w-full py-4 mt-8 border border-[#4A3728] hover:bg-[#4A3728] hover:text-white transition-all duration-500 uppercase tracking-widest text-[10px]">Initialize</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'onboarding_count' || view === 'onboarding_details') {
    return (
      <div className={`min-h-screen ${THEME.background} ${THEME.textPrimary} ${THEME.fontFamily} p-8 flex flex-col justify-center`}>
        {view === 'onboarding_count' ? (
          <div className="max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-3">
              <h2 className="text-3xl italic leading-tight">How many intentions?</h2>
              <p className="text-xs text-[#8C7B6E] italic leading-relaxed">
                Focus is a finite resource. To ensure your journey is sustainable, we offer a sanctuary for up to five daily habits.
              </p>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(num => <button key={num} onClick={() => startOnboardingDetails(num)} className="aspect-square border border-[#D1C7BD] hover:bg-[#4A3728] hover:text-white transition-colors flex items-center justify-center text-lg">{num}</button>)}
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-12 animate-in fade-in duration-500 py-12">
            <div className="space-y-2">
              <h2 className="text-3xl italic">Define your path</h2>
              <p className="text-xs text-[#8C7B6E] italic">Clarify your intentions and frequency.</p>
            </div>
            
            <div className="space-y-16">
              {draftHabits.map((h, i) => (
                <div key={`draft-${h.id}`} className="space-y-8 border-l border-[#D1C7BD] pl-6 transition-all duration-300">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest opacity-40">Intention {i + 1}</span>
                    <input 
                      className="text-2xl bg-transparent border-b border-[#E8E2D9] w-full focus:outline-none italic pb-2" 
                      placeholder="What is your focus?" 
                      value={h.name} 
                      onChange={e => {
                        const n = [...draftHabits]; n[i].name = e.target.value; setDraftHabits(n);
                      }} 
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-60">
                      <Repeat size={12} /> Frequency (days per week)
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map(num => (
                        <button
                          key={`freq-${h.id}-${num}`}
                          onClick={() => {
                            const n = [...draftHabits]; n[i].frequency = num; setDraftHabits(n);
                          }}
                          className={`w-8 h-8 text-[10px] border transition-all ${h.frequency === num ? 'bg-[#4A3728] text-white border-[#4A3728]' : 'border-[#E8E2D9] text-[#8C7B6E]'}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => {
                        const n = [...draftHabits]; n[i].wantsReminder = !n[i].wantsReminder; setDraftHabits(n);
                      }}
                      className={`flex items-center gap-2 text-xs transition-colors ${h.wantsReminder ? 'text-[#4A3728]' : 'text-[#8C7B6E] opacity-50'}`}
                    >
                      {h.wantsReminder ? <Bell size={14} /> : <BellOff size={14} />}
                      <span className="uppercase tracking-widest text-[10px]">Set a reminder?</span>
                    </button>

                    {h.wantsReminder && (
                      <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        {['Morning', 'Afternoon', 'Evening'].map(time => (
                          <button
                            key={`time-${h.id}-${time}`}
                            onClick={() => {
                              const n = [...draftHabits]; n[i].timeOfDay = time; setDraftHabits(n);
                            }}
                            className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-all ${h.timeOfDay === time ? 'bg-[#4A3728] text-white border-[#4A3728]' : 'border-[#E8E2D9] text-[#8C7B6E]'}`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={finalizeHabits} className="w-full py-4 border border-[#4A3728] uppercase text-[10px] tracking-widest hover:bg-[#4A3728] hover:text-white transition-all">Begin the Journey</button>
          </div>
        )}
      </div>
    );
  }

  if (view === 'profile') {
    const habitToPause = habits.find(h => h.id === confirmingDelete);
    const logsForHabit = habitToPause ? (logs[habitToPause.id] || []) : [];
    const habitStreak = calculateStreak(logsForHabit);

    return (
      <div className={`min-h-screen ${THEME.background} ${THEME.textPrimary} ${THEME.fontFamily} p-8 pb-32 overflow-x-hidden`}>
        <div className="max-w-lg mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <button onClick={() => setView('main')} className="p-2 -ml-2"><ArrowLeft size={20}/></button>
            <h2 className="text-2xl italic">Sanctuary Settings</h2>
            <div className="w-10"></div>
          </div>

          <MonthlyCalendar />

          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] uppercase tracking-[0.2em] opacity-50">Current Intentions</h3>
              {habits.length < 5 && (
                <button onClick={addNewHabit} className="text-[10px] uppercase border-b border-current flex items-center gap-1"><Plus size={10}/> Add</button>
              )}
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#F2EDE4]/60 border border-[#E8E2D9] rounded-sm italic text-xs text-[#735F4D]">
              <Info size={16} className="shrink-0 opacity-70" />
              <p>Remember: focus is a finite resource. To maintain clarity, we recommend no more than 3-5 daily intentions.</p>
            </div>

            <div className="space-y-4">
              {habits.map((h, i) => (
                <div key={h.id} className="flex flex-col p-4 border border-[#E8E2D9] rounded-sm bg-white/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <input className="bg-transparent italic focus:outline-none text-lg" value={h.name} onChange={e => {
                        const n = [...habits]; n[i].name = e.target.value; setHabits(n);
                      }} />
                      <div className="text-[9px] uppercase opacity-40 mt-1">
                        {calculateStreak(logs[h.id])} Day Streak • {h.timeOfDay} • {h.frequency}x/week
                      </div>
                    </div>
                    <button onClick={() => requestDelete(h.id)} className="text-[#D98E8E] p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={16}/></button>
                  </div>
                  
                  {/* Mini Frequency Review in Settings */}
                  <div className="flex gap-1">
                    {Array.from({ length: h.frequency }, (_, idx) => {
                      const d = new Date(); d.setDate(d.getDate() - (h.frequency - 1 - idx));
                      const isLogged = (logs[h.id] || []).includes(d.toISOString().split('T')[0]);
                      return <div key={`mini-${h.id}-${idx}`} className={`flex-1 h-2 border border-[#E8E2D9] ${isLogged ? 'bg-[#5B735B]' : 'bg-transparent'}`} />;
                    })}
                  </div>
                </div>
              ))}
              {habits.length === 0 && <p className="text-center italic opacity-40 text-sm py-4">No intentions currently active.</p>}
            </div>
          </section>

          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-4 border border-[#D98E8E] text-[#D98E8E] uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100">Reset All Data</button>
        </div>

        {/* --- PAUSE / DELETE MODAL --- */}
        {confirmingDelete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className={`${THEME.card} max-w-sm w-full p-8 border ${THEME.border} rounded-sm shadow-xl space-y-6 text-center`}>
              <div className="flex justify-center text-[#A67B5B]">
                <AlertCircle size={48} strokeWidth={1} />
              </div>
              
              {!isSureAboutDelete ? (
                <div className="space-y-4">
                  <h3 className="text-xl italic">Pause this Intention?</h3>
                  <p className="text-sm text-[#8C7B6E] leading-relaxed">
                    You've worked incredibly hard on <span className="text-[#4A3728] font-bold">"{habitToPause.name}"</span>. 
                    {habitStreak > 0 ? ` You have a ${habitStreak}-day streak protected.` : " Every step counts."} 
                    Are you certain you want to remove this path from your journal?
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmingDelete(null)} className="flex-1 py-3 border border-[#4A3728] text-xs uppercase tracking-widest">Keep It</button>
                    <button onClick={() => setIsSureAboutDelete(true)} className="flex-1 py-3 bg-[#D98E8E] text-white text-xs uppercase tracking-widest">I'm Sure</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl italic text-[#D98E8E]">Final Confirmation</h3>
                  <p className="text-sm text-[#8C7B6E] leading-relaxed">
                    Removing this will archive your progress. This cannot be undone. Do you wish to proceed?
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmingDelete(null)} className="flex-1 py-3 border border-[#4A3728] text-xs uppercase tracking-widest">Go Back</button>
                    <button onClick={executeDelete} className="flex-1 py-3 bg-[#4A3728] text-white text-xs uppercase tracking-widest">Remove Path</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 p-8 flex justify-center gap-12 bg-[#F9F7F2]/90 backdrop-blur-md border-t border-[#E8E2D9] z-20">
          <button className="text-[#D1C7BD]" onClick={() => setView('main')}><Coffee size={24}/></button>
          <button className="text-[#4A3728]" onClick={() => setView('profile')}><User size={24}/></button>
        </nav>
      </div>
    );
  }

  // --- MAIN VIEW ---
  const currentHabit = habits[currentIndex];
  const habitLogs = currentHabit ? (logs[currentHabit.id] || []) : [];
  const isDoneToday = habitLogs.includes(today);
  const currentStreak = currentHabit ? calculateStreak(habitLogs) : 0;

  return (
    <div className={`min-h-screen ${THEME.background} ${THEME.textPrimary} ${THEME.fontFamily} pb-24`}>
      <header className="p-8 border-b border-[#E8E2D9] flex justify-between items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 mb-1">Vol. 01 — Habit Registry</p>
          <h1 className="text-3xl italic lowercase">the quiet progress</h1>
        </div>
        <div className="text-right">
          <p className="text-xs italic">{user.name}</p>
          <p className="text-[10px] uppercase tracking-widest opacity-60">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
      </header>

      <main className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        {habits.length > 0 ? (
          <div className="w-full max-w-sm">
            {sessionCompleted ? (
              <div className="aspect-[3/4] bg-white border border-[#E8E2D9] p-8 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-700">
                <div className="w-16 h-16 rounded-full bg-[#F2EDE4] flex items-center justify-center"><Sparkles size={32} strokeWidth={1}/></div>
                <div className="space-y-2">
                  <h2 className="text-2xl italic">Well done.</h2>
                  <p className="text-sm text-[#8C7B6E]">You have logged your progress for the day. Rest now; the journey continues tomorrow.</p>
                </div>
                <button onClick={() => { setSessionCompleted(false); setCurrentIndex(0); }} className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 underline underline-offset-4 pt-4">Return to Sanctuary</button>
              </div>
            ) : (
              <>
                <div className="relative aspect-[3/4] bg-white border border-[#E8E2D9] p-8 flex flex-col justify-between transition-all duration-500">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase tracking-widest opacity-40">{currentIndex + 1} of {habits.length}</span>
                      {isDoneToday && <CheckCircle2 size={16} className="text-[#5B735B]" />}
                    </div>
                    <h2 className="text-4xl italic mt-6 break-words leading-tight">{currentHabit.name}</h2>
                    <div className="mt-4 flex gap-2">
                      <span className="text-xs px-2 py-1 bg-[#F2EDE4] rounded-full italic">{currentHabit.timeOfDay}</span>
                      <span className="text-xs px-2 py-1 border border-[#E8E2D9] rounded-full italic">{currentHabit.frequency}x week</span>
                      {currentStreak >= 1 && <span className="text-xs px-2 py-1 bg-[#A67B5B] text-white rounded-full flex items-center gap-1 font-bold"><Flame size={12} fill="currentColor"/> {currentStreak} Day</span>}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex gap-6">
                      <button onClick={() => logActivity(currentHabit.id, 'skip')} className="flex-1 aspect-square border border-[#D1C7BD] rounded-full flex items-center justify-center text-[#8C7B6E] active:scale-90 transition-all"><X size={32}/></button>
                      <button onClick={() => logActivity(currentHabit.id, 'done')} className={`flex-1 aspect-square border rounded-full flex items-center justify-center active:scale-90 transition-all ${isDoneToday ? 'bg-[#5B735B] border-[#5B735B] text-white' : 'border-[#4A3728] text-[#4A3728]'}`}><Check size={32}/></button>
                    </div>
                    <p className="text-center text-[10px] uppercase tracking-widest opacity-40">Cross to skip — Check to complete</p>
                  </div>
                </div>
                <div className="flex justify-center gap-2 mt-6">
                  {habits.map((_, i) => <div key={`indicator-${i}`} className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-[#4A3728]' : 'w-2 bg-[#D1C7BD]'}`} />)}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="italic opacity-50">No intentions set.</p>
            <button onClick={() => setView('profile')} className="text-xs uppercase tracking-widest underline">Add some now</button>
          </div>
        )}
      </main>

      <section className="px-8 mt-4 space-y-6 max-w-sm mx-auto">
        <h3 className="text-xs uppercase tracking-widest opacity-60 flex items-center gap-2"><Calendar size={12} /> Frequency Review</h3>
        <div className="space-y-8 pb-12">
          {habits.map(h => {
            const hLogs = logs[h.id] || [];
            return (
              <div key={`review-${h.id}`} className="space-y-3">
                <div className="flex justify-between text-[11px] uppercase tracking-wider">
                  <span className="italic normal-case font-semibold">{h.name}</span>
                  <span className="opacity-60">{h.frequency} Required Steps</span>
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: h.frequency }, (_, i) => {
                    const d = new Date(); d.setDate(d.getDate() - (h.frequency - 1 - i));
                    const isLogged = hLogs.includes(d.toISOString().split('T')[0]);
                    return (
                      <div 
                        key={`slot-${h.id}-${i}`} 
                        className={`flex-1 h-8 border border-[#E8E2D9] transition-all duration-500 flex items-center justify-center
                          ${isLogged ? 'bg-[#5B735B] border-[#5B735B]' : 'bg-transparent'}
                        `}
                      >
                        {isLogged && <Check size={12} className="text-white" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 p-8 flex justify-center gap-12 bg-[#F9F7F2]/90 backdrop-blur-md border-t border-[#E8E2D9] z-20">
        <button className={view === 'main' ? 'text-[#4A3728]' : 'text-[#D1C7BD]'} onClick={() => { setSessionCompleted(false); setView('main'); }}><Coffee size={24}/></button>
        <button className={view === 'profile' ? 'text-[#4A3728]' : 'text-[#D1C7BD]'} onClick={() => setView('profile')}><User size={24}/></button>
      </nav>
    </div>
  );
}