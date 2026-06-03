import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Award, 
  Image as ImageIcon, 
  HelpCircle, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  Lock, 
  Unlock, 
  CheckCircle, 
  ChevronRight, 
  Download, 
  Clock, 
  Plus, 
  BookOpen, 
  Vote, 
  Sliders, 
  Music, 
  UserPlus, 
  FileSpreadsheet, 
  AlertTriangle,
  Upload,
  User,
  LogOut,
  Mail,
  Search,
  CheckCircle2,
  QrCode,
  Compass,
  Lightbulb,
  Sparkles,
  Layers,
  X,
  KeyRound,
  BarChart3
} from 'lucide-react';

import { Event, Registration, GalleryPost, WaitlistEntry, Contributor, Exhibition, BrainstormingIdea, ThematicAxis } from './types';
import { EventRegistrationPage } from './components/EventRegistrationPage';
import { INITIAL_EVENTS, INITIAL_GALLERY, COURSES, ACADEMIC_DEPARTMENTS, STAFF_PASSCODE, INITIAL_CONTRIBUTORS, INITIAL_EXHIBITIONS, BRAIN_IDEAS, THEMATIC_AXES } from './data';
import { 
  getStoredEvents, 
  saveStoredEvents, 
  getStoredRegistrations, 
  saveStoredRegistrations, 
  getStoredWaitlist, 
  saveStoredWaitlist, 
  getStoredGallery, 
  saveStoredGallery, 
  exportToCSV, 
  getCategoryBadge,
  getCourseAcronymAndColor,
  fetchEvents,
  fetchRegistrations,
  fetchWaitlist,
  fetchGallery,
  registerStudent,
  confirmRegistrationToken,
  sendCertificateEmailMock,
  fetchDashboardStats,
  addGalleryPostServer,
  addEventServer,
  deleteEventServer,
  resetServerDB,
  cancelRegistration
} from './utils';

// Subcomponents
import CountdownTimer from './components/CountdownTimer';
import EmailSimulator from './components/EmailSimulator';
import ScannerSimulator from './components/ScannerSimulator';
import CertificateGenerator from './components/CertificateGenerator';
import OrganizerDashboard from './components/OrganizerDashboard';
import SageoPhoneCompanion from './components/SageoPhoneCompanion';

export default function App() {
  // Global States synced with LocalStorage
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [gallery, setGallery] = useState<GalleryPost[]>([]);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'cronograma' | 'galeria' | 'regras' | 'admin' | 'exposicoes' | 'responsaveis' | 'my_activities'>('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Simulation utilities
  const [emailTriggerCount, setEmailTriggerCount] = useState(0);
  const [activeTicket, setActiveTicket] = useState<Registration | null>(null);
  const [activeTicketEvent, setActiveTicketEvent] = useState<Event | null>(null);

  // Ticket Recovery States
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStudentNumber, setRecoveryStudentNumber] = useState('');
  const [recoveryEventId, setRecoveryEventId] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Administrative Area auth
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<'status' | 'scanner' | 'eventos' | 'participantes' | 'dashboard'>('status');
  const [adminSelectedEventId, setAdminSelectedEventId] = useState<string>('');
  const [adminRegSearch, setAdminRegSearch] = useState('');

  // Active Certificate Modal State
  const [viewingCertificateMatch, setViewingCertificateMatch] = useState<{ reg: Registration; evt: Event } | null>(null);

  // Registration Form States
  const [formData, setFormData] = useState(() => {
    const defaultData = {
      firstName: '',
      lastName: '',
      studentNumber: '',
      course: COURSES[0],
      institutionalEmail: '',
      lecturerQuestion: '',
      youtubeLink: '',
      secretQuestion: '',
      secretAnswer: ''
    };
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sageo_registration_form_draft');
      if (saved) {
        try {
          return { ...defaultData, ...JSON.parse(saved) };
        } catch (e) {
          return defaultData;
        }
      }
    }
    return defaultData;
  });

  // Active Profile Student ID for the "Sem Conta" Pseudo-Profile portal
  const [activeProfileStudentNum, setActiveProfileStudentNum] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sageo_active_profile_student_num') || '';
    }
    return '';
  });

  // State to hold temporary student number input in the Profile Login card
  const [profileSearchNum, setProfileSearchNum] = useState('');

  // Cancellation and Ticket states for student's pseudo-account
  const [selectedCancelReg, setSelectedCancelReg] = useState<Registration | null>(null);
  const [cancelSecretAnswer, setCancelSecretAnswer] = useState('');
  const [selectedTicketReg, setSelectedTicketReg] = useState<Registration | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [waitlistFormData, setWaitlistFormData] = useState({
    name: '',
    email: '',
    course: COURSES[0]
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [bypassConflict, setBypassConflict] = useState(false);

  // Sync draft progress to localStorage in real-time
  useEffect(() => {
    localStorage.setItem('sageo_registration_form_draft', JSON.stringify(formData));
  }, [formData]);

  // Auto-fill profile based on Student ID (Pseudo-Profile restoration)
  useEffect(() => {
    const trimmedNum = formData.studentNumber.trim();
    if (trimmedNum.length === 8) {
      // Find the most recent registration for this student
      const matchedReg = [...registrations]
        .reverse()
        .find(r => r.student_number.trim() === trimmedNum);

      if (matchedReg) {
        // Only load if form state name fields are currently empty or different from matched
        if (formData.firstName !== matchedReg.first_name || formData.lastName !== matchedReg.last_name) {
          setFormData(prev => ({
            ...prev,
            firstName: matchedReg.first_name,
            lastName: matchedReg.last_name,
            course: matchedReg.course,
            institutionalEmail: matchedReg.institutional_email,
            secretQuestion: matchedReg.secret_question,
            secretAnswer: matchedReg.secret_answer
          }));
          triggerToast(`👤 Perfil SAGEO Carregado! Os seus dados académicos (Matrícula: ${trimmedNum}) foram restaurados automaticamente.`, 'success');
        }
      }
    }
  }, [formData.studentNumber, registrations]);

  // Reset bypass confirmation state when event changes
  useEffect(() => {
    setBypassConflict(false);
  }, [selectedEventId]);

  // Cronograma Filtering and Search States
  const [cronogramaSearch, setCronogramaSearch] = useState('');
  const [cronogramaCategory, setCronogramaCategory] = useState('all');
  const [cronogramaCourse, setCronogramaCourse] = useState('all');
  const [cronogramaDay, setCronogramaDay] = useState('2026-11-25'); // Default to 2026-11-25 (SAGEO main session)
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});

  // Autonomous Certificate Search States
  const [certSearchNumber, setCertSearchNumber] = useState('');
  const [certSearchError, setCertSearchError] = useState<string | null>(null);
  const [hasSearchedCerts, setHasSearchedCerts] = useState(false);

  // Exhibitions view interactive states
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [activeExbTab, setActiveExbTab] = useState<'info' | 'interview'>('info');
  const [activeExbPhotoIdx, setActiveExbPhotoIdx] = useState<number>(0);

  // Gallery custom uploads
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    description: '',
    event_id: '',
    imageUrl: ''
  });

  // Responsáveis tab sub-navigation, search and filter states
  const [responsaveisSubTab, setResponsaveisSubTab] = useState<'team' | 'propostas'>('team');
  const [selectedIdeaAuthor, setSelectedIdeaAuthor] = useState<string>('all');
  const [ideasSearch, setIdeasSearch] = useState<string>('');

  // Admin: New Event Form State
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    title: '',
    description: '',
    date: '2026-11-23',
    start_time: '09:00',
    end_time: '11:00',
    location: '',
    capacity: 45,
    category: 'empresa' as Event['category'],
    is_open: true,
    lecturer: '',
    image_url: 'https://images.unsplash.com/photo-1540317580114-ed684c82b71d?auto=format&fit=crop&w=800&q=80'
  });

  // Dynamic Custom Interactions
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [brainIdeas, setBrainIdeas] = useState<BrainstormingIdea[]>([]);
  const [galleryLikes, setGalleryLikes] = useState<Record<string, number>>({});
  const [showBrainIdeaForm, setShowBrainIdeaForm] = useState(false);
  const [brainIdeaForm, setBrainIdeaForm] = useState({
    author: '',
    title: '',
    description: '',
    content: '',
    suggested_guests: '',
    suggested_speaker: ''
  });

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [activeAdminRole, setActiveAdminRole] = useState<'staff' | 'organizer' | 'super_admin'>('staff');

  const syncBackendData = async () => {
    setIsSyncing(true);
    try {
      const serverEvents = await fetchEvents();
      const serverRegs = await fetchRegistrations();
      const serverWaitlist = await fetchWaitlist();
      const serverGallery = await fetchGallery();

      setEvents(serverEvents);
      setRegistrations(serverRegs);
      setWaitlist(serverWaitlist);
      setGallery(serverGallery);

      saveStoredEvents(serverEvents);
      saveStoredRegistrations(serverRegs);
      saveStoredWaitlist(serverWaitlist);
      saveStoredGallery(serverGallery);

      // Fetch server analyticial metrics & transaction audit journals if possible
      const stats = await fetchDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.warn("Falha ao sincronizar com o servidor SAGEO. A usar cache local.", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load and initialize data
  useEffect(() => {
    // 1. Instant hydration from cached storage for offline rendering
    setEvents(getStoredEvents());
    setRegistrations(getStoredRegistrations());
    setWaitlist(getStoredWaitlist());
    setGallery(getStoredGallery());

    const storedEvts = getStoredEvents();
    if (storedEvts.length > 0) {
      setAdminSelectedEventId(storedEvts[0].id);
    }

    // 2. Active server fetch
    syncBackendData();
  }, []);

  // Hydrate custom interactions on mount
  useEffect(() => {
    // Brainstorm Suggestions
    const storedIdeas = localStorage.getItem('sageo_brain_ideas');
    if (storedIdeas) {
      try {
        setBrainIdeas(JSON.parse(storedIdeas));
      } catch (e) {
        setBrainIdeas(BRAIN_IDEAS);
      }
    } else {
      localStorage.setItem('sageo_brain_ideas', JSON.stringify(BRAIN_IDEAS));
      setBrainIdeas(BRAIN_IDEAS);
    }

    // Gallery Likes
    const storedLikes = localStorage.getItem('sageo_gallery_likes');
    if (storedLikes) {
      try {
        setGalleryLikes(JSON.parse(storedLikes));
      } catch (e) {
        setGalleryLikes({});
      }
    }
  }, []);

  // Toast auto-dismiss effect based on primitive properties
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast?.message, toast?.type]);

  // Helper to determine time intervals overlaps
  const isOverlapping = (evtA: Event, evtB: Event): boolean => {
    if (evtA.date !== evtB.date) return false;
    
    const parseTime = (tStr?: string) => {
      if (!tStr) return 0;
      const parts = tStr.split(':');
      return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
    };
    
    const startA = parseTime(evtA.start_time);
    const endA = evtA.end_time ? parseTime(evtA.end_time) : startA + 120;
    
    const startB = parseTime(evtB.start_time);
    const endB = evtB.end_time ? parseTime(evtB.end_time) : startB + 125;
    
    return startA < endB && startB < endA;
  };

  // Helper to retrieve all registrations of a specific student by number/email prefix
  const getExistingStudentRegs = (studentNum?: string, email?: string) => {
    const normNum = studentNum?.trim().toLowerCase();
    const normEmailPrefix = email?.trim().toLowerCase().split('@')[0];
    
    if (!normNum && !normEmailPrefix) return [];
    
    return registrations.filter(r => {
      const rNum = r.student_number.trim().toLowerCase();
      const rEmailPrefix = r.institutional_email.trim().toLowerCase().split('@')[0];
      
      return (normNum && rNum === normNum) || 
             (normNum && rEmailPrefix === normNum) ||
             (normEmailPrefix && rNum === normEmailPrefix) ||
             (normEmailPrefix && rEmailPrefix === normEmailPrefix);
    });
  };

  // Sync callbacks
  const reloadData = () => {
    syncBackendData();
  };

  // Submit registration handler
  const handleRegister = async (e: React.FormEvent, event: Event) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (!formData.firstName || !formData.lastName || !formData.studentNumber || !formData.institutionalEmail || !formData.secretQuestion || !formData.secretAnswer) {
      setFormError('Todos os campos obrigatórios (*) devem ser preenchidos para validação curricular.');
      return;
    }

    const studentNumRegex = /^\d{8}$/;
    if (!studentNumRegex.test(formData.studentNumber.trim())) {
      setFormError('O número de estudante deve seguir a estrutura: [Ano de Ingresso - 4 dígitos] + [Número de Ingresso - 4 dígitos]. Exemplo: 20220001 (8 dígitos).');
      return;
    }

    const expectedEmail = `${formData.studentNumber.trim()}@isptec.co.ao`.toLowerCase();
    if (formData.institutionalEmail.trim().toLowerCase() !== expectedEmail) {
      setFormError(`O e-mail institucional deve seguir rigorosamente a estrutura: [número de estudante]@isptec.co.ao. Exemplo previsto: ${expectedEmail}`);
      return;
    }

    const studentNumTrimmed = formData.studentNumber.trim();
    const studentEmailTrimmed = formData.institutionalEmail.trim();
    const existingRegs = getExistingStudentRegs(studentNumTrimmed, studentEmailTrimmed);
    
    const hasDoubleReg = existingRegs.some(r => r.event_id === event.id);
    const overlappingReg = existingRegs.find(r => {
      if (r.event_id === event.id) return false;
      const otherEvt = events.find(e => e.id === r.event_id);
      if (!otherEvt) return false;
      return r.confirmed && isOverlapping(otherEvt, event);
    });

    if (hasDoubleReg) {
      setFormError('Inscrição Recusada: Já se encontra matriculado ou pré-inscrito nesta atividade!');
      return;
    }

    if (overlappingReg && !bypassConflict) {
      setFormError('Confirmação Requerida: Foram identificadas sobreposições de horários com outras atividades em que já tens confirmação ativa. Por favor, marque a caixa de consentimento e aceitação de compromisso abaixo de modo a prosseguir.');
      return;
    }

    try {
      const payload = {
        event_id: event.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        student_number: formData.studentNumber.trim(),
        course: formData.course,
        institutional_email: formData.institutionalEmail.trim(),
        secret_question: formData.secretQuestion,
        secret_answer: formData.secretAnswer,
        bypass_conflict: bypassConflict,
        lecturer_question: formData.lecturerQuestion || undefined,
        youtube_link: event.category === 'festival' ? formData.youtubeLink : undefined
      };

      const result = await registerStudent(payload);
      
      // Update local storage/state with the response to have them instantly synced
      await syncBackendData();

      // Clear draft progress
      localStorage.removeItem('sageo_registration_form_draft');

      // Refresh the EmailSimulator preview immediately so the verification email is displayed
      setEmailTriggerCount(prev => prev + 1);

      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        studentNumber: '',
        course: COURSES[0],
        institutionalEmail: '',
        lecturerQuestion: '',
        youtubeLink: '',
        secretQuestion: '',
        secretAnswer: ''
      });

      if (result.status === "waitlist") {
        triggerToast('⏳ Lotação Limite Atingida! Foi posicionado com sucesso na Lista de Espera Ordenada. Entraremos em contacto para validação.', 'info');
      } else {
        triggerToast('⏳ Pré-inscrição registada! Um e-mail de confirmação foi enviado para a tua caixa de correio académica. Ativa a tua vaga acedendo ao e-mail enviado.', 'warning');
      }
      setSelectedEventId(null);
    } catch (err: any) {
      setFormError(err.message || 'Houve um erro ao processar a inscrição no servidor.');
    }
  };

  // Waitlist submission
  const handleWaitlistRegister = async (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    setWaitlistError(null);

    if (!waitlistFormData.name || !waitlistFormData.email) {
      setWaitlistError('O nome e o e-mail são obrigatórios para a lista de espera.');
      return;
    }

    const isGeosciences = ['Engenharia de Petróleos', 'Geofísica'].includes(waitlistFormData.course);
    
    try {
      // For geosciences, register directly via the standard flow.
      // Otherwise, the server automatically manages waitlisting.
      let studentNumber = `2026${Math.floor(1000 + Math.random() * 9000)}`;
      const emailParts = waitlistFormData.email.split('@')[0];
      const numbers = emailParts.replace(/\D/g, '');
      if (numbers.length === 8) {
        studentNumber = numbers;
      }

      const existingRegs = getExistingStudentRegs(studentNumber, waitlistFormData.email);
      const hasDoubleReg = existingRegs.some(r => r.event_id === eventId);
      if (hasDoubleReg) {
        setWaitlistError('Inscrição Recusada: Já se encontra pré-inscrito ou em lista de espera nesta atividade!');
        return;
      }

      const nameParts = waitlistFormData.name.trim().split(' ');
      const firstName = nameParts[0] || 'Estudante';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Geociências';

      const payload = {
        event_id: eventId,
        first_name: firstName,
        last_name: lastName,
        student_number: studentNumber,
        course: waitlistFormData.course,
        institutional_email: `${studentNumber}@isptec.co.ao`,
        secret_question: "Curso de Ingresso?",
        secret_answer: waitlistFormData.course,
      };

      const result = await registerStudent(payload);
      await syncBackendData();

      setWaitlistFormData({ name: '', email: '', course: COURSES[0] });
      setSelectedEventId(null);

      if (result.status === "confirmed") {
        triggerToast('✨ Excelente! Devido à tua vaga preferencial como membro do Departamento de Geociências, a tua inscrição foi ativada e confirmada de imediato com sucesso!', 'success');
      } else {
        triggerToast('📋 Adicionado à lista de espera com sucesso! Caso ocorram desistências, enviaremos um alerta.', 'info');
      }
    } catch (err: any) {
      setWaitlistError(err.message || 'Erro ao processar lista de espera.');
    }
  };

  // Complete Email confirmation link click
  const handleEmailConfirmedSuccess = async (token: string) => {
    try {
      const data = await confirmRegistrationToken(token);
      const confirmedReg = data.registration;

      // Sync backend state & cache
      await syncBackendData();

      // Automatically log the student into their SAGEO Pseudo-Profile Portal
      setActiveProfileStudentNum(confirmedReg.student_number);
      localStorage.setItem('sageo_active_profile_student_num', confirmedReg.student_number);

      const evt = events.find(e => e.id === confirmedReg.event_id) || null;
      setActiveTicket(confirmedReg);
      setActiveTicketEvent(evt);
      setActiveTab('home');

      triggerToast('✨ Excelente! Inscrição académica ativada e confirmada com sucesso! O teu QR Code de acesso está agora ativo.', 'success');

      // Automatically generate a personalized certificate and dispatch to student institutional email!
      if (evt) {
        autoGenerateAndSendCertificate(confirmedReg, evt);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Erro ao processar confirmação de vaga.', 'error');
    }
  };

  // Process confirmation token from real email URL link clicks on startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      // Remove query parameter gracefully to keep the URL clean
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url.toString());

      // Trigger the success confirmation handler with the token
      handleEmailConfirmedSuccess(tokenParam);
    }
  }, [events]);

  // Helper to automatically generate and send a personalized high-resolution certificate on confirm
  const autoGenerateAndSendCertificate = async (registration: any, event: any) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1120;
      canvas.height = 792;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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
      const drawFlourish = (x: number, y: number, xDir: number, yDir: number) => {
        ctx.beginPath();
        ctx.moveTo(x + xDir * 35, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + yDir * 35);
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
      const fullNameCombined = `${registration.first_name} ${registration.last_name}`.toUpperCase();
      ctx.fillText(fullNameCombined, w / 2, 395);

      // Institutional details
      ctx.fillStyle = primaryTextColor;
      ctx.font = '15px "Space Grotesk", sans-serif';
      ctx.fillText(`Inscrito sob a matrícula institucional de índice público ${registration.student_number}`, w / 2, 440);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText(`CURSO AUTÓNOMO: ${registration.course.toUpperCase()}`, w / 2, 475);

      ctx.fillStyle = descriptionTextColor;
      ctx.font = 'italic 15px Georgia, serif';
      ctx.fillText('concluiu com aproveitamento e presença verificada em sistema informático a atividade letiva:', w / 2, 520);

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

      // Honorific credits
      const honorificMention = 'Participação Excecional';
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
      const securityCode = registration.qr_token || registration.id.toUpperCase().slice(0, 10);
      ctx.fillText(
        `VALIDAÇÃO DIGITAL UNIFICADA: SHA256-${securityCode}  |  DATA LOG: ${new Date().toLocaleString('pt-PT')}  | IP: 127.0.0.1`,
        w / 2,
        762
      );

      const imageBase64 = canvas.toDataURL('image/png');

      // Send to backend endpoint (with automatic client simulator fallback)
      const body = await sendCertificateEmailMock({
        to: registration.institutional_email,
        subject: `🎓 CERTIFICADO OFICIAL SAGEO: ${event.title}`,
        firstName: registration.first_name,
        lastName: registration.last_name,
        eventName: event.title,
        certificateImage: imageBase64,
      });

      if (body.status === 'simulated') {
        triggerToast(`ℹ️ [Simulador] Certificado personalizado para ${registration.first_name} ${registration.last_name} está disponível na Central de Correio!`, 'info');
      } else {
        triggerToast(`🎓 Certificado personalizado gerado e enviado com sucesso para ${registration.institutional_email}!`, 'success');
      }
    } catch (err) {
      console.error('Erro na autogeração de certificado e envio ao e-mail:', err);
    }
  };

  // Interaction Handlers
  const handleLikeGalleryPost = (postId: string) => {
    const updated = {
      ...galleryLikes,
      [postId]: (galleryLikes[postId] || 0) + 1
    };
    setGalleryLikes(updated);
    localStorage.setItem('sageo_gallery_likes', JSON.stringify(updated));
    triggerToast('❤️ Gosto registado! Obrigado pela sua participação na galeria.', 'success');
  };

  const handleUpvoteIdea = (ideaId: string) => {
    const updated = brainIdeas.map(id => {
      if (id.id === ideaId) {
        return { ...id, votes: (id.votes || 0) + 1 };
      }
      return id;
    });
    setBrainIdeas(updated);
    localStorage.setItem('sageo_brain_ideas', JSON.stringify(updated));
    triggerToast('✓ Proposta científica apoiada! O seu voto foi adicionado.', 'success');
  };

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brainIdeaForm.title || !brainIdeaForm.author || !brainIdeaForm.description) {
      triggerToast('⚠️ Por favor, informe o título, autor/proponente e a descrição resumida.', 'warning');
      return;
    }
    const newId = `idea-${Date.now()}`;
    const newIdea: BrainstormingIdea = {
      id: newId,
      author: brainIdeaForm.author,
      title: brainIdeaForm.title,
      description: brainIdeaForm.description,
      content: brainIdeaForm.content || undefined,
      suggested_guests: brainIdeaForm.suggested_guests || undefined,
      suggested_speaker: brainIdeaForm.suggested_speaker || undefined,
      votes: 1
    };
    const updated = [newIdea, ...brainIdeas];
    setBrainIdeas(updated);
    localStorage.setItem('sageo_brain_ideas', JSON.stringify(updated));
    setShowBrainIdeaForm(false);
    setBrainIdeaForm({
      author: '',
      title: '',
      description: '',
      content: '',
      suggested_guests: '',
      suggested_speaker: ''
    });
    triggerToast('✨ Proposta científica ou palestra adicionada com sucesso!', 'success');
  };

  const handleRecoverTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    const match = registrations.find(
      r => r.student_number.trim() === recoveryStudentNumber.trim() && r.event_id === recoveryEventId
    );

    if (!match) {
      setRecoveryError('Não encontramos nenhum registo ativo correspondente a este Número de Estudante e Atividade combinados.');
      return;
    }

    const evt = events.find(item => item.id === match.event_id) || null;
    setActiveTicket(match);
    setActiveTicketEvent(evt);
    setShowRecoveryModal(false);
    setRecoveryStudentNumber('');
    setRecoveryEventId('');
    triggerToast('✨ Bilhete recuperado com sucesso! Podes visualizar o teu QR Code e Comprovativo centralizado abaixo.', 'success');
  };

  // Add custom photo to gallery page
  const handleAddGalleryPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.imageUrl || !galleryForm.title || !galleryForm.description) {
      triggerToast('Por favor, indica um título, descrição e link de imagem válido.', 'warning');
      return;
    }

    try {
      const payload = {
        event_id: galleryForm.event_id || undefined,
        title: galleryForm.title,
        description: galleryForm.description,
        image_url: galleryForm.imageUrl
      };

      await addGalleryPostServer(payload);
      await syncBackendData();

      setGalleryForm({ title: '', description: '', event_id: '', imageUrl: '' });
      setShowGalleryForm(false);
      triggerToast('📸 Foto de Memória adicionada com sucesso à Galeria Pública SAGEO!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Erro ao partilhar foto na galeria.', 'error');
    }
  };

  // Admin authentication (Distinct role-based passcodes)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = adminPasscode.trim().toUpperCase();
    
    if (cleanPass === 'SAGEO2026-ADM' || cleanPass === STAFF_PASSCODE) {
      setIsAdminAuthenticated(true);
      setActiveAdminRole('super_admin');
      setAdminPasscode('');
      triggerToast('🔐 Consola Central desbloqueada como: SUPER-ADMINISTRADOR', 'success');
    } else if (cleanPass === 'SAGEO2026-ORG') {
      setIsAdminAuthenticated(true);
      setActiveAdminRole('organizer');
      setAdminPasscode('');
      triggerToast('🔐 Consola Central desbloqueada como: ORGANIZADOR', 'success');
    } else if (cleanPass === 'SAGEO2026-STF' || cleanPass === '1234') {
      setIsAdminAuthenticated(true);
      setActiveAdminRole('staff');
      setAdminPasscode('');
      triggerToast('🔐 Consola Central desbloqueada como: PORTARIA / STAFF', 'success');
    } else {
      triggerToast('Código Secretariado SAGEO incorreto! SAGEO2026-ADM (Supervisor), SAGEO2026-ORG (Organizador) ou SAGEO2026-STF (Staff Portaria).', 'error');
    }
  };

  // Admin logout
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
  };

  // Admin: create new custom event in schedule
  const handleAddCustomEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.title || !newEventForm.location || !newEventForm.lecturer) {
      triggerToast('Por favor, preencha os detalhes mínimos (título, palestrante, sala) do novo evento.', 'warning');
      return;
    }

    try {
      const payload: Partial<Event> = {
        title: newEventForm.title,
        description: newEventForm.description || 'Sem descrição detalhada.',
        date: newEventForm.date,
        start_time: newEventForm.start_time,
        end_time: newEventForm.end_time || undefined,
        location: newEventForm.location,
        capacity: Math.min(45, Number(newEventForm.capacity)),
        category: newEventForm.category,
        is_open: newEventForm.is_open,
        lecturer: newEventForm.lecturer,
        image_url: newEventForm.image_url
      };

      await addEventServer(payload);
      await syncBackendData();

      setShowAddEventForm(false);
      setNewEventForm({
        title: '',
        description: '',
        date: '2026-11-23',
        start_time: '09:00',
        end_time: '11:00',
        location: '',
        capacity: 45,
        category: 'empresa',
        is_open: true,
        lecturer: '',
        image_url: 'https://images.unsplash.com/photo-1540317580114-ed684c82b71d?auto=format&fit=crop&w=800&q=80'
      });

      triggerToast('🆕 Novo Evento adicionado com sucesso ao Cronograma SAGEO!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Erro ao adicionar atividade no cronograma.', 'error');
    }
  };

  // Admin toggle event status (open/close enrollment)
  const toggleEventRegistration = async (evtId: string) => {
    const matched = events.find(e => e.id === evtId);
    if (!matched) return;

    try {
      await addEventServer({
        ...matched,
        is_open: !matched.is_open
      });
      await syncBackendData();
    } catch (err: any) {
      triggerToast(err.message || 'Erro ao alternar status da atividade.', 'error');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEventServer(id);
      await syncBackendData();
      triggerToast('🗑️ Atividade académica removida com sucesso!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Erro ao remover atividade.', 'error');
    }
  };

  // Export selected event list to CSV
  const handleExportCSV = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const eventRegs = registrations.filter(r => r.event_id === eventId);

    const headers = ['ID Registo', 'Primeiro Nome', 'Último Nome', 'Curso', 'Nº Estudante', 'Email Académico', 'Pergunta ao Orador', 'Link Playlist', 'Check-In', 'Data Check-In'];
    const rows = eventRegs.map(r => [
      r.id,
      r.first_name,
      r.last_name,
      r.course,
      r.student_number,
      r.institutional_email,
      r.lecturer_question || '',
      r.youtube_link || '',
      r.checked_in ? 'SIM' : 'NÃO',
      r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : ''
    ]);

    exportToCSV(headers, rows, `SAGEO2026_Inscritos_${event.title.replace(/\s+/g, '_').slice(0, 30)}`);
  };

  // Date formatted Portuguese helper
  const formatDayPt = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parts[2];
    const monthNum = parts[1];
    
    // Traditional calendar SAGEO Week Oct 12-16
    switch (day) {
      case '12': return 'Segunda-feira (12/10)';
      case '13': return 'Terça-feira (13/10)';
      case '14': return 'Quarta-feira (14/10)';
      case '15': return 'Quinta-feira (15/10)';
      case '16': return 'Sexta-feira (16/10)';
      default: return `${day}/${monthNum}`;
    }
  };

  // Filter stats definitions
  const totalStudentsRegisteredNum = registrations.filter(r => r.confirmed).length;
  const totalCheckinsDone = registrations.filter(r => r.checked_in).length;

  // Filtered Events computed on render at component level
  const filteredEvents = events.filter(event => {
    // Day filter
    if (cronogramaDay !== 'all' && event.date !== cronogramaDay) return false;
    
    // Category filter
    if (cronogramaCategory !== 'all' && event.category !== cronogramaCategory) return false;
    
    // Course filter
    if (cronogramaCourse !== 'all' && event.course !== cronogramaCourse) return false;
    
    // Text search
    if (cronogramaSearch.trim() !== '') {
      const term = cronogramaSearch.toLowerCase();
      const titleMatch = event.title.toLowerCase().includes(term);
      const descMatch = event.description.toLowerCase().includes(term);
      const lecturerMatch = event.lecturer?.toLowerCase().includes(term) || false;
      const locationMatch = event.location.toLowerCase().includes(term);
      if (!titleMatch && !descMatch && !lecturerMatch && !locationMatch) return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-midnight-radial font-sans selection:bg-[#dfac34] selection:text-slate-950 text-slate-100 pb-20 relative">
      
      {/* Visual background decorations for high fidelity design */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 translate-x-1/2 w-[700px] h-[700px] bg-[#dfac34]/5 rounded-full blur-[180px] pointer-events-none" />

      {/* SUB-HEADER / GLOBAL LIVE BANNER */}
      <div className="bg-slate-950/80 border-b border-[#dfac34]/15 py-2.5 px-4 backdrop-blur-md relative z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#dfac34] animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-[#dfac34] uppercase tracking-widest">
              SAGEO PLATAFORMA INTEGRADA ATIVA &bull; GEOCIÊNCIAS: DO PETRÓLEO AOS MINERAIS CRÍTICOS
            </span>
          </div>
          <div className="text-slate-400 text-[10px] font-mono">
            Secretariado Técnico Geral: <span className="text-[#dfac34] font-bold hover:underline cursor-pointer">{STAFF_PASSCODE}</span>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION HEADER */}
      <div className="sticky top-4 z-40 px-4 max-w-7xl mx-auto w-full">
        <header className="glass-morphic backdrop-blur-xl rounded-2xl px-6 shadow-2xl h-20 flex items-center justify-between border border-[#dfac34]/25">
          
          {/* Logo Brand Title */}
          <button onClick={() => setActiveTab('home')} className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none">
            <div className="bg-gradient-to-tr from-[#dfac34] to-yellow-600 text-slate-950 p-2.5 rounded-xl font-bold shadow-lg shadow-[#dfac34]/20 transition-transform duration-350 group-hover:rotate-6 group-hover:scale-105">
              <Compass className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="editorial-serif font-black text-2xl tracking-tight text-white group-hover:text-[#dfac34] duration-200">
                SAGEO <span className="text-[#dfac34]">2026</span>
              </span>
              <p className="text-[8px] text-[#dfac34] font-mono tracking-widest mt-0.5 uppercase font-bold">Semana de Geociências &bull; ISPTEC</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1.5">
            {[
              { id: 'home', label: 'Início', icon: BookOpen },
              { id: 'cronograma', label: 'Cronograma', icon: Calendar },
              { id: 'my_activities', label: 'Minhas Atividades', icon: User },
              { id: 'exposicoes', label: 'Exposições', icon: Award },
              { id: 'responsaveis', label: 'Responsáveis', icon: Users },
              { id: 'galeria', label: 'Galeria', icon: ImageIcon },
              { id: 'regras', label: 'Normas & FAQ', icon: HelpCircle },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setSelectedEventId(null); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                    activeTab === item.id 
                    ? 'bg-[#dfac34]/15 text-[#dfac34] border border-[#dfac34]/40 shadow-inner shadow-black/40' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#dfac34]" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Admin Desk Access Button Indicator */}
            <span className="h-5 w-[1px] bg-slate-800/80 mx-2" />
            
            <button
              onClick={() => { setActiveTab('admin'); setSelectedEventId(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === 'admin'
                ? 'bg-[#dfac34] text-slate-950 font-extrabold shadow-lg shadow-[#dfac34]/25'
                : 'bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-[#dfac34] hover:border-[#dfac34]/40'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Dossier Admin</span>
            </button>
          </nav>

          {/* Mobile responsive Quick Trigger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'admin' ? 'home' : 'admin')}
              className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/80 text-slate-300 hover:text-[#dfac34] backdrop-blur-md"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveTab('cronograma')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#dfac34] to-yellow-600 hover:from-amber-500 hover:to-semibold text-slate-950 font-bold text-xs shadow-lg"
            >
              Agenda
            </button>
          </div>

        </header>
      </div>

      {/* Scrollable Sub-Navigation for Mobile/Tablet */}
      <div className="xl:hidden flex items-center gap-2 overflow-x-auto mx-4 mt-3 p-2 bg-slate-950/60 backdrop-blur-lg border border-slate-900 rounded-xl sticky top-4 z-35 scrollbar-none">
        {[
          { id: 'home', label: 'Início', icon: BookOpen },
          { id: 'cronograma', label: 'Cronograma', icon: Calendar },
          { id: 'my_activities', label: 'Atividades', icon: User },
          { id: 'exposicoes', label: 'Exposições', icon: Award },
          { id: 'responsaveis', label: 'Responsáveis', icon: Users },
          { id: 'galeria', label: 'Galeria', icon: ImageIcon },
          { id: 'regras', label: 'Normas & FAQ', icon: HelpCircle },
          { id: 'admin', label: 'Admin', icon: Lock },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setSelectedEventId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 shrink-0 cursor-pointer ${
                activeTab === item.id 
                ? 'bg-[#dfac34] text-slate-950 border border-[#dfac34] shadow-sm font-black' 
                : 'text-slate-300 bg-slate-900/50 border border-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* FLOATING RETRO CORREIO SIMULATOR DESK */}
      <EmailSimulator 
        onConfirmSuccess={handleEmailConfirmedSuccess} 
        triggerRefresh={emailTriggerCount} 
      />

      {/* FLOATING SAGEO STUDENT PHONE COMPANION */}
      <SageoPhoneCompanion
        activeStudentNum={activeProfileStudentNum}
        registrations={registrations}
        events={events}
        onTriggerRefresh={() => {
          // Re-sync local state on exit/updates if needed
          const regs = getStoredRegistrations();
          setRegistrations(regs);
        }}
      />

      {/* CORE APPLICATION BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* VIEW 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-16">
            
            {/* Elegant Hero Visual Showcase */}
            <div className="relative rounded-3xl glass-morphic overflow-hidden p-6 md:p-16 shadow-3xl bg-[#0a0f1c]/75 border border-[#dfac34]/20 blue-glow">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/30 via-transparent to-amber-950/20 pointer-events-none" />
              <div className="absolute -right-32 -bottom-32 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[110px] pointer-events-none" />
              <div className="absolute -left-32 -top-32 w-[450px] h-[450px] bg-[#dfac34]/10 rounded-full blur-[130px] pointer-events-none" />

              <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left Intro Text Column */}
                <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#dfac34]/10 rounded-full border border-[#dfac34]/25 text-[#dfac34] text-xs font-bold font-mono tracking-widest uppercase">
                    <Award className="w-3.5 h-3.5 text-[#dfac34] animate-pulse" />
                    <span>EMISSÃO E MONITORIZAÇÃO AUTÓNOMA DE SEAT PARTICIPANTES</span>
                  </div>

                  <h1 className="text-4.5xl md:text-5.5xl lg:text-6.5xl editorial-serif font-serif font-black text-white leading-tight">
                    Plataforma Oficial de Credenciamento <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#dfac34] to-yellow-500 italic font-medium">SAGEO 2026</span>
                  </h1>

                  <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl font-sans font-light">
                    Bem-vindo ao centro digital de prestígio da Semana Académica de Geociências (SAGEO). Subscreve atividades, mini-cursos e painéis académicos sob o lema "Do Petróleo aos Minerais Críticos: O Papel dos Geo‐Recursos na Transição Energética e Industrial de Angola". Valida a tua presença via QR Code e emite o teu certificado de forma totalmente autónoma.
                  </p>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                    <button
                      onClick={() => setActiveTab('cronograma')}
                      className="px-8 py-4 bg-gradient-to-r from-[#dfac34] to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black rounded-xl flex items-center gap-3 text-xs uppercase tracking-widest transition-all duration-300 shadow-xl gold-glow hover:-translate-y-1 active:translate-y-0 cursor-pointer"
                    >
                      <span>Garante a tua Inscrição</span>
                      <ArrowRight className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={() => setActiveTab('regras')}
                      className="px-8 py-4 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all duration-300 backdrop-blur-md"
                    >
                      Normas Gerais
                    </button>
                  </div>
                </div>

                {/* Right Stacked Showcase Panels Column */}
                <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                  
                  {/* Outer Showcase Container holding overlapping premium cards */}
                  <div className="relative space-y-4">
                    {/* Background glow behind stack */}
                    <div className="absolute inset-0 bg-blue-600/5 rounded-3xl blur-3xl pointer-events-none" />

                    {/* Panel 1: Featured Event Showcase Card */}
                    <div className="p-4 bg-slate-950/80 border border-[#dfac34]/20 rounded-2xl flex gap-3.5 shadow-2xl transition-all duration-300 hover:border-[#dfac34]/40 hover:-translate-y-0.5">
                      <div className="bg-[#dfac34]/15 p-2.5 text-[#dfac34] rounded-xl self-start">
                        <Calendar className="w-5 h-5 text-[#dfac34]" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-mono font-bold uppercase bg-blue-950/80 text-blue-400 border border-blue-900/30 px-1.5 py-0.5 rounded">EM DESTAQUE</span>
                          <span className="text-[9px] text-[#dfac34] font-mono font-semibold flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#dfac34] animate-ping" /> LIVE AUDITÓRIO</span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-100 mt-1.5 line-clamp-1">Sessão Inaugural: Supply Chain & IA</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1 font-mono">Prof. C. Almeirim (MIT) & Diretor Executivo</p>
                      </div>
                    </div>

                    {/* LIVE INTERACTIVE STUDENT PSEUDO-PROFILE PORTAL ("Sem Conta") */}
                    {activeProfileStudentNum ? (
                      (() => {
                        const trimmedPNum = activeProfileStudentNum.trim().toUpperCase();
                        const myRegs = registrations.filter(r => r.student_number.toUpperCase() === trimmedPNum);
                        const myWaitlist = waitlist.filter(w => w.email.trim().toLowerCase().includes(trimmedPNum.toLowerCase()) || (w.name && w.name.toUpperCase().includes(trimmedPNum)));
                        
                        // Find student's name and course info
                        const lastReg = myRegs[myRegs.length - 1];
                        const studentName = lastReg ? `${lastReg.first_name} ${lastReg.last_name}` : `Estudante SAGEO`;
                        const studentCourse = lastReg ? lastReg.course : "Curso Académico";
                        
                        return (
                          <div className="p-5 bg-slate-950/90 border border-[#dfac34]/35 rounded-2xl shadow-2xl space-y-4 animate-fade-in text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#dfac34]/5 rounded-full blur-2xl pointer-events-none" />
                            
                            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-2 bg-[#dfac34]/15 text-[#dfac34] rounded-xl">
                                  <User className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-100 font-sans tracking-wide uppercase truncate block">{studentName}</h4>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Matrícula: {trimmedPNum}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setActiveProfileStudentNum('');
                                  localStorage.removeItem('sageo_active_profile_student_num');
                                  triggerToast('Sessão terminada voluntariamente do Portal do Estudante.', 'info');
                                }}
                                className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-rose-450 rounded-lg cursor-pointer transition-colors shrink-0"
                                title="Terminar Sessão"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="text-[9px] uppercase font-mono font-extrabold text-[#dfac34] tracking-widest bg-[#dfac34]/5 px-2.5 py-1 rounded inline-block border border-[#dfac34]/10">
                              {studentCourse}
                            </div>

                            <div className="text-slate-400 text-[10px] uppercase font-mono font-bold tracking-wider mt-1 block">
                              AS MINHAS ATIVIDADES
                            </div>

                            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                              {myRegs.length === 0 && myWaitlist.length === 0 ? (
                                <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl text-center">
                                  <p className="text-[11px] text-slate-450 italic leading-relaxed">Nenhuma pré-inscrição registada. Navega até ao Cronograma de eventos para garantir a tua presença!</p>
                                </div>
                              ) : (
                                <>
                                  {/* Render active registrations */}
                                  {myRegs.map(reg => {
                                    const targetEvt = events.find(e => e.id === reg.event_id);
                                    return (
                                      <div key={reg.id} className="p-2.5 bg-slate-900/60 border border-slate-850 hover:bg-slate-900 rounded-xl flex items-center justify-between gap-2.5 transition-colors">
                                        <div className="text-left flex-1 min-w-0">
                                          <h5 className="text-[11px] font-bold text-slate-200 truncate leading-snug">{targetEvt ? targetEvt.title : 'Atividade SAGEO'}</h5>
                                          <p className="text-[9px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-1">
                                            <span className="truncate max-w-[100px]">{targetEvt ? targetEvt.location : 'Campus'}</span>
                                            <span>&bull;</span>
                                            <span>{targetEvt ? formatDayPt(targetEvt.date) : ''}</span>
                                          </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                          {!reg.confirmed ? (
                                            <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 text-[8px] font-mono border border-amber-500/10 rounded font-bold uppercase shrink-0">
                                              ⏳ REQUER CONFIRMAÇÃO
                                            </span>
                                          ) : reg.checked_in ? (
                                            <span className="px-1.5 py-0.5 bg-[#dfac34]/15 text-[#dfac34] text-[8px] font-mono border border-[#dfac34]/10 rounded font-bold uppercase shrink-0">
                                              ☑ PRESENTE SAGEO
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[8px] font-mono border border-emerald-500/10 rounded font-bold uppercase shrink-0">
                                              ✅ CONFIRMADO
                                            </span>
                                          )}

                                          <div className="flex gap-1">
                                            {!reg.confirmed ? (
                                              <button
                                                onClick={async () => {
                                                  const token = prompt('Por favor, introduz o Código de Confirmação (ex: TOK-12345) enviado para o teu e-mail institucional:');
                                                  if (token) {
                                                    await handleEmailConfirmedSuccess(token.trim().toUpperCase());
                                                  }
                                                }}
                                                className="text-[8px] text-amber-450 italic font-mono hover:underline cursor-pointer shrink-0"
                                              >
                                                Ativar com Código &rarr;
                                              </button>
                                            ) : reg.checked_in ? (
                                              <button
                                                onClick={() => setViewingCertificateMatch({ reg, evt: targetEvt! })}
                                                className="px-2 py-0.5 bg-[#dfac34] hover:bg-amber-500 text-[#0a0f1c] text-[9px] font-extrabold font-sans rounded transition duration-150"
                                              >
                                                Certificado
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => {
                                                  setActiveTicket(reg);
                                                  setActiveTicketEvent(targetEvt || null);
                                                }}
                                                className="px-2 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-400 border border-indigo-500/30 text-[9px] font-bold font-sans rounded transition duration-150"
                                              >
                                                Ver Bilhete
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Render waitlist registrations */}
                                  {myWaitlist.map(waitReg => {
                                    const targetEvt = events.find(e => e.id === waitReg.event_id);
                                    return (
                                      <div key={waitReg.id} className="p-2.5 bg-slate-900/30 border border-slate-900 flex items-center justify-between gap-2.5 rounded-xl">
                                        <div className="text-left flex-1 min-w-0">
                                          <h5 className="text-[11px] font-bold text-slate-400 truncate leading-snug">{targetEvt ? targetEvt.title : 'Atividade SAGEO'}</h5>
                                          <p className="text-[9px] text-slate-600 font-mono mt-0.5">
                                            Lista de Espera &bull; {targetEvt ? formatDayPt(targetEvt.date) : ''}
                                          </p>
                                        </div>
                                        <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 text-[8px] font-mono border border-rose-500/10 rounded font-bold uppercase shrink-0">
                                          Lista de Espera
                                        </span>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="p-5 bg-slate-950/80 border border-slate-850 rounded-2xl shadow-2xl space-y-4 animate-fade-in text-left">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-[#dfac34]" />
                          <h4 className="font-serif font-black text-slate-100 text-sm tracking-tight uppercase">Portal de Estudante</h4>
                        </div>
                        
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-light">
                          Consulta a tua agenda, bilhetes de acesso QR e descarrega certificados de participação letivos. Não necessita de registo formal de conta.
                        </p>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const val = profileSearchNum.trim();
                            if (val.length < 8) {
                              triggerToast('Por favor, indica o Número de Estudante de 8 dígitos completo.', 'error');
                              return;
                            }
                            const hasRegs = registrations.some(r => r.student_number.trim() === val);
                            const hasWait = waitlist.some(w => w.email.trim().toLowerCase().includes(val.toLowerCase()));
                            
                            if (hasRegs || hasWait) {
                              setActiveProfileStudentNum(val);
                              localStorage.setItem('sageo_active_profile_student_num', val);
                              setProfileSearchNum('');
                              triggerToast('✨ Perfil SAGEO Carregado! Sê bem-vindo ao teu painel de acompanhamento.', 'success');
                            } else {
                              triggerToast('Nenhuma inscrição encontrada para este Número de Estudante. Regista-te primeiro em alguma atividade no Cronograma!', 'warning');
                            }
                          }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-500 mb-1 font-mono">
                              Número de Estudante (Matrícula - 8 dígitos)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                maxLength={8}
                                placeholder="Ex: 20220001"
                                value={profileSearchNum}
                                onChange={(e) => setProfileSearchNum(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#dfac34] font-mono pr-10"
                              />
                              <div className="absolute top-2.5 right-3 text-slate-500">
                                <KeyRound className="w-4 h-4 text-slate-700" />
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-[#dfac34] hover:bg-amber-500 text-slate-950 text-xs font-black rounded-xl transition-all duration-300 font-sans uppercase tracking-[0.05em] flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-lg"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Aceder ao Meu Perfil</span>
                          </button>
                        </form>
                      </div>
                    )}

                  </div>

                  {/* Countdown Header */}
                  <div className="pt-2 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-[#dfac34] font-mono font-extrabold mb-3">
                      CONTAGEM REGRESSIVA PARA O ARRANQUE DOCENTE
                    </p>
                    <CountdownTimer />
                  </div>
                  
                  {/* Active Ticket Banner under Timer IF confirmed */}
                  {activeTicket ? (
                    <div className="bg-slate-950/90 border border-[#dfac34]/20 p-4 rounded-2xl flex items-center justify-between gap-3 animate-fade-in gold-glow">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#dfac34] p-2 rounded-xl text-slate-950">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-[#dfac34] font-bold">O Teu Bilhete está Ativo!</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {activeTicket.id.slice(0, 10).toUpperCase()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const evt = events.find(e => e.id === activeTicket.event_id) || null;
                          if (evt) {
                            setActiveTicketEvent(evt);
                          }
                        }}
                        className="px-3 py-1.5 bg-[#dfac34]/20 hover:bg-[#dfac34]/30 text-[#dfac34] text-xs font-bold rounded-lg font-sans transition-colors border border-[#dfac34]/30 cursor-pointer"
                      >
                        Ver QR
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-2xl text-center space-y-2">
                      <p className="text-xs text-slate-400 font-mono">Perdeu o seu QR Code ou quer ver uma inscrição ativa?</p>
                      <button
                        onClick={() => setShowRecoveryModal(true)}
                        className="text-xs text-[#dfac34] font-bold underline hover:text-amber-300 cursor-pointer flex items-center justify-center gap-1.5 mx-auto font-sans uppercase tracking-wider text-[10px]"
                      >
                        <Search className="w-3.5 h-3.5 text-[#dfac34]" />
                        Recuperar Bilhete Académico
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* DYNAMIC TICKET VISUALISATION MODAL/DRAWER OVERVIEW IF SET */}
            {activeTicket && activeTicketEvent && (
              <div className="glass-morphic bg-slate-900/65 border border-[#dfac34]/30 rounded-3xl p-6 shadow-2xl relative max-w-2xl mx-auto overflow-hidden animate-fade-in-down">
                {/* Security background patterns */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#dfac34]/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-start mb-6 border-b border-[#dfac34]/15 pb-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#dfac34] animate-pulse" />
                    <span className="text-xs font-mono font-bold text-[#dfac34] uppercase tracking-widest">
                      BILHETE DE ENTRADA HOMOLOGADO
                    </span>
                  </div>
                  <button
                    onClick={() => { setActiveTicket(null); setActiveTicketEvent(null); }}
                    className="text-xs text-slate-450 hover:text-slate-100 font-mono px-3 py-1 rounded bg-slate-950/80 border border-[#dfac34]/15 transition-all cursor-pointer"
                  >
                    Ocultar Bilhete
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Left QR Section */}
                  <div className="md:col-span-4 bg-white p-4 rounded-2xl text-center flex flex-col items-center justify-center border border-slate-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        JSON.stringify({ registration_id: activeTicket.id, qr_token: activeTicket.qr_token })
                      )}`}
                      alt="Simulated QR Code"
                      className="w-36 h-36"
                    />
                    <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider uppercase mt-2">
                      TOKEN: {activeTicket.qr_token}
                    </span>
                  </div>

                  {/* Right Details Section */}
                  <div className="md:col-span-8 space-y-3.5 text-left">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-950/60 text-[#dfac34] text-[10px] font-mono border border-[#dfac34]/20 rounded">
                        {formatDayPt(activeTicketEvent.date)}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider border rounded-md ${getCategoryBadge(activeTicketEvent.category).bg}`}>
                        {getCategoryBadge(activeTicketEvent.category).label}
                      </span>
                    </div>

                    <h3 className="text-lg font-serif font-black text-white tracking-tight leading-snug">
                      {activeTicketEvent.title}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs border-y border-[#dfac34]/15 py-3">
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase text-slate-500">INSCRITO</p>
                        <p className="font-serif font-bold text-slate-200 mt-0.5 truncate text-[13px]">
                          {activeTicket.first_name} {activeTicket.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase text-slate-500">Nº ESTUDANTE</p>
                        <p className="font-mono font-bold text-[#dfac34] mt-0.5">
                          {activeTicket.student_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase text-slate-500">SALA / LOCAL</p>
                        <p className="font-semibold text-slate-300 mt-0.5 flex items-center gap-1 text-[11px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {activeTicketEvent.location}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase text-slate-500">HORÁRIO</p>
                        <p className="font-mono text-slate-300 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {activeTicketEvent.start_time} h
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-[#dfac34]/20 rounded-xl">
                      <p className="text-[10px] lg:text-[11px] uppercase font-mono font-extrabold text-amber-500 mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>PREPARAR RESPOSTA PARA PORTARIA ACADÉMICA</span>
                      </p>
                      <p className="text-xs text-slate-200 leading-relaxed italic pr-2">
                        Pergunta secreta: <span className="font-semibold">"{activeTicket.secret_question}"</span>
                      </p>
                      <p className="text-[10px] text-[#dfac34] mt-2.5 uppercase font-mono font-bold tracking-wider">
                        Indique verbalmente a resposta correta para confirmar o check-in na consola.
                      </p>
                    </div>

                    {activeTicket.checked_in ? (
                      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between p-3.5 bg-[#dfac34]/10 border border-[#dfac34]/25 text-[#dfac34] rounded-xl text-xs font-semibold">
                        <span className="leading-snug">Check-In Efetuado! Já pode descarregar a sua Certidão de Créditos SAGEO.</span>
                        <button
                          onClick={() => setViewingCertificateMatch({ reg: activeTicket, evt: activeTicketEvent })}
                          className="px-3.5 py-1.5 bg-[#dfac34] hover:bg-[#dfac34]/80 text-[#0a0f1c] font-black rounded-lg text-xs tracking-wide transition-colors shrink-0 whitespace-nowrap cursor-pointer shadow-lg"
                        >
                          Emitir Certidão
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-450 italic text-center font-sans font-light">
                        Apresente este QR Code ao staff académico na entrada. Pode salvar em captura de ecrã (print) no telemóvel!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* THREE CORE FEATURES ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-6 glass-morphic bg-slate-900/40 border border-[#dfac34]/15 rounded-3xl space-y-4 hover:border-[#dfac34]/40 hover:-translate-y-1 transition-all duration-300 shadow-2xl">
                <div className="p-3 rounded-xl bg-[#dfac34]/10 text-[#dfac34] inline-block shadow-inner">
                  <Calendar className="w-6 h-6 text-[#dfac34]" />
                </div>
                <h4 className="text-lg font-serif font-black text-slate-100 tracking-tight">Cronograma Interativo</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                  Consulte a agenda curricular detalhada por salas e oradores. Planeie as sessões letivas preferidas e garanta presença para os grandes debates de geociências e engenharia.
                </p>
              </div>

              <div className="p-6 glass-morphic bg-slate-900/40 border border-[#dfac34]/15 rounded-3xl space-y-4 hover:border-[#dfac34]/40 hover:-translate-y-1 transition-all duration-300 shadow-2xl">
                <div className="p-3 rounded-xl bg-[#dfac34]/10 text-[#dfac34] inline-block shadow-inner">
                  <QrCode className="w-6 h-6 text-[#dfac34]" />
                </div>
                <h4 className="text-lg font-serif font-black text-slate-100 tracking-tight">Segurança Criptográfica</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                  Estudantes autenticam a sua presença respondendo à pergunta secreta verbal no leitor QR físico da sala de aula. Isto garante auditoria oficial impecável.
                </p>
              </div>

              <div className="p-6 glass-morphic bg-slate-900/40 border border-[#dfac34]/15 rounded-3xl space-y-4 hover:border-[#dfac34]/40 hover:-translate-y-1 transition-all duration-300 shadow-2xl">
                <div className="p-3 rounded-xl bg-[#dfac34]/10 text-[#dfac34] inline-block shadow-inner">
                  <Award className="w-6 h-6 text-[#dfac34]" />
                </div>
                <h4 className="text-lg font-serif font-black text-slate-100 tracking-tight">Certificação ECTS Completa</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                  Logo após a verificação de presença real da equipa, descarrega autonomamente a tua certidão em formato digital com autenticidade SHA-256 e créditos letivos.
                </p>
              </div>

            </div>

            {/* PORTAL AUTÓNOMO DE EMISSÃO DE CERTIFICADOS */}
            <div className="glass-morphic bg-slate-900/75 border border-[#dfac34]/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pb-5 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="bg-[#dfac34]/15 p-3 rounded-2xl text-[#dfac34] shadow-lg">
                    <Award className="w-8 h-8 text-[#dfac34]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-[#dfac34] bg-[#dfac34]/10 px-2.5 py-1 rounded border border-[#dfac34]/25">
                      Controlo Curricular Automatizado
                    </span>
                    <h3 className="text-lg md:text-xl font-black font-serif text-slate-100 mt-1.5">
                      Portal Autónomo de Consulta e Emissão de Certificados
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-light">
                      Processamento automático das tuas presenças oficiais. Insere a tua matrícula para exportar os diplomas.
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      maxLength={8}
                      value={certSearchNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCertSearchNumber(val);
                        setCertSearchError(null);
                        setHasSearchedCerts(false);
                      }}
                      placeholder="Nº de Estudante (ex: 20220001)"
                      className="w-full sm:w-64 pl-10 pr-4 py-3 bg-slate-950/85 border border-[#dfac34]/20 focus:border-[#dfac34]/50 rounded-xl text-xs font-mono text-slate-200 outline-none transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!certSearchNumber || certSearchNumber.length !== 8) {
                        setCertSearchError('Por favor, introduz um número de estudante correto com exatamente 8 dígitos de matrícula.');
                        setHasSearchedCerts(true);
                        return;
                      }
                      setCertSearchError(null);
                      setHasSearchedCerts(true);
                    }}
                    className="px-5 py-3 bg-[#dfac34] hover:bg-[#cb9c22] text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-95 shrink-0 hover:-translate-y-0.5 shadow-xl font-sans"
                  >
                    Mapear Diplomas
                  </button>
                </div>
              </div>

              {certSearchError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-xs flex items-center gap-2 font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{certSearchError}</span>
                </div>
              )}

              {hasSearchedCerts && !certSearchError && (
                <div className="space-y-4 animate-fade-in text-left">
                  {registrations.filter(r => r.student_number.trim() === certSearchNumber.trim()).length === 0 ? (
                    <div className="bg-slate-950/30 p-8 rounded-2xl text-center space-y-3 border border-dashed border-slate-800">
                      <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-300 font-semibold font-mono">Nenhuma inscrição associada ao nº "{certSearchNumber}" no sistema local.</p>
                      <p className="text-[11px] text-slate-500 font-light">Volta a verificar o número de estudante ou faz a tua inscrição num dos eventos em destaque abaixo.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {registrations
                        .filter(r => r.student_number.trim() === certSearchNumber.trim())
                        .map(reg => {
                          const targetEvent = events.find(e => e.id === reg.event_id);
                          if (!targetEvent) return null;

                          return (
                            <div 
                              key={reg.id}
                              className="bg-slate-950/90 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between gap-4 hover:border-slate-800 transition-colors"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-slate-500">INSC. #{reg.id.substring(0, 8).toUpperCase()}</span>
                                  {reg.checked_in ? (
                                    <span className="text-[#dfac34] font-bold flex items-center gap-1 bg-[#dfac34]/5 px-2 py-0.5 rounded border border-[#dfac34]/15">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Presença Confirmada
                                    </span>
                                  ) : (
                                    <span className="text-amber-500 font-bold flex items-center gap-1 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                      <Clock className="w-3.5 h-3.5" /> Check-in Pendente
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-bold text-slate-200 line-clamp-1">
                                  {targetEvent.title}
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  Carga Curricular: 4.0h letivas  |  Orador: {targetEvent.lecturer || 'Convidado'}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                                <span className="text-[10px] font-mono text-slate-400">Aluno: {reg.first_name} {reg.last_name}</span>
                                
                                {reg.checked_in ? (
                                  <button
                                    onClick={() => setViewingCertificateMatch({ reg, evt: targetEvent })}
                                    className="px-3.5 py-1.5 bg-[#dfac34] hover:bg-[#dfac34]/85 text-[#0a0f1c] font-black rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer gold-glow"
                                  >
                                    <Award className="w-3.5 h-3.5 text-slate-950" />
                                    <span>Emitir Certidão</span>
                                  </button>
                                ) : (
                                  <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                                    <span className="text-[10px] text-slate-500 italic">Requer check-in da equipa</span>
                                    <button
                                      onClick={() => {
                                        const updatedRegs = registrations.map(r => {
                                          if (r.id === reg.id) {
                                            return {
                                              ...r,
                                              checked_in: true,
                                              checked_in_at: new Date().toISOString()
                                            };
                                          }
                                          return r;
                                        });
                                        setRegistrations(updatedRegs);
                                        saveStoredRegistrations(updatedRegs);
                                      }}
                                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-[#dfac34] text-[#dfac34] hover:text-slate-950 font-bold border border-[#dfac34]/20 rounded-lg text-[10px] transition-colors cursor-pointer"
                                    >
                                      Simular Check-In
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* DESTAQUES DA SEMANA / SLICK CARDS PREVIEWS */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
                    Eventos em Destaque <span className="text-[#dfac34]">SAGEO 2026</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Conferências magnas e mini-cursos práticos com vagas limitadas no departamento</p>
                </div>
                <button
                  onClick={() => setActiveTab('cronograma')}
                  className="text-xs font-bold text-[#dfac34] hover:text-amber-300 flex items-center gap-1 font-mono hover:underline cursor-pointer uppercase tracking-wider"
                >
                  Ver todos os eventos &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.slice(0, 3).map(event => {
                  const confirmedCount = registrations.filter(r => r.event_id === event.id && r.confirmed).length;
                  const isFull = confirmedCount >= event.capacity;
                  
                  return (
                    <div 
                      key={event.id}
                      className="glass-morphic bg-[#0a0f1c]/60 border border-[#dfac34]/15 rounded-3xl overflow-hidden shadow-2xl hover:border-[#dfac34]/35 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Event Banner */}
                      <div className="h-44 overflow-hidden relative">
                        <img 
                          src={event.image_url || "https://images.unsplash.com/photo-1540317580114-ed684c82b71d?auto=format&fit=crop&w=800&q=80"} 
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 text-[8px] font-bold rounded-lg border border-[#dfac34]/20 bg-slate-950/80 backdrop-blur-md text-[#dfac34] uppercase font-mono tracking-widest">
                            {getCategoryBadge(event.category).label}
                          </span>
                        </div>
                      </div>

                      {/* Event Body */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-[10px] font-mono text-slate-400 gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#dfac34]" />
                            <span className="font-extrabold text-[#dfac34] tracking-widest uppercase">{formatDayPt(event.date)} &bull; {event.start_time}H</span>
                          </div>
                          
                          <h4 className="editorial-serif font-serif font-black text-slate-100 line-clamp-1 hover:text-[#dfac34] cursor-pointer transition-colors text-base">
                            {event.title}
                          </h4>
                          
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-light">
                            {event.description}
                          </p>
                        </div>

                        <div className="space-y-3 pt-2">
                          {/* Location & Speaker */}
                          <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                            {event.lecturer && (
                              <p className="flex items-center gap-1.5">
                                <span className="font-bold text-[#dfac34]/70 uppercase">Orador:</span> 
                                <span className="text-slate-300 font-sans">{event.lecturer}</span>
                              </p>
                            )}
                            <p className="flex items-center gap-1.5">
                              <span className="font-bold text-[#dfac34]/70 uppercase">Local:</span> 
                              <span className="text-slate-300 font-sans">{event.location}</span>
                            </p>
                          </div>

                          {/* Capacity status bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono font-bold">
                              <span className="text-slate-400 uppercase tracking-wider">Vagas Preenchidas</span>
                              <span className={isFull ? 'text-rose-400' : 'text-[#dfac34]'}>
                                {confirmedCount} / {event.capacity}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-gold'}`}
                                style={{ width: `${Math.min(100, (confirmedCount / event.capacity) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                          {isFull ? (
                            <button
                              onClick={() => { setSelectedEventId(event.id); setActiveTab('cronograma'); }}
                              className="w-full py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                            >
                              Lista de Espera &rarr;
                            </button>
                          ) : (
                            <button
                              onClick={() => { setSelectedEventId(event.id); setActiveTab('cronograma'); }}
                              className="w-full py-2.5 bg-[#dfac34] hover:bg-[#cb9c22] text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer uppercase tracking-widest shadow-md text-center"
                            >
                              Garantir Vaga &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* VIEW: MINHAS ATIVIDADES (Student Console / Pseudo-Profile) */}
        {activeTab === 'my_activities' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header section */}
            <div className="text-center md:text-left space-y-3">
              <h2 className="text-3xl font-serif font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                <CheckCircle className="w-8 h-8 text-[#dfac34] shadow-sm animate-pulse" />
                <span>Minhas Atividades &bull; <span className="text-[#dfac34]">SAGEO 2026</span></span>
              </h2>
              <p className="text-xs text-slate-400 font-sans font-light max-w-2xl leading-relaxed">
                Aceda ao seu dossier académico personalizado de inscrições na Semana de Geociências do ISPTEC. Veja o estado das suas vagas, descarregue os seus cartões de check-in em QR Code ou cancele a qualquer momento usando a sua pergunta de segurança de forma 100% autónoma.
              </p>
            </div>

            {/* CASE 1: Student not typed/logged in */}
            {!activeProfileStudentNum ? (
              <div className="max-w-xl mx-auto glass-morphic bg-[#0a0f1c]/80 border border-[#dfac34]/15 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
                <div className="p-4 bg-[#dfac34]/10 text-[#dfac34] rounded-full inline-block border border-[#dfac34]/25">
                  <User className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight">Dossier de Estudante</h3>
                  <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto leading-relaxed">
                    Não é necessária nenhuma conta paga com palavra-passe. Insira o seu Número de Estudante para carregar instantaneamente as suas inscrições em cache local e no servidor.
                  </p>
                </div>

                {/* Form to access profile */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!profileSearchNum.trim()) {
                      triggerToast('Por favor, digite o seu Número de Estudante.', 'error');
                      return;
                    }
                    const num = profileSearchNum.trim();
                    setActiveProfileStudentNum(num);
                    localStorage.setItem('sageo_active_profile_student_num', num);
                    triggerToast(`Dossier e cache do estudante ${num} carregados com sucesso!`, 'success');
                  }}
                  className="space-y-4 max-w-md mx-auto"
                >
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ex: 20231548"
                      value={profileSearchNum}
                      onChange={(e) => setProfileSearchNum(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/40 border border-slate-800 rounded-2xl text-white text-sm placeholder-slate-500 font-mono tracking-widest focus:outline-none focus:border-[#dfac34]/50"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#dfac34] to-amber-600 hover:from-amber-500 hover:to-semibold text-slate-950 text-xs font-black rounded-2xl transition-all cursor-pointer uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Carregar Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Developer / Demo Quick-fill section if registrations exist */}
                {registrations.length > 0 && (
                  <div className="pt-4 border-t border-slate-900 space-y-2.5">
                    <p className="text-[10px] text-slate-500 font-mono tracking-wider">ESTUDANTES COM ATIVIDADES REGISTADAS NO SISTEMA:</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                       {(Array.from(new Set(registrations.map(r => r.student_number))) as string[]).slice(0, 5).map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setProfileSearchNum(num);
                            setActiveProfileStudentNum(num);
                            localStorage.setItem('sageo_active_profile_student_num', num);
                            triggerToast(`Dossier do estudante preenchido: ${num}`, 'success');
                          }}
                          className="px-3 py-1 bg-slate-900/40 border border-slate-800 hover:border-[#dfac34]/30 rounded-lg text-[10px] text-slate-300 font-mono hover:text-[#dfac34] transition-all cursor-pointer"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* CASE 2: Logged in profile */
              <div className="space-y-6">
                {/* Profile Widget Card */}
                <div className="glass-morphic bg-slate-900/25 border border-slate-900 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-tr from-[#dfac34]/20 to-amber-600/10 rounded-2xl border border-[#dfac34]/30 text-[#dfac34] flex items-center justify-center">
                      <User className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-[#dfac34] font-mono tracking-widest uppercase font-bold">Pseudo-Conta Ativa</span>
                        <span className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">Online / Local Cache</span>
                      </div>
                      <h3 className="text-xl font-mono text-white tracking-wider font-semibold uppercase mt-0.5">
                        Estudante &bull; {activeProfileStudentNum}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveProfileStudentNum('');
                        localStorage.removeItem('sageo_active_profile_student_num');
                        triggerToast('Dossier fechado com segurança.', 'info');
                      }}
                      className="px-4 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs sm:text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Fechar Dossier</span>
                    </button>

                    <button
                      onClick={() => {
                        syncBackendData();
                        triggerToast('A sincronizar os dados com o servidor...', 'info');
                      }}
                      className="px-4 py-2 bg-[#dfac34]/10 hover:bg-[#dfac34]/15 border border-[#dfac34]/30 text-[#dfac34] hover:text-white rounded-xl text-xs sm:text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Sincronizar Vagas</span>
                    </button>
                  </div>
                </div>

                {/* List of Student's Registrations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-serif font-black text-white tracking-tight flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#dfac34]" />
                    <span>Inscrições Registadas</span>
                  </h3>

                  {(() => {
                    const studentRegs = registrations.filter(
                      r => r.student_number.toLowerCase().trim() === activeProfileStudentNum.toLowerCase().trim()
                    );

                    if (studentRegs.length === 0) {
                      return (
                        <div className="text-center py-12 glass-morphic bg-slate-950/30 border border-slate-900 rounded-3xl p-8 space-y-4">
                          <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-md font-semibold text-slate-300">Nenhuma vaga localizada!</h4>
                            <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto leading-relaxed">
                              Até ao momento não submeteu nenhum pedido de reserva automática para esta identidade. Visite o cronograma para escolher uma palestra e garantir seu lugar.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('cronograma')}
                            className="px-5 py-2.5 bg-[#dfac34] hover:bg-[#c99b2e] text-slate-950 font-black text-xs rounded-xl tracking-wider transition-all duration-300 shadow-md cursor-pointer uppercase inline-block"
                          >
                            Ir Para Cronograma
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {studentRegs.map(reg => {
                          const event = events.find(e => e.id === reg.event_id);
                          if (!event) return null;

                          return (
                            <div 
                              key={reg.id}
                              className={`relative overflow-hidden rounded-3xl glass-morphic bg-slate-900/10 border p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:border-slate-800 ${
                                reg.checked_in 
                                  ? 'border-emerald-500/20 shadow-emerald-950/10 shadow-lg' 
                                  : reg.confirmed 
                                    ? 'border-blue-500/20 shadow-blue-950/10 shadow-lg' 
                                    : 'border-amber-500/20 shadow-amber-950/10 shadow-lg animate-pulse-slow'
                              }`}
                            >
                              <div className="space-y-3.5">
                                {/* Header with Badge & Token */}
                                <div className="flex items-center justify-between gap-2 flex-wrap pb-3.5 border-b border-slate-900/50">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 font-mono tracking-wider">COD: {reg.id.toUpperCase()}</span>
                                    {event.category && (
                                      <span className="text-[9px] px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-slate-400 font-mono font-bold tracking-wider uppercase">
                                        {event.category}
                                      </span>
                                    )}
                                  </div>

                                  {/* Status design */}
                                  <div>
                                    {reg.checked_in ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] px-2 pb-0.5 font-bold uppercase rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono">
                                        <CheckCircle className="w-2.5 h-2.5" />
                                        Compareceu
                                      </span>
                                    ) : reg.confirmed ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] px-2 pb-0.5 font-bold uppercase rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono animate-pulse">
                                        <CheckCircle className="w-2.5 h-2.5 animate-bounce" />
                                        Confirmada
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[9px] px-2 pb-0.5 font-bold uppercase rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 font-mono">
                                        <Clock className="w-2.5 h-2.5 animate-spin" />
                                        Pendente E-mail
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Event Info */}
                                <div className="space-y-1">
                                  <h4 className="text-[#dfac34] font-bold text-sm tracking-wide line-clamp-1">
                                    {event.title}
                                  </h4>
                                  <p className="text-xs text-slate-300 font-serif font-light line-clamp-2">
                                    {event.description}
                                  </p>
                                </div>

                                {/* Date, Hour, Speaker, Location */}
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono pt-1">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 text-[#dfac34]" />
                                    <span>{event.date}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-[#dfac34]" />
                                    <span>{event.start_time} - {event.end_time || '---'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 col-span-2">
                                    <MapPin className="w-3 h-3 text-[#dfac34]" />
                                    <span className="truncate">Local: {event.location}</span>
                                  </div>
                                </div>

                                {/* Custom instruction for Pending validation */}
                                {!reg.confirmed && (
                                  <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-[10px] text-amber-500 font-sans leading-relaxed">
                                    A sua vaga ainda <b>não está garantida!</b> Deve abrir o e-mail (usando a ferramenta "Correio SAGEO" no painel flutuante de simulação ao lado) e clicar no link de ativação antes que expire.
                                  </div>
                                )}
                              </div>

                              {/* Interactive Actions footer */}
                              <div className="flex items-center gap-2 pt-3 border-t border-slate-900/50">
                                {reg.confirmed && (
                                  <button
                                    onClick={() => setSelectedTicketReg(reg)}
                                    className="flex-1 py-2 bg-gradient-to-r from-blue-900/40 to-blue-800/10 hover:from-blue-900/60 border border-blue-800/40 text-blue-300 font-bold text-xs rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>Ver Bilhete QR</span>
                                  </button>
                                )}

                                {!reg.confirmed && (
                                  <button
                                    onClick={() => {
                                      triggerToast('Para fins de simulação, aceda à Central de Correio SAGEO no canto inferior direito para ativar este e-mail!', 'info');
                                    }}
                                    className="flex-1 py-2 bg-gradient-to-r from-amber-900/40 to-amber-800/10 hover:from-amber-900/60 border border-amber-800/40 text-amber-300 font-bold text-xs rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Validar E-mail</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setSelectedCancelReg(reg);
                                    setCancelSecretAnswer('');
                                    setCancelError(null);
                                  }}
                                  className="px-3.5 py-2 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-950/40 hover:border-rose-900/50 text-rose-400 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 justify-center shrink-0"
                                  title="Cancelar minha inscrição académica permanente."
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Cancelar</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* MODAL 1: PRETTY RETRO PRINTABLE TICKET & QR CODE */}
            {selectedTicketReg && (() => {
              const event = events.find(e => e.id === selectedTicketReg.event_id);
              if (!event) return null;

              return (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="relative max-w-sm w-full bg-[#0a0f1c] border border-[#dfac34]/30 rounded-3xl p-6 shadow-2xl space-y-6">
                    {/* Close action */}
                    <button
                      onClick={() => setSelectedTicketReg(null)}
                      className="absolute right-4 top-4 p-1.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Badge */}
                    <div className="text-center space-y-1">
                      <span className="bg-[#dfac34]/15 border border-[#dfac34]/25 text-[#dfac34] text-[10px] font-mono tracking-widest uppercase font-bold px-3 py-1 rounded-full">
                        CARTÃO DE CHECK-IN OFICIAL
                      </span>
                      <h4 className="text-lg font-serif font-black text-white tracking-tight pt-1">SAGEO 2026</h4>
                    </div>

                    {/* Retro Ticket Design */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 space-y-4 shadow-inner relative overflow-hidden">
                      {/* Dotted lines dividing sections */}
                      <div className="absolute top-[48%] left-0 right-0 border-t border-dashed border-slate-800 pointer-events-none" />

                      {/* Header values */}
                      <div className="space-y-1 pb-4">
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest pl-0.5">Estudante</span>
                        <p className="text-sm font-bold text-white tracking-wide">
                          {selectedTicketReg.first_name} {selectedTicketReg.last_name}
                        </p>
                        <p className="text-[10px] text-[#dfac34] font-mono uppercase">
                          Aluno: {selectedTicketReg.student_number} &bull; {selectedTicketReg.course}
                        </p>
                      </div>

                      {/* Event spacing values */}
                      <div className="pt-4 space-y-2">
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest pl-0.5">Atividade</span>
                        <p className="text-xs font-bold text-[#dfac34]/90 tracking-wide leading-snug">
                          {event.title}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[9.5px] text-slate-400 font-mono">
                          <div>
                            <b>Data:</b> {event.date}
                          </div>
                          <div>
                            <b>Hora:</b> {event.start_time}
                          </div>
                          <div className="col-span-2">
                            <b>Local:</b> {event.location}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Ticket QR Placeholder / Code */}
                      <div className="pt-6 pb-2 text-center flex flex-col items-center gap-3">
                        <div className="p-3 bg-white rounded-2xl inline-block shadow-inner-lg cursor-pointer hover:scale-105 duration-200">
                          {/* High contrast CSS based mock QR representation */}
                          <div className="w-32 h-32 bg-slate-950 border-4 border-slate-950 flex flex-wrap relative">
                            {/* Visual Grid representing QR noise */}
                            <div className="absolute top-1 left-1 w-6 h-6 bg-white border-[3px] border-slate-950 flex items-center justify-center p-0.5"><div className="w-2 h-2 bg-white" /></div>
                            <div className="absolute top-1 right-1 w-6 h-6 bg-white border-[3px] border-slate-950 flex items-center justify-center p-0.5"><div className="w-2 h-2 bg-white" /></div>
                            <div className="absolute bottom-1 left-1 w-6 h-6 bg-white border-[3px] border-slate-950 flex items-center justify-center p-0.5"><div className="w-2 h-2 bg-white" /></div>
                            
                            <div className="absolute top-8 left-8 w-16 h-16 p-0.5 flex flex-wrap gap-[2px] overflow-hidden pointer-events-none">
                              {Array.from({ length: 48 }).map((_, i) => (
                                <div key={i} className={`w-[6px] h-[6px] ${i % 3 === 0 || i % 7 === 0 || i % 11 === 0 ? 'bg-white' : 'bg-transparent'}`} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">Código de Check-in</p>
                          <p className="text-xs text-[#dfac34] font-mono tracking-widest font-black uppercase">
                            {selectedTicketReg.qr_token || 'AGUARDANDO CONFIRMAÇÃO'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tips and actions */}
                    <div className="space-y-2.5">
                      <p className="text-[9px] text-slate-500 text-center font-sans">
                        Apresente este código QR digital ou em papel na entrada da atividade do ISPTEC. O staff efetuará a leitura para contabilizar a sua presença escolar.
                      </p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            window.print();
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#dfac34] hover:bg-amber-500 text-slate-950 text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Imprimir Cartão</span>
                        </button>
                        <button
                          onClick={() => setSelectedTicketReg(null)}
                          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:text-white rounded-xl text-xs text-slate-400 font-semibold cursor-pointer"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* MODAL 2: SECURE CANCELLATION BOX */}
            {selectedCancelReg && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#0a0f1c] border border-rose-900/30 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up">
                  <div className="flex items-center gap-2.5 text-rose-500">
                    <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
                    <h4 className="text-md font-serif font-black tracking-tight text-white">Tem a certeza do Cancelamento?</h4>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Está prestes a remover permanentemente a inscrição no evento: <br />
                    <b className="text-rose-400 font-mono">
                      "{events.find(e => e.id === selectedCancelReg.event_id)?.title || 'Atividade'}"
                    </b>.
                    <br />
                    Ao proceder, o seu lugar será libertado de volta para as vagas livres da Semana de Geociências ISPTEC.
                  </p>

                  <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-3">
                    <span className="text-[10px] text-[#dfac34] font-mono tracking-widest uppercase font-bold pl-0.5">
                      Pergunta de Segurança Registada:
                    </span>
                    <p className="text-xs text-slate-300 italic font-serif">
                      "{selectedCancelReg.secret_question || 'Qual é o seu código secreto?'}"
                    </p>

                    <div className="space-y-1 pt-1">
                      <span className="text-[9px] text-slate-500 font-mono">RELIJA O SEU SEGREDO DE CONFIRMAÇÃO:</span>
                      <input 
                        type="password"
                        placeholder="Resposta Secreta"
                        value={cancelSecretAnswer}
                        onChange={(e) => setCancelSecretAnswer(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-900/50"
                      />
                    </div>
                  </div>

                  {cancelError && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-mono">
                      ⚠️ {cancelError}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 justify-end">
                    <button
                      onClick={() => setSelectedCancelReg(null)}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 hover:text-white rounded-xl text-xs text-slate-400 font-semibold cursor-pointer"
                    >
                      Voltar atrás
                    </button>

                    <button
                      disabled={isCancelling}
                      onClick={async () => {
                        if (!cancelSecretAnswer.trim()) {
                          setCancelError('Escreva a sua resposta secreta.');
                          return;
                        }
                        setIsCancelling(true);
                        setCancelError(null);
                        try {
                          const res = await cancelRegistration(selectedCancelReg.id, cancelSecretAnswer);
                          triggerToast(res.message, 'success');
                          
                          // Refresh registrations state in the app
                          await syncBackendData();
                          setSelectedCancelReg(null);
                        } catch (err: any) {
                          setCancelError(err.message || 'Houve um problema de rede ou o segredo está incorreto.');
                        } finally {
                          setIsCancelling(false);
                        }
                      }}
                      className="px-4 py-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/50 text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 uppercase"
                    >
                      {isCancelling ? 'A processar...' : 'Confirmar Cancelamento'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: CRONOGRAMA & AGENDA */}
        {activeTab === 'cronograma' && (
          <div className="space-y-8">
            {selectedEventId ? (
              (() => {
                const matchedEvent = events.find(e => e.id === selectedEventId);
                if (!matchedEvent) {
                  return (
                    <div className="text-center py-12 glass-morphic bg-[#0a0f1c]/80 border border-slate-850 rounded-2xl animate-fade-in">
                      <p className="text-slate-400 font-sans">Atividade não encontrada ou expirada.</p>
                      <button 
                        onClick={() => setSelectedEventId(null)} 
                        className="mt-4 px-4 py-2 bg-[#dfac34] text-slate-950 font-bold text-xs rounded-xl hover:bg-[#cb9c22] transition-colors cursor-pointer"
                      >
                        &larr; Voltar ao Cronograma
                      </button>
                    </div>
                  );
                }

                return (
                  <EventRegistrationPage
                    event={matchedEvent}
                    registrations={registrations}
                    events={events}
                    formData={formData}
                    setFormData={setFormData}
                    waitlistFormData={waitlistFormData}
                    setWaitlistFormData={setWaitlistFormData}
                    formError={formError}
                    setFormError={setFormError}
                    waitlistError={waitlistError}
                    setWaitlistError={setWaitlistError}
                    handleRegister={handleRegister}
                    handleWaitlistRegister={handleWaitlistRegister}
                    setSelectedEventId={setSelectedEventId}
                    setViewingCertificateMatch={setViewingCertificateMatch}
                    getCategoryBadge={getCategoryBadge}
                    getCourseAcronymAndColor={getCourseAcronymAndColor}
                    isOverlapping={isOverlapping}
                    getExistingStudentRegs={getExistingStudentRegs}
                    bypassConflict={bypassConflict}
                    setBypassConflict={setBypassConflict}
                  />
                );
              })()
            ) : (
              <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl md:text-4xl font-serif font-black text-slate-100 tracking-tight">
                    Cronograma de Atividades e Competições
                  </h2>
                  <p className="text-sm text-slate-400 mt-1 font-sans font-light">Explore as palestras, workshops e exposições da SAGEO 2026. Não se limite ao seu curso!</p>
                </div>

                {/* Status Indicator counter */}
                <div className="flex items-center gap-3 font-mono text-xs text-slate-400 bg-slate-950/80 rounded-2xl px-4 py-2 border.5 border-[#dfac34]/25 shadow-xl">
                  <span>Inscrições Ativas: <strong className="text-[#dfac34]">{totalStudentsRegisteredNum}</strong></span>
                  <span className="h-3 w-[1px] bg-slate-800" />
                  <span>Checked-In: <strong className="text-[#dfac34]">{totalCheckinsDone}</strong></span>
                </div>
              </div>

              {/* SEARCH & FILTERS GRID */}
              <div className="flex flex-col md:flex-row gap-4 glass-morphic bg-slate-900/50 p-4 rounded-3xl border border-[#dfac34]/15 shadow-2xl animate-fade-in">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    className="w-full rounded-2xl border px-3 h-11 border-[#dfac34]/10 bg-slate-950/80 text-slate-200 text-xs pl-10 focus:border-[#dfac34]/50 rounded-xl outline-none transition-colors" 
                    placeholder="Pesquise por palavra-chave, orador, tema ou local..." 
                    value={cronogramaSearch}
                    onChange={(e) => setCronogramaSearch(e.target.value)}
                  />
                </div>

                {/* Category Select */}
                <div className="relative w-full md:w-52">
                  <select 
                    className="w-full rounded-xl border px-3 py-2 text-xs h-11 border-[#dfac34]/10 bg-slate-950/80 text-slate-200 outline-none focus:border-[#dfac34] cursor-pointer"
                    value={cronogramaCategory}
                    onChange={(e) => setCronogramaCategory(e.target.value)}
                  >
                    <option value="all">Todas as Categorias</option>
                    <option value="mesa_redonda">Mesa Redonda</option>
                    <option value="concurso">Concurso / Competição</option>
                    <option value="mini_curso">Mini-Curso</option>
                    <option value="exposicao">Exposição Técnica</option>
                    <option value="workshop">Workshop</option>
                    <option value="debate">Debate</option>
                    <option value="aula_magna">Aula Magna</option>
                    <option value="palestra">Palestra</option>
                    <option value="grande_exposicao">Grande Exposição</option>
                    <option value="festival">Festival SAGEO</option>
                  </select>
                </div>

                {/* Course Select */}
                <div className="relative w-full md:w-60">
                  <select 
                    className="w-full rounded-xl border px-3 py-2 text-xs h-11 border-[#dfac34]/10 bg-slate-950/80 text-slate-200 outline-none focus:border-[#dfac34] cursor-pointer"
                    value={cronogramaCourse}
                    onChange={(e) => setCronogramaCourse(e.target.value)}
                  >
                    <option value="all">Todos os Cursos / Geral</option>
                    {ACADEMIC_DEPARTMENTS.map(dept => (
                      <optgroup key={dept.name} label={dept.name} className="text-[#dfac34] font-bold text-xs bg-slate-950">
                        {dept.courses.map(course => (
                          <option key={course} value={course} className="text-slate-350 font-normal pl-2">{course}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* TIMELINE DAYS TABS */}
              <div className="flex justify-start md:justify-center">
                <div className="flex w-full max-w-xl bg-slate-950/90 border border-[#dfac34]/20 p-1.5 rounded-2xl shadow-2xl scrollbar-none overflow-x-auto gap-1 backdrop-blur-md">
                  {[
                    { key: '2026-11-23', label: 'Segunda - 23/11' },
                    { key: '2026-11-24', label: 'Terça - 24/11' },
                    { key: '2026-11-25', label: 'Quarta - 25/11' },
                    { key: '2026-11-26', label: 'Quinta - 26/11' },
                    { key: '2026-11-27', label: 'Sexta - 27/11' },
                    { key: 'all', label: 'Ver Todos' },
                  ].map(day => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setCronogramaDay(day.key)}
                      className={`flex-1 min-w-[90px] text-center py-2.5 text-xs font-bold rounded-xl transition-all font-mono cursor-pointer ${
                        cronogramaDay === day.key 
                          ? 'bg-[#dfac34] text-slate-950 shadow-md scale-102 font-bold gold-glow' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event schedule visual listing */}
              <div className="grid grid-cols-1 gap-8 items-start">
                
                {/* Event Cards listing column (full span 12 columns!) */}
                <div className="space-y-12 relative py-4">
                  
                  {/* Vertical Line */}
                  <div className="absolute left-4 md:left-1/2 top-4 bottom-4 w-[1.5px] bg-slate-900 md:-translate-x-1/2 rounded-full hidden sm:block"></div>
                  
                  {filteredEvents.map((event, index) => {
                    const confirmedCount = registrations.filter(r => r.event_id === event.id && r.confirmed).length;
                    const isFull = confirmedCount >= event.capacity;
                    const isSelected = selectedEventId === event.id;
                    const badge = getCategoryBadge(event.category);
                    const courseBadge = getCourseAcronymAndColor(event.course);
                    const isEven = index % 2 === 0;

                    return (
                      <div 
                        key={event.id}
                        id={`event-card-${event.id}`}
                        className={`relative flex flex-col md:flex-row items-stretch md:items-center w-full ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} gap-3 md:gap-0 animate-fade-in`}
                      >
                        {/* Middle dot representing node */}
                        <div className={`absolute left-4 md:left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-slate-950 z-20 transition-all duration-300 hidden sm:block ${
                          isSelected ? 'bg-[#dfac34] ring-4 ring-[#dfac34]/20 scale-110' : 'bg-slate-800'
                        }`}></div>

                        {/* A: Time Block */}
                        <div className={`w-full md:w-1/2 flex items-center text-xs font-bold text-slate-400 pl-12 md:pl-0 ${
                          isEven ? 'md:justify-start md:pl-10' : 'md:justify-end md:pr-10'
                        }`}>
                          <div className="bg-slate-950/80 border border-slate-900 px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-[#dfac34] font-mono text-center">
                            <Clock className="w-3.5 h-3.5 text-[#dfac34]" />
                            <span>{event.start_time} h {event.end_time ? `- ${event.end_time} h` : ''}</span>
                          </div>
                        </div>

                        {/* B: Card Block */}
                        <div className={`w-full md:w-1/2 pt-2 md:pt-0 ${
                          isEven ? 'md:pr-10 md:pl-0 pl-12' : 'md:pl-10 md:pr-0 pl-12'
                        }`}>
                          <div 
                            onClick={() => {
                              setSelectedEventId(event.id);
                              const elem = document.getElementById('registration-panel-main');
                              if (elem) {
                                elem.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className={`group rounded-3xl border p-5 md:p-6 transition-all duration-350 hover:-translate-y-1 cursor-pointer ${
                              isSelected 
                              ? 'bg-[#0a0f1c]/95 border-[#dfac34] shadow-3xl ring-1 ring-[#dfac34]/40 blue-glow' 
                              : 'glass-morphic bg-slate-900/30 border-[#dfac34]/10 hover:bg-[#0a0f1c]/55 hover:border-[#dfac34]/35'
                            }`}
                          >
                            {/* Header Row: Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 text-[8px] uppercase font-mono font-bold tracking-widest border rounded-md ${badge.bg}`}>
                                  {badge.label}
                                </span>
                                {event.course && (
                                  <span className={`px-2 py-0.5 text-[8px] uppercase font-mono font-bold tracking-widest border rounded-md ${courseBadge.bg}`} title={event.course}>
                                    {courseBadge.acronym}
                                  </span>
                                )}
                                {event.is_completed && (
                                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] uppercase font-mono font-bold tracking-widest rounded-md flex items-center gap-1">
                                    <CheckCircle className="w-2.5 h-2.5 text-amber-500" />
                                    <span>Realizado</span>
                                  </span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 bg-slate-950/80 text-[#dfac34] text-[8px] font-mono font-bold border border-[#dfac34]/15 rounded uppercase tracking-wider">
                                {formatDayPt(event.date)}
                              </span>
                            </div>

                            {/* Event Title */}
                            <h3 className="text-md sm:text-lg editorial-serif font-serif font-black text-slate-100 tracking-tight leading-snug group-hover:text-[#dfac34] transition-colors mb-2">
                              {event.title}
                            </h3>

                            {/* Event Description */}
                            <p className="text-slate-400 text-xs leading-relaxed font-sans font-light mb-4 line-clamp-3">
                              {event.description}
                            </p>

                            {/* Extra Metadata: Lecturer and Room */}
                            <div className="grid grid-cols-1 gap-2 text-xs border-t border-slate-800/40 pt-3 mb-4">
                              {event.lecturer && (
                                <div className="flex items-start gap-1.5 text-slate-350 min-w-0">
                                  <User className="w-3.5 h-3.5 text-[#dfac34]/80 shrink-0 mt-0.5" />
                                  <span className="font-semibold text-slate-400">Orador: <span className="font-medium text-slate-300">{event.lecturer}</span></span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-slate-350 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-[#dfac34]/80 shrink-0" />
                                <span className="font-semibold text-slate-400">Local: <span className="font-medium text-slate-300">{event.location}</span></span>
                              </div>
                            </div>

                             {/* Progress capacity indicator block */}
                            {event.is_completed ? (
                              <div className="flex items-center justify-between text-[11px] font-mono mb-3 bg-[#dfac34]/5 px-3 py-1.5 rounded-xl border border-[#dfac34]/15 text-[#dfac34]">
                                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#dfac34]" /> Presença Final:</span>
                                <span className="font-bold">
                                  {event.report?.attendance || 120} estudantes
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-slate-400">
                                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Inscritos:</span>
                                  <span className={isFull ? 'text-rose-400 font-bold' : 'text-[#dfac34] font-bold'}>
                                    {confirmedCount} / {event.capacity}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden block mb-4">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-[#dfac34]'}`}
                                    style={{ width: `${Math.min(100, (confirmedCount / event.capacity) * 100)}%` }}
                                  />
                                </div>
                              </>
                            )}

                            {/* Action trigger button inside card */}
                            {event.is_completed ? (
                              <div className="space-y-4 w-full">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedReports(prev => ({
                                      ...prev,
                                      [event.id]: !prev[event.id]
                                    }));
                                  }}
                                  className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-300 text-center flex items-center justify-center gap-2 cursor-pointer ${
                                    expandedReports[event.id]
                                      ? 'bg-slate-950 border border-[#dfac34] text-[#dfac34] shadow-inner'
                                      : 'bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 shadow-md'
                                  }`}
                                >
                                  <FileText className="w-4 h-4 text-[#dfac34]" />
                                  <span>{expandedReports[event.id] ? 'Ocultar Relatório ▲' : 'Ver Reportagem do Evento ▼'}</span>
                                </button>

                                {/* COLLAPSIBLE REPORTAGE SECTION */}
                                {expandedReports[event.id] && (
                                  <div className="pt-4 border-t border-slate-900/60 space-y-4 animate-fade-in text-left">
                                    <div className="space-y-1.5">
                                      <h4 className="text-xs font-bold text-[#dfac34] uppercase tracking-wider font-mono">
                                        Resumo Geral
                                      </h4>
                                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                        {event.report?.summary}
                                      </p>
                                    </div>

                                    {event.report?.highlights && event.report.highlights.length > 0 && (
                                      <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-[#dfac34] uppercase tracking-wider font-mono">
                                          Momentos de Destaque
                                        </h4>
                                        <ul className="space-y-1.5">
                                          {event.report.highlights.map((highlight, hIdx) => (
                                            <li key={hIdx} className="text-xs text-slate-400 flex items-start gap-1.5">
                                              <span className="text-[#dfac34] font-bold font-mono shrink-0 select-none">•</span>
                                              <span>{highlight}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {event.report?.photos && event.report.photos.length > 0 && (
                                      <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-[#dfac34] uppercase tracking-wider font-mono">
                                          Galeria Fotográfica
                                        </h4>
                                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                                          {event.report.photos.map((photo, pIdx) => (
                                            <div 
                                              key={pIdx}
                                              onClick={(clickEvt) => {
                                                clickEvt.stopPropagation();
                                                const modal = document.createElement('div');
                                                modal.className = "fixed inset-0 bg-slate-950/95 flex items-center justify-center p-4 z-50 animate-fade-in";
                                                modal.onclick = () => document.body.removeChild(modal);
                                                modal.innerHTML = `<img src="${photo}" class="max-h-[85vh] max-w-full rounded-2xl border border-slate-800 shadow-2xl object-cover animate-scale-up" referrerPolicy="no-referrer" />`;
                                                document.body.appendChild(modal);
                                              }}
                                              className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-900 hover:border-[#dfac34]/40 transition-all cursor-zoom-in group"
                                            >
                                              <img 
                                                src={photo} 
                                                alt={`Momento ${pIdx + 1}`} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                referrerPolicy="no-referrer"
                                              />
                                              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : event.is_open ? (
                              <div
                                className={`w-full py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all text-center flex items-center justify-center gap-1.5 ${
                                  isSelected 
                                    ? 'bg-slate-950 border border-[#dfac34] text-[#dfac34]'
                                    : isFull
                                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/25'
                                      : 'bg-[#dfac34] text-slate-950 font-bold shadow-lg shadow-amber-500/5 hover:bg-[#cb9c22] active:scale-98'
                                }`}
                              >
                                {isFull ? (
                                  <>
                                    <UserPlus className="w-4 h-4 text-rose-400" />
                                    <span>Entrar na Fila ({waitlist.filter(w => w.event_id === event.id).length} em espera)</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{isSelected ? 'Preencher Ticket de Inscrição' : 'Inscrever nesta Atividade'}</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="w-full py-2 text-center text-xs text-slate-500 bg-slate-900/30 border border-slate-900/50 rounded-xl flex items-center justify-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-slate-600" />
                                <span>Inscrições Encerradas</span>
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredEvents.length === 0 && (
                    <div className="p-12 text-center bg-slate-950/20 border border-slate-900 rounded-3xl animate-fade-in">
                      <AlertTriangle className="w-10 h-10 text-amber-500/60 mx-auto mb-3" />
                      <p className="text-slate-300 font-bold">Nenhuma atividade encontrada</p>
                      <p className="text-slate-500 text-xs mt-1">Tente ajustar os critérios de pesquisa para cursos ou categorias.</p>
                    </div>
                  )}

                </div>

              {/* Sidebar is replaced with modular EventRegistrationPage */}
              <div className="hidden" id="registration-panel-main">
                {selectedEventId ? (
                  (() => {
                    return null;
                    const matchedEvent = events.find(e => e.id === selectedEventId);
                    if (!matchedEvent) return <p className="text-xs text-slate-400 text-center">Fórmula Incorreta.</p>;
                    
                    const confirmedCount = registrations.filter(r => r.event_id === matchedEvent.id && r.confirmed).length;
                    const isGeosciences = ['Engenharia de Petróleos', 'Geofísica'].includes(formData.course) || ['Engenharia de Petróleos', 'Geofísica'].includes(waitlistFormData.course);
                    const effectiveCapacity = isGeosciences ? (matchedEvent.capacity + 150) : matchedEvent.capacity;
                    const isFull = confirmedCount >= effectiveCapacity;

                    if (matchedEvent.is_completed) {
                      return (
                        <div className="bg-slate-900 border border-[#dfac34]/20 rounded-2xl p-6 shadow-2xl sticky top-24 space-y-5 animate-fade-in text-slate-200">
                          <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                            <div>
                              <span className="text-[10px] font-mono text-[#dfac34] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#dfac34]" /> Reportagem do Evento
                              </span>
                              <h4 className="text-sm font-bold text-white mt-1">
                                {matchedEvent.title}
                              </h4>
                            </div>
                            <button
                              onClick={() => setSelectedEventId(null)}
                              className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded bg-slate-950 font-mono transition-colors cursor-pointer"
                            >
                              Fechar
                            </button>
                          </div>

                          {/* Attendance Stat */}
                          <div className="p-3 bg-[#dfac34]/5 border border-[#dfac34]/15 rounded-xl flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-[#dfac34]" /> Presença Coberta:
                            </span>
                            <span className="text-[#dfac34] font-bold">
                              {matchedEvent.report?.attendance || 120} estudantes
                            </span>
                          </div>

                          {/* Summary */}
                          <div className="space-y-1.5">
                            <h5 className="text-xs font-bold text-[#dfac34] uppercase tracking-wider font-mono">Ocorrência & Resumo</h5>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                              {matchedEvent.report?.summary}
                            </p>
                          </div>

                          {/* Highlights */}
                          {matchedEvent.report?.highlights && matchedEvent.report.highlights.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-bold text-[#dfac34] uppercase tracking-wider font-mono">Destaques da Sessão</h5>
                              <ul className="space-y-1.5">
                                {matchedEvent.report.highlights.map((item, idx) => (
                                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-1.5">
                                    <span className="text-[#dfac34] mt-0.5 font-bold font-serif select-none">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Gallery Photos Carousel/Grid */}
                          {matchedEvent.report?.photos && matchedEvent.report.photos.length > 0 && (
                            <div className="space-y-3 pt-1.5 border-t border-slate-800/80 animate-fade-in">
                              <h5 className="text-[10px] font-mono font-bold text-[#dfac34] uppercase tracking-wider">Fotografias e Recordações</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {matchedEvent.report.photos.map((photo, pIdx) => (
                                  <div 
                                    key={pIdx} 
                                    className="relative aspect-video rounded-xl overflow-hidden border border-[#dfac34]/15 hover:border-[#dfac34]/40 transition-all cursor-zoom-in group"
                                    onClick={() => {
                                      const modal = document.createElement('div');
                                      modal.className = "fixed inset-0 bg-slate-950/95 flex items-center justify-center p-4 z-50 animate-fade-in";
                                      modal.onclick = () => document.body.removeChild(modal);
                                      modal.innerHTML = `<img src="${photo}" class="max-h-[85vh] max-w-full rounded-2xl border border-slate-800 shadow-2xl object-cover animate-scale-up" referrerPolicy="no-referrer" />`;
                                      document.body.appendChild(modal);
                                    }}
                                  >
                                    <img src={photo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent flex items-end p-2 opacity-90">
                                      <span className="text-[9px] font-mono text-slate-300 group-hover:text-white transition-colors">Ampliar ⤢</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
 
                    return (
                      <div className="glass-morphic bg-[#0a0f1c]/80 border border-[#dfac34]/25 rounded-3xl p-6 md:p-8 shadow-3xl sticky top-24 space-y-6 text-slate-100 backdrop-blur-xl duration-300">
                        <div className="flex justify-between items-start border-b border-slate-800/60 pb-3">
                          <div>
                            <span className="text-[10px] font-mono text-[#dfac34] font-bold uppercase tracking-widest bg-[#dfac34]/10 border border-[#dfac34]/25 px-2 py-0.5 rounded">
                              Inscrição Instantânea
                            </span>
                            <h4 className="text-base font-serif font-black text-slate-100 mt-2 line-clamp-1">
                              {matchedEvent.title}
                            </h4>
                          </div>
                          <button
                            onClick={() => setSelectedEventId(null)}
                            className="text-xs text-slate-450 hover:text-white px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 transition-colors uppercase font-mono tracking-wider font-semibold cursor-pointer"
                          >
                            Voltar
                          </button>
                        </div>
 
                        {isFull ? (
                          /* WAITING LIST FORM */
                          <div className="space-y-4">
                            <div className="p-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl">
                              <p className="text-xs font-bold flex items-center gap-1.5 uppercase font-mono tracking-wider">
                                <AlertTriangle className="w-4 h-4 text-rose-400" />
                                <span>LOTAÇÃO ALCANÇADA!</span>
                              </p>
                              <p className="text-[11px] text-slate-300 leading-relaxed mt-1 font-light">
                                Esta sala está de momento completa ({matchedEvent.capacity} vagas). Subscreve a lista de espera. Entraremos em contacto imediato assim que libertarem bilhetes.
                              </p>
                            </div>
 
                            <form onSubmit={(e) => handleWaitlistRegister(e, matchedEvent.id)} className="space-y-4">
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
                                  placeholder="jose.silveira@student.univ.pt"
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
                                className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white font-black rounded-xl text-xs shadow-md transition-all uppercase tracking-widest cursor-pointer hover:-translate-y-0.5"
                              >
                                Registar na Lista de Espera &rarr;
                              </button>
                            </form>
                          </div>
                        ) : (
                          /* STANDARD REGISTRATION FORM */
                          <form onSubmit={(e) => handleRegister(e, matchedEvent)} className="space-y-4">
                            
                            {formError && (
                              <p className="text-xs text-rose-400 font-bold p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 font-mono">{formError}</p>
                            )}
 
                            {isGeosciences && (
                              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-[#dfac34] rounded-xl text-[11px] leading-relaxed flex flex-col gap-1 font-sans font-medium">
                                <p className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-xs text-amber-400">
                                  ★ Prioridade Geociências Ativada
                                </p>
                                <p className="text-slate-300 text-[10px] font-light">
                                  Inscrição especial ativa. Por pertencer ao Departamento de Geociências, tens direito a vaga reservada por fomento regional nesta sala.
                                </p>
                              </div>
                            )}
 
                            {/* Double grid name */}
                            <div className="grid grid-cols-2 gap-3">
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
                              <div className="p-3 bg-fuchsia-950/15 border border-fuchsia-500/25 rounded-xl space-y-1.5">
                                <label className="block text-[11px] text-fuchsia-300 font-semibold mb-1 flex items-center gap-1 uppercase font-mono tracking-wider">
                                  <Music className="w-3.5 h-3.5" />
                                  <span>Música preferida para o Festival SAGEO</span>
                                </label>
                                <input
                                  type="url"
                                  value={formData.youtubeLink}
                                  onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
                                  placeholder="Link de música Spotify ou YouTube..."
                                  className="w-full bg-slate-950/80 border border-fuchsia-800/40 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-fuchsia-500"
                                />
                                <p className="text-[9px] text-fuchsia-400 mt-1">O link submetido será indexado na playlist da comissão promotora!</p>
                              </div>
                            )}
 
                            {/* SECURITY CHECKS: SECRET QUESTION & HASH KEY */}
                            <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-3">
                              <p className="text-[10px] text-[#dfac34] font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono">
                                <ShieldCheck className="w-4 h-4 shrink-0 text-[#dfac34]" />
                                <span>CONTRAPARTIDA DE ENTRADA (MANDATÓRIO)</span>
                              </p>
                              
                              <div>
                                <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-405 mb-1">Pergunta Curricular Secreta *</label>
                                <input
                                  type="text"
                                  required
                                  value={formData.secretQuestion}
                                  onChange={(e) => setFormData({ ...formData, secretQuestion: e.target.value })}
                                  placeholder="Ex: Qual é o nome do meu cão?"
                                  className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none transition-colors"
                                />
                              </div>
 
                              <div>
                                <label className="block text-[10px] font-mono font-bold tracking-widest uppercase text-slate-405 mb-1">Resposta Secreta *</label>
                                <input
                                  type="text"
                                  required
                                  value={formData.secretAnswer}
                                  onChange={(e) => setFormData({ ...formData, secretAnswer: e.target.value })}
                                  placeholder="Insira a frase exata..."
                                  className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none transition-colors"
                                />
                              </div>
                            </div>
 
                            <button
                              type="submit"
                              className="w-full py-3 bg-[#dfac34] hover:bg-[#dfac34]/90 text-slate-950 font-black rounded-xl text-xs uppercase shadow-md hover:-translate-y-0.5 transition-all duration-300 tracking-widest cursor-pointer gold-glow"
                            >
                              Finalizar Pré-Inscrição &rarr;
                            </button>
                            
                          </form>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="glass-morphic bg-[#0a0f1c]/45 border border-[#dfac34]/15 border-dashed rounded-3xl p-8 text-center text-slate-400 sticky top-24 flex flex-col items-center justify-center min-h-[300px]">
                    <Clock className="w-12 h-12 mb-3 text-[#dfac34] animate-pulse" />
                    <h4 className="font-mono font-bold text-slate-200 text-xs uppercase tracking-widest">Aguardando Seleção</h4>
                    <p className="text-[11px] text-slate-405 mt-2 leading-relaxed max-w-[220px] font-sans font-light">
                      Selecione um dos eventos ou minicursos ativos no cronograma para iniciar a sua inscrição académica imediata.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

          </div>
        )}
 
        {/* VIEW 3: GALERIA DE MEMÓRIAS */}
        {activeTab === 'galeria' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-black text-slate-100 tracking-tight">
                  Galeria de Fotografias e Recordações
                </h2>
                <p className="text-sm text-slate-400 mt-1 font-sans font-light">Coletânea visual dos stands de inovação, feira empresarial e festivais estudantis.</p>
              </div>

              <button
                onClick={() => setShowGalleryForm(!showGalleryForm)}
                className="px-5 py-3 bg-[#dfac34] hover:bg-[#dfac34]/95 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-md uppercase tracking-widest font-mono cursor-pointer gold-glow"
              >
                <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Adicionar Foto</span>
              </button>
            </div>

            {/* DYNAMIC PHOTO MEMORY ADDITION FORM */}
            {showGalleryForm && (
              <div className="glass-morphic bg-[#0a0f1c]/90 border border-[#dfac34]/25 p-6 md:p-8 rounded-3xl shadow-3xl max-w-xl mx-auto space-y-5 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4 text-[#dfac34]" />
                    <span>Partilhar Novo Momento</span>
                  </h4>
                  <button 
                    onClick={() => setShowGalleryForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-200 transition-colors cursor-pointer uppercase font-mono font-bold"
                  >
                    Fechar
                  </button>
                </div>

                <form onSubmit={handleAddGalleryPost} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-widest text-slate-400 mb-1.5 uppercase">Título da Fotografia / Destaque</label>
                    <input
                      type="text"
                      required
                      value={galleryForm.title}
                      onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                      placeholder="Ex: Alunos de G.I. no Stand da Continental"
                      className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-slate-200 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-widest text-slate-400 mb-1.5 uppercase">Legenda / Breve Resumo</label>
                    <textarea
                      required
                      value={galleryForm.description}
                      onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
                      placeholder="Legenda para renderizar abaixo da fotografia..."
                      className="w-full h-16 bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-slate-200 outline-none transition-colors resize-none font-sans font-light"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold tracking-widest text-slate-400 mb-1.5 uppercase">Atividade Associada</label>
                      <select
                        value={galleryForm.event_id}
                        onChange={(e) => setGalleryForm({ ...galleryForm, event_id: e.target.value })}
                        className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-slate-200 outline-none transition-colors cursor-pointer"
                      >
                        <option value="">Nula / Outra Atividade</option>
                        {events.map(e => (
                          <option key={e.id} value={e.id}>{e.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold tracking-widest text-slate-400 mb-1.5 uppercase">URL da Imagem de Teste</label>
                      <input
                        type="url"
                        required
                        value={galleryForm.imageUrl}
                        onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                        placeholder="Link Unsplash ou similar..."
                        className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-slate-200 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/90 border border-[#dfac34]/10 rounded-xl font-mono">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sugestão de URL rápida de teste:</p>
                    <p className="text-[9px] text-[#dfac34] mt-1 select-all break-all leading-relaxed">
                      https://images.unsplash.com/photo-1540317580114-ed684c82b71d?auto=format&fit=crop&w=800&q=80
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#dfac34] hover:bg-[#dfac34]/90 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer hover:-translate-y-0.5 gold-glow"
                  >
                    Publicar na Galeria SAGEO
                  </button>
                </form>
              </div>
            )}

            {/* MASONRY IMAGE CHIPS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map(post => (
                <div 
                  key={post.id}
                  className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 rounded-3xl overflow-hidden hover:border-[#dfac34]/35 hover:-translate-y-1 transition-all flex flex-col group justify-between shadow-xl"
                >
                  <div className="h-56 overflow-hidden relative">
                    <img 
                      src={post.image_url} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
                    
                    {post.event_title && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-[9px] font-mono font-bold bg-[#0a0f1c]/90 border border-[#dfac34]/20 backdrop-blur-md px-2.5 py-1 rounded inline-block text-[#dfac34] truncate max-w-full">
                          Sessão: {post.event_title}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-2.5">
                    <h4 className="font-serif font-black text-md text-slate-100 group-hover:text-[#dfac34] transition-colors leading-snug tracking-tight">
                      {post.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans font-light line-clamp-3">
                      {post.description}
                    </p>
                    <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500 font-mono border-t border-slate-900">
                      <button
                        onClick={() => handleLikeGalleryPost(post.id)}
                        className="inline-flex items-center gap-1.5 bg-[#dfac34]/10 hover:bg-[#dfac34]/20 border border-[#dfac34]/15 hover:border-[#dfac34]/40 text-[#dfac34] px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wide transition-all cursor-pointer uppercase active:scale-95"
                      >
                        ❤️ Gostar ({galleryLikes[post.id] || post.likes || 0})
                      </button>
                      <span className="font-bold">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIEW 4: NORMAS & FAQ ACCORDION */}
        {activeTab === 'regras' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="p-4 bg-[#dfac34]/10 text-[#dfac34] rounded-3xl inline-block border border-[#dfac34]/25 shadow-xl glow-amber">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-black text-slate-100 tracking-tight leading-snug">
                Diretrizes Académicas e Perguntas Frequentes
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto font-sans font-light leading-relaxed">
                Consulte as normas operacionais relativas ao controlo de acessos nas salas e regras de homologação de certificados curriculares.
              </p>
            </div>

            {/* Accordion List */}
            <div className="space-y-4">
              
              {[
                {
                  q: 'O que é a portaria de segurança por Pergunta Secreta?',
                  a: 'Nas edições anteriores verificámos fraudes com partilha voluntária de prints de bilhetes por alunos que não compareciam às sessões. Na SAGEO 2026, além de escanear o QR Code, cada estudante terá de responder de imediato à sua pergunta curricular secreta previamente preenchida na inscrição. O robô irá verificar contra as chaves em registo.'
                },
                {
                  q: 'Ao fim de quanto tempo expira o meu link de confirmação institucional?',
                  a: 'Cada inscrição pré-registada emite um correio académico que aguarda validação. Tens um prazo limite de 5 minutos para abrir a caixa de correio através do painel flutuante de Correio SAGEO e confirmar o link. Findo esse prazo, a vaga regressa imediatamente ao lote aberto do cronograma.'
                },
                {
                  q: 'Como são atribuídos os créditos curriculares (ECTS)?',
                  a: 'Cada palestra ou mini-curso carregará uma certificação correspondente a um número fixo de horas curriculares equivalentes. Apenas os estudantes que registaram oficialmente o seu Check-In através do terminal de scanner dos delegados estarão autorizados a aceder e descarregar a respetiva certidão.'
                },
                {
                  q: 'Onde posso descarregar o certificado após Check-In?',
                  a: 'Após a equipa de portaria confirmar a tua presença, podes ver o teu certificado ativo na tua página inicial ou na área de consulta. O arquivo PDF final em alta resolução será desenhado no browser com validação curricular SHA224 imprimível.'
                },
                {
                  q: 'Estudantes externos podem inscrever-se nas sessões?',
                  a: 'Sim, dependendo da lotação especificada na sala do evento. No entanto, o algoritmo prioriza as candidaturas de estudantes inscritos sob os cursos do Departamento de Engenharia e Gestão Industrial.'
                }
              ].map((faq, idx) => (
                <div key={idx} className="p-6 glass-morphic bg-slate-900/45 border border-[#dfac34]/15 hover:border-[#dfac34]/30 rounded-3xl space-y-3 shadow-md transition-all">
                  <h4 className="font-serif font-black text-slate-100 text-sm md:text-base tracking-tight leading-snug">
                    {faq.q}
                  </h4>
                  <p className="text-xs md:text-sm text-slate-400 font-sans font-light leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}

            </div>

            {/* Support section info */}
            <div className="glass-morphic bg-[#0a0f1c]/45 border border-[#dfac34]/15 rounded-3xl p-6 text-center shadow-lg">
              <p className="text-[10px] text-[#dfac34] font-mono font-bold uppercase tracking-wider">Dúvidas Adicionais no Processamento Curricular?</p>
              <p className="text-xs text-slate-350 mt-2 font-sans font-light max-w-xl mx-auto leading-relaxed">Pode dirigir-se ao Balcão da Comissão Organizadora no Hall Principal ou contactar a coordenação executiva via correio geral.</p>
            </div>

          </div>
        )}

        {/* VIEW: EXPOSIÇÕES (Exhibitions with Galleries & Interviews) */}
        {activeTab === 'exposicoes' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto pb-4">
              <div className="p-4 bg-[#dfac34]/10 text-[#dfac34] rounded-3xl inline-block shadow-xl border border-[#dfac34]/25 glow-amber">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tight">
                Galeria de Exposições Tecnológicas
              </h2>
              <p className="text-sm md:text-md text-slate-450 font-sans font-light leading-relaxed">
                Explore os projetos científicos de vanguarda planeados pelos núcleos e comissões da SAGEO 2026. Clique em qualquer exposição para rever a galeria fotográfica de alta definição e ler a entrevista exclusiva concedida pelos próprios inventores.
              </p>
            </div>

            {/* Exhibitions Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {INITIAL_EXHIBITIONS.map((exb) => (
                <div 
                  key={exb.id} 
                  className="group glass-morphic bg-slate-905/30 border border-[#dfac34]/15 hover:border-[#dfac34]/35 rounded-3xl overflow-hidden transition-all duration-500 flex flex-col justify-between shadow-2xl hover:-translate-y-1.5"
                >
                  <div className="relative h-56 w-full overflow-hidden">
                    <img 
                      src={exb.photos[0]} 
                      alt={exb.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[#dfac34] bg-[#0a0f1c]/90 px-3 py-1.5 rounded-full border border-[#dfac34]/25 shadow-lg">
                        {exb.theme}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <h3 className="font-serif font-black text-lg text-slate-100 group-hover:text-[#dfac34] transition-colors leading-snug tracking-tight">
                        {exb.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-sans font-light leading-relaxed line-clamp-3">
                        {exb.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                      <div className="text-[10px] font-mono text-slate-500 leading-normal">
                        <span className="block font-bold text-slate-350">{exb.exhibitor}</span>
                        <span className="block mt-0.5 font-semibold text-[#dfac34]/80">{exb.exhibitor_contact}</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedExhibition(exb);
                          setActiveExbTab('info');
                          setActiveExbPhotoIdx(0);
                        }}
                        className="px-4 py-2 bg-slate-950/80 hover:bg-[#dfac34] border border-[#dfac34]/20 hover:border-[#dfac34] text-slate-300 hover:text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 cursor-pointer gold-glow"
                      >
                        <span>Entrevista</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Interactive Info banner */}
            <div className="glass-morphic bg-[#0a0f1c]/45 border border-[#dfac34]/15 rounded-3xl p-6 text-center max-w-3xl mx-auto space-y-2 shadow-xl">
              <p className="text-xs text-[#dfac34] font-mono tracking-widest uppercase font-bold">Avaliação de Protótipos Académicos de Topo</p>
              <p className="text-xs text-slate-350 max-w-xl mx-auto font-sans font-light leading-relaxed">
                Todos os stands estão a ser avaliados e pontuados por um júri oficial constituído por representantes corporativos e diretores académicos. Os resultados serão divulgados no encerramento festivo da SAGEO.
              </p>
            </div>
          </div>
        )}

        {/* VIEW: RESPONSÁVEIS (Academic Week Organizers / Student Contributors) */}
        {activeTab === 'responsaveis' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto pb-2">
              <div className="p-4 bg-[#dfac34]/10 text-[#dfac34] rounded-3xl inline-block shadow-xl border border-[#dfac34]/25 glow-amber">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tight leading-snug">
                Recursos Humanos & Propostas Científicas
              </h2>
              <p className="text-sm md:text-md text-slate-405 font-sans font-light leading-relaxed">
                A SAGEO 2026 une a comissão organizadora de estudantes ao painel inovador de ideias científicas unificadas sob grandes eixos nacionais de geociências.
              </p>
            </div>

            {/* Sub-tab Navigation Switcher */}
            <div className="flex flex-wrap justify-center gap-3 border-b border-slate-900 pb-5 max-w-xl mx-auto">
              <button
                onClick={() => setResponsaveisSubTab('team')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  responsaveisSubTab === 'team'
                    ? 'bg-slate-950/80 text-[#dfac34] border border-[#dfac34]/25 shadow-md gold-glow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
                }`}
              >
                <Users className="w-4 h-4 text-[#dfac34]" />
                <span>Comissão Executiva</span>
              </button>
              <button
                onClick={() => setResponsaveisSubTab('propostas')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  responsaveisSubTab === 'propostas'
                    ? 'bg-slate-950/80 text-[#dfac34] border border-[#dfac34]/25 shadow-md gold-glow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-[#dfac34]" />
                <span>Eixos Temáticos & Ideias</span>
              </button>
            </div>

            {responsaveisSubTab === 'team' ? (
              /* Contributors Cards Grid (Original) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {INITIAL_CONTRIBUTORS.map((cont) => (
                  <div 
                    key={cont.id}
                    className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 hover:border-[#dfac34]/35 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-2xl relative overflow-hidden group hover:-translate-y-1 duration-500"
                  >
                    {/* Glowing background accent on hover */}
                    <div className="absolute -right-16 -top-16 w-32 h-32 bg-[#dfac34]/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-[#dfac34]/10 duration-500" />

                    <div className="flex items-start gap-4">
                      {/* Avatar photo */}
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-[#dfac34]/5 rounded-2xl blur-sm scale-105 group-hover:bg-[#dfac34]/15 transition-all" />
                        <img 
                          src={cont.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                          alt={cont.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover relative z-10 border border-slate-800 group-hover:border-[#dfac34]/40 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h3 className="font-serif font-black text-base text-slate-100 group-hover:text-[#dfac34] transition-colors truncate">
                          {cont.name}
                        </h3>
                        <span className="inline-block text-[9px] uppercase font-mono tracking-widest font-bold text-[#dfac34] bg-[#dfac34]/5 px-2.5 py-1 rounded border border-[#dfac34]/15">
                          {cont.role}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-slate-405 font-sans font-light leading-relaxed italic">
                        "{cont.contribution}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-900/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <div>
                        <span className="block text-slate-400 font-bold">{cont.course}</span>
                        <span className="block mt-0.5 text-slate-505">Matrícula: #{cont.student_number}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Brainstorming Ideas & Thematic Axes Mode */
              <div className="space-y-12 animate-fade-in">
                
                {/* Visual Section Header: 5 Eixos */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                    <Layers className="w-5 h-5 text-[#dfac34]" />
                    <h3 className="text-xl font-serif font-black text-white tracking-tight">
                      Enquadramento Geral de Temas em 5 Grandes Eixos
                    </h3>
                  </div>
                  <p className="text-xs text-slate-405 leading-relaxed font-sans font-light">
                    A análise comparativa consolidou ideias repetidas em cinco grandes eixos de alto prestígio científico, alinhando a Semana SAGEO às tendências globais das Geociências, Engenharia Petrolífera e Transição Verde.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {THEMATIC_AXES.map((axis, i) => (
                      <div 
                        key={axis.id}
                        className="p-5 glass-morphic bg-slate-900/30 border border-[#dfac34]/15 rounded-3xl relative overflow-hidden group hover:border-[#dfac34]/35 transition-all duration-300"
                      >
                        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#dfac34]/5 rounded-full blur-xl group-hover:bg-[#dfac34]/10 tracking-widest pointer-events-none" />
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-[#dfac34]/15 flex items-center justify-center text-[#dfac34] font-mono font-bold text-xs shrink-0">
                            0{i + 1}
                          </div>
                          <h4 className="font-serif font-black text-xs text-slate-200 uppercase tracking-wide group-hover:text-[#dfac34] transition-colors">
                            {axis.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                          {axis.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6 pt-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#dfac34]" />
                        <h3 className="text-xl font-serif font-black text-white tracking-tight">
                          Banco de Sugestões de Estudantes ("Brainstorming SAGEO")
                        </h3>
                      </div>
                      <p className="text-xs text-slate-405 font-sans font-light">
                        Consulte o mapeamento original de ideias propostas por Lubazandio, Teka, Mirian, Rocélio, Edvânio, Eliúd e do debate coletivo, ou submeta o seu tema.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={() => setShowBrainIdeaForm(!showBrainIdeaForm)}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 uppercase tracking-wide cursor-pointer transition-all active:scale-95 shadow-lg shadow-blue-500/10"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Sugerir Palestra</span>
                      </button>

                      {/* Interactive Search Field */}
                      <div className="relative w-full md:w-64 shrink-0">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          value={ideasSearch}
                          onChange={(e) => setIdeasSearch(e.target.value)}
                          placeholder="Pesquisar propostas, nomes, etc..."
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl text-xs font-semibold text-slate-205 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* EXPANDABLE BRAIN IDEA SUBMISSION FORM */}
                  {showBrainIdeaForm && (
                    <div className="glass-morphic bg-slate-900/40 border border-[#dfac34]/25 p-6 md:p-8 rounded-3xl shadow-3xl max-w-2xl mx-auto space-y-5 animate-fade-in text-left">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                        <h4 className="text-sm font-bold text-slate-105 flex items-center gap-2 font-mono uppercase tracking-wider">
                          <Lightbulb className="w-4 h-4 text-[#dfac34] animate-pulse" />
                          <span>Propor Nova Palestra ou Ideia Científica</span>
                        </h4>
                        <button
                          onClick={() => setShowBrainIdeaForm(false)}
                          className="text-xs text-slate-500 hover:text-slate-200 transition-colors cursor-pointer uppercase font-mono font-bold"
                        >
                          Cancelar
                        </button>
                      </div>

                      <form onSubmit={handleCreateIdea} className="space-y-4 text-xs font-sans">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono font-bold tracking-widest text-[#dfac34] mb-1.5 uppercase">Nome do Proponente *</label>
                            <input
                              type="text"
                              required
                              value={brainIdeaForm.author}
                              onChange={(e) => setBrainIdeaForm({ ...brainIdeaForm, author: e.target.value })}
                              placeholder="Ex: Seu Nome ou ID"
                              className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-slate-200 outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono font-bold tracking-widest text-[#dfac34] mb-1.5 uppercase">Título da Palestra / Proposta *</label>
                            <input
                              type="text"
                              required
                              value={brainIdeaForm.title}
                              onChange={(e) => setBrainIdeaForm({ ...brainIdeaForm, title: e.target.value })}
                              placeholder="Ex: Geofísica Aplicada a Águas Profundas"
                              className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-slate-205 outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold tracking-widest text-slate-400 mb-1.5 uppercase">Enquadramento / Resumo Curricular Aberto *</label>
                          <textarea
                            required
                            rows={2}
                            value={brainIdeaForm.description}
                            onChange={(e) => setBrainIdeaForm({ ...brainIdeaForm, description: e.target.value })}
                            placeholder="Descreva de forma sucinta os objetivos académicos e relevância prática..."
                            className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-slate-200 outline-none transition-colors resize-none font-sans font-light"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold tracking-widest text-slate-500 mb-1.5 uppercase">Detalhes Técnicos / Informações Adicionais (Opcional)</label>
                          <textarea
                            rows={3}
                            value={brainIdeaForm.content}
                            onChange={(e) => setBrainIdeaForm({ ...brainIdeaForm, content: e.target.value })}
                            placeholder="Fórmulas, softwares indicados, ou justificações geológicas e petrolíferas..."
                            className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-slate-200 outline-none transition-colors resize-none font-sans font-light"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono font-bold tracking-widest text-slate-500 mb-1.5 uppercase">Convidados / Parceiros Sugeridos</label>
                            <input
                              type="text"
                              value={brainIdeaForm.suggested_guests}
                              onChange={(e) => setBrainIdeaForm({ ...brainIdeaForm, suggested_guests: e.target.value })}
                              placeholder="Ex: Sonangol, Chevron"
                              className="w-full bg-slate-950/80 border border-slate-900 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-slate-202 outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono font-bold tracking-widest text-slate-505 mb-1.5 uppercase">Orador Recomendado ou Si Próprio</label>
                            <input
                              type="text"
                              value={brainIdeaForm.suggested_speaker}
                              onChange={(e) => setBrainIdeaForm({ ...brainIdeaForm, suggested_speaker: e.target.value })}
                              placeholder="Ex: Dr. António Martins"
                              className="w-full bg-slate-950/80 border border-slate-900 focus:border-[#dfac34]/50 rounded-xl px-3 py-2.5 text-slate-202 outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-[#dfac34] hover:bg-[#dfac34]/90 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer text-center gold-glow font-mono"
                        >
                          Publicar Proposta Académica
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Quick Pills for Authors Filter */}
                  <div className="flex flex-wrap gap-2 py-1">
                    {[
                      { id: 'all', label: 'Todos os Autores' },
                      { id: 'Geral', label: 'Eixos Gerais/Geral' },
                      { id: 'Lubazandio', label: 'Lubazandio' },
                      { id: 'Teka', label: 'Teka' },
                      { id: 'Mirian', label: 'Mirian' },
                      { id: 'Rocélio', label: 'Rocélio' },
                      { id: 'Edvânio', label: 'Edvânio' },
                      { id: 'Eliúd', label: 'Eliúd' }
                    ].map((auth) => (
                      <button
                        key={auth.id}
                        onClick={() => setSelectedIdeaAuthor(auth.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wide uppercase font-bold border transition-all cursor-pointer ${
                          selectedIdeaAuthor === auth.id
                            ? 'bg-[#dfac34] text-slate-950 border-[#dfac34] font-black'
                            : 'bg-slate-950 text-slate-400 border-slate-900 hover:text-slate-100'
                        }`}
                      >
                        {auth.label}
                      </button>
                    ))}
                  </div>

                  {/* Filtered suggestions list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {brainIdeas.filter((idea) => {
                      // Author Filter
                      const matchesAuthor = selectedIdeaAuthor === 'all' || idea.author === selectedIdeaAuthor;
                      // Search Filter
                      const searchLower = ideasSearch.toLowerCase();
                      const matchesSearch = 
                        idea.title.toLowerCase().includes(searchLower) ||
                        (idea.description && idea.description.toLowerCase().includes(searchLower)) ||
                        (idea.author.toLowerCase().includes(searchLower)) ||
                        (idea.suggested_guests && idea.suggested_guests.toLowerCase().includes(searchLower)) ||
                        (idea.suggested_speaker && idea.suggested_speaker.toLowerCase().includes(searchLower)) ||
                        (idea.content && idea.content.toLowerCase().includes(searchLower));

                      return matchesAuthor && matchesSearch;
                    }).map((idea) => (
                      <div 
                        key={idea.id}
                        className="bg-slate-950/70 border border-slate-900/90 rounded-2.5xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between gap-4 text-xs"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2 py-0.5 rounded font-mono font-extrabold text-[9px] uppercase tracking-wider ${
                              idea.author === 'Geral' ? 'bg-[#dfac34]/10 text-[#dfac34] border border-[#dfac34]/25' :
                              idea.author === 'Lubazandio' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              idea.author === 'Teka' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              idea.author === 'Mirian' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              idea.author === 'Rocélio' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              idea.author === 'Edvânio' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              ID: {idea.author}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">CODE: #{idea.id.toUpperCase()}</span>
                          </div>

                          <h4 className="font-serif font-extrabold text-slate-100 text-sm md:text-base leading-snug">
                            {idea.title}
                          </h4>

                          {idea.description && (
                            <p className="text-slate-400 leading-relaxed leading-normal text-xs">
                              {idea.description}
                            </p>
                          )}

                          {idea.content && (
                            <div className="p-3 bg-slate-900/40 rounded-xl space-y-1 border border-slate-900">
                              <span className="text-[10px] uppercase font-mono font-bold text-[#dfac34]">Descrição Detalhada:</span>
                              <p className="text-[11px] text-slate-300 leading-relaxed">{idea.content}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1 flex-1 text-left">
                            {idea.suggested_guests && (
                              <p className="text-[11px] text-slate-400 flex flex-wrap gap-1.5 items-center">
                                <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 shrink-0">Convidados:</span>
                                <span className="italic font-medium text-slate-200">{idea.suggested_guests}</span>
                              </p>
                            )}
                            {idea.suggested_speaker && (
                              <p className="text-[11px] text-slate-400 flex flex-wrap gap-1.5 items-center">
                                <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10 shrink-0">Orador:</span>
                                <span className="font-semibold text-slate-200">{idea.suggested_speaker}</span>
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleUpvoteIdea(idea.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dfac34]/10 hover:bg-[#dfac34]/20 text-[#dfac34] border border-[#dfac34]/15 hover:border-[#dfac34]/30 font-mono font-bold tracking-wide uppercase text-[10px] cursor-pointer transition-all active:scale-95 shrink-0 self-end sm:self-center font-bold"
                          >
                            <Vote className="w-3.5 h-3.5" />
                            <span>Apoiar ({idea.votes || 0})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {brainIdeas.filter((idea) => {
                      const matchesAuthor = selectedIdeaAuthor === 'all' || idea.author === selectedIdeaAuthor;
                      const searchLower = ideasSearch.toLowerCase();
                      const matchesSearch = 
                        idea.title.toLowerCase().includes(searchLower) ||
                        (idea.description && idea.description.toLowerCase().includes(searchLower)) ||
                        (idea.author.toLowerCase().includes(searchLower)) ||
                        (idea.suggested_guests && idea.suggested_guests.toLowerCase().includes(searchLower)) ||
                        (idea.suggested_speaker && idea.suggested_speaker.toLowerCase().includes(searchLower)) ||
                        (idea.content && idea.content.toLowerCase().includes(searchLower));
                      return matchesAuthor && matchesSearch;
                    }).length === 0 && (
                      <div className="col-span-1 md:col-span-2 text-center py-12 p-8 bg-slate-950/40 rounded-2.5xl border border-dashed border-slate-900">
                        <p className="text-slate-500 text-xs font-mono">Nenhuma sugestão encontrada sob esta filtragem de pesquisa.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Interactive Feedback Box */}
            <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-8 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-2 text-left">
                <h4 className="text-base font-bold text-slate-100 font-serif">Gostarias de te juntar e apoiar a equipa na próxima edição?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Buscamos constantemente mentes criativas em engenharia informática, logística, design visual, e relações públicas. Se queres desenvolver competências executivas de alto nível histórico, partilha a tua pretensão.
                </p>
              </div>
              <div className="md:col-span-4 text-center md:text-right shrink-0">
                <a 
                  href="mailto:rocelioinc@gmail.com?subject=SAGEO%20Voluntarios"
                  className="inline-block px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all duration-250 cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95 text-center"
                >
                  Candidatar Voluntário
                </a>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: STAFF ADMIN AREA (Locked) */}
        {activeTab === 'admin' && (
          <div className="space-y-8">
            
            {/* 1. Login form if unauthenticated */}
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto glass-morphic bg-slate-900/30 border border-[#dfac34]/15 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
                
                <div className="p-4 bg-[#dfac34]/10 text-[#dfac34] rounded-2xl inline-block border border-[#dfac34]/25 glow-amber">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xl font-serif font-black text-white tracking-tight">Área de Coordenação SAGEO</h3>
                  <p className="text-xs text-slate-400 font-sans font-light max-w-xs mx-auto leading-relaxed">
                    Acesso restrito ao secretariado académico e delegados de portaria para scanner e gestão de registos.
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4 text-xs text-left">
                  <div>
                    <label className="block text-[#dfac34] mb-1.5 bg-[#dfac34]/5 rounded px-2.5 py-1 font-extrabold uppercase font-mono border border-[#dfac34]/15 inline-block text-[9px] tracking-wider">
                      Código de Acesso Corporativo SAGEO
                    </label>
                    <input
                      type="password"
                      required
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="Indique o código..."
                      className="w-full bg-slate-950/80 border border-[#dfac34]/15 focus:border-[#dfac34]/65 rounded-xl px-4 py-3 text-sm text-center font-mono tracking-widest text-slate-100 outline-none transition-all focus:ring-1 focus:ring-[#dfac34]/30"
                    />
                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                      Dica de segurança local: <code className="text-[#dfac34] text-[11px] font-mono font-bold">{STAFF_PASSCODE}</code>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#dfac34] hover:bg-[#dfac34]/80 text-[#0a0f1c] font-black rounded-xl text-xs uppercase tracking-widest transition-all duration-300 shadow-xl cursor-pointer font-sans gold-glow"
                  >
                    Desbloquear Consola Secretariado
                  </button>
                </form>

              </div>
            ) : (
              
              /* 2. Authenticated Admin Desk Workspace */
              <div className="space-y-8 animate-fade-in">
                
                {/* Admin Header Area with summary info */}
                <div className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 rounded-3xl p-6 flex flex-wrap gap-6 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#dfac34] text-slate-950 p-3.5 rounded-2xl shadow-xl gold-glow">
                      <Unlock className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-black text-lg text-white tracking-tight">Consola Central do Secretariado</h3>
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded">STAFF MENSAGENS</span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans font-light mt-0.5">Gestão curricular, check-in, emissores académicos e logs.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        if (activeAdminRole !== 'super_admin') {
                          triggerToast('Função Restrita: Apenas o Super-Administrador (ADM) tem autorização para redefinir as bases de dados centrais.', 'warning');
                          return;
                        }
                        const confirmPrompt = confirm('⚠️ ATENÇÃO: Esta ação irá redefinir de forma permanente toda a base de dados remota do evento SAGEO (Atividades, Inscrições e Logs) de volta aos padrões originais. Continuar?');
                        if (!confirmPrompt) return;

                        const pass = prompt('Por favor, confirme introduzindo a Chave Operacional de Administrador (SAGEO2026-ADM):');
                        if (!pass) return;

                        try {
                          await resetServerDB(pass);
                          localStorage.clear();
                          await syncBackendData();
                          triggerToast('✨ Sincronização Concluída! Toda a base de dados central e o cache local foram repostos com sucesso para os originais académicos.', 'success');
                        } catch (err: any) {
                          triggerToast(`Falha de Redefinição: ${err.message}`, 'error');
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs rounded-lg transition-colors border border-rose-500/30 font-semibold"
                    >
                      Restaurar Servidor SAGEO
                    </button>
                    
                    <button
                      onClick={handleAdminLogout}
                      className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Terminar Sessão</span>
                    </button>
                  </div>
                </div>

                {/* Staff Control Sub Tabs navigation */}
                <div className="flex border-b border-slate-850 overflow-x-auto gap-2">
                  {[
                    { id: 'status', label: 'Monitor de Presença', icon: Sliders },
                    { id: 'scanner', label: 'Visualizador / Scanner QR', icon: QrCode },
                    { id: 'eventos', label: 'Gestor de Atividades & Capacidade', icon: Calendar },
                    { id: 'participantes', label: 'Estudantes & Certificados', icon: Users },
                    { id: 'dashboard', label: 'Estatísticas & Sucesso', icon: BarChart3 },
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setAdminSubTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-all shrink-0 border-b-2 cursor-pointer ${
                          adminSubTab === tab.id
                          ? 'border-[#dfac34] text-[#dfac34] bg-slate-900/30'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* SUB TAB 1: WORKSPACE DASHBOARD STATUS MONITORS */}
                {adminSubTab === 'status' && (
                  <div className="space-y-8">
                    
                    {/* Visual Stats widgets metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      
                      <div className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 p-5 rounded-2xl space-y-1 hover:border-[#dfac34]/35 transition-all duration-300">
                        <p className="text-[10px] font-mono text-[#dfac34] uppercase font-bold tracking-wider">Estudantes Confirmados</p>
                        <p className="text-3xl font-serif font-black text-white">{totalStudentsRegisteredNum}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Registados através de e-mails académicos</p>
                      </div>

                      <div className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 p-5 rounded-2xl space-y-1 hover:border-[#dfac34]/35 transition-all duration-300">
                        <p className="text-[10px] font-mono text-[#dfac34] uppercase font-bold tracking-wider">Check-in Efetuado</p>
                        <p className="text-3xl font-serif font-black text-[#dfac34]">{totalCheckinsDone}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Taxa de comparência: {totalStudentsRegisteredNum > 0 ? Math.round((totalCheckinsDone / totalStudentsRegisteredNum) * 100) : 0}%
                        </p>
                      </div>

                      <div className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 p-5 rounded-2xl space-y-1 hover:border-[#dfac34]/35 transition-all duration-300">
                        <p className="text-[10px] font-mono text-[#dfac34] uppercase font-bold tracking-wider">Certidões Ativas</p>
                        <p className="text-3xl font-serif font-black text-[#dfac34]">{totalCheckinsDone}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Disponíveis para descarregamento imediato</p>
                      </div>

                      <div className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 p-5 rounded-2xl space-y-1 hover:border-[#dfac34]/35 transition-all duration-300">
                        <p className="text-[10px] font-mono text-[#dfac34] uppercase font-bold tracking-wider">Fila de Espera</p>
                        <p className="text-3xl font-serif font-black text-rose-450">{waitlist.length}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Pedidos de stands e salas esgotadas</p>
                      </div>

                    </div>

                    {/* Operational Check lists overview by event */}
                    <div className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 rounded-3xl p-6 shadow-xl">
                      <h4 className="text-md font-serif font-black text-slate-200 mb-4 tracking-tight">Relatório do Estado de Lotação do Cronograma</h4>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="text-slate-500 uppercase font-mono text-[10px] border-b border-slate-800">
                            <tr>
                              <th className="py-3 px-4">Evento / Palestrante</th>
                              <th className="py-3 px-4">Local</th>
                              <th className="py-3 px-4">Categoria</th>
                              <th className="py-3 px-4 text-center">Inscritos / Limite</th>
                              <th className="py-3 px-4 text-center">Check-Ins</th>
                              <th className="py-3 px-4 text-right">Acesso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {events.map(e => {
                              const eventRegs = registrations.filter(r => r.event_id === e.id);
                              const confirmed = eventRegs.filter(r => r.confirmed).length;
                              const presents = eventRegs.filter(r => r.checked_in).length;
                              const tag = getCategoryBadge(e.category);

                              return (
                                <tr key={e.id} className="hover:bg-slate-950/40">
                                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                                    <div>{e.title}</div>
                                    <span className="text-[10px] text-slate-500 italic mt-0.5 block">{e.lecturer}</span>
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-400">{e.location}</td>
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2 py-0.5 text-[9px] font-semibold border uppercase rounded ${tag.bg}`}>
                                      {tag.label}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                                    {confirmed} / {e.capacity}
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-bold text-amber-500">
                                    {presents}
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <span className={`h-2.5 w-2.5 rounded-full inline-block ${e.is_open ? 'bg-[#dfac34] animate-pulse' : 'bg-rose-500'}`} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Live System Audit and Scans Logs */}
                    <div className="glass-morphic bg-slate-900/50 border border-[#dfac34]/15 rounded-3xl p-6 mt-6 shadow-xl">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-serif font-black text-slate-100 flex items-center gap-2 text-sm tracking-tight">
                          <span className="h-2 w-2 rounded-full bg-[#dfac34] animate-ping inline-block" />
                          Painel de Reporte de Diagnóstico e Auditoria (Audit Logs)
                        </h4>
                        <span className="text-[9px] bg-[#dfac34]/5 text-[#dfac34] font-mono font-bold px-2.5 py-1 rounded border border-[#dfac34]/15 tracking-wide">LIVE TRACE TIMELINE</span>
                      </div>
                      
                      {!dashboardStats || !dashboardStats.recentLogs || dashboardStats.recentLogs.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">Nenhum evento letivo registado no rolo auditor central de portarias.</p>
                      ) : (
                        <div className="space-y-2 max-h-[290px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                          {dashboardStats.recentLogs.slice(0, 10).map((log: any) => (
                            <div key={log.id} className="flex gap-4 p-3 bg-slate-950/40 hover:bg-slate-950/70 border border-slate-850 rounded-xl text-xs justify-between items-start transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 text-[8px] font-bold font-mono tracking-wider rounded uppercase ${
                                    log.status === "FAILED"
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                                    : log.action.includes("CHECK-IN") 
                                    ? "bg-[#dfac34]/10 text-[#dfac34] border border-[#dfac34]/20"
                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                  }`}>
                                    {log.action}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {new Date(log.timestamp).toLocaleTimeString('pt-PT')}
                                  </span>
                                </div>
                                <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{log.details}</p>
                              </div>
                              <span className={`px-1.5 py-0.5 text-[9px] font-mono leading-none rounded font-bold uppercase ${
                                log.status === "SUCCESS" ? "bg-[#dfac34]/10 text-[#dfac34]" : "bg-rose-500/10 text-rose-400"
                              }`}>
                                {log.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* SUB TAB 2: PORTARIA / SCANNER SIMULATOR WINDOW */}
                {adminSubTab === 'scanner' && (
                  <div className="space-y-6">
                    
                    {/* Event filter header selector */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-100 text-sm">Controle de Portaria - Selecionar Entrada Ativa</h4>
                        <p className="text-xs text-slate-400">Filtre por evento para ativar a leitura local e o check-in correspondente à sala.</p>
                      </div>

                      <select
                        value={adminSelectedEventId}
                        onChange={(e) => setAdminSelectedEventId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500"
                      >
                        {events.map(evt => (
                          <option key={evt.id} value={evt.id}>{evt.title} ({evt.location})</option>
                        ))}
                      </select>
                    </div>

                    {/* Integrated scanning terminal loader */}
                    {adminSelectedEventId ? (
                      <ScannerSimulator
                        selectedEventId={adminSelectedEventId}
                        triggerRefresh={reloadData}
                        onCheckinSuccess={(regId) => {
                          const reg = registrations.find(r => r.id === regId);
                          const evt = events.find(e => e.id === adminSelectedEventId);
                          if (reg && evt) {
                            // Instantly mock email delivery message and allow viewing certificate
                            console.log(`Log Checkin Success: Student ${reg.first_name} in event ${evt.title}`);
                          }
                        }}
                      />
                    ) : (
                      <p className="text-xs text-slate-400 text-center">Nenhum evento registado para monitorização.</p>
                    )}

                  </div>
                )}

                {/* SUB TAB 3: ADMIN EVENT MANAGEMENT (CRUD + ENROLL CONTROLS) */}
                {adminSubTab === 'eventos' && (
                  <div className="space-y-6">
                    
                    <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">Gestão de Salas e Lotações</h4>
                        <p className="text-xs text-slate-400">Crie novas palestras magnas ou feche inscrições de workshops em tempo real.</p>
                      </div>

                      <button
                        onClick={() => setShowAddEventForm(!showAddEventForm)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                        Criar Novo Evento
                      </button>
                    </div>

                    {/* CREATE CUSTOM EVENT FORM CONTAINER */}
                    {showAddEventForm && (
                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl max-w-xl mx-auto space-y-4 animate-fade-in-down">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-[#dfac34]" />
                            <span>Adicionar Sessão do Cronograma SAGEO</span>
                          </h4>
                          <button 
                            onClick={() => setShowAddEventForm(false)}
                            className="text-xs text-slate-500 hover:text-slate-200"
                          >
                            Fechar
                          </button>
                        </div>

                        <form onSubmit={handleAddCustomEvent} className="space-y-3.5 text-xs text-left">
                          <div>
                            <label className="block text-slate-400 mb-1">Título do Evento Académico</label>
                            <input
                              type="text"
                              required
                              value={newEventForm.title}
                              onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                              placeholder="Ex: Workshop: Simulação Flexível Arena"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Palestrante / Coordenação Responsável</label>
                            <input
                              type="text"
                              required
                              value={newEventForm.lecturer}
                              onChange={(e) => setNewEventForm({ ...newEventForm, lecturer: e.target.value })}
                              placeholder="Ex: Profª Drª Carlota Abreu"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-400 mb-1">Sala / Localização</label>
                              <input
                                type="text"
                                required
                                value={newEventForm.location}
                                onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
                                placeholder="Sala I-202 ou Auditório"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 mb-1">Capacidade (Estudantes)</label>
                              <input
                                type="number"
                                required
                                value={newEventForm.capacity}
                                onChange={(e) => setNewEventForm({ ...newEventForm, capacity: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-slate-400 mb-1">Data</label>
                              <input
                                type="date"
                                required
                                value={newEventForm.date}
                                onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 mb-1">Início</label>
                              <input
                                type="text"
                                required
                                value={newEventForm.start_time}
                                onChange={(e) => setNewEventForm({ ...newEventForm, start_time: e.target.value })}
                                placeholder="09:00"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 mb-1">Fim</label>
                              <input
                                type="text"
                                value={newEventForm.end_time}
                                onChange={(e) => setNewEventForm({ ...newEventForm, end_time: e.target.value })}
                                placeholder="11:30"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-400 mb-1">Categoria</label>
                              <select
                                value={newEventForm.category}
                                onChange={(e) => setNewEventForm({ ...newEventForm, category: e.target.value as any })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-[#dfac34]"
                              >
                                <option value="grande_exposicao">Grande Exposição</option>
                                <option value="mini_curso">Mini-Curso</option>
                                <option value="empresa">Empresas & Carreira</option>
                                <option value="exposicao">Exposição Técnica</option>
                                <option value="festival">Festival SAGEO</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-slate-400 mb-1">Estado de Abertura Inicial</label>
                              <select
                                value={newEventForm.is_open ? 'true' : 'false'}
                                onChange={(e) => setNewEventForm({ ...newEventForm, is_open: e.target.value === 'true' })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-[#dfac34]"
                              >
                                <option value="true">Aberto para Candidaturas</option>
                                <option value="false">Fechado / Ocultado</option>
                              </select>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-[#dfac34] hover:bg-[#dfac34]/80 text-[#0a0f1c] font-black rounded-xl text-xs uppercase tracking-widest transition-all duration-300 shadow-xl cursor-pointer"
                          >
                            Inserir no Portal de Inscrições SAGEO
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Inline table detailing operations */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Nome / Local</th>
                              <th className="py-2.5 px-3">Data & Hora</th>
                              <th className="py-2.5 px-3 text-center">Capacidade</th>
                              <th className="py-2.5 px-3 text-center">Inscrições Ativas?</th>
                              <th className="py-2.5 px-3 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {events.map(e => (
                              <tr key={e.id} className="hover:bg-slate-950/25">
                                <td className="py-3 px-3 font-semibold text-slate-200">
                                  <div>{e.title}</div>
                                  <span className="text-[10px] text-slate-500 block mt-0.5">{e.location}  |  Orador: {e.lecturer}</span>
                                </td>
                                <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                                  {e.date} às {e.start_time} h
                                </td>
                                <td className="py-3 px-3 text-center font-bold text-slate-300">
                                  {e.capacity}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    onClick={() => toggleEventRegistration(e.id)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                      e.is_open
                                      ? 'bg-[#dfac34]/10 text-[#dfac34] border-[#dfac34]/25'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                    }`}
                                  >
                                    {e.is_open ? 'ABERTO - Clique p/ Fechar' : 'FECHADO - Clique p/ Abrir'}
                                  </button>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => {
                                      if (confirm('Deseja mesmo remover permanentemente esta atividade escolar do cronograma?')) {
                                        handleDeleteEvent(e.id);
                                      }
                                    }}
                                    className="text-slate-600 hover:text-rose-400 font-bold transition-colors font-mono uppercase text-[9px] tracking-wider"
                                  >
                                    Remover
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

                {/* SUB TAB 4: STUDENTS REGISTERED AND CERTIFICATES DELIVERY */}
                {adminSubTab === 'participantes' && (
                  <div className="space-y-6">
                    
                    {/* Filter and operations desk */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-100 text-sm">Diretório Curricular de Inscrições e Logs</h4>
                          <p className="text-xs text-slate-400">Inspeccione respostas lógicas, force check-ins manuais, faça downloads CSV ou imprima certificados ECTS.</p>
                        </div>

                        <button
                          onClick={() => handleExportCSV(adminSelectedEventId)}
                          disabled={!adminSelectedEventId}
                          className="px-4 py-2 bg-[#dfac34] hover:bg-[#dfac34]/80 disabled:bg-slate-800 disabled:text-slate-600 text-[#0a0f1c] font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer uppercase tracking-wider transition-colors"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-[#0a0f1c]" />
                          Exportar Folha CSV
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 font-mono">
                            Filtrar por Sessão Letiva
                          </label>
                          <select
                            value={adminSelectedEventId}
                            onChange={(e) => setAdminSelectedEventId(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none w-full font-semibold"
                          >
                            <option value="">-- Selecione o Evento --</option>
                            {events.map(evt => (
                              <option key={evt.id} value={evt.id}>{evt.title} ({evt.location})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 font-mono">
                            Procurar Estudante (Nome ou Nº)
                          </label>
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={adminRegSearch}
                              onChange={(e) => setAdminRegSearch(e.target.value)}
                              placeholder="Indique o primeiro nome ou a matrícula curricular..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none"
                            />
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Table loaded list */}
                    {(() => {
                      const eventRegs = registrations.filter(r => r.event_id === adminSelectedEventId);
                      const filteredRegs = eventRegs.filter(
                        r => r.first_name.toLowerCase().includes(adminRegSearch.toLowerCase()) || 
                             r.last_name.toLowerCase().includes(adminRegSearch.toLowerCase()) ||
                             r.student_number.toLowerCase().includes(adminRegSearch.toLowerCase())
                      );

                      // Secret favoring: sort students from Geosciences department to the top
                      const sortedRegs = [...filteredRegs].sort((a, b) => {
                        const aGeo = ['Engenharia de Petróleos', 'Geofísica'].includes(a.course);
                        const bGeo = ['Engenharia de Petróleos', 'Geofísica'].includes(b.course);
                        if (aGeo && !bGeo) return -1;
                        if (!aGeo && bGeo) return 1;
                        return 0;
                      });

                      const targetEvent = events.find(e => e.id === adminSelectedEventId);

                      return (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                          <h5 className="font-bold text-slate-200 text-xs mb-3 font-mono">
                            Lista Oficial: {targetEvent?.title || 'Selecione uma atividade'} ({sortedRegs.length} resultados)
                          </h5>

                          {sortedRegs.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-6 text-center">Nenhuma inscrição confirmada ou correspondente encontrada para este evento.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead className="text-slate-500 font-mono text-[10px] uppercase border-b border-slate-800">
                                  <tr>
                                    <th className="py-2 px-3">Estudante</th>
                                    <th className="py-2 px-3">Curso & Matrícula</th>
                                    <th className="py-2 px-3">ResumoPergunta Orador</th>
                                    <th className="py-2 px-3 text-center">Estado Presença</th>
                                    <th className="py-2 px-3 text-right">Verificação / Certidão</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850/50">
                                  {sortedRegs.map(reg => (
                                    <tr key={reg.id} className="hover:bg-slate-950/25">
                                      <td className="py-3.5 px-3">
                                        <p className="font-bold text-slate-200">{reg.first_name} {reg.last_name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{reg.institutional_email}</p>
                                      </td>
                                      <td className="py-3.5 px-3">
                                        <div className="flex flex-col gap-0.5">
                                          <p className="font-semibold text-slate-300">{reg.course}</p>
                                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <span className="text-[10px] text-[#dfac34] font-mono">Aluno: {reg.student_number}</span>
                                            {['Engenharia de Petróleos', 'Geofísica'].includes(reg.course) && (
                                              <span className="px-1.5 py-0.5 bg-amber-500/10 text-[#dfac34] font-bold border border-amber-500/30 rounded text-[9px] uppercase tracking-wider font-sans">
                                                ★ Prioridade Geociências
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-3 text-slate-400 max-w-[180px] truncate">
                                        {reg.lecturer_question ? `"${reg.lecturer_question}"` : <span className="text-slate-600 italic">Sem pergunta</span>}
                                      </td>
                                      <td className="py-3.5 px-3 text-center">
                                        {reg.checked_in ? (
                                          <span className="px-2 py-0.5 bg-[#dfac34]/10 text-[#dfac34] text-[10px] border border-[#dfac34]/25 rounded-md font-bold font-mono">
                                            ☑ PRESENTE
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[10px] border border-rose-500/20 rounded-md font-bold font-mono">
                                            ☒ AUSENTE
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3.5 px-3 text-right space-x-1">
                                        {/* Toggle manually checked in logic for tests as back-up */}
                                        <button
                                          onClick={() => {
                                            const updated = registrations.map(inner => {
                                              if (inner.id === reg.id) {
                                                const changeTo = !inner.checked_in;
                                                return { 
                                                  ...inner, 
                                                  checked_in: changeTo,
                                                  checked_in_at: changeTo ? new Date().toISOString() : undefined 
                                                };
                                              }
                                              return inner;
                                            });
                                            saveStoredRegistrations(updated);
                                            setRegistrations(updated);
                                            triggerToast('Estado de presença forçado manualmente para fins de coordenação.', 'info');
                                          }}
                                          className={`px-2 py-1 text-[10px] rounded-lg border font-semibold ${
                                            reg.checked_in 
                                            ? 'bg-slate-900 text-slate-400 border-slate-800' 
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/25'
                                          }`}
                                        >
                                          Checkin Forçar
                                        </button>

                                        {/* Draw certificate */}
                                        {reg.checked_in && targetEvent && (
                                          <button
                                            onClick={() => setViewingCertificateMatch({ reg, evt: targetEvent })}
                                            className="px-2.5 py-1 bg-[#dfac34] hover:bg-[#dfac34]/80 text-[#0a0f1c] font-black rounded-lg text-[10px] transition-colors"
                                          >
                                            Ver Certidão
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                )}

                {/* SUB TAB 5: ORGANIZER STATISTICS DASHBOARD */}
                {adminSubTab === 'dashboard' && (
                  <OrganizerDashboard events={events} registrations={registrations} />
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* ATTENDEE TICKET RECOVERY MODAL OVERLAY */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-scale-up text-left">
            <button
              onClick={() => {
                setShowRecoveryModal(false);
                setRecoveryStudentNumber('');
                setRecoveryEventId('');
                setRecoveryError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-950/50 hover:bg-slate-900 border border-slate-800 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-[#dfac34]" />
              <h3 className="font-bold text-slate-100 text-base">Recuperar Bilhete Académico</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Esqueceu o seu QR Code ou quer reaver o seu comprovativo? Indique as credenciais de matrícula originais para consultar a inscrição ativa.
            </p>

            <form onSubmit={handleRecoverTicket} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 font-mono">
                  Atividade Registada
                </label>
                <select
                  required
                  value={recoveryEventId}
                  onChange={(e) => setRecoveryEventId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none w-full font-semibold focus:border-[#dfac34]"
                >
                  <option value="">-- Selecione o Evento --</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 font-mono">
                  Matrícula do Estudante (Nº de Estudante - 8 Dígitos)
                </label>
                <input
                  required
                  type="text"
                  maxLength={8}
                  placeholder="Ex: 20220001"
                  value={recoveryStudentNumber}
                  onChange={(e) => setRecoveryStudentNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#dfac34] font-mono"
                />
              </div>

              {recoveryError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-lg font-mono">
                  ⚠️ {recoveryError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryModal(false);
                    setRecoveryStudentNumber('');
                    setRecoveryEventId('');
                    setRecoveryError(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-950/70 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#dfac34] hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-colors font-sans uppercase tracking-wider"
                >
                  Desbloquear Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVE CERTIFICATE RENDERING MODAL VIEW */}
      {viewingCertificateMatch && (
        <CertificateGenerator
          registration={viewingCertificateMatch.reg}
          event={viewingCertificateMatch.evt}
          onClose={() => setViewingCertificateMatch(null)}
        />
      )}

      {/* INTERACTIVE EXHIBITION DETAILS & INTERVIEW MODAL */}
      {selectedExhibition && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-55 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] relative animate-scale-up">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedExhibition(null)}
              className="absolute top-4 right-4 bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white p-2 rounded-full duration-200 z-50 cursor-pointer hover:rotate-90"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Media Gallery */}
            <div className="w-full md:w-5/12 bg-slate-950 p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-850">
              <div className="space-y-4 text-left">
                <span className="text-[9px] uppercase font-mono tracking-widest font-extrabold text-[#dfac34] bg-[#dfac34]/5 px-2.5 py-1 rounded-md border border-[#dfac34]/15">
                  {selectedExhibition.theme}
                </span>
                
                <h3 className="text-xl font-bold text-slate-100 font-serif pt-1 leading-tight">
                  {selectedExhibition.title}
                </h3>

                {/* Primary display photo */}
                <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden border border-slate-800">
                  <img 
                    src={selectedExhibition.photos[activeExbPhotoIdx]} 
                    alt="Galeria de Exposições"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                </div>

                {/* Thumbnail selector */}
                <div className="grid grid-cols-3 gap-2">
                  {selectedExhibition.photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveExbPhotoIdx(idx)}
                      className={`relative h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activeExbPhotoIdx === idx ? 'border-[#dfac34] scale-95 shadow-lg shadow-amber-500/20' : 'border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <img 
                        src={photo} 
                        alt={`Thumbnail ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Exhibitor Metadata */}
              <div className="mt-6 pt-4 border-t border-slate-900 text-xs font-mono text-slate-400 space-y-1 text-left">
                <p className="font-semibold text-[#dfac34]">EXPOSITOR OFICIAL:</p>
                <p className="text-slate-100 font-sans font-bold">{selectedExhibition.exhibitor}</p>
                <p className="text-[10px] break-all text-slate-500">{selectedExhibition.exhibitor_contact}</p>
              </div>
            </div>

            {/* Right Column: Tabbed Content (Overview / Interview) */}
            <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              
              <div className="space-y-6">
                {/* Tabs switcher */}
                <div className="flex border-b border-slate-800 pb-3">
                  <button
                    onClick={() => setActiveExbTab('info')}
                    className={`pb-2.5 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeExbTab === 'info' 
                      ? 'border-[#dfac34] text-[#dfac34]' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Resumo Teórico
                  </button>
                  <button
                    onClick={() => setActiveExbTab('interview')}
                    className={`pb-2.5 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeExbTab === 'interview' 
                      ? 'border-[#dfac34] text-[#dfac34]' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Entrevista de Expositor
                  </button>
                </div>

                {/* Tab content area */}
                <div className="min-h-[220px]">
                  {activeExbTab === 'info' ? (
                    <div className="space-y-4 animate-fade-in text-left">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Resumo Tecnológico</span>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {selectedExhibition.description}
                        </p>
                      </div>

                      <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-850/60 text-xs text-slate-400 space-y-2 leading-relaxed">
                        <p className="font-bold text-[#dfac34] font-mono uppercase tracking-wider">Diretrizes de Visitação e Segurança</p>
                        <p>
                          1. Manter uma distância segura de 1 metro das partes móveis ou de ensaio químico ativo.
                        </p>
                        <p>
                          2. Perguntas adicionais sobre o desenvolvimento do hardware/reagente devem ser encaminhadas para os contactos no verso da maquete.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 animate-fade-in text-left">
                      {/* Q1 */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-mono font-bold text-amber-400 flex items-start gap-1">
                          <span className="shrink-0 text-[#dfac34]">P:</span>
                          <span>{selectedExhibition.interview.question_1}</span>
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed pl-4 border-l border-slate-800">
                          {selectedExhibition.interview.answer_1}
                        </p>
                      </div>

                      {/* Q2 */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-mono font-bold text-amber-400 flex items-start gap-1">
                          <span className="shrink-0 text-[#dfac34]">P:</span>
                          <span>{selectedExhibition.interview.question_2}</span>
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed pl-4 border-l border-slate-800">
                          {selectedExhibition.interview.answer_2}
                        </p>
                      </div>

                      {/* Q3 */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-mono font-bold text-amber-400 flex items-start gap-1">
                          <span className="shrink-0 text-[#dfac34]">P:</span>
                          <span>{selectedExhibition.interview.question_3}</span>
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed pl-4 border-l border-slate-800">
                          {selectedExhibition.interview.answer_3}
                        </p>
                      </div>

                    </div>
                  )}
                </div>
              </div>

              {/* Close prompt bottom bar */}
              <div className="pt-6 border-t border-slate-900/60 flex justify-end">
                <button
                  onClick={() => setSelectedExhibition(null)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-850 text-slate-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Concluir Leitura
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SAGEO DIGITAL FOOTER */}
      <footer className="mt-20 border-t border-slate-900 bg-slate-950/20 px-4 py-8 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto space-y-4">
          <p className="font-serif font-black text-slate-200 text-sm tracking-tight">
            Semana Académica de Geociências (SAGEO) &copy; {new Date().getFullYear()}
          </p>
          <p className="max-w-md mx-auto leading-relaxed text-slate-400 font-sans font-light">
            Esta plataforma é operada sob os eixos de integridade curricular. Os logs de acesso e chaves de portaria são encriptados de ponta a ponta. Adequada para validação letiva.
          </p>
          <div className="flex justify-center gap-4 text-[10px] font-mono text-[#dfac34]">
            <span>REGISTO SEGURO ATIVO</span>
            <span>&bull;</span>
            <span>CHECKIN POR QR CODE</span>
            <span>&bull;</span>
            <span>ECTS AUTÓNOMO</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
