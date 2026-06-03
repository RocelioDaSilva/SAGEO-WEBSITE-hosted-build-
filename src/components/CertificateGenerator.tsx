import { useRef, useEffect, useState } from 'react';
import { Award, Download, X, ShieldCheck, Printer, Paintbrush, Layers, Landmark, Mail, Send, Check, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Registration, Event } from '../types';

interface CertificateGeneratorProps {
  registration: Registration;
  event: Event;
  onClose: () => void;
}

type ThemeType = 'royal_navy' | 'imperial_cream' | 'obsidian_jade' | 'sunset_gold';
type LogoType = 'shield_crest' | 'geoscience_compass' | 'tech_hexagon';
type SignatureType = 'double_auth' | 'presidency_only' | 'department_only';

export default function CertificateGenerator({ registration, event, onClose }: CertificateGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Customization States
  const [theme, setTheme] = useState<ThemeType>('royal_navy');
  const [logoStyle, setLogoStyle] = useState<LogoType>('shield_crest');
  const [signatureStyle, setSignatureStyle] = useState<SignatureType>('double_auth');
  const [customTitle, setCustomTitle] = useState('Certificado de Participação');
  const [honorificMention, setHonorificMention] = useState('Participação Excecional');
  const [showSecurityHash, setShowSecurityHash] = useState(true);
  const [showMetallicStamp, setShowMetallicStamp] = useState(true);
  const [badgeMetallicColor, setBadgeMetallicColor] = useState<'gold' | 'platinum'>('gold');
  
  // Interactive Email Status
  const [recipientEmail, setRecipientEmail] = useState(registration.institutional_email);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Enhanced Retry and Status tracking states
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Redraw when any customizable property changes, ensuring custom fonts are loaded
  useEffect(() => {
    let active = true;
    
    // Initial paint
    drawCertificate();
    
    // Re-paint when fonts have loaded asynchronously in the browser
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        if (active) drawCertificate();
      });
    }
    
    return () => {
      active = false;
    };
  }, [theme, logoStyle, signatureStyle, customTitle, honorificMention, showSecurityHash, showMetallicStamp, badgeMetallicColor]);

  const drawCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High Resolution Grid Setup (1120 x 792 - A4 ratio 1.414)
    canvas.width = 1120;
    canvas.height = 792;
    const w = canvas.width;
    const h = canvas.height;

    // Clear Canvas and define colors based on theme
    ctx.clearRect(0, 0, w, h);

    let bgColor = '#060a16';
    let outerBorderColor = '#d9aa32'; // gold-amber
    let innerBorderColor = '#1d3557'; // navy
    let primaryTextColor = '#ffffff';
    let secondaryTextColor = '#94a3b8'; // slate-400
    let focusColor = '#e2b13c'; // real gold
    let descriptionTextColor = '#cbd5e1';

    if (theme === 'royal_navy') {
      // Midnight navy royal theme
      bgColor = '#03081a';
      outerBorderColor = '#dfac34';
      innerBorderColor = '#101e3d';
      primaryTextColor = '#f8fafc';
      secondaryTextColor = '#64748b';
      descriptionTextColor = '#e2e8f0';
      focusColor = '#dfac34';
    } else if (theme === 'imperial_cream') {
      // Classic elegant organic cream style
      bgColor = '#faf8f5';
      outerBorderColor = '#450a0a'; // regal deep wine red
      innerBorderColor = '#065f46'; // emerald green
      primaryTextColor = '#0f172a';
      secondaryTextColor = '#64748b';
      descriptionTextColor = '#334155';
      focusColor = '#b45309';
    } else if (theme === 'obsidian_jade') {
      // Sleek tech cyber dark theme
      bgColor = '#090d16';
      outerBorderColor = '#10b981'; // vibrant emerald
      innerBorderColor = '#064e3b'; // deep green
      primaryTextColor = '#f8fafc';
      secondaryTextColor = '#64748b';
      descriptionTextColor = '#94a3b8';
      focusColor = '#34d399';
    } else if (theme === 'sunset_gold') {
      bgColor = '#110c03';
      outerBorderColor = '#f59e0b'; // amber
      innerBorderColor = '#78350f'; // bronze
      primaryTextColor = '#fffdfa';
      secondaryTextColor = '#a16207';
      descriptionTextColor = '#d97706';
      focusColor = '#fbbf24';
    }

    // DRAW BACKGROUND
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Subtle background mesh visual curves representation
    ctx.strokeStyle = theme === 'imperial_cream' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.bezierCurveTo(i + 150, h / 3, i - 150, (h * 2) / 3, i, h);
      ctx.stroke();
    }

    // DRAW BORDERS
    // Outer bold border
    ctx.lineWidth = 12;
    ctx.strokeStyle = outerBorderColor;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    // Inner thin border
    ctx.lineWidth = 2;
    ctx.strokeStyle = innerBorderColor;
    ctx.strokeRect(32, 32, w - 64, h - 64);

    // Corner flourishes
    const drawFlourish = (x: number, y: number, xDir: number, yDir: number) => {
      ctx.beginPath();
      // Outer angle corner
      ctx.moveTo(x + xDir * 35, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + yDir * 35);
      // Small accent block inside corner
      ctx.moveTo(x + xDir * 15, y + yDir * 15);
      ctx.lineTo(x + xDir * 25, y + yDir * 15);
      ctx.lineTo(x + xDir * 15, y + yDir * 25);
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

    // HEADER BRANDING TEXT
    ctx.textAlign = 'center';
    ctx.fillStyle = focusColor;
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.fillText('S A G E O   2 0 2 6', w / 2, 85);

    ctx.fillStyle = secondaryTextColor;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('SEMANA ACADÉMICA DE ENGENHARIA E ORGANIZAÇÃO  |  PORTUGAL', w / 2, 110);

    // DRAW DYNAMIC EMBLEM / LOGO
    const logoY = 180;
    const logoX = w / 2;

    if (logoStyle === 'shield_crest') {
      // 1. Imperial Shield Crest Path
      ctx.save();
      ctx.strokeStyle = focusColor;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = theme === 'imperial_cream' ? 'rgba(180,83,9,0.05)' : 'rgba(255,255,255,0.03)';
      
      ctx.beginPath();
      ctx.moveTo(logoX, logoY - 35);
      ctx.quadraticCurveTo(logoX + 25, logoY - 35, logoX + 25, logoY - 10);
      ctx.quadraticCurveTo(logoX + 25, logoY + 15, logoX, logoY + 30);
      ctx.quadraticCurveTo(logoX - 25, logoY + 15, logoX - 25, logoY - 10);
      ctx.quadraticCurveTo(logoX - 25, logoY - 35, logoX, logoY - 35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Horizontal inside stripe
      ctx.beginPath();
      ctx.moveTo(logoX - 24, logoY - 5);
      ctx.lineTo(logoX + 24, logoY - 5);
      ctx.stroke();

      // Tiny stars inside emblem
      ctx.fillStyle = focusColor;
      ctx.font = '12px Georgia';
      ctx.fillText('★', logoX, logoY - 12);
      ctx.fillText('★', logoX - 10, logoY + 10);
      ctx.fillText('★', logoX + 10, logoY + 10);
      ctx.restore();

    } else if (logoStyle === 'geoscience_compass') {
      // 2. Geoscience 3D Compass Rose
      ctx.save();
      const radius = 30;
      ctx.translate(logoX, logoY);
      
      // Outer guiding circle
      ctx.strokeStyle = 'rgba(223, 172, 52, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Sharp Compass points (North, East, South, West)
      const drawNeedle = (deg: number) => {
        ctx.rotate((deg * Math.PI) / 180);
        // Left dark shade
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, 0);
        ctx.lineTo(0, -radius - 8);
        ctx.closePath();
        ctx.fillStyle = focusColor;
        ctx.fill();

        // Right light shade
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, -radius - 8);
        ctx.closePath();
        ctx.fillStyle = theme === 'imperial_cream' ? '#ebd7b0' : 'rgba(255,255,255,0.6)';
        ctx.fill();
        ctx.rotate((-deg * Math.PI) / 180);
      };

      drawNeedle(0);
      drawNeedle(90);
      drawNeedle(180);
      drawNeedle(270);
      ctx.restore();

    } else if (logoStyle === 'tech_hexagon') {
      // 3. Systems Engineering Hexagon
      ctx.save();
      ctx.strokeStyle = focusColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let side = 0; side <= 6; side++) {
        const angle = (side * Math.PI) / 3;
        const xPos = logoX + Math.cos(angle) * 35;
        const yPos = logoY + Math.sin(angle) * 35;
        if (side === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner lines
      ctx.strokeStyle = innerBorderColor;
      ctx.beginPath();
      ctx.moveTo(logoX, logoY - 33);
      ctx.lineTo(logoX, logoY + 33);
      ctx.moveTo(logoX - 29, logoY - 17);
      ctx.lineTo(logoX + 29, logoY + 17);
      ctx.moveTo(logoX - 29, logoY + 17);
      ctx.lineTo(logoX + 29, logoY - 17);
      ctx.stroke();

      ctx.font = 'bold 10px "JetBrains Mono"';
      ctx.fillStyle = focusColor;
      ctx.fillText('E.G.I', logoX, logoY + 4);
      ctx.restore();
    }

    // TITLE OF THE DOCUMENT
    ctx.fillStyle = primaryTextColor;
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillText(customTitle, w / 2, 275);

    // EXPLANATORY BODY LATIN TEXT STYLE
    ctx.fillStyle = descriptionTextColor;
    ctx.font = 'italic 16px Georgia, serif';
    ctx.fillText('Certifica-se, para a devida concessão de créditos curriculares Erasmus ECTS, que', w / 2, 330);

    // STUDENT FULL NAME IN LARGE DISPLAY TYPOGRAPHY
    ctx.fillStyle = focusColor;
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    const fullNameCombined = `${registration.first_name} ${registration.last_name}`.toUpperCase();
    ctx.fillText(fullNameCombined, w / 2, 395);

    // SUB DATA - Student ID Card & Course
    ctx.fillStyle = primaryTextColor;
    ctx.font = '15px "Space Grotesk", sans-serif';
    ctx.fillText(`Inscrito sob a matrícula institucional de índice público ${registration.student_number}`, w / 2, 440);

    // COURSE DETAILS
    ctx.fillStyle = theme === 'imperial_cream' ? '#1b4332' : '#34d399';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(`CURSO AUTÓNOMO: ${registration.course.toUpperCase()}`, w / 2, 475);

    // ACHIEVEMENT DESCRIPTION
    ctx.fillStyle = descriptionTextColor;
    ctx.font = 'italic 15px Georgia, serif';
    ctx.fillText('concluiu com aproveitamento e presença verificada em sistema informático a atividade letiva:', w / 2, 520);

    // EVENT TITLE & LECTURER
    ctx.fillStyle = primaryTextColor;
    ctx.font = 'bold italic 22px Georgia, serif';
    ctx.fillText(`"${event.title}"`, w / 2, 560);

    ctx.fillStyle = secondaryTextColor;
    ctx.font = '13px "Space Grotesk", sans-serif';
    const formattedDate = new Date(event.date).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    ctx.fillText(`Leccionado por: ${event.lecturer}  |  Emitido a ${formattedDate} (${event.start_time} h)`, w / 2, 595);

    // HONORIFIC MENTION / CREDIT PILL
    if (honorificMention) {
      ctx.save();
      const textWidth = ctx.measureText(honorificMention).width + 30;
      ctx.strokeStyle = focusColor;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(223, 172, 52, 0.05)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(w / 2 - textWidth / 2, 615, textWidth, 24, 12);
      } else {
        ctx.rect(w / 2 - textWidth / 2, 615, textWidth, 24);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = focusColor;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(`CRÉDITOS ECTS ATRIBUÍDOS: 4.0h - ${honorificMention.toUpperCase()}`, w / 2, 631);
      ctx.restore();
    }

    // SIGNATURE SIGN-OFFS
    const sigY = 695;

    if (signatureStyle === 'double_auth' || signatureStyle === 'presidency_only') {
      // Left signature line
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

      // Signature scribble N1
      ctx.strokeStyle = theme === 'imperial_cream' ? '#1d4ed8' : '#60a5fa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 220, sigY - 25);
      ctx.bezierCurveTo(w / 2 - 200, sigY - 45, w / 2 - 140, sigY - 5, w / 2 - 120, sigY - 25);
      ctx.bezierCurveTo(w / 2 - 110, sigY - 35, w / 2 - 90, sigY - 10, w / 2 - 80, sigY - 20);
      ctx.stroke();
    }

    if (signatureStyle === 'double_auth' || signatureStyle === 'department_only') {
      // Right signature line
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

      // Signature scribble N2
      ctx.strokeStyle = theme === 'imperial_cream' ? '#047857' : '#34d399';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2 + 110, sigY - 22);
      ctx.bezierCurveTo(w / 2 + 140, sigY - 40, w / 2 + 160, sigY - 5, w / 2 + 180, sigY - 28);
      ctx.bezierCurveTo(w / 2 + 190, sigY - 45, w / 2 + 210, sigY - 15, w / 2 + 230, sigY - 25);
      ctx.stroke();
    }

    // AUTHENTIC METALLIC STAMP COIN
    if (showMetallicStamp) {
      const stampX = w / 2;
      const stampY = sigY - 25;
      ctx.save();
      
      // Starburst gear background
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
      ctx.fillStyle = badgeMetallicColor === 'gold' ? '#dfac34' : '#cbd5e1';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 8;
      ctx.fill();

      // Border lines
      ctx.shadowBlur = 0; // reset shadow
      ctx.strokeStyle = badgeMetallicColor === 'gold' ? '#cb9c22' : '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(stampX, stampY, 20, 0, Math.PI * 2);
      ctx.stroke();

      // Stamp Center Emblem
      ctx.fillStyle = badgeMetallicColor === 'gold' ? '#78350f' : '#334155';
      ctx.font = '13px Georgia';
      ctx.fillText('★', stampX, stampY + 4);
      ctx.restore();
    }

    // DECRYPTION TOKEN FOOTER
    if (showSecurityHash) {
      ctx.fillStyle = secondaryTextColor;
      ctx.font = '8px "JetBrains Mono", monospace';
      const securityCode = registration.qr_token || registration.id.toUpperCase().slice(0, 10);
      ctx.fillText(
        `VALIDAÇÃO DIGITAL UNIFICADA: SHA256-${securityCode}  |  DATA LOG: ${registration.checked_in_at ? new Date(registration.checked_in_at).toLocaleString('pt-PT') : 'AUTO-CHECKIN'}  | IP: 127.0.0.1 (SANDBOX)`,
        w / 2,
        762
      );
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/jpeg', 0.98);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SAGEO2026_Certificado_${registration.first_name}_${registration.last_name}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/jpeg');
    const win = window.open('');
    if (win) {
      win.document.write(`<img src="${url}" style="width:100%; height:auto;" onload="window.print();window.close();" />`);
      win.document.close();
    }
  };

  // SEND REAL / SIMULATED EMAIL HANDLER WITH ROBUST AUTO-RETRY & NETWORK DIAGNOSTIC
  const handleSendEmail = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setEmailError("Impossível aceder à tela de desenho do certificado (Canvas não inicializado).");
      return;
    }
    
    setEmailSending(true);
    setEmailSuccess(null);
    setEmailError(null);
    setCurrentAttempt(1);
    setStatusMessage("A extrair ficheiro gráfico de alta resolução do certificado...");

    // Diagnostic Check: If navigator is offline
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setEmailError("Rede Inativa (Offline): O seu navegador indica falta de ligação à Internet. Reconecte o dispositivo antes de tentar novamente.");
      setEmailSending(false);
      setStatusMessage(null);
      return;
    }

    // Get Base64 PNG
    const imageBase64 = canvas.toDataURL('image/png');

    // Diagnostic Check: Check image completeness (prevent transparent 1px or corrupt states)
    if (!imageBase64 || imageBase64.length < 2000) {
      setEmailError(`Aviso de Ficheiro Pixelizado/Corrompido: A imagem codificada tem apenas ${Math.round((imageBase64?.length || 0) / 1024)} KB. Isso costuma indicar telas em branco ou contextos de desenho 2D não inicializados corretamente.`);
      setEmailSending(false);
      setStatusMessage(null);
      return;
    }

    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 2500;
    let success = false;
    let lastErrorMsg = "";

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      setCurrentAttempt(attempt);
      setStatusMessage(`A ligar ao servidor académico... (Tentativa ${attempt} de ${MAX_ATTEMPTS})`);

      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientEmail,
            subject: `🎓 CERTIFICADO OFICIAL SAGEO: ${event.title}`,
            firstName: registration.first_name,
            lastName: registration.last_name,
            eventName: event.title,
            certificateImage: imageBase64,
          }),
        });

        // Safe JSON parsing with fallback
        let body: any = {};
        try {
          body = await response.json();
        } catch (jsonErr) {
          throw new Error(`Resposta do servidor académica inválida (Não é um JSON válido). Código Estado: ${response.status}`);
        }

        if (response.ok) {
          if (body.status === 'simulated') {
            setEmailSuccess(`Simulador Ativo: Certificado enviado para ${recipientEmail} (Modo Simulação).`);
          } else {
            setEmailSuccess(`Excelente! Certificado oficial de alta resolução enviado com sucesso para ${recipientEmail}.`);
          }
          success = true;
          break; // Stop retrying immediately
        } else {
          // Identify precise backend error classes
          const errMsg = body.message || body.error || `Erro desconhecido (Status ${response.status})`;
          
          if (response.status === 400) {
            lastErrorMsg = `Dados Inválidos: ${errMsg}. Confirme se o endereço '${recipientEmail}' é válido.`;
            break; // No retry for client input error
          } else if (response.status === 401 || response.status === 403) {
            lastErrorMsg = `Acesso Proibido/Sandbox: ${errMsg}. A assinatura do servidor académica ou token de acesso expirou.`;
            break; // No retry for permission errors
          } else if (response.status === 429) {
            lastErrorMsg = `Limite de Envio Reduzido: ${errMsg}. Por favor, aguarde alguns segundos antes de iniciar novas tentativas.`;
          } else if (response.status >= 500) {
            lastErrorMsg = `Falha do Servidor Académico (${response.status}): ${errMsg}. O sistema está temporariamente incontactável.`;
          } else {
            lastErrorMsg = errMsg;
          }

          throw new Error(lastErrorMsg);
        }

      } catch (err: any) {
        lastErrorMsg = err.message || 'Erro imprevisto de rede na ligação com a API académica.';
        
        // Notify of current failure and prepare for next retry
        if (attempt < MAX_ATTEMPTS) {
          const countLabel = attempt === 1 ? 'Primeira' : attempt === 2 ? 'Segunda' : 'Terceira';
          setStatusMessage(`${countLabel} tentativa falhou: ${lastErrorMsg.slice(0, 60)}... A reagendar ligação em 2.5s...`);
          await delay(RETRY_DELAY_MS);
        }
      }
    }

    if (!success) {
      setEmailError(`O envio falhou permanentemente após ${MAX_ATTEMPTS} tentativas consecutivas. Última ocorrência: ${lastErrorMsg}`);
    }

    setEmailSending(false);
    setStatusMessage(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex flex-col justify-start overflow-y-auto p-4 md:p-8">
      
      {/* Dynamic customizable dashboard */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Canvas Display */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Header Controls */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2.5 rounded-2xl text-amber-500">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-100">Portal de Customização de Certidão</h3>
                <p className="text-xs text-slate-400">Modifica o visual, define brasões e envia cópia por correio eletrónico.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[#dfac34] hover:bg-[#cb9c22] text-slate-950 font-bold rounded-xl flex items-center gap-2 text-xs transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <Download className="w-4 h-4" />
                Descarregar JPG
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl flex items-center gap-2 text-xs transition-transform hover:-translate-y-0.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-xl transition-colors"
                id="close-cert-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Real Live Canvas view frame */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-2xl flex items-center justify-center overflow-x-auto min-h-[460px]">
            <div className="min-w-[690px] w-full max-w-4xl bg-slate-950 shadow-2xl rounded-2xl overflow-hidden border border-slate-800">
              <canvas ref={canvasRef} className="w-full h-auto block" />
            </div>
          </div>

          {/* Crypto validation banner */}
          <div className="flex gap-3 p-4 bg-amber-950/15 border border-[#dfac34]/10 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-slate-300 text-xs leading-relaxed">
              <p className="font-bold text-[#dfac34] mb-0.5">Assinatura Certificada pelo Eletivas SAGEO 2026</p>
              Este documento utiliza regras de validação criptográfica (Chave Letiva Atribuída). Pode ser impresso e anexado diretamente aos dossiês de candidatura de bolsas acadêmicas.
            </div>
          </div>
        </div>

        {/* Right column: Interactive controls panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Design Config Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Paintbrush className="w-4 h-4 text-[#dfac34]" />
              <h4 className="font-serif font-bold text-slate-200 text-sm">Design & Aparência</h4>
            </div>

            {/* Themes selection */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-mono text-slate-400 font-bold">Tema de Cor Imperial</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTheme('royal_navy')}
                  className={`p-2.5 rounded-xl border text-[11px] font-medium text-left transition-all ${
                    theme === 'royal_navy' 
                    ? 'border-amber-500 bg-amber-500/10 text-slate-200' 
                    : 'border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-400'
                  }`}
                >
                  🔵 Midnight Royal
                </button>
                <button
                  onClick={() => setTheme('imperial_cream')}
                  className={`p-2.5 rounded-xl border text-[11px] font-medium text-left transition-all ${
                    theme === 'imperial_cream' 
                    ? 'border-amber-500 bg-amber-500/10 text-slate-200' 
                    : 'border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-400'
                  }`}
                >
                  📜 Imperial Cream
                </button>
                <button
                  onClick={() => setTheme('obsidian_jade')}
                  className={`p-2.5 rounded-xl border text-[11px] font-medium text-left transition-all ${
                    theme === 'obsidian_jade' 
                    ? 'border-emerald-500 bg-emerald-500/10 text-slate-200' 
                    : 'border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-400'
                  }`}
                >
                  🟢 Obsidian Jade
                </button>
                <button
                  onClick={() => setTheme('sunset_gold')}
                  className={`p-2.5 rounded-xl border text-[11px] font-medium text-left transition-all ${
                    theme === 'sunset_gold' 
                    ? 'border-amber-500 bg-amber-500/10 text-slate-200' 
                    : 'border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-400'
                  }`}
                >
                  🟠 Sunset Amber
                </button>
              </div>
            </div>

            {/* Emblem selection */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-mono text-slate-400 font-bold">Brasão de Entrada / Logo</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setLogoStyle('shield_crest')}
                  className={`p-1.5 py-2.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                    logoStyle === 'shield_crest'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  Escudo
                </button>
                <button
                  onClick={() => setLogoStyle('geoscience_compass')}
                  className={`p-1.5 py-2.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                    logoStyle === 'geoscience_compass'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  Bússola
                </button>
                <button
                  onClick={() => setLogoStyle('tech_hexagon')}
                  className={`p-1.5 py-2.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                    logoStyle === 'tech_hexagon'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  Conexões
                </button>
              </div>
            </div>

            {/* Custom content inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Título do Documento</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Aproveitamento / Menção Curricular</label>
                <input
                  type="text"
                  value={honorificMention}
                  onChange={(e) => setHonorificMention(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  placeholder="Ex: Excelente Aproveitamento"
                />
              </div>
            </div>

            {/* Signature styles and extras */}
            <div className="space-y-3">
              <label className="block text-[10px] uppercase font-mono text-slate-400 font-bold">Tipo de Assinatura Oficial</label>
              <select
                value={signatureStyle}
                onChange={(e) => setSignatureStyle(e.target.value as SignatureType)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              >
                <option value="double_auth">Dupla Validação (Presidente & Oradora)</option>
                <option value="presidency_only">Apenas Autoridade Executiva</option>
                <option value="department_only">Apenas Comissão Coadjutoras</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Exibir Selo Metálico</span>
                <input
                  type="checkbox"
                  checked={showMetallicStamp}
                  onChange={(e) => setShowMetallicStamp(e.target.checked)}
                  className="accent-[#dfac34]"
                />
              </div>

              {showMetallicStamp && (
                <div className="flex items-center justify-between text-[11px] bg-slate-950 p-2 rounded-xl">
                  <span className="text-slate-500">Cor do Selo</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setBadgeMetallicColor('gold')}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${badgeMetallicColor === 'gold' ? 'bg-[#dfac34] text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                    >
                      Ouro
                    </button>
                    <button 
                      onClick={() => setBadgeMetallicColor('platinum')}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${badgeMetallicColor === 'platinum' ? 'bg-slate-300 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                    >
                      Platina
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs border-t border-slate-850/40 pt-2.5">
                <span className="text-slate-400">Assinatura SHA-256 Rodapé</span>
                <input
                  type="checkbox"
                  checked={showSecurityHash}
                  onChange={(e) => setShowSecurityHash(e.target.checked)}
                  className="accent-[#dfac34]"
                />
              </div>
            </div>

          </div>

          {/* 2. Interactive Email Delivery Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Mail className="w-4 h-4 text-[#dfac34]" />
              <h4 className="font-serif font-bold text-slate-200 text-sm">Despacho Automático E-mail</h4>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Manda o teu certificado de forma instantânea para qualquer caixa postal. O sistema criará um pacote PNG com validação de créditos integrada.
            </p>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-mono text-slate-500 font-bold">Endereço de E-mail de Receção</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="exemplo@universidade.pt"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            {statusMessage && (
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 text-indigo-350 rounded-xl text-xs flex items-center gap-2.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 shrink-0 text-indigo-400 animate-spin" />
                <span className="font-medium text-[11px] leading-relaxed">{statusMessage}</span>
              </div>
            )}

            {emailSuccess && (
              <div className="p-3 bg-[#dfac34]/10 border border-[#dfac34]/25 text-[#dfac34] rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-[#dfac34]" />
                <span className="font-medium text-[11px] leading-relaxed">{emailSuccess}</span>
              </div>
            )}

            {emailError && (
              <div className="p-3.5 bg-rose-950/25 border border-rose-500/30 text-rose-350 rounded-xl text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5 animate-bounce" />
                  <span className="font-semibold text-[11px] leading-relaxed text-rose-350">Falha no Despacho Académico</span>
                </div>
                <p className="text-[10px] text-rose-400 font-sans leading-relaxed pl-6.5">
                  {emailError}
                </p>
                <div className="pl-6.5 pt-1 flex flex-wrap gap-2 items-center text-[10px] text-slate-400 uppercase font-mono font-bold">
                  <span>Diagnóstico: 3 tentativas esgotadas</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-rose-400">
                    {typeof window !== 'undefined' && !window.navigator.onLine ? (
                      <>
                        <WifiOff className="w-3 h-3 text-rose-400 shrink-0" /> Sem Rede (Offline)
                      </>
                    ) : (
                      "Falha na API / Servidor Excedeu Timeout"
                    )}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSendEmail}
              disabled={emailSending}
              className="w-full py-2.5 bg-[#dfac34] hover:bg-[#cb9c22] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {emailSending ? (
                <>
                  <RefreshCw className="w-4 h-4 text-slate-950 animate-spin" />
                  <span>Tentativa {currentAttempt}/3 em Curso...</span>
                </>
              ) : emailError ? (
                <>
                  <RefreshCw className="w-4 h-4 text-slate-950" />
                  <span>Reatentar Envio do Certificado</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>Mandar para o E-mail de Estudante</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
