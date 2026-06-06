import { Event, Registration, GalleryPost, WaitlistEntry } from './types';
import { INITIAL_EVENTS, INITIAL_GALLERY } from './data';

// LocalStorage Keys
const KEYS = {
  EVENTS: 'sageo_events',
  REGISTRATIONS: 'sageo_registrations',
  WAITLIST: 'sageo_waitlist',
  GALLERY: 'sageo_gallery',
  CURRENT_USER_NUM: 'sageo_current_user_num'
};

// ----------------------------------------------------
// SYNCHRONOUS CACHE / OFFLINE FALLBACK METHODS
// ----------------------------------------------------

export const getStoredEvents = (): Event[] => {
  const capTo45 = (evts: Event[]) => evts.map(e => ({ ...e, capacity: Math.min(45, e.capacity || 45) }));
  if (typeof window === 'undefined') return capTo45(INITIAL_EVENTS);
  const stored = localStorage.getItem(KEYS.EVENTS);
  if (!stored) {
    const adjusted = capTo45(INITIAL_EVENTS);
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(adjusted));
    return adjusted;
  }
  try {
    const parsed = JSON.parse(stored);
    return capTo45(Array.isArray(parsed) ? parsed : INITIAL_EVENTS);
  } catch (err) {
    return capTo45(INITIAL_EVENTS);
  }
};

export const saveStoredEvents = (events: Event[]) => {
  localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
};

export const getStoredRegistrations = (): Registration[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(KEYS.REGISTRATIONS);
  if (!stored) {
    const INITIAL_REGISTRATIONS: Registration[] = [
      {
        id: "reg-demo-1",
        event_id: "evt-1",
        first_name: "Rocélio",
        last_name: "Da Silva",
        student_number: "20220001",
        course: "Engenharia de Produção Industrial",
        institutional_email: "20220001@isptec.co.ao",
        secret_question: "Nome do teu primeiro animal?",
        secret_answer: "bobi",
        confirmation_token: "TOK-91402-A",
        token_expires_at: "2026-11-30T23:59:59Z",
        confirmed: true,
        qr_token: "SAGEO-A91402-1",
        checked_in: true,
        checked_in_at: "2026-11-23T09:45:00Z"
      },
      {
        id: "reg-demo-2",
        event_id: "evt-3",
        first_name: "Rocélio",
        last_name: "Da Silva",
        student_number: "20220001",
        course: "Engenharia de Produção Industrial",
        institutional_email: "20220001@isptec.co.ao",
        secret_question: "Nome do teu primeiro animal?",
        secret_answer: "bobi",
        confirmation_token: "TOK-91402-B",
        token_expires_at: "2026-11-30T23:59:59Z",
        confirmed: true,
        qr_token: "SAGEO-A91402-2",
        checked_in: false
      },
      {
        id: "reg-demo-3",
        event_id: "evt-2",
        first_name: "Ana",
        last_name: "Maria Sousa",
        student_number: "20220002",
        course: "Gestão Empresarial",
        institutional_email: "20220002@isptec.co.ao",
        secret_question: "Cidade onde nasceste?",
        secret_answer: "luanda",
        confirmation_token: "TOK-22002-A",
        token_expires_at: "2026-11-30T23:59:59Z",
        confirmed: true,
        qr_token: "SAGEO-AM22002",
        checked_in: true,
        checked_in_at: "2026-11-23T14:15:00Z"
      }
    ];
    localStorage.setItem(KEYS.REGISTRATIONS, JSON.stringify(INITIAL_REGISTRATIONS));
    return INITIAL_REGISTRATIONS;
  }
  return JSON.parse(stored);
};

export const saveStoredRegistrations = (regs: Registration[]) => {
  localStorage.setItem(KEYS.REGISTRATIONS, JSON.stringify(regs));
};

export const getStoredWaitlist = (): WaitlistEntry[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(KEYS.WAITLIST);
  return stored ? JSON.parse(stored) : [];
};

export const saveStoredWaitlist = (entries: WaitlistEntry[]) => {
  localStorage.setItem(KEYS.WAITLIST, JSON.stringify(entries));
};

export const getStoredGallery = (): GalleryPost[] => {
  if (typeof window === 'undefined') return INITIAL_GALLERY;
  const stored = localStorage.getItem(KEYS.GALLERY);
  if (!stored) {
    localStorage.setItem(KEYS.GALLERY, JSON.stringify(INITIAL_GALLERY));
    return INITIAL_GALLERY;
  }
  return JSON.parse(stored);
};

export const saveStoredGallery = (posts: GalleryPost[]) => {
  localStorage.setItem(KEYS.GALLERY, JSON.stringify(posts));
};

// ----------------------------------------------------
// REAL MULTI-USER BACKEND API METHODS (PROD CAPABLE) WITH LOCAL FALLBACKS
// ----------------------------------------------------

export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const res = await fetch("/api/events");
    if (!res.ok) throw new Error();
    const data = await res.json();
    saveStoredEvents(data);
    return data;
  } catch (err) {
    console.warn("Utilizando dados de eventos locais (Offline Mode / Netlify)");
    return getStoredEvents();
  }
};

export const fetchRegistrations = async (): Promise<Registration[]> => {
  try {
    const passcode = localStorage.getItem("sageo_temp_passcode") || "";
    const res = await fetch("/api/registrations", {
      headers: passcode ? { "x-sageo-passcode": passcode } : {}
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    saveStoredRegistrations(data);
    return data;
  } catch (err) {
    console.warn("Utilizando registros locais (Offline Mode / Netlify)");
    return getStoredRegistrations();
  }
};

export const fetchWaitlist = async (): Promise<WaitlistEntry[]> => {
  try {
    const res = await fetch("/api/waitlist");
    if (!res.ok) throw new Error();
    const data = await res.json();
    saveStoredWaitlist(data);
    return data;
  } catch (err) {
    console.warn("Utilizando lista de espera local (Offline Mode / Netlify)");
    return getStoredWaitlist();
  }
};

export const fetchGallery = async (): Promise<GalleryPost[]> => {
  try {
    const res = await fetch("/api/gallery");
    if (!res.ok) throw new Error();
    const data = await res.json();
    saveStoredGallery(data);
    return data;
  } catch (err) {
    console.warn("Utilizando galeria local (Offline Mode / Netlify)");
    return getStoredGallery();
  }
};

export const fetchAdminGallery = async (): Promise<GalleryPost[]> => {
  try {
    const passcode = localStorage.getItem("sageo_temp_passcode") || "";
    const res = await fetch("/api/admin/gallery", {
      headers: passcode ? { "x-sageo-passcode": passcode } : {}
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (err) {
    console.warn("Utilizando galeria local (Offline Mode / Netlify)");
    return getStoredGallery();
  }
};

export const approveGalleryPost = async (id: string): Promise<boolean> => {
  try {
    const passcode = localStorage.getItem("sageo_temp_passcode") || "";
    const res = await fetch("/api/admin/gallery/approve", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
         ...(passcode ? { "x-sageo-passcode": passcode } : {})
      },
      body: JSON.stringify({ id })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

export const rejectGalleryPost = async (id: string): Promise<boolean> => {
  try {
    const passcode = localStorage.getItem("sageo_temp_passcode") || "";
    const res = await fetch("/api/admin/gallery/reject", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
         ...(passcode ? { "x-sageo-passcode": passcode } : {})
      },
      body: JSON.stringify({ id })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
};

// Log mock helper
export const addLocalAuditLog = (action: string, details: string, status: "success" | "failed" | "info", studentNumber?: string, eventId?: string) => {
  try {
    const logsKey = 'sageo_local_audit_logs';
    const existing = localStorage.getItem(logsKey);
    const logs = existing ? JSON.parse(existing) : [];
    logs.push({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      status,
      studentNumber,
      eventId
    });
    localStorage.setItem(logsKey, JSON.stringify(logs));
  } catch (e) {
    console.error("Erro ao salvar log local:", e);
  }
};

// Email mock helper
export const saveSimulatedEmail = (email: any) => {
  try {
    const emailsKey = 'sageo_simulated_emails';
    const existing = localStorage.getItem(emailsKey);
    const emails = existing ? JSON.parse(existing) : [];
    emails.push(email);
    localStorage.setItem(emailsKey, JSON.stringify(emails));
  } catch (e) {
    console.error("Erro ao salvar e-mail simulado:", e);
  }
};

export const registerStudent = async (payload: {
  event_id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  course: string;
  institutional_email: string;
  secret_question: string;
  secret_answer: string;
  bypass_conflict?: boolean;
  lecturer_question?: string;
  youtube_link?: string;
}): Promise<{ status: "confirmed" | "waitlist" | "pending_confirmation"; registration?: Registration; entry?: WaitlistEntry; message?: string }> => {
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Fallback static environment");
      const errorData = await res.json();
      throw new Error(errorData.error || "Tentativa de inscrição falhada.");
    }
    return res.json();
  } catch (err: any) {
    // Transparent local storage fallback for Netlify static deployments
    console.warn("Activando simulador de registros em memoria local (Netlify/PWA)", err);
    
    const evts = getStoredEvents();
    const selectedEvent = evts.find(e => e.id === payload.event_id);
    if (!selectedEvent) {
      throw new Error("A atividade selecionada não existe.");
    }

    const cleanNum = payload.student_number.trim();
    const cleanMail = payload.institutional_email.trim().toLowerCase();
    const regs = getStoredRegistrations();

    // Check duplicate
    const duplicate = regs.some(
      r => {
        if (r.event_id !== payload.event_id || r.student_number.toLowerCase() !== cleanNum.toLowerCase()) return false;
        if (r.confirmed) return true;
        const isExpired = Date.now() > new Date(r.token_expires_at).getTime();
        return !isExpired;
      }
    );
    if (duplicate) {
      throw new Error("Este número de estudante já se inscreveu neste evento.");
    }

    // Overlapping
    const isOverlappingMock = (evt1: Event, evt2: Event) => {
      if (evt1.date !== evt2.date) return false;
      const parse = (t?: string) => {
        if (!t) return 0;
        const parts = t.split(":");
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
      };
      const s1 = parse(evt1.start_time);
      const e1 = parse(evt1.end_time || `${parseInt(evt1.start_time) + 2}:00`);
      const s2 = parse(evt2.start_time);
      const e2 = parse(evt2.end_time || `${parseInt(evt2.start_time) + 2}:00`);
      return (s1 < e2 && s2 < e1);
    };

    const overlappingConfirmed = regs.find(r => {
      if (r.student_number.toLowerCase() !== cleanNum.toLowerCase()) return false;
      if (!r.confirmed) return false;
      const otherEvt = evts.find(e => e.id === r.event_id);
      if (!otherEvt) return false;
      return isOverlappingMock(otherEvt, selectedEvent);
    });

    if (overlappingConfirmed && !payload.bypass_conflict) {
      const otherEvt = evts.find(e => e.id === overlappingConfirmed.event_id);
      throw new Error(`Conflito de Agenda detetado: Já tens uma inscrição CONFIRMADA na atividade "${otherEvt?.title}" no mesmo horário! Ativa o marcador de autorização de compromisso de honra se desejas prosseguir.`);
    }

    // Capacity checks
    const currentConfirmedCount = regs.filter(r => r.event_id === payload.event_id && r.confirmed).length;
    const isGeosciences = ['Engenharia de Petróleos', 'Geofísica'].includes(payload.course);
    const effectiveCapacity = isGeosciences ? (selectedEvent.capacity + 150) : selectedEvent.capacity;

    if (currentConfirmedCount >= effectiveCapacity) {
      // Simulate waitlist
      const waitlistEntry: WaitlistEntry = {
        id: `wait-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        event_id: payload.event_id,
        name: `${payload.first_name} ${payload.last_name}`,
        email: cleanMail,
        created_at: new Date().toISOString()
      };
      
      const waitlist = getStoredWaitlist();
      waitlist.push(waitlistEntry);
      saveStoredWaitlist(waitlist);

      addLocalAuditLog("WAITLIST_ADD", `Vagas esgotadas na atividade "${selectedEvent.title}". Aluno ${cleanNum} movido para lista de espera local.`, "info", cleanNum, payload.event_id);

      return {
        status: "waitlist",
        message: "Lamentamos, mas não temos mais vagas na base de dados. Foste colocado no topo da lista de espera com sucesso!",
        entry: waitlistEntry
      };
    }

    // Create pending registration
    const shortToken = `SAGEO-${Math.floor(10000 + Math.random() * 90000)}-${regs.length + 1}`;
    const newReg: Registration = {
      id: `reg-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      event_id: payload.event_id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      student_number: cleanNum,
      course: payload.course,
      institutional_email: cleanMail,
      secret_question: payload.secret_question,
      secret_answer: payload.secret_answer,
      confirmation_token: `TOK-${Math.floor(10000 + Math.random() * 90000)}`,
      token_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      confirmed: false,
      qr_token: shortToken,
      checked_in: false,
      lecturer_question: payload.lecturer_question,
      youtube_link: payload.youtube_link
    };

    regs.push(newReg);
    saveStoredRegistrations(regs);

    // Save mock email inside email simulator logs
    saveSimulatedEmail({
      to: cleanMail,
      subject: `🔗 CONFIRMAÇÃO OBRIGATÓRIA: Inscrição SAGEO - ${selectedEvent.title}`,
      token: newReg.confirmation_token,
      reg: newReg,
      event: selectedEvent,
      sent_at: new Date().toISOString()
    });

    addLocalAuditLog("REGISTRATION_CREATE", `Inscrição PENDENTE de ${newReg.first_name} ${newReg.last_name} (${newReg.student_number}) na atividade "${selectedEvent.title}" (Requer confirmação de e-mail)`, "info", cleanNum, payload.event_id);

    return {
      status: "pending_confirmation",
      registration: newReg
    } as any;
  }
};

export const confirmRegistrationToken = async (token: string): Promise<{ success: boolean; registration: Registration }> => {
  try {
    const res = await fetch("/api/registrations/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Fallback static environment");
      const errData = await res.json();
      throw new Error(errData.error || "Erro ao confirmar vaga.");
    }
    return res.json();
  } catch (err) {
    console.warn("Confirmando inscrição localmente no cliente (Offline Mode / Netlify)");
    
    const regs = getStoredRegistrations();
    const matched = regs.find(r => r.confirmation_token === token);
    if (!matched) {
      throw new Error("Código do Token de Confirmação inválido.");
    }

    if (matched.confirmed) {
      return { success: true, registration: matched };
    }

    // Overlap checks
    const evts = getStoredEvents();
    const currentEvent = evts.find(e => e.id === matched.event_id);
    if (currentEvent) {
      const isOverlappingMock = (evt1: Event, evt2: Event) => {
        if (evt1.date !== evt2.date) return false;
        const parse = (t?: string) => {
          if (!t) return 0;
          const parts = t.split(":");
          return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
        };
        const s1 = parse(evt1.start_time);
        const e1 = parse(evt1.end_time || `${parseInt(evt1.start_time) + 2}:00`);
        const s2 = parse(evt2.start_time);
        const e2 = parse(evt2.end_time || `${parseInt(evt2.start_time) + 2}:00`);
        return (s1 < e2 && s2 < e1);
      };

      const overlappingConf = regs.find(r => {
        if (r.student_number.toLowerCase() !== matched.student_number.toLowerCase()) return false;
        if (!r.confirmed) return false;
        if (r.id === matched.id) return false;

        const otherEvt = evts.find(e => e.id === r.event_id);
        if (!otherEvt) return false;
        return isOverlappingMock(otherEvt, currentEvent);
      });

      if (overlappingConf) {
        const otherEvt = evts.find(e => e.id === overlappingConf.event_id);
        throw new Error(`Confirmação Recusada: Já possuis uma presença CONFIRMADA para a atividade "${otherEvt?.title}" no mesmo horário!`);
      }
    }

    matched.confirmed = true;
    if (!matched.qr_token) {
      matched.qr_token = `SAGEO-${Math.floor(10000 + Math.random() * 90000)}-${matched.id.slice(-3)}`;
    }

    saveStoredRegistrations(regs);
    addLocalAuditLog("REGISTRATION_CONFIRM", `Inscrição de ${matched.first_name} ${matched.last_name} confirmada via e-mail clicado no cliente local.`, "success", matched.student_number, matched.event_id);

    return { success: true, registration: matched };
  }
};

export const cancelRegistration = async (registrationId: string, secretAnswer: string): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch("/api/registrations/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, secretAnswer })
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Fallback static environment");
      const errorData = await res.json();
      throw new Error(errorData.error || "Operação de cancelamento recusada.");
    }
    return res.json();
  } catch (err: any) {
    if (err.message !== "Fallback static environment") {
      throw err;
    }
    console.warn("Processando Cancelamento localmente (Offline Mode / Netlify)");

    const regs = getStoredRegistrations();
    const matchedIndex = regs.findIndex(r => r.id === registrationId);
    if (matchedIndex === -1) {
      throw new Error("A sua inscrição não foi localizada na base de dados do dispositivo.");
    }

    const matched = regs[matchedIndex];
    if (matched.secret_answer.toLowerCase().trim() !== secretAnswer.toLowerCase().trim()) {
      throw new Error("A Resposta Secreta à pergunta de segurança está incorreta!");
    }

    const studentNum = matched.student_number;
    const eventId = matched.event_id;
    const studentName = `${matched.first_name} ${matched.last_name}`;
    const evts = getStoredEvents();
    const selectedEvent = evts.find(e => e.id === eventId);
    const eventTitle = selectedEvent ? selectedEvent.title : "Atividade Desconhecida";

    regs.splice(matchedIndex, 1);
    saveStoredRegistrations(regs);

    addLocalAuditLog("REGISTRATION_CANCEL", `Inscrição cancelada voluntariamente por ${studentName} (${studentNum}) na atividade "${eventTitle}".`, "success", studentNum, eventId);

    return { success: true, message: "Inscrição cancelada com sucesso na base de dados do browser!" };
  }
};

export const checkInStudent = async (payload: {
  eventId: string;
  ticketCode: string;
  secretAnswer: string;
  bypassSecretQuestion?: boolean;
}): Promise<{ success: boolean; registration: Registration }> => {
  try {
    const passcode = localStorage.getItem("sageo_temp_passcode") || "";
    const res = await fetch("/api/check-in", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
         ...(passcode ? { "x-sageo-passcode": passcode } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Fallback static environment");
      const errorData = await res.json();
      throw new Error(errorData.error || "Check-in recusado.");
    }
    return res.json();
  } catch (err) {
    console.warn("Processando Check-in localmente (Offline Mode / Netlify)");

    const regs = getStoredRegistrations();
    const matched = regs.find(r => r.event_id === payload.eventId && r.qr_token === payload.ticketCode);
    if (!matched) {
      throw new Error("Não foi encontrada nenhuma inscrição para este evento com este código QR.");
    }

    if (!matched.confirmed) {
      throw new Error("Inscrição Recusada: O teu e-mail de pré-inscrição ainda não foi ativado com o código.");
    }

    if (matched.checked_in) {
      throw new Error("Bilhete Inválido: O check-in deste QR Code já foi realizado anteriormente para este evento!");
    }

    if (!payload.bypassSecretQuestion) {
      if (matched.secret_answer.toLowerCase().trim() !== payload.secretAnswer.toLowerCase().trim()) {
        throw new Error("Código Secreto incorreto. Check-in de segurança recusado!");
      }
    }

    matched.checked_in = true;
    matched.checked_in_at = new Date().toISOString();
    saveStoredRegistrations(regs);

    addLocalAuditLog("CHECK_IN_SUCCESS", `Check-in validado de ${matched.first_name} na atividade via validador local de QR-Code.`, "success", matched.student_number, payload.eventId);

    return { success: true, registration: matched };
  }
};

export const fetchDashboardStats = async (): Promise<{
  totalRegistrations: number;
  confirmedCount: number;
  checkedInCount: number;
  pendingCount: number;
  waitlistCount: number;
  occupancy: Array<{ eventId: string; title: string; capacity: number; booked: number; percent: number }>;
  recentLogs: Array<{ id: string; timestamp: string; action: string; details: string; status: string }>;
  supabaseStatus?: {
    initialized: boolean;
    urlExists: boolean;
    keyExists: boolean;
    syncActive: boolean;
    lastSyncTime: string;
    errors: string[];
  };
}> => {
  try {
    const passcode = localStorage.getItem("sageo_temp_passcode") || "";
    const res = await fetch("/api/dashboard-stats", {
      headers: passcode ? { "x-sageo-passcode": passcode } : {}
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch (err) {
    console.warn("Calculando estatísticas locais do painel (Offline Mode / Netlify)");
    const regs = getStoredRegistrations();
    const waitlist = getStoredWaitlist();
    const evts = getStoredEvents();

    const confirmed = regs.filter(r => r.confirmed);
    const checkedIn = regs.filter(r => r.checked_in);
    const pending = regs.filter(r => !r.confirmed);

    const occupancyMap = evts.map(e => {
      const booked = regs.filter(r => r.event_id === e.id && r.confirmed).length;
      return {
        eventId: e.id,
        title: e.title,
        capacity: e.capacity,
        booked,
        percent: Math.min(100, Math.round((booked / e.capacity) * 100))
      };
    });

    const logsKey = 'sageo_local_audit_logs';
    const localLogsStr = localStorage.getItem(logsKey);
    const localLogs = localLogsStr ? JSON.parse(localLogsStr) : [];

    const defaultLog = {
      id: "log-init-local",
      timestamp: new Date().toISOString(),
      action: "OFFLINE_LOCAL_DB",
      details: "Sistema a funcionar em sandbox local de alto rendimento totalmente reativo.",
      status: "info"
    };

    const combinedLogs = [...localLogs, defaultLog].slice(-15).reverse();

    return {
      totalRegistrations: regs.length,
      confirmedCount: confirmed.length,
      checkedInCount: checkedIn.length,
      pendingCount: pending.length,
      waitlistCount: waitlist.length,
      occupancy: occupancyMap,
      recentLogs: combinedLogs as any
    };
  }
};

export const addGalleryPostServer = async (payload: {
  event_id?: string;
  event_title?: string;
  title: string;
  description: string;
  image_url: string;
}): Promise<GalleryPost> => {
  try {
    const res = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Fallback static environment");
      const errorData = await res.json();
      throw new Error(errorData.error || "Partilha de foto falhada.");
    }
    return res.json();
  } catch (err) {
    console.warn("Salvando post na galeria local (Offline Mode / Netlify)");
    
    const gallery = getStoredGallery();
    const newPost: GalleryPost = {
      id: `gal-${Date.now()}`,
      event_id: payload.event_id,
      event_title: payload.event_title,
      title: payload.title,
      description: payload.description,
      image_url: payload.image_url,
      created_at: new Date().toISOString(),
      likes: 0
    };
    gallery.unshift(newPost);
    saveStoredGallery(gallery);
    addLocalAuditLog("GALLERY_UPLOAD", `Publicação adicionada à galeria do evento: "${payload.title}"`, "success");

    return newPost;
  }
};

export const addEventServer = async (payload: Partial<Event>): Promise<Event> => {
  try {
    const passcode = localStorage.getItem("sageo_temp_passcode") || "";
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
         ...(passcode ? { "x-sageo-passcode": passcode } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Fallback static environment");
      const errorData = await res.json();
      throw new Error(errorData.error || "Operação de atividade cancelada.");
    }
    return res.json();
  } catch (err) {
    console.warn("Adicionando atividade localmente (Offline Mode / Netlify)");
    
    const evts = getStoredEvents();
    const newEvt: Event = {
      id: payload.id || `evt-${Date.now()}`,
      title: payload.title || "Atividade sem título",
      description: payload.description || "Descrição padrão",
      lecturer: payload.lecturer || "Orador SAGEO",
      course: payload.course || "Engenharia de Produção Industrial",
      date: payload.date || "2026-11-23",
      start_time: payload.start_time || "09:00",
      end_time: payload.end_time || "10:30",
      location: payload.location || "Auditório",
      category: payload.category || "palestra",
      capacity: payload.capacity || 45,
      is_open: true,
      image_url: payload.image_url
    };
    evts.push(newEvt);
    saveStoredEvents(evts);
    addLocalAuditLog("EVENT_CREATE", `Nova atividade "${newEvt.title}" criada localmente pelo organizador.`, "success");

    return newEvt;
  }
};

export const deleteEventServer = async (id: string): Promise<boolean> => {
  try {
    const passcode = localStorage.getItem("sageo_temp_passcode") || "";
    const res = await fetch(`/api/events/${id}`, {
      method: "DELETE",
      headers: passcode ? { "x-sageo-passcode": passcode } : {}
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Fallback static environment");
      const errorData = await res.json();
      throw new Error(errorData.error || "Operação impossibilitada.");
    }
    return true;
  } catch (err) {
    console.warn("Excluindo atividade localmente (Offline Mode / Netlify)");
    
    const evts = getStoredEvents();
    const updated = evts.filter(e => e.id !== id);
    saveStoredEvents(updated);
    addLocalAuditLog("EVENT_DELETE", `Atividade com ID ${id} eliminada localmente na base de dados.`, "success");

    return true;
  }
};

export const resetServerDB = async (passcode: string): Promise<boolean> => {
  try {
    const res = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-sageo-passcode": passcode
      },
      body: JSON.stringify({ passcode })
    });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Fallback static environment");
      const errorData = await res.json();
      throw new Error(errorData.error || "Chave administrativa recusada.");
    }
    return true;
  } catch (err) {
    console.warn("Simulando reposição de base de dados (Offline Mode / Netlify)");
    if (passcode !== "SAGEO2026_MASTER_SYS") {
      throw new Error("Chave de reposição administrativa inválida!");
    }
    localStorage.removeItem('sageo_events');
    localStorage.removeItem('sageo_registrations');
    localStorage.removeItem('sageo_waitlist');
    localStorage.removeItem('sageo_gallery');
    localStorage.removeItem('sageo_local_audit_logs');
    addLocalAuditLog("DATABASE_RESET", "Base de dados local redefinida com sucesso para as sementes padrão.", "success");
    return true;
  }
};

export const sendCertificateEmailMock = async (payload: {
  to: string;
  subject: string;
  firstName: string;
  lastName: string;
  eventName: string;
  certificateImage: string;
}): Promise<{ status: "simulated" | "sent" }> => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error("Static Fallback");
      const body = await response.json();
      throw new Error(body.error || body.message);
    }
    return response.json();
  } catch (err) {
    console.warn("Certificado simulado enviado com sucesso (Netlify/PWA offline).");
    return { status: "simulated" };
  }
};

// ----------------------------------------------------
// UTILITY METHODS
// ----------------------------------------------------

// Export table to CSV data-uri
export const exportToCSV = (headers: string[], rows: string[][], filename: string) => {
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Simple pseudo hash to simulate secure verification without heavy client modules
export const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

// Helper to format category labels in Portuguese with beautiful colors
export const getCategoryBadge = (category: Event['category']) => {
  switch (category) {
    case 'grande_exposicao':
      return { label: 'Grande Exposição', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
    case 'mini_curso':
      return { label: 'Mini-Curso', bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
    case 'empresa':
      return { label: 'Empresas & Carreira', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    case 'exposicao':
      return { label: 'Exposição Técnica', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'festival':
      return { label: 'Festival SAGEO', bg: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30' };
    case 'mesa_redonda':
      return { label: 'Mesa Redonda', bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' };
    case 'concurso':
      return { label: 'Concurso', bg: 'bg-teal-500/15 text-teal-400 border-teal-500/30' };
    case 'workshop':
      return { label: 'Workshop', bg: 'bg-pink-500/15 text-pink-400 border-pink-500/30' };
    case 'debate':
      return { label: 'Debate', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
    case 'aula_magna':
      return { label: 'Aula Magna', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    case 'palestra':
      return { label: 'Palestra', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    default:
      return { label: 'Atividade', bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
  }
};

export const getCourseAcronymAndColor = (courseName: string = "") => {
  const name = courseName.trim();
  switch (true) {
    case /Civil/i.test(name):
      return { acronym: "ECV", bg: "bg-sky-500/15 text-sky-400 border-sky-500/30" };
    case /Electrot/i.test(name):
      return { acronym: "EELT", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    case /Inform/i.test(name):
      return { acronym: "EINF", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    case /Mec/i.test(name):
      return { acronym: "EMC", bg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" };
    case /Qu[íi]m/i.test(name):
      return { acronym: "EQM", bg: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
    case /Produ/i.test(name):
      return { acronym: "EPI", bg: "bg-violet-500/15 text-violet-400 border-violet-500/30" };
    case /Petr/i.test(name):
      return { acronym: "EPET", bg: "bg-rose-500/15 text-rose-400 border-rose-500/30" };
    case /Geof/i.test(name):
      return { acronym: "GEOF", bg: "bg-teal-500/15 text-teal-400 border-teal-500/30" };
    case /Econ/i.test(name):
      return { acronym: "ECON", bg: "bg-green-500/15 text-green-400 border-green-500/30" };
    case /Cont/i.test(name):
      return { acronym: "CONT", bg: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30" };
    case /Gest/i.test(name):
      return { acronym: "GES", bg: "bg-lime-500/15 text-lime-400 border-lime-500/30" };
    default:
      return { acronym: "SAGEO", bg: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
  }
};
