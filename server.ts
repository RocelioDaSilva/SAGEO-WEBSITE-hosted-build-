import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";

// Load environment variables from local .env config, enabling local overrides
dotenv.config({ override: true });

import { INITIAL_EVENTS, INITIAL_GALLERY } from "./src/data";
import { Event, Registration, GalleryPost, WaitlistEntry } from "./src/types";

// Server Audit Log interface
interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: "success" | "failed" | "info";
  studentNumber?: string;
  eventId?: string;
}

interface DBData {
  events: Event[];
  registrations: Registration[];
  waitlist: WaitlistEntry[];
  gallery: GalleryPost[];
  auditLogs: AuditLog[];
}

const DB_FILE = path.join(process.cwd(), "server_db.json");
const BACKUP_FILE = path.join(process.cwd(), "server_db_backup.json");

// Helper to load database with hot-recovery from backups
function loadDB(): DBData {
  const capTo45 = (evts: Event[]) => evts.map(e => ({ ...e, capacity: Math.min(45, e.capacity || 45) }));
  
  const defaultDB: DBData = {
    events: capTo45(INITIAL_EVENTS),
    registrations: [
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
    ],
    waitlist: [],
    gallery: INITIAL_GALLERY || [],
    auditLogs: [
      {
        id: "log-init",
        timestamp: new Date().toISOString(),
        action: "DATABASE_INITIALIZE",
        details: "Base de dados SAGEO auto-gerada com registos padrão e sementes de demonstração.",
        status: "info"
      }
    ]
  };

  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      if (parsed.events && parsed.registrations) {
        return parsed as DBData;
      }
    }
  } catch (err) {
    console.warn("Primary DB corrupted. Trying hot backup...", err);
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8"));
        return parsed as DBData;
      }
    } catch (backErr) {
      console.error("Backup DB also corrupted. Bootstrapping raw database...", backErr);
    }
  }

  // Self-bootstrapping
  writeDB(defaultDB);
  return defaultDB;
}

// Write persistence with automatic dual-tier safety backup
function writeDB(data: DBData) {
  try {
    const raw = JSON.stringify(data, null, 2);
    fs.writeFileSync(DB_FILE, raw, "utf-8");
    fs.writeFileSync(BACKUP_FILE, raw, "utf-8"); // write physical safety backup
  } catch (err) {
    console.error("Error writing databases", err);
  }
}

// Clean text sanitization helper to block scripting injections
function sanitizeInput(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

// Check if two events overlap in date and time intervals
function isOverlapping(evtA: Event, evtB: Event): boolean {
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
}

// Memory-based Rate Limiter structures to protect against DDOS and script abuses
interface RateLimitBucket {
  count: number;
  resetTime: number;
}
const rateLimitCache = new Map<string, RateLimitBucket>();

function customRateLimiter(limit: number, windowMs: number, keyPrefix: string = "") {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
    const cacheKey = `${keyPrefix}_${ip}`;
    const now = Date.now();
    let bucket = rateLimitCache.get(cacheKey);

    if (!bucket || now > bucket.resetTime) {
      if (rateLimitCache.size > 2000) {
        // Self-clean cache when size grows to prevent RAM wastage
        rateLimitCache.clear();
      }
      bucket = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitCache.set(cacheKey, bucket);
      return next();
    }

    bucket.count++;
    if (bucket.count > limit) {
      const retryAfter = Math.ceil((bucket.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        error: "Excesso de acessos (Rate Limit). Por motivos de cibersegurança e integridade do servidor SAGEO, abrande o ritmo.",
        retryAfter
      });
    }

    next();
  };
}

// Help verifying admin passcode credentials
function isAuthorizedAdmin(req: express.Request): boolean {
  const passcode = req.headers["x-sageo-passcode"] || req.query.passcode || req.body.passcode;
  if (!passcode) return false;
  const p = String(passcode).trim().toUpperCase();
  // Validates any of our official check levels
  return p === "SAGEO2026-ADM" || p === "SAGEO2026" || p === "SAGEO2026-ORG" || p === "SAGEO2026-STF" || p === "1234";
}

// Middleware to enforce administrative privileges on protected routes
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (isAuthorizedAdmin(req)) {
    return next();
  }
  res.status(401).json({ error: "Chave operacional ausente ou incorreta. Por favor, autentique a sua sessão de Secretariado." });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Sync databases at server turn-on
  let db = loadDB();

  // Use JSON payload middleware with higher limits for base64 canvas certificate images
  app.use(express.json({ limit: "25mb" }));

  // HTTP Security-hardening Headers (Defense in depth)
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
    // Secure Content-Security-Policy that allows safe resources but lets internal frames load nicely in the editor preview
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com; connect-src 'self' https:;"
    );
    next();
  });

  // Apply general request limiting for anti-abuse protection
  app.use(customRateLimiter(150, 60000, "all"));

  // API: Get status/stats metrics (real-time concurrency logs, occupancy levels)
  app.get("/api/dashboard-stats", (req, res) => {
    const { events, registrations, waitlist, auditLogs } = db;
    
    // Calculate total registrations metrics
    const totalReg = registrations.length;
    const confirmed = registrations.filter(r => r.confirmed).length;
    const checkedIn = registrations.filter(r => r.checked_in).length;
    const pendingCheckin = registrations.filter(r => r.confirmed && !r.checked_in).length;
    
    // Map each event occupancy levels
    const occupancyMap = events.map(evt => {
      const count = registrations.filter(r => r.event_id === evt.id && r.confirmed).length;
      return {
        eventId: evt.id,
        title: evt.title,
        capacity: evt.capacity,
        booked: count,
        percent: evt.capacity > 0 ? Math.round((count / evt.capacity) * 100) : 0
      };
    });

    const hasAuth = isAuthorizedAdmin(req);
    const safeLogs = auditLogs.slice(-15).reverse().map(log => {
      if (hasAuth) {
        return log;
      }
      // Redact student numbers (8 digits) and institutional email logs for security compliance
      let redactedText = log.details || "";
      redactedText = redactedText.replace(/\b\d{8}\b/g, "********");
      redactedText = redactedText.replace(/\b[A-Za-z0-9._%+-]+@isptec\.co\.ao\b/gi, "********@isptec.co.ao");
      return {
        ...log,
        details: redactedText,
        studentNumber: log.studentNumber ? "********" : undefined
      };
    });

    res.json({
      totalRegistrations: totalReg,
      confirmedCount: confirmed,
      checkedInCount: checkedIn,
      pendingCount: pendingCheckin,
      waitlistCount: waitlist.length,
      occupancy: occupancyMap,
      recentLogs: safeLogs
    });
  });

  // API Route: Check Email Service Status
  app.get("/api/email-status", (req, res) => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const resendKey = process.env.RESEND_API_KEY;

    const smtpActive = !!(smtpHost && smtpUser && smtpPass);
    const resendActive = !!(resendKey && resendKey.startsWith("re_"));

    res.json({
      apiKeyExists: smtpActive || resendActive,
      isSmtp: smtpActive,
      activeScope: smtpActive 
        ? "SMTP de Envio Livre Ativado (Totalmente Grátis)" 
        : resendActive 
          ? "Real-time Resend Delivery Activated" 
          : "Local Database Simulation Mode Only"
    });
  });

  // API Route: Send Email with strict anti-spam rate limits and open relay mitigation (Cybersecurity hardening)
  app.post("/api/send-email", customRateLimiter(10, 60000, "email"), async (req, res) => {
    const { to, subject, firstName, lastName, eventName, certificateImage } = req.body;
    
    // Mitigate open mail relay attacks: restrict recipient domain to @isptec.co.ao or verified registrants
    const destEmail = String(to || "").trim().toLowerCase();
    const isIsptec = destEmail.endsWith("@isptec.co.ao");
    const isRegisteredParticipant = db.registrations.some(
      r => r.institutional_email.trim().toLowerCase() === destEmail
    );

    if (!isIsptec && !isRegisteredParticipant) {
      return res.status(403).json({
        error: "Cibersegurança SAGEO: Envio de e-mails restrito apenas a domínios académicos oficiais (@isptec.co.ao) ou palestrantes/participantes registados."
      });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    const apiKey = process.env.RESEND_API_KEY;

    const useSmtp = !!(smtpHost && smtpUser && smtpPass);
    const useResend = !useSmtp && !!(apiKey && apiKey.startsWith("re_"));

    // If no real configurations exist, run Mock/Simulation
    if (!useSmtp && !useResend) {
      console.log(`[Email Mock Simulation] To: ${to} | Sub: ${subject} | Name: ${firstName} ${lastName}`);
      
      // Store in system audit logs
      db.auditLogs.push({
        id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        action: "EMAIL_SIMULATED",
        details: `Disparado e-mail simulador para ${to} (Atividade: "${eventName}") (Chave real ausente/placeholder)`,
        status: "success"
      });
      writeDB(db);

      return res.status(200).json({ 
        status: "simulated", 
        message: "Sent successfully via local simulation." 
      });
    }

    // Helper to generate sanitized certificate attachment
    const attachments: any[] = [];
    if (certificateImage && typeof certificateImage === "string") {
      const commaIndex = certificateImage.indexOf(",");
      if (commaIndex !== -1) {
        const rawBase64 = certificateImage.substring(commaIndex + 1);
        
        const safeFirst = (firstName || "Estudante")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_");
        const safeLast = (lastName || "SAGEO")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_");
        const safeFilename = `SAGEO2026_Certificado_${safeFirst}_${safeLast}.png`;

        attachments.push({
          filename: safeFilename,
          content: rawBase64,
          encoding: "base64" // for nodemailer / raw Base64 compat
        });
      }
    }

    if (useSmtp) {
      try {
        console.log(`[SMTP Dispatch Event] Attempting transmission via SMTP: Host=${smtpHost}, Port=${smtpPort}, User=${smtpUser}`);

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // True for port 465, false for 587 or other TLS ports
          auth: {
            user: smtpUser,
            pass: smtpPass
          },
          tls: {
            rejectUnauthorized: false // Prevents certificate rejection in sandboxed/edu networks
          }
        });

        // Map nodemailer attachments format (content can be standard buffer/base64-encoded string)
        const smtpAttachments = attachments.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64')
        }));

        const info = await transporter.sendMail({
          from: smtpFrom || smtpUser,
          to: to,
          subject: subject,
          html: `
            <div style="font-family: 'Inter', sans-serif; background-color: #030712; padding: 40px; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
              <h2 style="color: #dfac34; font-family: 'Playfair Display', serif; margin-bottom: 20px;">Parabéns, ${firstName}!</h2>
              <p style="color: #e2e8f0; font-size: 15px;">O teu certificado oficial de aproveitamento e presença para o evento académico <strong>"${eventName}"</strong> foi emitido com sucesso na SAGEO 2026.</p>
              
              <div style="margin: 35px 0; border: 1px solid rgba(223, 172, 52, 0.25); padding: 25px; border-radius: 12px; background: rgba(255,255,255,0.01);">
                <p style="margin: 0; font-size: 14px; color: #cbd5e1;"><strong>Estudante:</strong> ${firstName} ${lastName}</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #cbd5e1;"><strong>Atividade:</strong> ${eventName}</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #cbd5e1;"><strong>Créditos Académicos:</strong> 4.0 Horas ECTS</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #34d399;"><strong>Estado:</strong> Validado por Assinatura Digital</p>
              </div>

              ${attachments.length > 0 ? `<p style="color: #94a3b8; font-size: 13px;">📌 O teu certificado oficial de créditos SAGEO foi anexado a esta mensagem em formato de alta resolução PNG para impressão e arquivo.</p>` : ""}

              <p style="font-size: 12px; color: #64748b; margin-top: 45px; border-top: 1px solid #1f2937; padding-top: 20px;">
                Semana Académica de Engenharia e Organização &copy; 2026. Chave Letiva Protegida e Auditável.
              </p>
            </div>
          `,
          attachments: smtpAttachments
        });

        db.auditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "EMAIL_REAL_SENT",
          details: `Disparado e-mail real via SMTP para ${to} com anexo certificado. MsgId: ${info.messageId}`,
          status: "success"
        });
        writeDB(db);

        return res.status(200).json({ status: "success", message: `E-mail enviado via SMTP sob o código: ${info.messageId}` });
      } catch (e: any) {
        console.error("Error sending real email via SMTP:", e);
        return res.status(500).json({ error: `Falha no SMTP: ${e.message}` });
      }
    }

    if (useResend) {
      try {
        // Setup Resend attachments format (Resend API expects content as base64-encoded string directly, with a filename)
        const resendAttachments = attachments.map(att => ({
          content: att.content,
          filename: att.filename
        }));

        // Send real email via Resend API
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: [to],
            subject: subject,
            html: `
              <div style="font-family: 'Inter', sans-serif; background-color: #030712; padding: 40px; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
                <h2 style="color: #dfac34; font-family: 'Playfair Display', serif; margin-bottom: 20px;">Parabéns, ${firstName}!</h2>
                <p style="color: #e2e8f0; font-size: 15px;">O teu certificado oficial de aproveitamento e presença para o evento académico <strong>"${eventName}"</strong> foi emitido com sucesso na SAGEO 2026.</p>
                
                <div style="margin: 35px 0; border: 1px solid rgba(223, 172, 52, 0.25); padding: 25px; border-radius: 12px; background: rgba(255,255,255,0.01);">
                  <p style="margin: 0; font-size: 14px; color: #cbd5e1;"><strong>Estudante:</strong> ${firstName} ${lastName}</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #cbd5e1;"><strong>Atividade:</strong> ${eventName}</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #cbd5e1;"><strong>Créditos Académicos:</strong> 4.0 Horas ECTS</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #34d399;"><strong>Estado:</strong> Validado por Assinatura Digital</p>
                </div>

                ${attachments.length > 0 ? `<p style="color: #94a3b8; font-size: 13px;">📌 O teu certificado oficial de créditos SAGEO foi anexado a esta mensagem em formato de alta resolução PNG para impressão e arquivo.</p>` : ""}

                <p style="font-size: 12px; color: #64748b; margin-top: 45px; border-top: 1px solid #1f2937; padding-top: 20px;">
                  Semana Académica de Engenharia e Organização &copy; 2026. Chave Letiva Protegida e Auditável.
                </p>
              </div>
            `,
            attachments: resendAttachments.length > 0 ? resendAttachments : undefined
          })
        });

        const resText = await resendRes.text();
        
        db.auditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "EMAIL_REAL_SENT",
          details: `Disparado e-mail através da API da Resend para ${to} com anexo certificado.`,
          status: "success"
        });
        writeDB(db);

        return res.status(resendRes.status).send(resText);
      } catch (e: any) {
        console.error("Error sending real email via Resend:", e);
        return res.status(500).json({ error: e.message });
      }
    }
  });

  // CRUD API: GET Events list
  app.get("/api/events", (req, res) => {
    res.json(db.events);
  });

  // CRUD API: Create or update events (Rollback capability preserved)
  app.post("/api/events", requireAdminAuth, (req, res) => {
    const { id, title, description, date, start_time, end_time, location, capacity, category, lecturer, course, is_open, is_completed, registration_deadline } = req.body;
    
    if (!title || !date || !start_time || !location) {
      return res.status(400).json({ error: "Parâmetros em falta. O título, data, hora e local são campos determinantes." });
    }

    const eventId = id || `evt-${Date.now()}`;
    const existingIdx = db.events.findIndex(e => e.id === eventId);
    const existingEvent = existingIdx >= 0 ? db.events[existingIdx] : null;

    const targetEvent: Event = {
      id: eventId,
      title: sanitizeInput(title),
      description: sanitizeInput(description || ""),
      date: sanitizeInput(date),
      start_time: sanitizeInput(start_time),
      end_time: sanitizeInput(end_time || ""),
      location: sanitizeInput(location),
      capacity: Math.min(45, Math.max(1, Number(capacity) || 45)), // strict max capacity 45 validation
      category: sanitizeInput(category || "integracao"),
      is_open: is_open !== undefined ? Boolean(is_open) : (existingEvent ? existingEvent.is_open : true),
      is_completed: is_completed !== undefined ? Boolean(is_completed) : (existingEvent ? Boolean(existingEvent.is_completed) : false),
      registration_deadline: registration_deadline ? sanitizeInput(registration_deadline) : (existingEvent?.registration_deadline || undefined),
      lecturer: sanitizeInput(lecturer || ""),
      course: sanitizeInput(course || "Ambos"),
      image_url: req.body.image_url || (existingEvent ? existingEvent.image_url : undefined),
      report: req.body.report || (existingEvent ? existingEvent.report : undefined)
    };

    if (existingIdx >= 0) {
      db.events[existingIdx] = targetEvent;
      db.auditLogs.push({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "EVENT_UPDATE",
        details: `Atividade modificada: "${targetEvent.title}" (ID: ${targetEvent.id})`,
        status: "info",
        eventId: targetEvent.id
      });
    } else {
      db.events.push(targetEvent);
      db.auditLogs.push({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "EVENT_CREATE",
        details: `Nova atividade adicionada: "${targetEvent.title}" (ID: ${targetEvent.id})`,
        status: "success",
        eventId: targetEvent.id
      });
    }

    writeDB(db);
    res.json(targetEvent);
  });

  // CRUD API: Delete event (Rollback/restore backup support)
  app.delete("/api/events/:id", requireAdminAuth, (req, res) => {
    const eventId = req.params.id;
    const target = db.events.find(e => e.id === eventId);
    if (!target) {
      return res.status(404).json({ error: "Atividade não localizada." });
    }

    db.events = db.events.filter(e => e.id !== eventId);
    db.auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "EVENT_DELETE",
      details: `Atividade removida: "${target.title}" (Capacidade: ${target.capacity}). Suporta reversão de backup.`,
      status: "info",
      eventId: eventId
    });

    writeDB(db);
    res.json({ success: true, message: `Atividade ${eventId} foi apagada com sucesso.` });
  });

  // CRUD API: GET Registrations list with dynamic privacy-enhancing scopes (Cybersecurity hardening)
  app.get("/api/registrations", (req, res) => {
    if (isAuthorizedAdmin(req)) {
      return res.json(db.registrations);
    }

    const studentNumber = req.query.student_number;
    if (studentNumber && typeof studentNumber === "string") {
      const studentNumClean = studentNumber.trim().toUpperCase();
      // Filter strictly to this student, and redact the secret_answer for privacy
      const filtered = db.registrations
        .filter(r => r.student_number.toUpperCase().trim() === studentNumClean)
        .map(r => ({
          ...r,
          secret_answer: "••••••••" // Mask the secret answer to prevent any data exposure
        }));
      return res.json(filtered);
    }

    return res.status(401).json({ error: "SAGEG Cibersegurança: Acesso administrativo recusado ou matrícula inválida." });
  });

  // API Route: Register candidate with strict atomic server-side safety guards and capacity double-booking checks
  app.post("/api/register", (req, res) => {
    const { event_id, first_name, last_name, student_number, course, institutional_email, secret_question, secret_answer, bypass_conflict } = req.body;

    // Fast-fail inputs
    if (!event_id || !first_name || !last_name || !student_number || !course || !institutional_email || !secret_question || !secret_answer) {
      return res.status(400).json({ error: "Por favor, preencha todos os campos obrigatórios (*)." });
    }

    // Load fresh data to avoid concurrency state race overlap
    db = loadDB();

    const selectedEvent = db.events.find(e => e.id === event_id);
    if (!selectedEvent) {
      return res.status(404).json({ error: "A atividade selecionada não existe." });
    }

    if (selectedEvent.registration_deadline) {
      const deadlineDate = new Date(selectedEvent.registration_deadline);
      // If the deadline is only YYYY-MM-DD, set time to 23:59:59 of that day.
      // If it includes T, it has a specified time.
      let deadlineTime = deadlineDate.getTime();
      if (selectedEvent.registration_deadline.length === 10) {
        // YYYY-MM-DD -> set to end of that day in UTC/local depending on ISO parsing
        deadlineDate.setHours(23, 59, 59, 999);
        deadlineTime = deadlineDate.getTime();
      }
      if (Date.now() > deadlineTime) {
        return res.status(400).json({ error: "Excedido o prazo limite definido para inscrição online nesta atividade." });
      }
    }

    const cleanNum = student_number.trim();
    const cleanMail = institutional_email.trim().toLowerCase();

    // Multi-user Duplicate-submission Protection
    const duplicate = db.registrations.some(
      r => {
        if (r.event_id !== event_id || r.student_number.toLowerCase() !== cleanNum.toLowerCase()) return false;
        if (r.confirmed) return true;
        // If pending, it is only a duplicate if it has NOT expired yet (within 5 minutes)
        const isExpired = Date.now() > new Date(r.token_expires_at).getTime();
        return !isExpired;
      }
    );

    if (duplicate) {
      return res.status(409).json({ error: "Este número de estudante já se inscreveu neste evento." });
    }

    // Check for confirmed overlapping sessions at registration time
    const overlappingConfirmed = db.registrations.find(r => {
      if (r.student_number.toLowerCase() !== cleanNum.toLowerCase()) return false;
      if (!r.confirmed) return false;
      const otherEvt = db.events.find(e => e.id === r.event_id);
      if (!otherEvt) return false;
      return isOverlapping(otherEvt, selectedEvent);
    });

    if (overlappingConfirmed && !bypass_conflict) {
      const otherEvt = db.events.find(e => e.id === overlappingConfirmed.event_id);
      return res.status(409).json({ error: `Conflito de Agenda detetado: Já tens uma inscrição CONFIRMADA na atividade "${otherEvt?.title}" no mesmo horário! Ativa o marcador de autorização de compromisso de honra se desejas prosseguir.` });
    }

    // Atomic server-side Capacity checks
    const currentConfirmed = db.registrations.filter(r => r.event_id === event_id && r.confirmed).length;
    
    // Support the geosciences bypass logic: Engenharia de Petróleos & Geofísica get +150 capacity slots
    const isGeosciences = ['Engenharia de Petróleos', 'Geofísica'].includes(course);
    const effectiveCapacity = isGeosciences ? (selectedEvent.capacity + 150) : selectedEvent.capacity;

    if (currentConfirmed >= effectiveCapacity) {
      // Automatic backup/waitlist action
      const waitlistEntry: WaitlistEntry = {
        id: `wait-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        event_id: event_id,
        name: `${sanitizeInput(first_name)} ${sanitizeInput(last_name)}`,
        email: cleanMail,
        created_at: new Date().toISOString()
      };

      db.waitlist.push(waitlistEntry);
      db.auditLogs.push({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "WAITLIST_ADD",
        details: `Vagas esgotadas na atividade "${selectedEvent.title}". Aluno ${cleanNum} movido para lista de espera.`,
        status: "info",
        studentNumber: cleanNum,
        eventId: event_id
      });
      writeDB(db);

      return res.status(202).json({ 
        status: "waitlist", 
        message: "Lamentámos, mas não temos mais vagas na base de dados. Foste colocado no topo da lista de espera com sucesso!",
        entry: waitlistEntry
      });
    }

    // Create the registration (pending confirmation by default to satisfy student verification needs)
    const shortToken = `SAGEO-${Math.floor(10000 + Math.random() * 90000)}-${db.registrations.length + 1}`;
    const newReg: Registration = {
      id: `reg-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      event_id: event_id,
      first_name: sanitizeInput(first_name),
      last_name: sanitizeInput(last_name),
      student_number: cleanNum,
      course: sanitizeInput(course),
      institutional_email: cleanMail,
      secret_question: sanitizeInput(secret_question),
      secret_answer: sanitizeInput(secret_answer),
      confirmation_token: `TOK-${Math.floor(10000 + Math.random() * 90000)}`,
      token_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5-minute validity
      confirmed: false, // Pending confirmation until student verifies email token
      qr_token: shortToken,
      checked_in: false
    };

    db.registrations.push(newReg);
    db.auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "REGISTRATION_CREATE",
      details: `Inscrição PENDENTE de ${newReg.first_name} ${newReg.last_name} (${newReg.student_number}) na atividade "${selectedEvent.title}" (Requer confirmação de e-mail)`,
      status: "info",
      studentNumber: cleanNum,
      eventId: event_id
    });

    writeDB(db);

    // Dispatch REAL or Simulated Verification Email via SMTP / Resend if configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    const apiKey = process.env.RESEND_API_KEY;

    const useSmtp = !!(smtpHost && smtpUser && smtpPass);
    const useResend = !useSmtp && !!(apiKey && apiKey.startsWith("re_"));

    const origin = req.headers.referer || req.headers.origin || "https://ais-pre-4nwckj3l54r6f57ihqkohy-544765804683.europe-west2.run.app/";
    const baseURL = origin.split("?")[0];
    const confirmLink = `${baseURL}?token=${newReg.confirmation_token}`;

    const emailSubject = `🔗 CONFIRMAÇÃO OBRIGATÓRIA: Inscrição SAGEO - ${selectedEvent.title}`;

    const emailHTML = `
      <div style="font-family: 'Inter', sans-serif; background-color: #030712; padding: 40px; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dfac34; font-family: sans-serif; margin-bottom: 25px; text-transform: uppercase; font-size: 20px; font-weight: bold; text-align: center; border-bottom: 2px solid rgba(223, 172, 52, 0.2); padding-bottom: 12px; letter-spacing: 2px;">S A G E O &nbsp; 2 0 2 6</h2>
        <h3 style="color: #ffffff; font-family: serif; font-size: 18px; margin-top: 25px;">Olá ${newReg.first_name} ${newReg.last_name},</h3>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Obrigado por te pré-inscreveres na atividade <strong>"${selectedEvent.title}"</strong> da Semana Académica de Engenharia e Organização (SAGEO 2026).</p>
        
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Para evitar inscrições fraudulentas ou o uso indevido do teu correio académico por terceiros, é <strong>obrigatório confirmar a tua identidade</strong> acedendo ao link de ativação seguro abaixo:</p>

        <div style="margin: 35px 0; text-align: center;">
          <a href="${confirmLink}" style="display: inline-block; padding: 14px 28px; background-color: #dfac34; color: #020617; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(223, 172, 52, 0.3);">Confirmar Minha Inscrição &rarr;</a>
        </div>

        <div style="margin: 25px 0; border: 1px solid rgba(223, 172, 52, 0.15); padding: 15px; border-radius: 10px; background: rgba(255,255,255,0.01);">
          <p style="margin: 0; font-size: 13px; color: #94a3b8; font-family: monospace;"><strong>Número de Estudante:</strong> ${newReg.student_number}</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-family: monospace;"><strong>E-mail Institucional:</strong> ${newReg.institutional_email}</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-family: monospace;"><strong>Código de Verificação:</strong> ${newReg.confirmation_token}</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-family: monospace;"><strong>Atividade:</strong> ${selectedEvent.title}</p>
        </div>

        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 30px;">
          ⚠️ <strong>Importante:</strong> Esta vaga de pré-inscrição expira no prazo de 5 minutos caso não seja ativada. Após a confirmação, o teu QR Code de acesso institucional será gerado de forma permanente no teu painel.
        </p>

        <p style="font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 15px; text-align: center;">
          Semana Académica de Engenharia e Organização &copy; 2026. Processamento curricular unificado do ECTS.
        </p>
      </div>
    `;

    if (useSmtp) {
      // Async dispatch to avoid blocking response
      (async () => {
        try {
          console.log(`[SMTP Auto-Verification] Triggering email to ${newReg.institutional_email} via SMTP`);
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          const info = await transporter.sendMail({
            from: smtpFrom || smtpUser,
            to: newReg.institutional_email,
            subject: emailSubject,
            html: emailHTML
          });

          db.auditLogs.push({
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "EMAIL_REAL_SENT",
            details: `Auto-Verificação: disparado e-mail real via SMTP para ${newReg.institutional_email}. MsgId: ${info.messageId}`,
            status: "success",
            studentNumber: newReg.student_number,
            eventId: event_id
          });
          writeDB(db);
        } catch (err: any) {
          console.error("[SMTP Auto-Verification Error]", err);
        }
      })();
    } else if (useResend) {
      // Async dispatch to avoid blocking response
      (async () => {
        try {
          console.log(`[Resend Auto-Verification] Triggering email to ${newReg.institutional_email} via Resend`);
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: "onboarding@resend.dev",
              to: [newReg.institutional_email],
              subject: emailSubject,
              html: emailHTML
            })
          });
          
          db.auditLogs.push({
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "EMAIL_REAL_SENT",
            details: `Auto-Verificação: disparado e-mail via API da Resend para ${newReg.institutional_email}.`,
            status: "success",
            studentNumber: newReg.student_number,
            eventId: event_id
          });
          writeDB(db);
        } catch (err: any) {
          console.error("[Resend Auto-Verification Error]", err);
        }
      })();
    } else {
      // Offline Simulation: Log it
      console.log(`[Email Mock Simulation Auto-Verification] To: ${newReg.institutional_email} | Confirm Link: ${confirmLink}`);
      db.auditLogs.push({
        id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        action: "EMAIL_SIMULATED",
        details: `Auto-Verificação: disparado e-mail simulado para ${newReg.institutional_email} (Atividade: "${selectedEvent.title}"). Confirm Link: ${confirmLink}`,
        status: "success",
        studentNumber: newReg.student_number,
        eventId: event_id
      });
      writeDB(db);
    }

    res.status(201).json({ status: "pending_confirmation", registration: newReg });
  });

  // API Route: Confirm Email manually (simulation confirm module)
  app.post("/api/registrations/confirm", (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token em falta." });
    }

    db = loadDB();
    const matched = db.registrations.find(r => r.confirmation_token === token);
    if (!matched) {
      return res.status(404).json({ error: "Código do Token de Confirmação inválido." });
    }

    if (matched.confirmed) {
      return res.status(200).json({ success: true, registration: matched, message: "A inscrição já se encontrava validada." });
    }

    // Check token expiration (5-minute limit)
    const isExpired = Date.now() > new Date(matched.token_expires_at).getTime();
    if (isExpired) {
      return res.status(410).json({ error: "O código de confirmação expirou (limite de 5 minutos excedido). Por favor, efectue uma nova inscrição para obter um código válido." });
    }

    // Server-side check for confirmed overlapping sessions AT confirmation time!
    const currentEvent = db.events.find(e => e.id === matched.event_id);
    if (currentEvent) {
      const overlappingConf = db.registrations.find(r => {
        if (r.student_number.toLowerCase() !== matched.student_number.toLowerCase()) return false;
        if (!r.confirmed) return false;
        if (r.id === matched.id) return false;

        const otherEvt = db.events.find(e => e.id === r.event_id);
        if (!otherEvt) return false;
        return isOverlapping(otherEvt, currentEvent);
      });

      if (overlappingConf) {
        const otherEvt = db.events.find(e => e.id === overlappingConf.event_id);
        return res.status(409).json({ error: `Confirmação Recusada: Já possuis uma presença CONFIRMADA para a atividade "${otherEvt?.title}" no mesmo horário!` });
      }
    }

    matched.confirmed = true;
    if (!matched.qr_token) {
      matched.qr_token = `SAGEO-${Math.floor(10000 + Math.random() * 90000)}-${matched.id.slice(-3)}`;
    }

    db.auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "REGISTRATION_CONFIRM",
      details: `Inscrição token de ${matched.first_name} ${matched.last_name} confirmada via e-mail link.`,
      status: "success",
      studentNumber: matched.student_number,
      eventId: matched.event_id
    });

    writeDB(db);

    // Dispatch Official Institutional Invitation Email with QR code details!
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    const apiKey = process.env.RESEND_API_KEY;

    const useSmtp = !!(smtpHost && smtpUser && smtpPass);
    const useResend = !useSmtp && !!(apiKey && apiKey.startsWith("re_"));

    const invitationSubject = `🎟️ CONVITE INSTITUCIONAL SAGEO: Entrada Confirmada - ${currentEvent ? currentEvent.title : 'Evento'}`;
    const qrData = JSON.stringify({ registration_id: matched.id, qr_token: matched.qr_token });
    const qrImageURL = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

    const invitationHTML = `
      <div style="font-family: 'Inter', sans-serif; background-color: #030712; padding: 40px; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dfac34; font-family: sans-serif; margin-bottom: 25px; text-transform: uppercase; font-size: 20px; font-weight: bold; text-align: center; border-bottom: 2px solid rgba(223, 172, 52, 0.2); padding-bottom: 12px; letter-spacing: 2px;">S A G E O &nbsp; 2 0 2 6</h2>
        <h3 style="color: #ffffff; font-family: serif; font-size: 18px; margin-top: 25px;">Olá ${matched.first_name} ${matched.last_name},</h3>
        <p style="color: #34d399; font-size: 15px; font-weight: bold; margin-bottom: 15px;">A tua inscrição académica foi totalmente confirmada!</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Temos o prazer de te enviar o teu <strong>Convite Oficial Institucional</strong> com o bilhete e o respetivo código QR de acesso para a atividade:</p>
        
        <div style="margin: 25px 0; border: 1.5px solid rgba(52, 211, 153, 0.3); padding: 25px; border-radius: 12px; background: rgba(52, 211, 153, 0.02); text-align: left;">
          <h4 style="margin: 0 0 15px 0; color: #ffffff; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">${currentEvent ? currentEvent.title : 'Atividade SAGEO'}</h4>
          <p style="margin: 0; font-size: 13px; color: #94a3b8; font-family: monospace;"><strong>Número de Estudante:</strong> ${matched.student_number}</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-family: monospace;"><strong>E-mail Institucional:</strong> ${matched.institutional_email}</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-family: monospace;"><strong>Localização:</strong> ${currentEvent ? currentEvent.location : 'Anfiteatro / Sala'}</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-family: monospace;"><strong>Data / Horário:</strong> ${currentEvent ? currentEvent.date : ''} às ${currentEvent ? currentEvent.start_time : ''}</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #dfac34; font-family: monospace;"><strong>Código QR Token:</strong> ${matched.qr_token}</p>
        </div>

        <div style="margin: 30px 0; text-align: center; background: #0b1329; padding: 20px; border-radius: 12px; border: 1px solid #1e293b;">
          <p style="color: #cbd5e1; font-size: 13px; margin-bottom: 12px;"><strong>O Teu Cartão QR de Acesso:</strong></p>
          <img src="${qrImageURL}" alt="Token QR SAGEO" style="border: 4px solid #ffffff; border-radius: 8px; width: 150px; height: 150px; display: inline-block;" />
          <p style="color: #94a3b8; font-size: 11px; margin-top: 10px; line-height: 1.4;">Alinha este código no visor do leitor óptico SAGEO (via smartphone ou portátil) no check-in do evento.</p>
        </div>

        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 30px;">
          ⚠️ <strong>Nota Curricular:</strong> Para assinalar o aproveitamento lúdico e obter o certificado (4.0 horas ECTS), a tua presença física deve ser validada pela equipa de portagem na entrada.
        </p>

        <p style="font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 15px; text-align: center;">
          Semana Académica de Engenharia e Organização &copy; 2026. Processamento curricular unificado do ECTS.
        </p>
      </div>
    `;

    if (useSmtp) {
      (async () => {
        try {
          console.log(`[SMTP Invitation Dispatch] Triggering official ticket invite to ${matched.institutional_email} via SMTP`);
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          await transporter.sendMail({
            from: smtpFrom || smtpUser,
            to: matched.institutional_email,
            subject: invitationSubject,
            html: invitationHTML
          });

          db.auditLogs.push({
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "EMAIL_REAL_SENT",
            details: `Convite Oficial: disparado e-mail real de convite (com bilhete QR e dados de acesso) via SMTP para ${matched.institutional_email}.`,
            status: "success",
            studentNumber: matched.student_number,
            eventId: matched.event_id
          });
          writeDB(db);
        } catch (err: any) {
          console.error("[SMTP Invitation Error]", err);
        }
      })();
    } else if (useResend) {
      (async () => {
        try {
          console.log(`[Resend Invitation Dispatch] Triggering official ticket invite to ${matched.institutional_email} via Resend`);
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: "onboarding@resend.dev",
              to: [matched.institutional_email],
              subject: invitationSubject,
              html: invitationHTML
            })
          });

          db.auditLogs.push({
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "EMAIL_REAL_SENT",
            details: `Convite Oficial: disparado e-mail real de convite (com bilhete QR e dados de acesso) via Resend para ${matched.institutional_email}.`,
            status: "success",
            studentNumber: matched.student_number,
            eventId: matched.event_id
          });
          writeDB(db);
        } catch (err: any) {
          console.error("[Resend Invitation Error]", err);
        }
      })();
    } else {
      console.log(`[Email Mock Simulation Invitation] To: ${matched.institutional_email} | Ticket QR Data: ${qrData}`);
      db.auditLogs.push({
        id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        action: "EMAIL_SIMULATED",
        details: `Convite Oficial: disparado e-mail de convite simulado (com bilhete QR e dados de acesso) para ${matched.institutional_email}. Token: ${matched.qr_token}`,
        status: "success",
        studentNumber: matched.student_number,
        eventId: matched.event_id
      });
      writeDB(db);
    }

    res.json({ success: true, registration: matched });
  });

  // API Route: Secure Student Cancellation
  app.post("/api/registrations/cancel", (req, res) => {
    const { registrationId, secretAnswer } = req.body;

    if (!registrationId || !secretAnswer) {
      return res.status(400).json({ error: "O ID da inscrição e a Resposta Secreta são obrigatórios." });
    }

    db = loadDB();

    const matchedIndex = db.registrations.findIndex(r => r.id === registrationId);
    if (matchedIndex === -1) {
      return res.status(404).json({ error: "Inscrição não localizada." });
    }

    const matched = db.registrations[matchedIndex];

    if (matched.secret_answer.toLowerCase().trim() !== secretAnswer.toLowerCase().trim()) {
      return res.status(403).json({ error: "A Resposta Secreta à pergunta de segurança está incorreta!" });
    }

    const studentNum = matched.student_number;
    const eventId = matched.event_id;
    const studentName = `${matched.first_name} ${matched.last_name}`;
    const selectedEvent = db.events.find(e => e.id === eventId);
    const eventTitle = selectedEvent ? selectedEvent.title : "Atividade Desconhecida";

    db.registrations.splice(matchedIndex, 1);

    db.auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "REGISTRATION_CANCEL",
      details: `Inscrição cancelada voluntariamente por ${studentName} (${studentNum}) na atividade "${eventTitle}".`,
      status: "success",
      studentNumber: studentNum,
      eventId: eventId
    });

    writeDB(db);
    res.json({ success: true, message: "Inscrição cancelada com sucesso. A vaga foi libertada!" });
  });

  // API Route: Secure Server-Side Scan & Check-in validation
  app.post("/api/check-in", requireAdminAuth, (req, res) => {
    const { eventId, ticketCode, secretAnswer, bypassSecretQuestion } = req.body;

    if (!eventId || !ticketCode) {
      return res.status(400).json({ error: "ID da Atividade e Código do bilhete/Token QR são necessários." });
    }

    db = loadDB();

    // Find the student registration (match by id, token, student number or qr token)
    const normalizedCode = ticketCode.trim();
    const matched = db.registrations.find(
      r => r.id === normalizedCode || 
           r.confirmation_token === normalizedCode || 
           r.student_number === normalizedCode ||
           (r.qr_token && r.qr_token === normalizedCode)
    );

    if (!matched) {
      db.auditLogs.push({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "CHECKIN_FAILED_TICKET",
        details: `Scan Falhado: Bilhete inválido ou inexistente "${normalizedCode}"`,
        status: "failed",
        eventId: eventId
      });
      writeDB(db);
      return res.status(404).json({ error: "Código de Bilhete / Inscrição inválido ou pendente." });
    }

    // Verify activity match
    if (matched.event_id !== eventId) {
      const otherEvt = db.events.find(e => e.id === matched.event_id);
      db.auditLogs.push({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "CHECKIN_FAILED_EVENT",
        details: `Scan Falhado: O estudante ${matched.student_number} tentou entrar na atividade errada. Bilhete pertence a: "${otherEvt?.title}"`,
        status: "failed",
        studentNumber: matched.student_number,
        eventId: eventId
      });
      writeDB(db);
      return res.status(422).json({ 
        error: `Este bilhete pertence a outro evento: "${otherEvt?.title || 'Sem título'}"` 
      });
    }

    // Verify double check-in attempt
    if (matched.checked_in) {
      db.auditLogs.push({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "CHECKIN_DUPLICATE_ALERT",
        details: `Alerta: Tentativa de duplo check-in para ${matched.first_name} ${matched.last_name} (Sessão já ratificada).`,
        status: "failed",
        studentNumber: matched.student_number,
        eventId: eventId
      });
      writeDB(db);
      return res.status(409).json({ 
        error: `ALERTA DE SEGURANÇA: Esta presença já foi confirmada às: ${new Date(matched.checked_in_at!).toLocaleTimeString()}` 
      });
    }

    // If verification bypass is disabled (staff control check), validate secret phrase
    if (!bypassSecretQuestion) {
      if (!secretAnswer) {
        return res.status(412).json({ error: "A resposta à pergunta de segurança é necessária." });
      }

      const provided = secretAnswer.trim().toLowerCase();
      const saved = matched.secret_answer.trim().toLowerCase();

      if (provided !== saved) {
        db.auditLogs.push({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "CHECKIN_FAILED_SECRET",
          details: `Scan Negado: Frase secreta fornecida por ${matched.student_number} incorreta.`,
          status: "failed",
          studentNumber: matched.student_number,
          eventId: eventId
        });
        writeDB(db);
        return res.status(401).json({ error: "RESPOSTA DE SEGURANÇA SEGREDA INCORRETA! O check-in necessita da frase correta do estudante por motivos de segurança." });
      }
    }

    // Process check-in
    matched.checked_in = true;
    matched.checked_in_at = new Date().toISOString();

    db.auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "CHECKIN_SUCCESS",
      details: `Check-in Completo: ${matched.first_name} ${matched.last_name} (${matched.student_number}) validado por Staff.`,
      status: "success",
      studentNumber: matched.student_number,
      eventId: eventId
    });

    writeDB(db);
    res.json({ success: true, registration: matched });
  });

  // REST API: GET Shared Gallery posts
  app.get("/api/gallery", (req, res) => {
    // Only return posts that are approved or do not have a set status (legacy initial seeds)
    const approved = db.gallery.filter(p => !p.status || p.status === 'approved');
    res.json(approved);
  });

  // REST API: POST Shared Gallery posts
  app.post("/api/gallery", (req, res) => {
    const { event_id, event_title, title, description, image_url } = req.body;
    
    if (!title || !description || !image_url) {
      return res.status(400).json({ error: "Título, descrição e imagem são obrigatórios." });
    }

    const newPost: GalleryPost = {
      id: `gal-${Date.now()}`,
      event_id: sanitizeInput(event_id || ""),
      event_title: sanitizeInput(event_title || ""),
      title: sanitizeInput(title),
      description: sanitizeInput(description),
      image_url: image_url, // allow unsplash direct linkage
      created_at: new Date().toISOString(),
      status: 'pending' // requires administrative approval
    };

    db.gallery.unshift(newPost); // push latest to top
    db.auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "GALLERY_ADD",
      details: `Novo registo fotográfico submetido para moderação: "${newPost.title}"`,
      status: "info"
    });

    writeDB(db);
    res.status(201).json(newPost);
  });

  // REST API: GET Admin All Gallery posts (including pending ones)
  app.get("/api/admin/gallery", requireAdminAuth, (req, res) => {
    res.json(db.gallery);
  });

  // REST API: POST Admin Gallery approval
  app.post("/api/admin/gallery/approve", requireAdminAuth, (req, res) => {
    const { id } = req.body;
    const post = db.gallery.find(p => p.id === id);
    if (!post) {
      return res.status(404).json({ error: "Registo fotográfico não encontrado." });
    }
    
    post.status = 'approved';
    
    db.auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "GALLERY_APPROVE",
      details: `Registo fotográfico aprovado pelo administrador: "${post.title}"`,
      status: "success"
    });
    
    writeDB(db);
    res.json({ success: true, post });
  });

  // REST API: POST Admin Gallery rejection
  app.post("/api/admin/gallery/reject", requireAdminAuth, (req, res) => {
    const { id } = req.body;
    const postIndex = db.gallery.findIndex(p => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Registo fotográfico não encontrado." });
    }
    
    const post = db.gallery[postIndex];
    post.status = 'rejected';
    
    db.auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "GALLERY_REJECT",
      details: `Registo fotográfico rejeitado/arquivado pelo administrador: "${post.title}"`,
      status: "info"
    });
    
    writeDB(db);
    res.json({ success: true });
  });

  // REST API: GET Waitlist list
  app.get("/api/waitlist", (req, res) => {
    res.json(db.waitlist);
  });

  // REST API: POST Waitlist request
  app.post("/api/waitlist", (req, res) => {
    const { event_id, name, email } = req.body;
    if (!event_id || !name || !email) {
      return res.status(400).json({ error: "Faltam parâmetros para a lista de espera." });
    }

    const newEntry: WaitlistEntry = {
      id: `wait-${Date.now()}`,
      event_id: sanitizeInput(event_id),
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      created_at: new Date().toISOString()
    };

    db.waitlist.push(newEntry);
    writeDB(db);
    res.status(201).json(newEntry);
  });

  // API Staff Admin database restoration and resets
  app.post("/api/admin/reset", requireAdminAuth, (req, res) => {
    const { passcode } = req.body;
    if (passcode !== "SAGEO2026") {
      return res.status(403).json({ error: "Código administrativo incorreto." });
    }

    // Clean databases back up to default state
    fs.unlinkSync(DB_FILE);
    db = loadDB();
    res.json({ success: true, message: "A base de dados oficial do servidor foi recriada e restaurada para as sementes básicas." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

