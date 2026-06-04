import { useState, useEffect } from 'react';
import { Camera, Search, CheckCircle2, AlertCircle, Smartphone, KeyRound, UserCheck, Shield, ToggleLeft, HelpCircle, X, CameraOff } from 'lucide-react';
import { getStoredRegistrations, getStoredEvents, checkInStudent } from '../utils';
import { Registration, Event } from '../types';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerSimulatorProps {
  onCheckinSuccess: (regId: string) => void;
  triggerRefresh: () => void;
  selectedEventId: string;
}

export default function ScannerSimulator({ onCheckinSuccess, triggerRefresh, selectedEventId }: ScannerSimulatorProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
  // Real camera active scanning state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scanner state
  const [ticketInput, setTicketInput] = useState('');
  const [scannedRegistration, setScannedRegistration] = useState<Registration | null>(null);
  const [staffSecretAnswer, setStaffSecretAnswer] = useState('');
  const [bypassQuestion, setBypassQuestion] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [showHowToDialog, setShowHowToDialog] = useState(false);
  
  useEffect(() => {
    // Read from local storage as initial cache
    setRegistrations(getStoredRegistrations());
    setEvents(getStoredEvents());
  }, [selectedEventId]);

  // Real-time camera QR scanner effect
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (cameraActive) {
      setCameraError(null);
      
      const timeoutId = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode("reader");
          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 15,
              qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.75;
                return { width: size, height: size };
              }
            },
            (decodedText) => {
              // Soft tactile audio beep context for authentic check-in experience
              try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                  const beep = new AudioContextClass();
                  const osc = beep.createOscillator();
                  const gain = beep.createGain();
                  osc.connect(gain);
                  gain.connect(beep.destination);
                  osc.type = "sine";
                  osc.frequency.value = 950; // crisp high pitch beep 
                  gain.gain.setValueAtTime(0.12, beep.currentTime);
                  osc.start();
                  osc.stop(beep.currentTime + 0.12);
                }
              } catch (soundErr) {
                console.warn("Soft scan alert output omitted", soundErr);
              }

              // Deactivate camera on validation match
              setCameraActive(false);

              // Force direct lookup
              handleVerifyTicket(decodedText);
            },
            () => {
              // frame match errors (silent)
            }
          ).catch((err) => {
            console.error("Camera fail:", err);
            setCameraError("Acesso à câmara recusado ou indisponível. Dê permissão nas definições do seu browser.");
            setCameraActive(false);
          });
        } catch (e) {
          console.error("Hardware initialization exception:", e);
          setCameraError("Não foi possível aceder ao controlador de câmara do dispositivo.");
          setCameraActive(false);
        }
      }, 350);

      return () => {
        clearTimeout(timeoutId);
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.warn("Clean-up warning:", err));
        }
      };
    }
  }, [cameraActive, selectedEventId]);

  const loadData = () => {
    setRegistrations(getStoredRegistrations());
  };

  // Filter confirmed but not checked-in students for the simulator shortcut
  const pendingStudents = registrations.filter(
    r => r.event_id === selectedEventId && r.confirmed && !r.checked_in
  );

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Handle ticket verification
  const handleVerifyTicket = (regIdOrToken: string) => {
    setValidationMessage(null);
    setStaffSecretAnswer('');
    
    let targetToken = regIdOrToken ? regIdOrToken.trim() : '';

    // Smart-extract identifiers in case of formatted JSON string in QR Code
    if (targetToken.startsWith('{') && targetToken.endsWith('}')) {
      try {
        const parsed = JSON.parse(targetToken);
        if (parsed.registration_id) {
          targetToken = parsed.registration_id;
        } else if (parsed.qr_token) {
          targetToken = parsed.qr_token;
        }
      } catch (e) {
        console.warn("Could not parse JSON payload token", e);
      }
    }
    
    const regs = getStoredRegistrations();
    // Search by exact id, secret confirmation token, student number, or resolved QR token
    const matched = regs.find(
      r => r.id === targetToken || 
           r.confirmation_token === targetToken || 
           r.student_number === targetToken ||
           (r.qr_token && r.qr_token === targetToken)
    );

    if (!matched) {
      setValidationMessage({ type: 'error', text: 'Código de Bilhete / Inscrição inválido.' });
      setScannedRegistration(null);
      return;
    }

    if (matched.event_id !== selectedEventId) {
      const otherEvent = events.find(e => e.id === matched.event_id);
      setValidationMessage({ 
        type: 'error', 
        text: `Este bilhete pertence a outro evento: "${otherEvent?.title || 'Sem título'}"` 
      });
      setScannedRegistration(null);
      return;
    }

    if (matched.checked_in) {
      setValidationMessage({ 
        type: 'error', 
        text: `ALERTA: Presença já confirmada anteriormente em: ${matched.checked_in_at ? new Date(matched.checked_in_at).toLocaleTimeString() : 'N/A'}` 
      });
      setScannedRegistration(matched);
      return;
    }

    setScannedRegistration(matched);
  };

  // Safe checks using backend APIs
  const handleApplyCheckin = async () => {
    if (!scannedRegistration) return;

    setSubmittingCheckin(true);
    setValidationMessage(null);

    try {
      // Direct REST post validation to our express backend server
      const result = await checkInStudent({
        eventId: selectedEventId,
        ticketCode: scannedRegistration.id,
        secretAnswer: staffSecretAnswer,
        bypassSecretQuestion: bypassQuestion
      });

      if (result.success) {
        setValidationMessage({ 
          type: 'success', 
          text: 'CHECK-IN REALIZADO COM SUCESSO! Certidão e-learning curricular gerada e entregue.' 
        });

        // Trigger callbacks to sync state across views and servers
        onCheckinSuccess(scannedRegistration.id);
        triggerRefresh();

        // Delay view resetting
        setTimeout(() => {
          setScannedRegistration(null);
          setStaffSecretAnswer('');
          setValidationMessage(null);
          loadData();
        }, 2200);
      }
    } catch (err: any) {
      setValidationMessage({
        type: 'error',
        text: err.message || 'Falha ao processar o check-in.'
      });
    } finally {
      setSubmittingCheckin(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 1. Simulator Left: Trigger Scan */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-4 text-sm font-mono">
            <Smartphone className="w-4 h-4" />
            <span>TERMINAL DE CONTROLO DE ACESSOS</span>
          </div>
          
          <h4 className="text-lg font-bold text-slate-100 mb-2">Simulação de Scanner & Leitura de QR Codes</h4>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Podes ler os bilhetes confirmados utilizando as câmaras de entrada, inserindo o código do registo, ou selecionando diretamente um dos estudantes inscritos na lista simuladora abaixo para testes rápidos.
          </p>

          {/* Quick Match Student Box */}
          <div className="mb-6 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
              Seleção Rápida de Inscritos ({pendingStudents.length} pendentes)
            </label>
            
            {pendingStudents.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1">Não há mais estudantes com entrada pendente para este evento.</p>
            ) : (
              <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-2">
                {pendingStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => handleVerifyTicket(student.id)}
                    className="w-full text-left p-2 hover:bg-slate-800 bg-slate-900 text-xs rounded-lg flex items-center justify-between group transition-colors border border-slate-800/50"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{student.first_name} {student.last_name}</span>
                      <span className="text-slate-400 font-mono ml-2">({student.student_number})</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25 group-hover:bg-emerald-500 group-hover:text-slate-950 font-semibold transition-colors">
                      Ler Bilhete
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Direct Input Validation */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
              Inserção Manual de ID ou Token QR
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="ID do bilhete, Nº Estudante ou Token QR..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                onClick={() => handleVerifyTicket(ticketInput)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Validar
              </button>
            </div>
          </div>
        </div>

        {/* Real Live QR Camera scanner toggle */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400 font-mono">Leitura Digital via Câmara</span>
            <button
              onClick={() => {
                setCameraActive(!cameraActive);
                setCameraError(null);
              }}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-md ${
                cameraActive 
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30' 
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              {cameraActive ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Desligar Câmara</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ativar Câmara Real</span>
                </>
              )}
            </button>
          </div>

          {/* Camera Viewer panel */}
          {cameraActive ? (
            <div className="relative border-2 border-emerald-500 bg-black rounded-2xl overflow-hidden shadow-emerald-950/20 shadow-2xl animate-fade-in">
              {/* HTML5 QR Code hook reader div */}
              <div id="reader" className="w-full aspect-square bg-slate-950"></div>

              {/* Decorative target overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl"></div>
                  <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr"></div>
                </div>
                {/* Laser animation inside the viewport */}
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse rounded-full laser-sweep"></div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl"></div>
                  <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br"></div>
                </div>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-mono whitespace-nowrap z-10">
                Alinhe o QR Code no centro do visor
              </div>
            </div>
          ) : (
            <div className={`border rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center text-center bg-slate-950/20 relative overflow-hidden group transition-all duration-300 ${
              showHowToDialog ? 'border-dashed border-slate-800' : 'border-solid scanner-border-pulse'
            }`}>
              {/* Decorative scanner frame corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-700 rounded-tl group-hover:border-slate-500 transition-colors"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-700 rounded-tr group-hover:border-slate-500 transition-colors"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-700 rounded-bl group-hover:border-slate-500 transition-colors"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-700 rounded-br group-hover:border-slate-500 transition-colors"></div>

              {/* Scanner sweeping laser effect */}
              <div className="absolute left-6 right-6 h-[2.5px] bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.9)] pointer-events-none rounded-full laser-sweep"></div>

              <Camera className="w-8 h-8 text-slate-500 mb-2 relative z-10" />
              <h5 className="text-xs font-semibold text-slate-350 relative z-10">Câmara de Scan Desativada</h5>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[280px] leading-relaxed relative z-10">
                Ligue o leitor premindo o botão "Ativar Câmara Real" acima para efetuar a leitura através do seu telemóvel.
              </p>

              <button
                id="scanner-sim-btn"
                onClick={() => setShowHowToDialog(true)}
                className="mt-4 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-amber-400 font-bold text-[10px] rounded-xl border border-slate-800/80 transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 relative z-10 active:scale-95 text-slate-200"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Como Digitalizar o QR?</span>
              </button>
            </div>
          )}

          {/* Camera Error Handling */}
          {cameraError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium leading-relaxed">
              ⚠️ {cameraError}
            </div>
          )}

          {/* "How to Scan" Overlay or Tooltip Context inside the scanner simulator screen */}
          {showHowToDialog && (
            <div className={`absolute border border-slate-800 rounded-2xl inset-0 bg-[#060a13] p-5 flex flex-col justify-between text-left animate-fade-in z-30`}>
              {/* Overlay header */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-serif font-black text-xs tracking-wide">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>GUIA DE ALINHAMENTO DE QR CODE</span>
                </div>
                <button
                  onClick={() => setShowHowToDialog(false)}
                  className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-250 transition-colors cursor-pointer"
                  title="Fechar Guia"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Overlay main instructions with mini aligned-box representation */}
              <div className="grid grid-cols-12 gap-3 items-center my-2 text-xs">
                {/* Simulated align target */}
                <div className="col-span-4 relative border-2 border-emerald-500/80 bg-slate-950 rounded-lg h-[92px] flex items-center justify-center p-1.5 overflow-hidden">
                  {/* Corner indicators */}
                  <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-emerald-400"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-emerald-400"></div>
                  <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-emerald-400"></div>
                  <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-emerald-400"></div>
                  
                  {/* Laser line inside help */}
                  <div className="absolute left-1 right-1 h-[1.5px] bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] pointer-events-none rounded-full laser-sweep"></div>
                  
                  {/* Simulated QR Code outline */}
                  <div className="w-10 h-10 border border-dashed border-slate-700 bg-slate-900/50 flex flex-wrap gap-0.5 p-1 items-center justify-center opacity-60">
                    <div className="w-3 h-3 border border-slate-400 self-start justify-self-start mr-auto"></div>
                    <div className="w-3 h-3 border border-slate-400 self-start justify-self-end ml-auto"></div>
                    <div className="w-3 h-3 border border-slate-400 self-end justify-self-start mr-auto mt-2"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 self-center"></div>
                  </div>
                </div>

                {/* Bulleted instructions */}
                <div className="col-span-8 space-y-1.5 text-[10px] leading-relaxed text-slate-300">
                  <div className="flex gap-1.5 items-start">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800 text-amber-500 flex items-center justify-center font-mono text-[9px] font-bold shrink-0 mt-0.5">1</span>
                    <p><strong className="text-slate-100 font-medium">Posicionamento:</strong> Coloque o ecrã do telemóvel virado para a câmara a cerca de 10-15 cm de distância.</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800 text-amber-500 flex items-center justify-center font-mono text-[9px] font-bold shrink-0 mt-0.5">2</span>
                    <p><strong className="text-slate-100 font-medium">Enquadramento:</strong> Centre o QR code dentro das quatro marcas verdes do leitor.</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800 text-amber-500 flex items-center justify-center font-mono text-[9px] font-bold shrink-0 mt-0.5">3</span>
                    <p><strong className="text-slate-100 font-medium">Contraste:</strong> Caso não leia bem, aumente o brilho do seu dispositivo e evite reflexos diretos.</p>
                  </div>
                </div>
              </div>

              {/* Overlay footer */}
              <button
                onClick={() => setShowHowToDialog(false)}
                className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 rounded-lg text-[10px] transition-colors outline-none cursor-pointer text-center"
              >
                Voltar ao Scanner de Câmara
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Simulator Right: Validação de Presença */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-semibold mb-4 text-sm font-mono">
            <KeyRound className="w-4 h-4" />
            <span>MÓDULO DE VERIFICAÇÃO DE SEGURANÇA</span>
          </div>

          <h4 className="text-lg font-bold text-slate-100 mb-2">Verificação dactilográfica e Pergunta Secreta</h4>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Se o bilhete for válido, insira a resposta dada verbalmente pelo aluno para desbloquear o check-in oficial. Isto impede a duplicação ou o roubo de capturas de ecrã dos bilhetes!
          </p>

          {/* Validation Status message block */}
          {validationMessage && (
            <div className={`p-4 rounded-xl mb-6 flex gap-3 text-xs leading-relaxed ${
              validationMessage.type === 'success' 
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            }`}>
              {validationMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <div>
                <p className="font-semibold">{validationMessage.type === 'success' ? 'Verificação OK!' : 'Erro de Validação'}</p>
                <p className="text-slate-400 mt-1">{validationMessage.text}</p>
              </div>
            </div>
          )}

          {scannedRegistration ? (
            <div className="space-y-4 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estudante Confirmado</p>
                  <p className="text-sm font-bold text-slate-200 mt-1">
                    {scannedRegistration.first_name} {scannedRegistration.last_name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {scannedRegistration.course}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nº de Aluno</p>
                  <p className="text-xs font-mono font-semibold text-emerald-400 mt-1">
                    {scannedRegistration.student_number}
                  </p>
                </div>
              </div>

              {/* Secret Area */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold mb-2">
                  <Shield className="w-4 h-4" />
                  <span>Pergunta Secreta do Aluno:</span>
                </div>
                <p className="text-xs text-slate-300 italic mb-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  "{scannedRegistration.secret_question}"
                </p>

                {scannedRegistration.checked_in ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium text-center">
                    Check-in Completo em {scannedRegistration.checked_in_at ? new Date(scannedRegistration.checked_in_at).toLocaleTimeString() : ''}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Bypasse switch */}
                    <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bypass Supervisor (Ignora pergunta)</span>
                      <input 
                        type="checkbox"
                        checked={bypassQuestion}
                        onChange={(e) => setBypassQuestion(e.target.checked)}
                        className="accent-amber-500"
                      />
                    </div>

                    {!bypassQuestion && (
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                          Resposta fornecida verbalmente:
                        </label>
                        <input
                          type="text"
                          value={staffSecretAnswer}
                          onChange={(e) => setStaffSecretAnswer(e.target.value)}
                          placeholder="Introduza a resposta do aluno..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-200 outline-none focus:border-amber-500 transition-colors placeholder-slate-600"
                        />
                        <p className="text-[10px] text-slate-500 mt-1.5 italic">
                          Dica para teste rápido: utilize contas de teste configuradas no ambiente de desenvolvimento.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500 bg-slate-950/20 flex flex-col items-center justify-center h-[230px]">
              <Smartphone className="w-12 h-12 mb-3 text-slate-705 animate-pulse" />
              <p className="text-xs font-semibold">A aguardar leitura de bilhete</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[250px]">Lê o QR Code de um estudante ou clica em "Ler Bilhete" na coluna lateral para prosseguir.</p>
            </div>
          )}
        </div>

        {scannedRegistration && !scannedRegistration.checked_in && (
          <button
            onClick={handleApplyCheckin}
            disabled={(!staffSecretAnswer && !bypassQuestion) || submittingCheckin}
            className="w-full mt-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-950" />
            {submittingCheckin ? 'A registar check-in...' : 'Efetuar Check-in Oficial e Autenticar Presença'}
          </button>
        )}
      </div>
    </div>
  );
}
