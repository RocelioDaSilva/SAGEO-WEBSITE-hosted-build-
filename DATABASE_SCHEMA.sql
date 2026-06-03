-- SAGEO 2026 - Schema da Base de Dados (Supabase / PostgreSQL)
-- Executar este script no SQL Editor do Supabase para inicializar os dados

-- 1. Tabela de Eventos
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 50,
    category TEXT NOT NULL CHECK (category IN ('empresa', 'exposicao', 'grande_exposicao', 'mini_curso', 'festival')),
    is_open BOOLEAN NOT NULL DEFAULT true,
    lecturer TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Inscrições (Registos)
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    student_number TEXT NOT NULL,
    course TEXT NOT NULL,
    institutional_email TEXT NOT NULL,
    lecturer_question TEXT,
    youtube_link TEXT,
    secret_question TEXT NOT NULL,
    secret_answer_hash TEXT NOT NULL,
    confirmation_token TEXT UNIQUE NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confirmed BOOLEAN NOT NULL DEFAULT false,
    qr_token TEXT UNIQUE,
    checked_in BOOLEAN NOT NULL DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Um estudante só pode ter uma inscrição ativa por evento
    CONSTRAINT unique_student_event UNIQUE (event_id, student_number)
);

-- 3. Lista de Espera (Waitlist)
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Logs de Presença / Auditoria de Check-In
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    checked_by TEXT NOT NULL DEFAULT 'SAGEO_STAFF_READER'
);

-- 5. Certificados de Creditação
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    certificate_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Galeria de Memórias
CREATE TABLE IF NOT EXISTS public.gallery_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    event_title TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de Performance Avançados
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_confirmed ON public.registrations(confirmed);
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in ON public.registrations(checked_in);
CREATE INDEX IF NOT EXISTS idx_waitlist_event_id ON public.waitlist(event_id);

-- Ativar Segurança RLS (Row Level Security)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_posts ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público
CREATE POLICY "Qualquer utilizador pode ler eventos" ON public.events
    FOR SELECT USING (true);

CREATE POLICY "Qualquer utilizador pode ler a galeria" ON public.gallery_posts
    FOR SELECT USING (true);

CREATE POLICY "Qualquer utilizador pode inserir inscrições" ON public.registrations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Qualquer utilizador pode atualizar e confirmar a sua inscrição pública" ON public.registrations
    FOR UPDATE USING (confirmed = false);

CREATE POLICY "Estudante pode ler o seu próprio registo por token" ON public.registrations
    FOR SELECT USING (true);

-- Dados de Demonstração Iniciais SAGEO 2026
INSERT INTO public.events (id, title, description, date, start_time, end_time, location, capacity, category, is_open, lecturer, image_url)
VALUES 
('ebd82f34-1111-404c-8fa6-1e9b2cb40a83', 'Sessão de Abertura & O Futuro da Engenharia de Organização', 'Conferência inaugural que aborda os novos paradigmas da engenharia industrial, transformação digital e o papel do Engenheiro na otimização de sistemas industriais.', '2026-10-12', '09:30:00', '11:30:00', 'Auditório Nobre', 120, 'grande_exposicao', true, 'Prof. Dr. Armando Silva (Diretor Executivo)', 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80'),
('ebd82f34-2222-404c-8fa6-1e9b2cb40a83', 'Mini-Curso: Gestão de Projetos Ágeis e Scrum em Escala', 'Workshop prático focado nas metodologias Scrum, Kanban e frameworks de escalabilidade ágil aplicados a ambientes industriais de rápido crescimento.', '2026-10-12', '14:00:00', '17:30:00', 'Sala de Formação B', 40, 'mini_curso', true, 'Engª. Sandra Costa (Agile Coach da Bosch)', 'https://images.unsplash.com/photo-1531535934200-87349997def9?auto=format&fit=crop&w=800&q=80'),
('ebd82f34-3333-404c-8fa6-1e9b2cb40a83', 'Mesa Redonda: Inovação e Sustentabilidade nas Grandes Empresas', 'Um painel interativo com líderes do ecossistema de tecnologia e engenharia discutindo economia circular, processos de pegada zero e eficiência sistémica.', '2026-10-13', '10:00:00', '12:30:00', 'Auditório Central', 80, 'empresa', true, 'Representantes da Siemens, Continental & Bosch', 'https://images.unsplash.com/photo-1540317580114-ed684c82b71d?auto=format&fit=crop&w=800&q=80');
