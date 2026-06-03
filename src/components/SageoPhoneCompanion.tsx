import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Mail, X, CheckSquare, Calendar, Bell, Clock, ArrowRight, UserCheck, Volume2, VolumeX, Sparkles, AlertCircle, RefreshCw, ChevronRight, Share, Info } from 'lucide-react';
import { Registration, Event } from '../types';
import { getStoredRegistrations, getStoredEvents } from '../utils';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'agenda' | 'confirmation' | 'checkin' | 'alert';
  eventId?: string;
}

interface SageoPhoneCompanionProps {
  activeStudentNum?: string;
  registrations: Registration[];
  events: Event[];
  onTriggerRefresh: () => void;
}

export default function SageoPhoneCompanion({ 
  activeStudentNum = '', 
  registrations: propRegistrations, 
  events: propEvents,
  onTriggerRefresh 
}: SageoPhoneCompanionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'dashboard' | 'widgets' | 'pwa_guide'>('notifications');
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [hasSound, setHasSound] = useState(true);
  
  // Real native notification permission status
  const [notifPermission, setNotifPermission] = useState<string>('default');

  // Local state for registrations & events to detect changes
  const [prevRegCount, setPrevRegCount] = useState(0);
  const [localRegs, setLocalRegs] = useState<Registration[]>([]);
  
  // Overlay screen push notification (mimics iOS push banner on the main page)
  const [activePushBanner, setActivePushBanner] = useState<NotificationItem | null>(null);
  
  // Track auto-dismiss timers
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Read current system level notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Request system notification permission
  const handleRequestSysPermissions = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('⚠️ Este navegador/dispositivo não suporta notificações do sistema.');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      
      if (permission === 'granted') {
        const welcomeNotif: NotificationItem = {
          id: `perm-${Date.now()}`,
          title: '🔔 Notificações Nativas Concedidas!',
          body: 'Conectado com sucesso ao telemóvel! Agora receberás os teus alarmes de atividades reais no ecrã bloqueado.',
          time: 'Agora',
          type: 'alert'
        };
        triggerPush(welcomeNotif);
      } else if (permission === 'denied') {
        alert('❌ Permissão recusada. Por favor, acede às definições do teu browser/telemóvel para autorizar notificações.');
      }
    } catch (err) {
      console.error('Erro ao pedir permissão de notificações:', err);
    }
  };

  // Sync state and watch for student registrations activity
  useEffect(() => {
    const regs = propRegistrations.length > 0 ? propRegistrations : getStoredRegistrations();
    setLocalRegs(regs);
    
    // Check if a registration changed status or a new one was added to trigger a real-time push alert
    if (prevRegCount > 0 && regs.length > prevRegCount) {
      const latestReg = regs[regs.length - 1];
      const targetEvt = propEvents.find(e => e.id === latestReg.event_id);
      
      const newNotif: NotificationItem = {
        id: `m-notif-${Date.now()}`,
        title: '📝 Pré-Inscrição Submetida',
        body: `Quase de lá! Valida a tua vaga na atividade "${targetEvt?.title || 'Sessão SAGEO'}" confirmando o código no teu e-mail em 5 minutos!`,
        time: 'Agora',
        type: 'confirmation',
        eventId: latestReg.event_id
      };
      
      triggerPush(newNotif);
    } else {
      // Check if any registration was newly confirmed
      const prevConfirmedCount = localRegs.filter(r => r.confirmed).length;
      const currentConfirmedCount = regs.filter(r => r.confirmed).length;
      if (currentConfirmedCount > prevConfirmedCount && prevConfirmedCount > 0) {
        // Find the newly confirmed registration
        const newlyConfirmed = regs.find(r => r.confirmed && !localRegs.find(prev => prev.id === r.id)?.confirmed);
        if (newlyConfirmed) {
          const targetEvt = propEvents.find(e => e.id === newlyConfirmed.event_id);
          const newNotif: NotificationItem = {
            id: `m-notif-${Date.now()}`,
            title: '✅ Inscrição Ativada com Sucesso!',
            body: `Parabéns, a tua vaga em "${targetEvt?.title || 'Atividade SAGEO'}" está garantida! O teu QR code de acesso foi ativado.`,
            time: 'Agora',
            type: 'agenda',
            eventId: newlyConfirmed.event_id
          };
          triggerPush(newNotif);
        }
      }
    }
    
    setPrevRegCount(regs.length);
  }, [propRegistrations, propEvents]);

  // Initial load of some default demo push notifications
  useEffect(() => {
    setNotifs([
      {
        id: 'notif-welcome',
        title: '🚀 Bem-vindo à SAGEO 2026',
        body: 'Inscreve-te em mini-cursos, palestras e conferências sobre o papel dos Geo-Recursos em Angola.',
        time: '08:00',
        type: 'alert'
      },
      {
        id: 'notif-ects',
        title: '🎓 Aproveitamento Curricular garantido',
        body: 'Lembra-te: confere as listas de presenças nos eventos confirmados para acumulares as tuas horas de certificado.',
        time: '08:15',
        type: 'alert'
      }
    ]);
  }, []);

  // Web synthesized audio alert for push notifications
  const playAlertSound = () => {
    if (!hasSound) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);  // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, audioCtx.currentTime); // D4
      osc2.frequency.setValueAtTime(440, audioCtx.currentTime + 0.1);  // A4

      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('AudioContext blocked or un-supported:', e);
    }
  };

  // Triggers visual banner + sound + registers in telephone inbox + launches actual system level native notifications (if granted)
  const triggerPush = (notification: NotificationItem) => {
    playAlertSound();
    
    // 1. Add to in-app simulate lists
    setNotifs(prev => [notification, ...prev]);
    
    // 2. Show floating push banner on top of browser
    setActivePushBanner(notification);
    
    // 3. Fire real system level native notification on physical device (works on iOS and Android)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      // Prefer firing through Service Worker (so it handles background triggers safely)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(notification.title, {
            body: notification.body,
            icon: '/sageo_icon.png',
            badge: '/sageo_icon.png',
            vibrate: [150, 100, 150],
            tag: notification.id,
            renotify: true
          } as any);
        }).catch(() => {
          // Fallback to standard web notification
          try {
            new Notification(notification.title, {
              body: notification.body,
              icon: '/sageo_icon.png'
            });
          } catch (e) {
            console.log('Fired direct notification skipped:', e);
          }
        });
      } else {
        // Pure legacy fallback
        try {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/sageo_icon.png'
          });
        } catch (e) {
          console.log('Notification construction error:', e);
        }
      }
    }
    
    // Clear old timer and set 6s auto-dismiss
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      setActivePushBanner(null);
    }, 6000);
  };

  // Simulate Morning Alarm / Morning Start (Início do Dia)
  const handleSimulateMorningSchedule = (studentNumToUse: string) => {
    const targetStudent = studentNumToUse.trim();
    if (!targetStudent) {
      triggerPush({
        id: `err-${Date.now()}`,
        title: '⚠️ Erro de Simulação',
        body: 'Por favor, introduz uma matrícula de 8 dígitos ou carrega sessão no Portal do Estudante.',
        time: 'Agora',
        type: 'alert'
      });
      return;
    }

    const regs = propRegistrations.length > 0 ? propRegistrations : getStoredRegistrations();
    const evts = propEvents.length > 0 ? propEvents : getStoredEvents();
    
    // Find confirmed registrations for the student
    const studentRegs = regs.filter(
      r => r.student_number.trim() === targetStudent && r.confirmed
    );

    const first_name = studentRegs[0]?.first_name || 'Estudante';

    if (studentRegs.length === 0) {
      triggerPush({
        id: `morning-notif-${Date.now()}`,
        title: '🌅 Inbox de Bom Dia SAGEO',
        body: `Olá ${first_name}! Iniciaste o teu dia, mas ainda não possuis quaisquer atividades CONFIRMADAS para hoje. Consulta o cronograma e ativa os pendentes em 5 minutos!`,
        time: '08:00',
        type: 'alert'
      });
      return;
    }

    // Build the morning event summary list
    const scheduledTitles = studentRegs.map((r, idx) => {
      const evt = evts.find(e => e.id === r.event_id);
      return evt ? `${idx + 1}. [${evt.start_time}h] ${evt.title}` : '';
    }).filter(Boolean).join('\n');

    triggerPush({
      id: `morning-notif-${Date.now()}`,
      title: '🌅 O Teu Horário SAGEO: Início do Dia!',
      body: `Bom dia, ${first_name}! 📅 Tens as seguintes sessões marcadas para hoje:\n${scheduledTitles}\nApresenta o teu bilhete QR no telemóvel à entrada.`,
      time: '08:00',
      type: 'agenda'
    });
  };

  const clearNotifs = () => {
    setNotifs([]);
  };

  // Determine notification counts
  const notificationCount = notifs.length;

  return (
    <>
      {/* 1. FLOATING IOS-STYLE PUSH NOTIFICATION BANNER (Always visible on page if triggered) */}
      {activePushBanner && (
        <div 
          onClick={() => {
            setIsOpen(true);
            setActivePushBanner(null);
          }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md bg-slate-950/95 hover:bg-slate-900 border border-[#dfac34]/50 backdrop-blur-xl shadow-2xl rounded-2xl p-4 flex gap-3 transition-all duration-300 transform translate-y-0 scale-100 cursor-pointer animate-fade-in text-left hover:scale-[1.02] gold-glow"
        >
          <div className="bg-[#dfac34]/20 text-[#dfac34] p-2.5 rounded-xl self-start shrink-0">
            <Bell className="w-5 h-5 text-[#dfac34] animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold text-[#dfac34] uppercase tracking-widest flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Telemóvel SAGEO
              </span>
              <span className="text-[9px] text-slate-500 font-mono">{activePushBanner.time}</span>
            </div>
            <h5 className="text-xs font-extrabold text-white truncate">{activePushBanner.title}</h5>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans font-light mt-0.5 line-clamp-3 whitespace-pre-line">
              {activePushBanner.body}
            </p>
            <p className="text-[9px] text-[#dfac34]/70 font-bold mt-1.5 flex items-center gap-1 font-mono uppercase tracking-wider">
              Ver no telemóvel corporativo <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActivePushBanner(null);
            }} 
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 justify-self-start shrink-0 cursor-pointer animate-fade-in"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. FLOATING TRIGGER BUTTON (Always visible at bottom left) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-slate-950 to-blue-950 hover:from-blue-950 hover:to-slate-900 text-slate-100 font-semibold rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border border-[#dfac34]/20 cursor-pointer text-xs uppercase tracking-wider font-mono hover:border-[#dfac34]/40"
        id="phone-sim-btn"
      >
        <div className="relative">
          <Smartphone className="w-5 h-5 text-[#dfac34]" />
          {notificationCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-rose-500 border border-slate-950 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
              {notificationCount}
            </span>
          )}
        </div>
        <span>Telemóvel SAGEO</span>
      </button>

      {/* 3. SIMULATED RESIZABLE SMARTPHONE SIDEBAR PANNER */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-slate-950 rounded-[40px] border-[6px] border-slate-800 w-full max-w-[370px] h-[680px] flex flex-col shadow-2xl overflow-hidden text-slate-100 flex-shrink-0">
            {/* Top Notch of Smartphone */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-800 rounded-b-xl z-55 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
              <span className="h-1 w-10 rounded-full bg-slate-950" />
            </div>

            {/* Simulated Phone Status Bar */}
            <div className="pt-6 px-6 pb-2 bg-slate-950 flex items-center justify-between text-[10px] font-mono text-slate-400 select-none border-b border-white/5">
              <span>08:00 AM</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setHasSound(!hasSound)} 
                  className={`cursor-pointer ${hasSound ? 'text-emerald-400' : 'text-rose-400'}`}
                  title={hasSound ? 'Sons Ativos' : 'Silenciado'}
                >
                  {hasSound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 rounded text-[8px] font-black tracking-widest font-mono uppercase">5G REAL</span>
                <span>🔋 98%</span>
              </div>
            </div>

            {/* SmartPhone Navigation Sub-tabs */}
            <div className="grid grid-cols-4 border-b border-slate-900 bg-slate-950 text-center text-[10px]">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-3 font-mono font-bold border-b-2 tracking-wider ${
                  activeTab === 'notifications' 
                  ? 'border-[#dfac34] text-[#dfac34] bg-slate-900/10 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Inbox {notificationCount > 0 && `(${notificationCount})`}
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-3 font-mono font-bold border-b-2 tracking-wider ${
                  activeTab === 'dashboard' 
                  ? 'border-[#dfac34] text-[#dfac34] bg-slate-900/10 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🌅 Alarmes
              </button>
              <button
                onClick={() => setActiveTab('widgets')}
                className={`py-3 font-mono font-bold border-b-2 tracking-wider ${
                  activeTab === 'widgets' 
                  ? 'border-[#dfac34] text-[#dfac34] bg-slate-900/10 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📋 QR-Acessos
              </button>
              <button
                onClick={() => setActiveTab('pwa_guide')}
                className={`py-3 font-mono font-bold border-b-2 tracking-wider text-rose-300 ${
                  activeTab === 'pwa_guide' 
                  ? 'border-rose-400 text-rose-400 bg-slate-900/20 font-black' 
                  : 'border-transparent text-[#dfac34]/80 hover:text-white'
                }`}
              >
                📲 Instalar SW
              </button>
            </div>

            {/* Smartphone screen body */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#060b16] via-[#091122] to-[#040810] p-4 flex flex-col justify-between min-h-0 relative scrollbar-thin">
              
              {/* SCREEN CONTENT BY ACTIVE TAB */}
              <div className="flex-1 flex flex-col justify-start">
                
                {/* TAB 1: NOTIFICATIONS SCREEN */}
                {activeTab === 'notifications' && (
                  <div className="space-y-3.5 flex-1 flex flex-col">
                    
                    {/* Native permission toggle header */}
                    <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-2xl flex flex-col gap-2 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-400">Notificações Reais no Telemóvel</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                          notifPermission === 'granted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {notifPermission === 'granted' ? 'ATIVO' : 'PENDENTE'}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-snug font-sans font-light">
                        Ativa as notificações nativas de sistema para receberes no teu ecrã bloqueado real (iPhone/Android).
                      </p>
                      {notifPermission !== 'granted' && (
                        <button
                          onClick={handleRequestSysPermissions}
                          className="w-full py-1.5 bg-[#dfac34] hover:bg-amber-500 text-slate-950 font-black uppercase text-[9px] tracking-widest rounded-lg transition-transform cursor-pointer"
                        >
                          Autorizar Alertas do Sistema
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <h4 className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Centro de Alertas</h4>
                      {notifs.length > 0 && (
                        <button 
                          onClick={clearNotifs}
                          className="text-[9px] font-bold text-[#dfac34]/70 hover:text-amber-400 underline cursor-pointer"
                        >
                          Limpar tudo
                        </button>
                      )}
                    </div>

                    {notifs.length === 0 ? (
                      <div className="my-auto flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-900 mb-3.5 text-slate-600 animate-pulse">
                          <Bell className="w-10 h-10 text-slate-750" />
                        </div>
                        <p className="text-xs font-extrabold text-slate-400 tracking-wide uppercase">Sem Mensagens de Hoje</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-sans max-w-[190px] mt-1.5">
                          Submete qualquer pré-inscrição no portal ou simula o "Começo do dia" para ver os teus alarmes aqui.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
                        {notifs.map(n => (
                          <div 
                            key={n.id} 
                            className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl flex items-start gap-2.5 shadow-md relative group hover:border-[#dfac34]/20 transition-all font-sans"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-[#dfac34] absolute top-4 left-2 shrink-0 animate-pulse" />
                            <div className="flex-1 text-left min-w-0 pl-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[8px] uppercase tracking-widest font-extrabold text-[#dfac34]/80 font-mono">
                                  {n.type === 'agenda' ? '📅 SAGEO Agenda' : n.type === 'confirmation' ? '✉️ SAGEO Ativação' : '⚠️ Alerta Sistema'}
                                </span>
                                <span className="text-[8px] text-slate-500 font-mono shrink-0">{n.time}</span>
                              </div>
                              <h5 className="text-[11px] font-extrabold text-white mt-1 leading-snug">{n.title}</h5>
                              <p className="text-[10px] text-slate-400 leading-relaxed mt-1 font-light whitespace-pre-wrap">{n.body}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: MORNING SIMULATOR (INÍCIO DO DIA) */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-4 text-left">
                    <div className="p-3.5 bg-[#dfac34]/10 border border-[#dfac34]/25 rounded-2xl flex items-start gap-2.5">
                      <Sparkles className="w-5 h-5 text-[#dfac34] shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-bold text-[#dfac34] uppercase tracking-wide">Filtros Anti-Esquecimento ☀️</h4>
                        <p className="text-[10px] text-slate-300 mt-1 leading-relaxed font-sans font-light">
                          Simula o início do dia do estudante. O sistema dispara um sumário completo de atividades para o visor do telemóvel!
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-2xl space-y-4">
                      <h4 className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">Estudante Alvo</h4>
                      
                      {activeStudentNum ? (
                        <div className="p-3 bg-[#dfac34]/5 border border-[#dfac34]/15 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="text-[9px] uppercase font-mono tracking-widest text-[#dfac34] block">Sessão Ativa Detetada</span>
                            <span className="text-xs text-white font-mono font-bold tracking-wider">Matrícula: #{activeStudentNum}</span>
                          </div>
                          <span className="h-2 w-2 rounded-full bg-emerald-400" title="Perfil Ativo" />
                        </div>
                      ) : (
                        <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl text-center">
                          <p className="text-[10px] text-slate-400">Nenhum estudante ativo no Portal. Introduz ou digita a tua matrícula abaixo.</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500 block">Número de Matrícula (8 Digitos)</label>
                        <input 
                          type="text"
                          maxLength={8}
                          placeholder="Ex: 20220001"
                          defaultValue={activeStudentNum}
                          id="morning-student-input"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 uppercase outline-none focus:border-[#dfac34] font-mono"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const el = document.getElementById('morning-student-input') as HTMLInputElement;
                          const studentNo = el ? el.value.trim() : activeStudentNum;
                          handleSimulateMorningSchedule(studentNo);
                        }}
                        className="w-full py-3 bg-[#dfac34] hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Simular Início do Dia 🌅</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: ACTIVE STUDENT TICKETS */}
                {activeTab === 'widgets' && (
                  <div className="space-y-3 text-left">
                    <h4 className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase block">Os Meus Acessos SAGEO</h4>
                    
                    {(() => {
                      const searchNo = activeStudentNum || (document.getElementById('morning-student-input') as HTMLInputElement)?.value || '';
                      if (!searchNo) {
                        return (
                          <div className="py-12 text-center text-slate-500 space-y-2">
                            <AlertCircle className="w-8 h-8 mx-auto text-slate-700" />
                            <p className="text-xs">Identifica o teu cadastro primeiro para listares bilhetes QR ativos.</p>
                          </div>
                        );
                      }

                      const studentRegs = localRegs.filter(r => r.student_number.toUpperCase() === searchNo.toUpperCase());

                      if (studentRegs.length === 0) {
                        return (
                          <div className="py-10 text-center text-slate-500">
                            <p className="text-xs">Nenhum registo ou bilhete gerado para #{searchNo}.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                          {studentRegs.map(reg => {
                            const evt = propEvents.find(e => e.id === reg.event_id);
                            return (
                              <div key={reg.id} className="p-3.5 bg-slate-950/95 border border-slate-900 rounded-2xl space-y-2 font-mono">
                                <div className="flex justify-between items-start gap-2 border-b border-white/5 pb-2">
                                  <div>
                                    <h5 className="text-[11px] font-extrabold text-[#dfac34] truncate max-w-[190px]">{evt ? evt.title : 'Evento SAGEO'}</h5>
                                    <span className="text-[9px] text-slate-500 block">{evt ? evt.location : 'Campus'} &bull; {evt ? evt.start_time : ''} h</span>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    reg.checked_in 
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' 
                                      : reg.confirmed 
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                        : 'bg-rose-500/10 text-rose-450 border border-rose-500/15'
                                  }`}>
                                    {reg.checked_in ? 'Visto Prova' : reg.confirmed ? 'Garantido' : 'Pendente Ativar'}
                                  </span>
                                </div>
                                
                                {reg.confirmed ? (
                                  <div className="text-center bg-white p-2 rounded-xl w-32 mx-auto shadow-md">
                                    <div className="w-28 h-28 bg-[#eaeaea] rounded flex flex-col items-center justify-center border border-slate-300 relative overflow-hidden">
                                      <div className="w-full h-1 bg-rose-500 absolute top-10 animate-pulse shrink-0"></div>
                                      <div className="grid grid-cols-5 gap-[2px] w-[88%] mx-auto">
                                        {Array.from({ length: 25 }).map((_, i) => (
                                          <div 
                                            key={i} 
                                            className={`h-4 w-4 ${
                                              (i * 7 + i % 3 + (reg.qr_token || '').charCodeAt(i % 5 || 0)) % 2 === 0 
                                              ? 'bg-black' 
                                              : 'bg-white'
                                            }`} 
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <span className="text-[8px] text-slate-800 uppercase tracking-widest mt-1 block">BILHETE SAGEO</span>
                                    <span className="text-[8px] text-[#dfac34] font-black">{reg.qr_token || 'SAGEO-CONF'}</span>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-rose-950/10 border border-rose-500/10 rounded-xl text-center">
                                    <p className="text-[9px] text-rose-350 font-normal">Tens uma vaga de pré-inscrição de 5 minutos! Ativa com código no botão "Ativar com Código" para obter o teu QR permanente.</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 4: REAL PWA INSTALLATION GUIDE (FOR IPHONES AND ANDROID DEVICE ACCESS) */}
                {activeTab === 'pwa_guide' && (
                  <div className="space-y-4 text-left font-sans">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex gap-2 items-start text-xs">
                      <Smartphone className="w-5 h-5 shrink-0 text-rose-400 animate-pulse" />
                      <div>
                        <h4 className="font-extrabold uppercase text-[10px] tracking-wider">Suporte Real e Nativo (iOS e Android)</h4>
                        <p className="text-[10px] text-slate-300 mt-1 leading-normal font-light">
                          Os iPhones e Androids agora suportam notificações push de browser reais graças ao SAGEO PWA de forma autêntica! Segue os passos abaixo para instalares.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Apple Card */}
                      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
                        <div className="flex items-center gap-1.5 text-xs text-white font-extrabold uppercase tracking-wide border-b border-slate-850 pb-1.5 mb-2">
                          <span>🍎</span> <span>Telemóveis iPhone (Safari iOS)</span>
                        </div>
                        <ol className="text-[10px] text-slate-300 space-y-2 list-decimal list-inside font-light leading-relaxed">
                          <li>Abre o link deste site no teu navegador original <strong className="text-[#dfac34]">Safari</strong> do iPhone.</li>
                          <li>Clica no botão de <strong className="text-sky-305 flex inline-flex items-center gap-0.5"><Share className="w-3.5 h-3.5 inline text-[#dfac34]" /> Partilhar</strong> ao fundo do ecrã das opções de Safari.</li>
                          <li>Arrasta para baixo e clica em <strong className="text-white">"Ecrã Principal"</strong> (Add to Home Screen).</li>
                          <li>Instala-o! Abre-o a partir do teu ecrã inicial e aceita o pedido de alertas na secção de Notificações!</li>
                        </ol>
                      </div>

                      {/* Google/Android Card */}
                      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
                        <div className="flex items-center gap-1.5 text-xs text-[#dfac34] font-extrabold uppercase tracking-wide border-b border-slate-850 pb-1.5 mb-2">
                          <span>🤖</span> <span>Telemóveis Android (Chrome)</span>
                        </div>
                        <ol className="text-[10px] text-slate-300 space-y-2 list-decimal list-inside font-light leading-relaxed">
                          <li>Clica nos <strong className="text-white">3 pontos</strong> verticais superiores direitos do ecrã do Chrome.</li>
                          <li>Clica em <strong className="text-[#dfac34]">"Adicionar ao Ecrã Inicial"</strong> ou <strong className="text-[#dfac34]">"Instalar SAGEO App"</strong>.</li>
                          <li>Aceita os pedidos de permissão para garantir que o dispositivo vibra e dispara banners em background.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Smartphone physical home button bar representation */}
              <div className="pt-4 border-t border-slate-900 bg-slate-950 text-center flex justify-center pb-2 mt-auto">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onTriggerRefresh(); // Trigger refresh on exit
                  }}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-[10px] text-slate-400 hover:text-white font-mono tracking-widest shrink-0 uppercase transition-colors cursor-pointer"
                >
                  Fechar Telemóvel SAGEO
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
