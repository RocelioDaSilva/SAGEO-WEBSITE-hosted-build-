import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Award, 
  Clock, 
  BookOpen, 
  Music, 
  ShieldCheck, 
  FileText, 
  ArrowLeft,
  Download,
  AlertTriangle,
  Sliders,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { Event, Registration } from '../types';
import { ACADEMIC_DEPARTMENTS } from '../data';

interface EventRegistrationPageProps {
  event: Event;
  registrations: Registration[];
  events: Event[];
  formData: {
    firstName: string;
    lastName: string;
    studentNumber: string;
    course: string;
    institutionalEmail: string;
    lecturerQuestion: string;
    youtubeLink: string;
    secretQuestion: string;
    secretAnswer: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  waitlistFormData: {
    name: string;
    email: string;
    course: string;
  };
  setWaitlistFormData: React.Dispatch<React.SetStateAction<any>>;
  formError: string | null;
  setFormError: (err: string | null) => void;
  waitlistError: string | null;
  setWaitlistError: (err: string | null) => void;
  handleRegister: (e: React.FormEvent, event: Event) => Promise<void>;
  handleWaitlistRegister: (e: React.FormEvent, eventId: string) => Promise<void>;
  setSelectedEventId: (id: string | null) => void;
  setViewingCertificateMatch: (val: { reg: Registration; evt: Event } | null) => void;
  getCategoryBadge: (cat: string) => { label: string; bg: string };
  getCourseAcronymAndColor: (course?: string) => { acronym: string; bg: string; label: string; color: string } | null;
  isOverlapping: (evtA: Event, evtB: Event) => boolean;
  getExistingStudentRegs: (studentNum?: string, email?: string) => Registration[];
  bypassConflict: boolean;
  setBypassConflict: (val: boolean) => void;
}

export const EventRegistrationPage: React.FC<EventRegistrationPageProps> = ({
  event: matchedEvent,
  registrations,
  events,
  formData,
  setFormData,
  waitlistFormData,
  setWaitlistFormData,
  formError,
  setFormError,
  waitlistError,
  setWaitlistError,
  handleRegister,
  handleWaitlistRegister,
  setSelectedEventId,
  setViewingCertificateMatch,
  getCategoryBadge,
  getCourseAcronymAndColor,
  isOverlapping,
  getExistingStudentRegs,
  bypassConflict,
  setBypassConflict
}) => {
  const confirmedCount = registrations.filter(r => r.event_id === matchedEvent.id && r.confirmed).length;
  // Geosciences override for "Engenharia de Petróleos" and "Geofísica" courses
  const isGeosciences = ['Engenharia de Petróleos', 'Geofísica'].includes(formData.course) || ['Engenharia de Petróleos', 'Geofísica'].includes(waitlistFormData.course);
  const effectiveCapacity = isGeosciences ? (matchedEvent.capacity + 150) : matchedEvent.capacity;
  const isFull = confirmedCount >= effectiveCapacity;

  const isDeadlinePassed = (() => {
    if (!matchedEvent.registration_deadline) return false;
    const deadlineDate = new Date(matchedEvent.registration_deadline);
    if (matchedEvent.registration_deadline.length === 10) {
      deadlineDate.setHours(23, 59, 59, 999);
    }
    return Date.now() > deadlineDate.getTime();
  })();

  // Real-time dynamic conflicts for current inputs
  const studentNumTrimmed = formData.studentNumber.trim();
  const studentEmailTrimmed = formData.institutionalEmail.trim();
  const existingRegs = studentNumTrimmed.length === 8 ? getExistingStudentRegs(studentNumTrimmed, studentEmailTrimmed) : [];
  
  const hasDoubleReg = studentNumTrimmed.length === 8 && existingRegs.some(r => r.event_id === matchedEvent.id);
  const existingOwnReg = hasDoubleReg ? existingRegs.find(r => r.event_id === matchedEvent.id) : null;
  
  const overlappingReg = studentNumTrimmed.length === 8 && existingRegs.find(r => {
    if (r.event_id === matchedEvent.id) return false;
    const otherEvt = events.find(e => e.id === r.event_id);
    if (!otherEvt) return false;
    return r.confirmed && isOverlapping(otherEvt, matchedEvent);
  });
  
  const conflictingEvent = overlappingReg ? events.find(e => e.id === overlappingReg.event_id) : null;
  const isTooManyEvents = false;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Back Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-950/80 border border-slate-900 rounded-3xl gap-4 shadow-xl">
        <button 
          onClick={() => setSelectedEventId(null)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase text-slate-300 bg-slate-900 hover:bg-slate-850 hover:text-[#dfac34] border border-slate-800 hover:border-[#dfac34]/40 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> ← Voltar ao Cronograma Geral
        </button>
        <div className="text-left sm:text-right text-xs text-slate-400 font-mono">
          Página de Inscrição Única &bull; ID: <span className="text-[#dfac34] font-bold">{matchedEvent.id}</span>
        </div>
      </div>

      {/* Dedicated Registration Page Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Details and Context, 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Hero presentation of Event */}
          <div className="glass-morphic bg-gradient-to-br from-[#0a0f1c]/90 to-slate-950/95 border border-[#dfac34]/20 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#dfac34]/5 rounded-full blur-3xl animate-pulse" />
            
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const b = getCategoryBadge(matchedEvent.category);
                  return (
                    <span className={`px-2.5 py-1 text-[10px] font-mono rounded-full border ${b.bg}`}>
                      {b.label}
                    </span>
                  );
                })()}
                {getCourseAcronymAndColor(matchedEvent.course) && (
                  <span className={`px-2.5 py-1 text-[10px] font-mono rounded-full border font-bold uppercase tracking-wider ${getCourseAcronymAndColor(matchedEvent.course)!.bg}`}>
                    {getCourseAcronymAndColor(matchedEvent.course)!.acronym}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-serif font-black text-slate-100 tracking-tight leading-relaxed">
                {matchedEvent.title}
              </h1>

              <p className="text-xs text-slate-350 leading-relaxed font-light font-sans whitespace-pre-line">
                {matchedEvent.description}
              </p>

              {/* Detailed stats & locations */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 text-xs font-mono">
                <div className="flex items-center gap-2.5 p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <Calendar className="w-4 h-4 text-[#dfac34]" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Data da Sessão</span>
                    <span className="text-slate-300 font-bold">{matchedEvent.date.split('-').reverse().join('/')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <Clock className="w-4 h-4 text-[#dfac34]" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Horário Letivo</span>
                    <span className="text-slate-300 font-bold">{matchedEvent.start_time} h {matchedEvent.end_time ? `- ${matchedEvent.end_time} h` : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <MapPin className="w-4 h-4 text-[#dfac34]" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Local SAGEO</span>
                    <span className="text-slate-300 font-bold truncate block max-w-[130px]" title={matchedEvent.location}>{matchedEvent.location}</span>
                  </div>
                </div>
              </div>

              {matchedEvent.lecturer && (
                <div className="p-4 bg-[#dfac34]/5 border border-[#dfac34]/15 rounded-2xl flex items-center gap-3.5 mt-4">
                  <Award className="w-6 h-6 text-[#dfac34]" />
                  <div className="text-xs">
                    <span className="text-[10px] text-[#dfac34]/80 font-mono font-bold tracking-widest uppercase block">Facilitador / Orador Principal</span>
                    <span className="text-slate-200 font-serif font-black text-sm">{matchedEvent.lecturer}</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Capacity Stats widget & Progress */}
          <div className="glass-morphic bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-widest text-[#dfac34] uppercase">Capacidade Útil e Confirmações</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-center">
              <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-900">
                <span className="text-[9px] text-slate-450 block uppercase">Lotação Total</span>
                <span className="text-xl font-serif font-black text-white">{matchedEvent.capacity}</span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-900">
                <span className="text-[9px] text-slate-450 block uppercase">Inscrições</span>
                <span className="text-xl font-serif font-black text-[#dfac34]">{confirmedCount}</span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-900 col-span-2 sm:col-span-1">
                <span className="text-[9px] text-slate-450 block uppercase">Vagas Disponíveis</span>
                <span className="text-xl font-serif font-black text-emerald-400">
                  {Math.max(0, effectiveCapacity - confirmedCount)}
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Taxa de Ocupação da Sala</span>
                <span className="font-bold text-[#dfac34]">{Math.round((confirmedCount / matchedEvent.capacity) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-[#dfac34]'}`}
                  style={{ width: `${Math.min(100, (confirmedCount / matchedEvent.capacity) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Informative Academic Details */}
          <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-3xl text-xs space-y-3 leading-relaxed">
            <h5 className="font-serif font-black text-slate-250 uppercase tracking-wider flex items-center gap-1.5 text-xs text-[#dfac34]">
              <BookOpen className="w-4 h-4" /> Informações Internas e Equivalências
            </h5>
            <p className="text-slate-400 font-light font-sans text-[11px]">
              A participação neste evento confere direito ao correspondente certificado oficial assinado pela direção do ISPTEC, computando <strong>{matchedEvent.category === 'mini_curso' ? '12h' : '3h'} de atividades complementares extracurriculares</strong>. Todo o rastreio de presenças utiliza credenciamento eletrónico por QR Code na entrada da sala de conferências.
            </p>
          </div>

        </div>

        {/* Right Column (Forms, 5 cols) */}
        <div className="lg:col-span-5 sticky top-24">
          
          {matchedEvent.is_completed ? (
            /* COMPLETED SESSION COMPONENT */
            <div className="bg-slate-900 border border-[#dfac34]/20 rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in text-slate-200">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#dfac34] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#dfac34]" /> Reportagem do Evento
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1 font-serif">
                    {matchedEvent.title}
                  </h4>
                </div>
              </div>

              <div className="p-3 bg-[#dfac34]/5 border border-[#dfac34]/15 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#dfac34]" /> Presença Registada:
                </span>
                <span className="text-[#dfac34] font-bold">
                  {matchedEvent.report?.attendance || 120} estudantes
                </span>
              </div>

              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-[#dfac34] uppercase tracking-wider font-mono">Ocorrência & Resumo</h5>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                  {matchedEvent.report?.summary}
                </p>
              </div>

              {matchedEvent.report?.highlights && matchedEvent.report.highlights.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-[#dfac34] uppercase tracking-wider font-mono">Destaques da Sessão</h5>
                  <ul className="space-y-1.5">
                    {matchedEvent.report.highlights.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-400 flex items-start gap-1.5 font-sans">
                        <span className="text-[#dfac34] mt-0.5 font-bold font-serif select-none">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : isFull ? (
            /* WAITLIST REGISTRATION */
            <div className="glass-morphic bg-[#0a0f1c]/80 border border-rose-500/25 rounded-3xl p-6 shadow-3xl text-slate-100 backdrop-blur-xl">
              <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-widest bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded-full">
                Lista de Espera Ativa
              </span>
              
              <div className="p-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-2xl mt-4 space-y-1">
                <p className="text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 uppercase">
                  <AlertTriangle className="w-4 h-4" /> Lotação Total Alcançada!
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                  Esta sala atingiu o limite curricular homologado. Subscreve à lista de espera e serás notificado se houver alguma desistência automática do sistema.
                </p>
              </div>

              {/* Same event warning for waitlist if typed */}
              {hasDoubleReg && (
                <div className="p-4 bg-rose-950/40 border border-rose-500/30 text-rose-400 rounded-2xl mt-4 space-y-1.5 text-xs">
                  <p className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Dupla Inscrição Detetada
                  </p>
                  <p className="text-slate-300">
                    Já constas na agenda desta atividade. Não necessitas de nova submissão!
                  </p>
                </div>
              )}

              <form onSubmit={(e) => handleWaitlistRegister(e, matchedEvent.id)} className="space-y-4 mt-6">
                {waitlistError && (
                  <p className="text-xs text-rose-400 font-semibold p-2.5 bg-rose-500/5 rounded border border-rose-500/15 font-mono">{waitlistError}</p>
                )}
                
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mb-1.5">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={waitlistFormData.name}
                    onChange={(e) => setWaitlistFormData({ ...waitlistFormData, name: e.target.value })}
                    placeholder="José Silva Ramos"
                    className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mb-1.5">E-mail Académico/Estudante</label>
                  <input
                    type="email"
                    required
                    value={waitlistFormData.email}
                    onChange={(e) => setWaitlistFormData({ ...waitlistFormData, email: e.target.value })}
                    placeholder="20220001@isptec.co.ao"
                    className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mb-1.5">Curso Académico *</label>
                  <select
                    value={waitlistFormData.course}
                    onChange={(e) => setWaitlistFormData({ ...waitlistFormData, course: e.target.value })}
                    className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition-colors cursor-pointer"
                  >
                    {ACADEMIC_DEPARTMENTS.map(dept => (
                      <optgroup key={dept.name} label={dept.name} className="text-[#dfac34] font-serif text-[11px] italic font-bold bg-slate-950">
                        {dept.courses.map(course => (
                          <option key={course} value={course} className="text-slate-200 font-sans text-xs normal-case font-normal">{course}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={hasDoubleReg}
                  className={`w-full py-3 text-white font-black rounded-xl text-xs shadow-md transition-all uppercase tracking-widest cursor-pointer ${
                    hasDoubleReg
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 hover:-translate-y-0.5'
                  }`}
                >
                  {hasDoubleReg ? 'Já Inscrito' : 'Registar na Lista de Espera 📋'}
                </button>
              </form>
            </div>
          ) : isDeadlinePassed ? (
            /* REGISTRATION DEADLINE PASSED ALERT */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in text-slate-200">
              <div className="flex justify-between items-start border-b border-slate-800/60 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-rose-450 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-rose-550/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full inline-flex self-start">
                    <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Inscrições Encerradas
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2.5 font-serif">
                    {matchedEvent.title}
                  </h4>
                </div>
              </div>

              <div className="p-4 bg-rose-500/5 border border-rose-550/10 rounded-2xl space-y-1.5 text-slate-300 text-xs">
                <p className="font-bold uppercase tracking-wider text-rose-400 text-[10px] font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Prazo de Inscrição Excedido
                </p>
                <p className="leading-relaxed font-sans font-light">
                  Lamentamos, mas o prazo limite estipulado pela coordenação científica para inscrição nesta atividade expirou em:
                </p>
                <div className="p-2.5 bg-slate-950 rounded-xl text-center font-mono font-bold text-[#dfac34] text-xs mt-1 border border-slate-900 shadow-inner">
                  {new Date(matchedEvent.registration_deadline).toLocaleString('pt', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD COMPREHENSIVE TICKET FORM */
            <div className="glass-morphic bg-[#0a0f1c]/85 border border-[#dfac34]/25 rounded-3xl p-6 md:p-8 shadow-3xl text-slate-100 backdrop-blur-xl">
              <span className="text-[10px] font-mono text-[#dfac34] font-bold uppercase tracking-widest bg-[#dfac34]/10 border border-[#dfac34]/25 px-2.5 py-0.5 rounded-full">
                Inscrição Instantânea
              </span>

              <form onSubmit={(e) => handleRegister(e, matchedEvent)} className="space-y-4 mt-6">
                
                {formError && (
                  <p className="text-xs text-rose-400 font-bold p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 font-mono leading-relaxed">{formError}</p>
                )}

                {isGeosciences && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-[#dfac34] rounded-xl text-[11px] leading-relaxed flex flex-col gap-1 font-sans font-medium">
                    <p className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-xs text-amber-400">
                      ★ Prioridade Geociências Ativada
                    </p>
                    <p className="text-slate-300 text-[10px] font-light">
                      Inscrição especial ativa. Por pertencer ao Departamento de Geociências, tens direito a vaga reservada nesta sala.
                    </p>
                  </div>
                )}

                {/* DYNAMIC CONFLICT ADVISOR BOX */}
                {studentNumTrimmed.length === 8 && (
                  <div className="space-y-3.5 animate-fade-in text-xs transition-all duration-300">
                    
                    {/* a) Double Registration (Same event) */}
                    {hasDoubleReg && (
                      <div className="p-4 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl relative overflow-hidden flex flex-col gap-2">
                        <div className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-[10px] font-mono">
                          <AlertTriangle className="w-4 h-4 text-rose-500" /> Dupla Inscrição Detetada
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                          Detetámos que já estás inscrito nesta atividade! Não precisas de te reinscrever. Podes aceder ao teu bilhete oficial na <strong>Área do Estudante</strong>.
                        </p>
                        {existingOwnReg && (
                          <button
                            type="button"
                            onClick={() => setViewingCertificateMatch({ reg: existingOwnReg, evt: matchedEvent })}
                            className="mt-1 self-start inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-950 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer font-mono"
                          >
                            <Download className="w-3.5 h-3.5 text-[#dfac34]" /> Ver / Descarregar Bilhete
                          </button>
                        )}
                      </div>
                    )}

                    {/* b) Schedule Overlap (Overlapping session) */}
                    {!hasDoubleReg && conflictingEvent && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/25 text-[#dfac34] rounded-2xl flex flex-col gap-1.5">
                        <div className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
                          <Clock className="w-4 h-4" /> Conflito de Agenda (Simultâneo)
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-light font-sans">
                          Já tens presença confirmada em: <strong>"{conflictingEvent.title}"</strong> que decorre em horário conflituoso ({conflictingEvent.start_time} - {conflictingEvent.end_time || '2h'}).
                        </p>
                      </div>
                    )}

                    {/* d) The Required Honor Confirmation Checkbox */}
                    {!hasDoubleReg && overlappingReg && (
                      <div className="p-4 bg-slate-950/80 border border-[#dfac34]/20 rounded-2xl flex items-start gap-2 text-slate-300 text-[11px]">
                        <input 
                          type="checkbox"
                          id="bypass-conflict-checkbox"
                          checked={bypassConflict}
                          onChange={(e) => setBypassConflict(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                        />
                        <label htmlFor="bypass-conflict-checkbox" className="leading-tight select-none cursor-pointer text-slate-200 font-sans">
                          <strong className="text-emerald-400 block font-serif text-xs mb-0.5 animate-pulse">Autorização Extrarequerida</strong>
                          Sim, confirmo a dupla inscrição / sobreposição horária sob o meu compromisso de honra e compreendo que a emissão do certificado dependerá de check-in na sala física.
                        </label>
                      </div>
                    )}

                  </div>
                )}

                {/* Double grid name */}
                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mb-1">Primeiro Nome *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Daniela"
                      className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mb-1">Último Nome *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Barbosa"
                      className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Student Number & Course Selector */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mb-1">Número de Estudante * <span className="text-[#dfac34] text-[9px] lowercase font-light">(ex: 20220001)</span></label>
                    <input
                      type="text"
                      required
                      value={formData.studentNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                        setFormData({
                          ...formData,
                          studentNumber: val,
                          institutionalEmail: val ? `${val}@isptec.co.ao` : ''
                        });
                      }}
                      placeholder="20220001"
                      maxLength={8}
                      className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mb-1">Curso Académico *</label>
                    <select
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors cursor-pointer"
                    >
                      {ACADEMIC_DEPARTMENTS.map(dept => (
                        <optgroup key={dept.name} label={dept.name} className="text-[#dfac34] font-serif text-[11px] italic font-bold bg-slate-950">
                          {dept.courses.map(course => (
                            <option key={course} value={course} className="text-slate-200 font-sans text-xs normal-case font-normal">{course}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mb-1">E-mail Institucional ISPTEC * <span className="text-slate-500 font-light lowercase">(Gerado automaticamente)</span></label>
                  <input
                    type="text"
                    required
                    value={formData.institutionalEmail}
                    onChange={(e) => setFormData({ ...formData, institutionalEmail: e.target.value })}
                    placeholder="20220001@isptec.co.ao"
                    className="w-full bg-slate-950/40 border border-[#dfac34]/10 rounded-xl px-3 py-2.5 text-xs text-slate-400 outline-none font-mono cursor-not-allowed"
                    disabled
                  />
                  <p className="text-[9px] text-slate-500 mt-1 font-light">O link de confirmação do correio será gerado imediatamente após submeter.</p>
                </div>

                {/* Question to lecturer */}
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mb-1">Pergunta para o Orador</label>
                  <textarea
                    value={formData.lecturerQuestion}
                    onChange={(e) => setFormData({ ...formData, lecturerQuestion: e.target.value })}
                    placeholder="Queira formular a pergunta para apoiar a palestra..."
                    className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-colors h-16 resize-none font-sans font-light"
                  />
                </div>

                {/* Spotify Link if festival category */}
                {matchedEvent.category === 'festival' && (
                  <div className="p-3 bg-fuchsia-950/15 border border-fuchsia-500/25 rounded-xl space-y-1.5 font-sans">
                    <label className="block text-[11px] text-fuchsia-300 font-semibold mb-1 flex items-center gap-1 uppercase font-mono tracking-wider">
                      <Music className="w-3.5 h-3.5" />
                      <span>Música preferida para o Festival SAGEO</span>
                    </label>
                    <input
                      type="url"
                      value={formData.youtubeLink}
                      onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
                      placeholder="Link de música Spotify ou YouTube..."
                      className="w-full bg-slate-950/80 border border-fuchsia-800/40 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-fuchsia-500 font-mono"
                    />
                    <p className="text-[9px] text-fuchsia-400 mt-1">O link submetido será indexado na playlist da comissão promotora!</p>
                  </div>
                )}

                {/* SECURITY CHECKS: SECRET QUESTION & HASH KEY */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-3 font-sans">
                  <p className="text-[10px] text-[#dfac34] font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#dfac34]" />
                    <span>CONTRAPARTIDA DE ENTRADA (MANDATÓRIO)</span>
                  </p>
                  
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 mb-1">Pergunta Curricular Secreta *</label>
                    <input
                      type="text"
                      required
                      value={formData.secretQuestion}
                      onChange={(e) => setFormData({ ...formData, secretQuestion: e.target.value })}
                      placeholder="Ex: Nome da primeira disciplina académica?"
                      className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-404 mb-1">Resposta Secreta *</label>
                    <input
                      type="text"
                      required
                      value={formData.secretAnswer}
                      onChange={(e) => setFormData({ ...formData, secretAnswer: e.target.value })}
                      placeholder="Insira a resposta secreta exata..."
                      className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={hasDoubleReg || (overlappingReg && !bypassConflict)}
                  className={`w-full py-3 font-black rounded-xl text-xs uppercase shadow-md transition-all duration-300 tracking-widest cursor-pointer mt-2 ${
                    hasDoubleReg
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : overlappingReg && !bypassConflict
                        ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30 cursor-not-allowed animate-pulse'
                        : 'bg-[#dfac34] hover:bg-[#dfac34]/90 text-slate-950 hover:-translate-y-0.5 gold-glow'
                  }`}
                >
                  {hasDoubleReg 
                    ? 'Inscrição Ativa' 
                    : overlappingReg && !bypassConflict 
                      ? 'Requer Marcador de Autorização' 
                      : 'Finalizar Pré-Inscrição \u2192'}
                </button>
                
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
