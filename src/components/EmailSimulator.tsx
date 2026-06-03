import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, X, ChevronRight, Inbox, Clock, Send, KeyRound, Server, Check } from 'lucide-react';
import { getStoredRegistrations, getStoredEvents } from '../utils';
import { Registration, Event } from '../types';

interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  token: string;
  eventName: string;
  registrationName: string;
}

interface EmailSimulatorProps {
  onConfirmSuccess: (token: string) => void;
  triggerRefresh: number;
}

export default function EmailSimulator({ onConfirmSuccess, triggerRefresh }: EmailSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);

  // SMTP Testing Console States
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ apiKeyExists: boolean; isSmtp?: boolean; activeScope: string } | null>(null);
  
  // Custom test states pre-filled with the user's email
  const [testRecipient, setTestRecipient] = useState('20220001@isptec.co.ao');
  const [testFirstName, setTestFirstName] = useState('Rocélio');
  const [testLastName, setTestLastName] = useState('Da Silva');
  const [testSubject, setTestSubject] = useState('🎓 CERTIFICADO OFICIAL SAGEO: Teste SMTP');
  const [testEventName, setTestEventName] = useState('Sessão Especial SAGEO 2026');
  const [isSendingRealTest, setIsSendingRealTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; simulated: boolean; message: string } | null>(null);

  // Refresh regular emails
  useEffect(() => {
    const regs = getStoredRegistrations();
    const events = getStoredEvents();
    
    const unconfirmedEmails: Email[] = regs
      .filter(r => !r.confirmed)
      .map(r => {
        const evt = events.find(e => e.id === r.event_id);
        const eventName = evt ? evt.title : 'Evento SAGEO';
        
        return {
          id: r.id,
          to: r.institutional_email,
          subject: `🔗 CONFIRMAÇÃO OBRIGATÓRIA: Inscrição SAGEO - ${eventName}`,
          registrationName: `${r.first_name} ${r.last_name}`,
          eventName,
          sentAt: new Date(r.token_expires_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
          token: r.confirmation_token,
          body: `Olá ${r.first_name},\n\nPara garantir a tua vaga na sessão "${eventName}", precisas de validar as tuas credenciais de estudante no prazo de 5 minutos.\n\nLembra-te de memorizar a tua resposta à pergunta secreta para o check-in na entrada!`
        };
      })
      .reverse(); // Newest first

    setEmails(unconfirmedEmails);
    setBadgeCount(unconfirmedEmails.length);
  }, [triggerRefresh, isOpen]);

  // Check Resend API status on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/email-status')
        .then(res => res.json())
        .then(data => setApiStatus(data))
        .catch(err => console.error('Erro ao verificar ligação de emails:', err));
    }
  }, [isOpen, triggerRefresh]);

  const handleConfirm = (token: string) => {
    onConfirmSuccess(token);
    setIsOpen(false);
    setSelectedEmail(null);
    setIsTestingMode(false);
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingRealTest(true);
    setTestResult(null);

    try {
      // Generate a personalized high-resolution certificate base64 string on the fly
      const canvas = document.createElement('canvas');
      canvas.width = 1120;
      canvas.height = 792;
      const ctx = canvas.getContext('2d');
      let base64Cert = '';

      if (ctx) {
        const w = 1120;
        const h = 792;

        // Draw standard SAGEO Royal Navy Theme
        const bgColor = '#03081a';
        const outerBorderColor = '#dfac34';
        const innerBorderColor = '#101e3d';
        const primaryTextColor = '#f8fafc';
        const secondaryTextColor = '#64748b';
        const descriptionTextColor = '#e2e8f0';
        const focusColor = '#dfac34';

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);

        // Micro wavy background representation
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 80) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.bezierCurveTo(i + 150, h / 3, i - 150, (h * 2) / 3, i, h);
          ctx.stroke();
        }

        // Border bounds
        ctx.lineWidth = 12;
        ctx.strokeStyle = outerBorderColor;
        ctx.strokeRect(18, 18, w - 36, h - 36);

        ctx.lineWidth = 2;
        ctx.strokeStyle = innerBorderColor;
        ctx.strokeRect(32, 32, w - 64, h - 64);

        // Corner flourishes
        const drawFlourish = (cx: number, cy: number, xDir: number, yDir: number) => {
          ctx.beginPath();
          ctx.moveTo(cx + xDir * 35, cy);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx, cy + yDir * 35);
          ctx.moveTo(cx + xDir * 15, cy + yDir * 15);
          ctx.lineTo(cx + xDir * 25, cy + yDir * 15);
          ctx.lineTo(cx + xDir * 15, cy + yDir * 25);
          ctx.closePath();
          ctx.fillStyle = focusColor;
          ctx.strokeStyle = focusColor;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fill();
        };

        drawFlourish(32, 32, 1, 1);
        drawFlourish(w - 32, 32, -1, 1);
        drawFlourish(32, h - 32, 1, -1);
        drawFlourish(w - 32, h - 32, -1, -1);

        // Branding Header
        ctx.textAlign = 'center';
        ctx.fillStyle = focusColor;
        ctx.font = 'bold 24px "Space Grotesk", sans-serif';
        ctx.fillText('S A G E O   2 0 2 6', w / 2, 85);

        ctx.fillStyle = secondaryTextColor;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('SEMANA ACADÉMICA DE ENGENHARIA E ORGANIZAÇÃO  |  PORTUGAL', w / 2, 110);

        // Shield Logo drawing
        const logoY = 180;
        const logoX = w / 2;
        ctx.save();
        ctx.strokeStyle = focusColor;
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.moveTo(logoX, logoY - 35);
        ctx.quadraticCurveTo(logoX + 25, logoY - 35, logoX + 25, logoY - 10);
        ctx.quadraticCurveTo(logoX + 25, logoY + 15, logoX, logoY + 30);
        ctx.quadraticCurveTo(logoX - 25, logoY + 15, logoX - 25, logoY - 10);
        ctx.quadraticCurveTo(logoX - 25, logoY - 35, logoX, logoY - 35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(logoX - 24, logoY - 5);
        ctx.lineTo(logoX + 24, logoY - 5);
        ctx.stroke();

        ctx.fillStyle = focusColor;
        ctx.font = '12px Georgia';
        ctx.fillText('★', logoX, logoY - 12);
        ctx.fillText('★', logoX - 10, logoY + 10);
        ctx.fillText('★', logoX + 10, logoY + 10);
        ctx.restore();

        // Titles
        ctx.fillStyle = primaryTextColor;
        ctx.font = 'bold 38px Georgia, serif';
        ctx.fillText('Certificado de Participação', w / 2, 275);

        ctx.fillStyle = descriptionTextColor;
        ctx.font = 'italic 16px Georgia, serif';
        ctx.fillText('Certifica-se, para a devida concessão de créditos curriculares Erasmus ECTS, que', w / 2, 330);

        // Student name (Personalized)
        ctx.fillStyle = focusColor;
        ctx.font = 'bold 36px "Space Grotesk", sans-serif';
        const fullNameCombined = `${testFirstName} ${testLastName}`.toUpperCase();
        ctx.fillText(fullNameCombined, w / 2, 395);

        // Institutional details
        ctx.fillStyle = primaryTextColor;
        ctx.font = '15px "Space Grotesk", sans-serif';
        ctx.fillText(`Inscrito sob a matrícula institucional de índice público 20220001`, w / 2, 440);

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillText(`CURSO AUTÓNOMO: CIÊNCIAS DA TERRA E ENGENHARIA`, w / 2, 475);

        ctx.fillStyle = descriptionTextColor;
        ctx.font = 'italic 15px Georgia, serif';
        ctx.fillText('concluiu com aproveitamento e presença verificada em sistema informático a atividade letiva:', w / 2, 520);

        ctx.fillStyle = primaryTextColor;
        ctx.font = 'bold italic 22px Georgia, serif';
        ctx.fillText(`"${testEventName}"`, w / 2, 560);

        ctx.fillStyle = secondaryTextColor;
        ctx.font = '13px "Space Grotesk", sans-serif';
        const formattedDate = new Date().toLocaleDateString('pt-PT', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        ctx.fillText(`Leccionado por: Palestrante SAGEO  |  Emitido a ${formattedDate}`, w / 2, 595);

        // Honorific credits
        const honorificMention = 'Participação Excecional';
        ctx.save();
        const textWidth = ctx.measureText(honorificMention).width + 30;
        ctx.strokeStyle = focusColor;
        ctx.lineWidth = 1.5;
        ctx.fillStyle = 'rgba(223, 172, 52, 0.05)';
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(w / 2 - textWidth / 2, 615, textWidth, 24, 12);
        } else {
          ctx.rect(w / 2 - textWidth / 2, 615, textWidth, 24);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = focusColor;
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(`CRÉDITOS ECTS ATRIBUÍDOS: 4.0h - ${honorificMention.toUpperCase()}`, w / 2, 631);
        ctx.restore();

        // Sign-offs
        const sigY = 695;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 270, sigY);
        ctx.lineTo(w / 2 - 70, sigY);
        ctx.stroke();

        ctx.fillStyle = primaryTextColor;
        ctx.font = 'bold 12px "Space Grotesk", sans-serif';
        ctx.fillText('Prof. Dr. Armando Silva', w / 2 - 170, sigY + 18);
        ctx.fillStyle = secondaryTextColor;
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText('PRESIDÊNCIA DO SAGEO 2026', w / 2 - 170, sigY + 31);

        // scribble 1
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 220, sigY - 25);
        ctx.bezierCurveTo(w / 2 - 200, sigY - 45, w / 2 - 140, sigY - 5, w / 2 - 120, sigY - 25);
        ctx.bezierCurveTo(w / 2 - 110, sigY - 35, w / 2 - 90, sigY - 10, w / 2 - 80, sigY - 20);
        ctx.stroke();

        // Right Line
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2 + 70, sigY);
        ctx.lineTo(w / 2 + 270, sigY);
        ctx.stroke();

        ctx.fillStyle = primaryTextColor;
        ctx.font = 'bold 12px "Space Grotesk", sans-serif';
        ctx.fillText('Coord. Drª Carlota Abreu', w / 2 + 170, sigY + 18);
        ctx.fillStyle = secondaryTextColor;
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText('DIREÇÃO ACADÉMICA COADJUVANTE', w / 2 + 170, sigY + 31);

        // scribble 2
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(w / 2 + 110, sigY - 22);
        ctx.bezierCurveTo(w / 2 + 140, sigY - 40, w / 2 + 160, sigY - 5, w / 2 + 180, sigY - 28);
        ctx.bezierCurveTo(w / 2 + 190, sigY - 45, w / 2 + 210, sigY - 15, w / 2 + 230, sigY - 25);
        ctx.stroke();

        // Stamp
        const stampX = w / 2;
        const stampY = sigY - 25;
        ctx.save();
        const points = 24;
        const outerRad = 28;
        const innerRad = 24;
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const theta = (i * Math.PI * 2) / points;
          const radius = i % 2 === 0 ? outerRad : innerRad;
          const xPos = stampX + Math.cos(theta) * radius;
          const yPos = stampY + Math.sin(theta) * radius;
          if (i === 0) ctx.moveTo(xPos, yPos);
          else ctx.lineTo(xPos, yPos);
        }
        ctx.closePath();
        ctx.fillStyle = '#dfac34';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#cb9c22';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(stampX, stampY, 20, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#78350f';
        ctx.font = '13px Georgia';
        ctx.fillText('★', stampX, stampY + 4);
        ctx.restore();

        // security hash
        ctx.fillStyle = secondaryTextColor;
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText(
          `VALIDAÇÃO DIGITAL UNIFICADA: SHA256-TEST_SMTP_DIAGNOSTIC  |  DATA LOG: ${new Date().toLocaleString('pt-PT')}  | IP: 127.0.0.1`,
          w / 2,
          762
        );

        base64Cert = canvas.toDataURL('image/png');
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testRecipient,
          subject: testSubject,
          firstName: testFirstName,
          lastName: testLastName,
          eventName: testEventName,
          certificateImage: base64Cert
        })
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch (err) {
        data = { message: "Servidor indisponível temporariamente." };
      }

      if (response.ok) {
        setTestResult({
          success: true,
          simulated: data.status === 'simulated',
          message: data.status === 'simulated'
            ? 'Mensagem processada! O servidor local de sandbox deteve este e-mail no Simulador de Entrada.'
            : `Fabuloso! O e-mail em tempo real foi transmitido e entregue nos servidores da Resend com destino a ${testRecipient}!`
        });

        // Trigger updating diagnostic stats or adding standard mock message if simulated
        if (data.status === 'simulated') {
          // Push a dynamic simulation log to the inbox lists so they can instantly view it!
          const newSimulatedEmail: Email = {
            id: `test-${Date.now()}`,
            to: testRecipient,
            subject: testSubject,
            registrationName: `${testFirstName} ${testLastName}`,
            eventName: testEventName,
            sentAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            token: `TOK-SIM-${Math.floor(10000 + Math.random() * 90000)}`,
            body: `Parabéns ${testFirstName} ${testLastName}!\n\nEste é um e-mail de teste disparado com sucesso da consola de diagnósticos SAGEO.\n\nAtividade: ${testEventName}\n\nO sistema de correio está totalmente funcional!`
          };
          setEmails(prev => [newSimulatedEmail, ...prev]);
          setBadgeCount(prev => prev + 1);
        }
      } else {
        setTestResult({
          success: false,
          simulated: false,
          message: data.error || data.message || 'Falha na resposta do gateway de correio eletrónico.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        simulated: false,
        message: err.message || 'Erro de rede na ligação ao servidor.'
      });
    } finally {
      setIsSendingRealTest(false);
    }
  };

  return (
    <>
      {/* Trigger Button with Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border border-emerald-400/20 cursor-pointer"
        id="email-sim-btn"
      >
        <Mail className="w-5 h-5 animate-pulse" />
        <span className="text-sm">Correio Académico</span>
        {badgeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-emerald-900 animate-bounce">
            {badgeCount}
          </span>
        )}
      </button>

      {/* Floating Email Client Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl h-[620px] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            {/* Inbox header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400 animate-pulse">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Central de Correio & Diagnósticos</h3>
                  <p className="text-xs text-slate-400 font-mono">Entrega simulada em Sandbox local & Disparo SMTP em Tempo Real</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsOpen(false); setSelectedEmail(null); setIsTestingMode(false); }}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Client Content Split */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Column: List */}
              <div className={`w-full md:w-[350px] border-r border-slate-800 flex flex-col justify-between overflow-hidden ${selectedEmail || isTestingMode ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-800/60 scrollbar-thin">
                  {emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                      <Mail className="w-12 h-12 mb-3 opacity-30 text-emerald-500" />
                      <p className="text-sm font-semibold">Caixa de Entrada Vazia</p>
                      <p className="text-xs mt-1 max-w-[200px] text-slate-450 leading-relaxed">Podes preencher um registo no painel ou clicar no botão abaixo para testar o envio para o teu e-mail real!</p>
                    </div>
                  ) : (
                    emails.map(email => (
                      <button
                        key={email.id}
                        onClick={() => { setSelectedEmail(email); setIsTestingMode(false); }}
                        className={`w-full text-left p-4 hover:bg-slate-800/45 transition-colors flex flex-col gap-1.5 relative ${
                          selectedEmail?.id === email.id ? 'bg-slate-750/35 border-l-4 border-emerald-500 pl-3' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-mono font-bold text-emerald-400 truncate max-w-[140px]">{email.to}</span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {email.sentAt}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-200 line-clamp-1">{email.eventName}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{email.subject}</p>
                      </button>
                    ))
                  )}
                </div>

                {/* Left side Action footer */}
                <div className="p-3 bg-slate-950/60 border-t border-slate-850 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsTestingMode(true);
                      setSelectedEmail(null);
                      setTestResult(null);
                    }}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                      isTestingMode
                        ? 'bg-[#dfac34] text-slate-950 shadow-md font-black'
                        : 'bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>Disparar E-mail Real</span>
                  </button>
                </div>
              </div>

              {/* Right Column: View / Form */}
              <div className={`flex-1 flex flex-col overflow-hidden bg-slate-950/20 ${!selectedEmail && !isTestingMode ? 'hidden md:flex items-center justify-center text-slate-500' : 'flex'}`}>
                {isTestingMode ? (
                  /* THE SMTP DIAGNOSTIC SENDER PANEL */
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-[#dfac34]" />
                        <h4 className="font-bold text-slate-100 text-sm tracking-wide uppercase">Consola de Transmissão SMTP</h4>
                      </div>
                      <button 
                        onClick={() => setIsTestingMode(false)}
                        className="text-[10px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Fechar Consola
                      </button>
                    </div>

                    {/* API STATUS DYNAMIC CARD */}
                    {apiStatus?.apiKeyExists ? (
                      apiStatus.isSmtp ? (
                        <div className="p-4 bg-emerald-950/15 border border-emerald-500/25 rounded-2xl flex items-start gap-3">
                          <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">🔒 Envio Real Grátis Ativo (SMTP)</h5>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              O SAGEO detetou as tuas variáveis de <strong>SMTP Direto</strong> (.env). Cada e-mail disparado nesta consola enviará correio real sem custos, contornando a Resend e permitindo que envies certificados livremente!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-teal-950/15 border border-teal-500/25 rounded-2xl flex items-start gap-3">
                          <div className="bg-teal-500/20 text-teal-400 p-2 rounded-xl shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-teal-400 uppercase tracking-wider">🔒 Envio Real Ativo (Resend)</h5>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              A chave de API do Resend foi detetada. Os e-mails reais são despachados através do limite grátis da plataforma Resend (3,000 e-mails do plano gratuito).
                            </p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="p-4 bg-[#dfac34]/10 border border-[#dfac34]/25 rounded-2xl flex items-start gap-3">
                        <div className="bg-[#dfac34]/15 text-[#dfac34] p-2 rounded-xl shrink-0">
                          <AlertCircle className="w-4 h-4 animate-bounce" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-[#dfac34] uppercase tracking-wider">⚠️ Modo Simulação (Sandbox)</h5>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            Nenhum ligador SMTP real ou chave Resend foi detetado no ficheiro de configuração <code className="bg-slate-950 text-[#dfac34] px-1 rounded font-mono text-[10px]">.env</code>.
                            Os e-mails serão entregues apenas no <strong>Simulador do Correio</strong> (painel à esquerda).
                          </p>
                          <div className="mt-3 p-3 bg-slate-950/80 rounded-xl space-y-2 border border-slate-900 text-[10px] text-slate-350 leading-normal">
                            <p className="font-bold text-[#dfac34] text-xs">Como enviar e-mails reais grátis sem API Resend (via SMTP)?</p>
                            <p>No editor de backend (botão <strong>"Segredos"</strong> do menu), adicione as seguintes chaves de ambiente:</p>
                            <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[9px] bg-slate-900/60 p-2 rounded-lg">
                              <li><code className="text-emerald-400">SMTP_HOST</code> = smtp.gmail.com (ou do seu ISP/instituição)</li>
                              <li><code className="text-emerald-400">SMTP_PORT</code> = 587 (Standard TLS) ou 465</li>
                              <li><code className="text-emerald-400">SMTP_USER</code> = o seu endereço de email completo</li>
                              <li><code className="text-emerald-400">SMTP_PASS</code> = a sua palavra-chave de app (Ex: Gmail App Password)</li>
                            </ul>
                            <p className="italic text-slate-400 pt-1">💡 Desta forma, o envio é feito diretamente pelo seu servidor de e-mail sem precisar pagar por nenhum serviço!</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SENDER TEST FORM */}
                    <form onSubmit={handleSendTestEmail} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-mono">Destinatário Principal</label>
                          <input
                            type="email"
                            required
                            value={testRecipient}
                            onChange={(e) => setTestRecipient(e.target.value)}
                            placeholder="rocelioinc@gmail.com"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-[#dfac34] font-mono transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-mono">Atividade de Teste</label>
                          <input
                            type="text"
                            required
                            value={testEventName}
                            onChange={(e) => setTestEventName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-[#dfac34] transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-mono">Primeiro Nome</label>
                          <input
                            type="text"
                            required
                            value={testFirstName}
                            onChange={(e) => setTestFirstName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-[#dfac34] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-mono">Último Nome</label>
                          <input
                            type="text"
                            required
                            value={testLastName}
                            onChange={(e) => setTestLastName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-[#dfac34] transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-mono">Assunto do E-mail</label>
                        <input
                          type="text"
                          required
                          value={testSubject}
                          onChange={(e) => setTestSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-[#dfac34] transition-colors"
                        />
                      </div>

                      {/* SUBMIT BUTTON */}
                      <button
                        type="submit"
                        disabled={isSendingRealTest}
                        className="w-full py-3 bg-[#dfac34] hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:cursor-not-allowed"
                      >
                        {isSendingRealTest ? (
                          <>
                            <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>A transmitir para o SMTP...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Efetuar Envio de Teste</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* DYNAMIC RESULTS STATUS CONTAINER */}
                    {testResult && (
                      <div className={`p-4 rounded-2xl border text-xs leading-relaxed animate-fade-in ${
                        testResult.success 
                          ? testResult.simulated 
                            ? 'bg-amber-950/15 border-amber-500/20 text-slate-350'
                            : 'bg-emerald-950/20 border-emerald-500/20 text-slate-250 font-medium'
                          : 'bg-rose-950/20 border-rose-500/20 text-rose-350 font-bold'
                      }`}>
                        <div className="flex items-center gap-2 mb-1.5 font-bold uppercase text-[10px] tracking-wider">
                          {testResult.success ? (
                            <>
                              <CheckCircle2 className={`w-4 h-4 ${testResult.simulated ? 'text-amber-400' : 'text-emerald-400'}`} />
                              <span className={testResult.simulated ? 'text-amber-400' : 'text-emerald-400'}>
                                {testResult.simulated ? 'SIMULAÇÃO CONCLUÍDA' : 'TRANSMISSÃO REAL EFECTUADA'}
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-rose-450" />
                              <span className="text-rose-450">ERRO NO DISPARO</span>
                            </>
                          )}
                        </div>
                        <p>{testResult.message}</p>
                        {testResult.success && testResult.simulated && (
                          <p className="mt-2 text-[10px] text-slate-400 italic">
                            💡 Podes ver este e-mail exatamente como ficaria, clicando na lista de e-mails à esquerda para vê-lo no ecrã!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : selectedEmail ? (
                  /* THE SELECTED EMAIL PREVIEW SHOWN IN COLOURED CSS */
                  <div className="flex-1 flex flex-col overflow-y-auto p-5 scrollbar-thin">
                    {/* Back Button for mobile */}
                    <button 
                      onClick={() => setSelectedEmail(null)}
                      className="md:hidden flex items-center text-emerald-400 text-xs font-semibold mb-4 gap-1 cursor-pointer"
                    >
                      &larr; Voltar para a Inbox
                    </button>

                    {/* Email Headers */}
                    <div className="border-b border-slate-800 pb-4 mb-4">
                      <h4 className="font-bold text-slate-100 text-md">{selectedEmail.subject}</h4>
                      <p className="text-xs text-slate-400 mt-2">
                        <span className="text-slate-500 font-mono">Para:</span> {selectedEmail.to}
                      </p>
                      <p className="text-xs text-slate-400">
                        <span className="text-slate-500 font-mono">Enviado:</span> Hoje às {selectedEmail.sentAt} (Expira em 60 min)
                      </p>
                    </div>

                    {/* Email Body */}
                    <div className="flex-1 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedEmail.body}
                      
                      {/* Interactive Call to Action */}
                      {selectedEmail.token && !selectedEmail.token.startsWith('TOK-SIM-') && (
                        <div className="my-8 p-5 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl text-center">
                          <p className="text-xs text-emerald-400 font-semibold mb-3">Autenticação de Estudante SAGEO</p>
                          <button
                            onClick={() => handleConfirm(selectedEmail.token)}
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-slate-950" />
                            Confirmar Inscrição Académica
                          </button>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-505 italic">
                        Esta mensagem foi gerada automaticamente pelo sistema de inscrições da SAGEO 2026. Se não requisitaste esta inscrição, podes ignorar este email.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* THE BLANK PLACEHOLDER STATE */
                  <div className="text-center p-6 my-auto">
                    <Mail className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                    <p className="text-sm font-medium">Seleciona um e-mail para visualizar</p>
                    <p className="text-xs text-slate-500 mt-1">Abre os e-mails académicos provisórios e confirma a tua presença com o token.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
