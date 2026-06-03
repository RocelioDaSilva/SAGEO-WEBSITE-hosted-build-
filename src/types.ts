export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time?: string;
  location: string;
  capacity: number;
  category: 'empresa' | 'exposicao' | 'grande_exposicao' | 'mini_curso' | 'festival' | 'mesa_redonda' | 'concurso' | 'workshop' | 'debate' | 'aula_magna' | 'palestra' | string;
  is_open: boolean;
  image_url?: string;
  lecturer?: string;
  course?: string;
  is_completed?: boolean;
  report?: {
    summary: string;
    highlights: string[];
    photos: string[];
    attendance?: number;
  };
}

export interface Registration {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  course: string;
  institutional_email: string;
  lecturer_question?: string;
  youtube_link?: string;
  secret_question: string;
  secret_answer: string; // In our client model, stored plain under salt/hash comparison
  confirmation_token: string;
  token_expires_at: string;
  confirmed: boolean;
  qr_token?: string;
  checked_in: boolean;
  checked_in_at?: string;
}

export interface WaitlistEntry {
  id: string;
  event_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface GalleryPost {
  id: string;
  event_id?: string;
  event_title?: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  likes?: number;
}

export interface Contributor {
  id: string;
  name: string;
  role: string;
  course: string;
  avatar_url?: string;
  contribution: string;
  linkedin_url?: string;
  student_number: string;
}

export interface Exhibition {
  id: string;
  title: string;
  theme: string;
  description: string;
  exhibitor: string;
  exhibitor_contact?: string;
  photos: string[];
  interview: {
    question_1: string;
    answer_1: string;
    question_2: string;
    answer_2: string;
    question_3: string;
    answer_3: string;
  };
}

export interface BrainstormingIdea {
  id: string;
  author: string;
  title: string;
  content?: string;
  suggested_guests?: string;
  suggested_speaker?: string;
  description?: string;
  votes?: number;
}

export interface ThematicAxis {
  id: string;
  title: string;
  description?: string;
}


