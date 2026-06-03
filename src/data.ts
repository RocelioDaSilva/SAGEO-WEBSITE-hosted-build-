import { Event, GalleryPost, Registration, Contributor, Exhibition, BrainstormingIdea, ThematicAxis } from './types';

export const INITIAL_EVENTS: Event[] = [
  {
    id: "evt-1",
    title: "C-01: Cerimónia Oficial de Abertura SAGEO 2026",
    description: "Conferência inaugural e sessão formal de abertura da 3.ª Edição da Semana Académica de Geociências do ISPTEC, com presença da direção institucional, oradores seniores do MIREMPET e Sonangol, e momento artístico cultural.",
    date: "2026-11-23",
    start_time: "08:30",
    end_time: "10:30",
    location: "Auditório Nobre",
    capacity: 150,
    category: "grande_exposicao",
    is_open: true,
    lecturer: "Coordenação SAGEO, Direção do ISPTEC & Convidados de Honra",
    image_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    course: "Ambos",
    is_completed: true,
    report: {
      summary: "A sessão de abertura oficial reuniu mais de 150 participantes sob o alto patrocínio do Departamento de Geociências. Apresentou-se o tema central do ano: 'Do Petróleo aos Minerais Críticos' e deu-se as boas-vindas institucionais.",
      highlights: [
        "Apresentação das metas estratégicas da SAGEO 2026 e das parcerias setoriais",
        "Discurso de abertura realçado pela liderança do ISPTEC e oradores do MIREMPET",
        "Ativação do ecossistema digital de credenciamento e emissão autónoma"
      ],
      photos: [
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80"
      ],
      attendance: 152
    }
  },
  {
    id: "evt-a1",
    title: "A-01: Aula Magna — O Papel do Geólogo e Geofísico na Angola de 2035",
    description: "Sessão central de alto impacto analisando as megatendências de exploração de minerais estratégicos em Angola, novos perfis demandados no mercado nacional e a dinâmica de diversificação industrial global.",
    date: "2026-11-23",
    start_time: "11:00",
    end_time: "12:30",
    location: "Auditório Nobre",
    capacity: 120,
    category: "grande_exposicao",
    is_open: true,
    lecturer: "Docentes e Oradores Seniores do Setor de Recursos Minerais",
    image_url: "https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-2",
    title: "P-04: Perfuração de Poços em Águas Profundas — Tecnologias e Desafios",
    description: "Workshop especializado no offshore angolano focado em cabeças de poço sob pressões severas HPHT, controle preventivo de kicks de gás químico e mitigação de lamas de sondagem no meio marinho.",
    date: "2026-11-23",
    start_time: "14:00",
    end_time: "17:30",
    location: "Sala de Formação B",
    capacity: 45,
    category: "workshop",
    is_open: true,
    lecturer: "Lubazandio (Palestrantes Convidados da TotalEnergies & ExxonMobil)",
    image_url: "https://images.unsplash.com/photo-1531535934200-87349997def9?auto=format&fit=crop&w=800&q=80",
    course: "Engenharia de Petróleos"
  },
  {
    id: "AC-01",
    title: "Sessão de Cinema Científico e Documentários Geológicos SAGEO",
    description: "Exibição didática e artística de documentários históricos cobrindo a evolução da engenharia mineral e petrolífera em Angola e os desafios globais da descarbonização estrutural.",
    date: "2026-11-23",
    start_time: "18:00",
    end_time: "20:00",
    location: "Mini-aud. 4",
    capacity: 50,
    category: "cultural",
    is_open: true,
    lecturer: "Comissão de Divulgação Cultural SAGEO",
    image_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "AC-02",
    title: "Welcome Night de Abertura SAGEO 2026",
    description: "Cocktail e sessão informal de networking promovendo a inserção e boas-vindas recíprocas entre os formandos, ex-alunos do ISPTEC e comitivas empresariais convidadas.",
    date: "2026-11-23",
    start_time: "19:30",
    end_time: "22:00",
    location: "Jardins do Campus",
    capacity: 150,
    category: "cultural",
    is_open: true,
    lecturer: "Comissão Executiva de Estudantes",
    image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-a2",
    title: "A-02: Aula Magna — Mulheres nas Geociências",
    description: "Painel de liderança e mentoria focado no protagonismo feminino e carreira nas indústrias de petróleo, gás e mineração sólidas em Angola de hoje de amanhã.",
    date: "2026-11-24",
    start_time: "09:00",
    end_time: "10:30",
    location: "Auditório Central",
    capacity: 100,
    category: "grande_exposicao",
    is_open: true,
    lecturer: "Docentes Seniores (Odeth Cassova, Prof.ª Teresa Victor, Eng.ª Cláudia Guimarães)",
    image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-3",
    title: "P-05: Transição Energética e o Futuro do Engenheiro Angolano",
    description: "Painel científico avaliando as políticas energéticas estatais, metas integradas de descarbonização e fomento solar e eólico para um mix diversificado nacional sob a chancela do MINEA.",
    date: "2026-11-24",
    start_time: "11:00",
    end_time: "12:30",
    location: "Auditório Central",
    capacity: 80,
    category: "mesa_redonda",
    is_open: true,
    lecturer: "Mirian & Orador Convidado (Kátia Gabriel / Docente do ISPTEC & Técnica do MINEA)",
    image_url: "https://images.unsplash.com/photo-1540317580114-ed684c82b71d?auto=format&fit=crop&w=800&q=80",
    course: "Ambos",
    is_completed: true,
    report: {
      summary: "Excelente debate sopesando as metas de eletrificação sustentável angolanas. Apresentou-se o mapa solar preliminar para infraestruturas isoladas do interior.",
      highlights: [
        "Debate em torno do papel dos geofísicos na estruturação geotérmica do Kwanza Sul",
        "Conformidade e metas ecológicas de emissão neutra estipuladas pelo MINEA",
        "Aconselhamento sobre modelação estocástica aplicada a aqüíferos"
      ],
      photos: [
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540317580114-ed684c82b71d?auto=format&fit=crop&w=800&q=80"
      ],
      attendance: 84
    }
  },
  {
    id: "evt-4",
    title: "P-03: Geofísica de Exploração — Sísmica, Gravimetria e Interpretação",
    description: "Estudo prático centrado na calibração sismológica computacional, inversão acústica tridimensional de subsolo marinho e processamento computacional tridimensional de reflectância.",
    date: "2026-11-24",
    start_time: "14:30",
    end_time: "18:00",
    location: "Laboratório de Computação 3",
    capacity: 45,
    category: "mini_curso",
    is_open: true,
    lecturer: "Rocélio & Especialistas Técnicos (Convidados: Engenheiros Técnicos da Schlumberger / Baker Hughes)",
    image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
    course: "Geofísica"
  },
  {
    id: "evt-8",
    title: "P-06: O Futuro do Petróleo Angolano num Mundo de Descarbonização",
    description: "Mesa redonda focada na redução operacional de tocha de gás nas plataformas, estratégias de descarbonização do upstream e planos de sustentabilidade ambiental integrados.",
    date: "2026-11-25",
    start_time: "08:00",
    end_time: "09:30",
    location: "Mini-aud. 4",
    capacity: 50,
    category: "mesa_redonda",
    is_open: true,
    lecturer: "Eliúd (Convidados Técnicos da Sonangol E&P e Operadoras de Bloco)",
    image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    course: "Geofísica"
  },
  {
    id: "evt-9",
    title: "GeoChallenge: Datathon de IA e Modelação Estocástica de Reservatórios",
    description: "Competição intensa focada na modelação numérica com Python aplicando automações de Machine Learning e Digital Twins para predição probabilística de fluxos de fluidos.",
    date: "2026-11-25",
    start_time: "08:00",
    end_time: "15:00",
    location: "Hall de Entrada BA",
    capacity: 40,
    category: "concurso",
    is_open: true,
    lecturer: "Rocélio, Edvânio & Comissão Científica SAGEO (Sugestão: Edmilson Praia)",
    image_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-10",
    title: "Mesa-Redonda: Carreiras e Mentoria com Alumni em Operadoras Globais",
    description: "Sessão altamente concorrida interligando profissionais do mercado graduados do ISPTEC para aconselhamento prático sobre competências de contratação, currículos e exames.",
    date: "2026-11-25",
    start_time: "08:30",
    end_time: "09:30",
    location: "Mini-aud. 2",
    capacity: 65,
    category: "mini_curso",
    is_open: true,
    lecturer: "Teka & Rocélio (Convidados: Alumni ISPTEC destacados na Exxon & Chevron)",
    image_url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    course: "Ambos",
    is_completed: true,
    report: {
      summary: "Simulações práticas de processos admissionais de grande valia corporativa. Alunos receberam orientações diretas sobre refinamento técnico de CV e oratória técnica de pitch corporativo.",
      highlights: [
        "Partilha de estratégias vencedoras para colocação em multinacionais de energia",
        "Oficina de dinâmicas comportamentais e inteligência emocional integrada",
        "Divulgação de redes de mentoria intergeracional de geociências do ISPTEC"
      ],
      photos: [
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"
      ],
      attendance: 62
    }
  },
  {
    id: "evt-11",
    title: "Mostra de Poster Científico e Exposição Fotográfica 'Angola no Campo'",
    description: "Painéis e maquetes avaliadas por técnicos do MIREMPET, ladeando a galeria de fotos de dobras estruturais registadas nas províncias do Huambo, Namibe e Kwanza Sul.",
    date: "2026-11-25",
    start_time: "09:00",
    end_time: "17:45",
    location: "Pátio Central",
    capacity: 100,
    category: "exposicao",
    is_open: true,
    lecturer: "Teka (Estudantes Investigadores)",
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-12",
    title: "P-11: Como a IA está a Redefinir a Descoberta de Recursos Minerais",
    description: "Sessão prática dedicada à integração algorítmica de georradar computorizado, imagiologia avançada por drones e identificação de sills subterrâneos do Pré-Sal.",
    date: "2026-11-25",
    start_time: "09:00",
    end_time: "09:45",
    location: "BA 4-1",
    capacity: 45,
    category: "mini_curso",
    is_open: true,
    lecturer: "Eliúd & Edvânio (Sugestão: Edmilson Praia)",
    image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    course: "Geofísica"
  },
  {
    id: "evt-13",
    title: "Mesa-Redonda: O Overhype da Indústria de Petróleos e a Transição Energética",
    description: "Mesa redonda magna e inovadora onde líderes industriais de topo debatem de forma isenta o plano concorrencial e o papel de Angola no mix energético (2030-2050).",
    date: "2026-11-25",
    start_time: "09:00",
    end_time: "10:45",
    location: "Auditório Principal",
    capacity: 100,
    category: "mesa_redonda",
    is_open: true,
    lecturer: "Teka, Edvânio & Convidados (Eng. Paz Catoquessa, Eng. Miguel Baptista, Eng. Aldo Fragas, Eng.ª Maria José)",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-14",
    title: "Workshop: Geoquímica Orgânica Avançada de Bacias Petrolíferas",
    description: "Avaliação instrumental avançada de rochas geradoras (Rock Eval, biomarcadores e simulação de maturação térmica) aplicada com dados das bacias do Kwanza e Lower Congo.",
    date: "2026-11-25",
    start_time: "09:30",
    end_time: "10:30",
    location: "Pav 1",
    capacity: 35,
    category: "workshop",
    is_open: true,
    lecturer: "Mirian (Docentes ISPTEC & Equipa Técnica da Sonangol Pesquisa & Produção)",
    image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-15",
    title: "P-09: Evolução da Mineração Angolana para a Era das Baterias",
    description: "Análise fática de prospecção, mapeamento de depósitos e exploração de minerais críticos (lítio, cobalto, terras raras) cruciais para a transição ecológica internacional.",
    date: "2026-11-25",
    start_time: "10:00",
    end_time: "10:45",
    location: "Mini Aud 2",
    capacity: 50,
    category: "palestra",
    is_open: true,
    lecturer: "Lubazandio & Edvânio (Oradores Convidados: ENDIAMA e MIREMPET)",
    image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-16",
    title: "Concurso: GeoQuiz — Quiz de Conhecimentos em Geociências",
    description: "Sessão lúdica e interactiva de perguntas e respostas sobre geofísica estrutural, vulcanologia do Pré-Sal e estratigrafia de bacias marinhas angolanas.",
    date: "2026-11-25",
    start_time: "11:00",
    end_time: "13:00",
    location: "Pátio Lab Pro",
    capacity: 60,
    category: "concurso",
    is_open: true,
    lecturer: "Rocélio & Núcleo Académico SAGEO",
    image_url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-17",
    title: "Geo-Challenge: Corrida de Identificação Visual de Minerais e Rochas",
    description: "Jogo prático competitivo utilizando materiais geológicos e amostras físicas reais do ISPTEC para aferir precisão na descrição de propriedades macroscópicas minerais.",
    date: "2026-11-25",
    start_time: "13:00",
    end_time: "14:30",
    location: "Jardim Bloco D",
    capacity: 40,
    category: "concurso",
    is_open: true,
    lecturer: "Rocélio & Investigadores de Mineralogia do DCC",
    image_url: "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&w=800&q=80",
    course: "Engenharia de Petróleos"
  },
  {
    id: "evt-18",
    title: "Mini-Curso: Otimização da Produção em Reservatórios Petrolíferos",
    description: "Sessão prática avançada cobrindo métodos modernos de modelagem e fatores determinantes de recuperação de hidrocarbonetos acoplados.",
    date: "2026-11-25",
    start_time: "14:00",
    end_time: "17:00",
    location: "Laboratório de Computação 2",
    capacity: 40,
    category: "mini_curso",
    is_open: true,
    lecturer: "Eng. Edlásio Vasconcelos (Convidado: SPE Angola / INP)",
    image_url: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80",
    course: "Engenharia de Petróleos"
  },
  {
    id: "evt-19",
    title: "P-10: Orientação de Carreira no Setor Petrolífero",
    description: "Análise estratégica de preparação de perfis curriculares técnicos e competências comportamentais fundamentais para as marcas de energia globais.",
    date: "2026-11-25",
    start_time: "14:30",
    end_time: "15:30",
    location: "A1",
    capacity: 50,
    category: "palestra",
    is_open: true,
    lecturer: "Elias Ngwa (Naslan Energy / Naslan Academy)",
    image_url: "https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-5",
    title: "GeoTech Exhibition: Exposição de Tecnologias e Maquetes SAGEO",
    description: "Grande feira de tecnologias com demonstração mecânica ao vivo de brocas raras de diamante, turbostrans e simuladores hidráulicos em stand de marcas líderes.",
    date: "2026-11-25",
    start_time: "15:00",
    end_time: "18:00",
    location: "Pavilhão Multiúsos",
    capacity: 100,
    category: "exposicao",
    is_open: true,
    lecturer: "Rocélio & Corpo de Estudantes de Geociências",
    image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "evt-6",
    title: "Palestra Magna: Captura e Armazenamento de CO2 (CCS) em Angola",
    description: "Visão técnica abrangente sobre oportunidades geológicas para contenção e armazenamento estrutural seguro de gases emissionários no upstream angolano da nova era.",
    date: "2026-11-26",
    start_time: "11:00",
    end_time: "13:00",
    location: "Auditório Nobre",
    capacity: 120,
    category: "grande_exposicao",
    is_open: true,
    lecturer: "Edvânio (Convidados: Técnicos de Engenharia de Azule Energy & Sonangol)",
    image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "AC-05",
    title: "Estudo de Caso: O Projeto de Terras Raras de Longonjo no Huambo",
    description: "Análise de infraestrutura de minas sólidas e refino de neodímio, sopesando o papel e a inserção competitiva de Angola na cadeia global de energia verde.",
    date: "2026-11-26",
    start_time: "10:00",
    end_time: "12:00",
    location: "Auditório Central",
    capacity: 75,
    category: "integracao",
    is_open: true,
    lecturer: "Eliúd & Convidados do Projeto de Minas de Longonjo",
    image_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "AC-04",
    title: "Sessão de Networking Académico-Empresarial SAGEO",
    description: "Encontro para acelerar a inserção de graduados no mercado do petróleo, gás e mineração, mediado com directores regionais seniores de Recursos Humanos.",
    date: "2026-11-26",
    start_time: "14:00",
    end_time: "16:30",
    location: "Hall de Entrada BA",
    capacity: 80,
    category: "integracao",
    is_open: true,
    lecturer: "Gabinete de Apoio e Relações Corporativas do ISPTEC",
    image_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  },
  {
    id: "AC-03",
    title: "Gala de Encerramento SAGEO, Entrega de Certificados e Prémios",
    description: "Encerramento formal do evento de maior prestígio das Geociências angolanas. Entrega de certificados curriculares, prémios aos melhores protótipos e apresentação artística académica.",
    date: "2026-11-27",
    start_time: "18:00",
    end_time: "23:59",
    location: "Praça do Campus",
    capacity: 200,
    category: "cultural",
    is_open: true,
    lecturer: "Comissão Executiva SAGEO & Tunas Universitárias do ISPTEC",
    image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    course: "Ambos"
  }
];

export const INITIAL_GALLERY: GalleryPost[] = [
  {
    id: "gal-1",
    event_id: "evt-1",
    event_title: "C-01: Cerimónia Oficial de Abertura SAGEO 2026",
    title: "Auditório Nobre Completamente Esgotado",
    description: "O arranque da SAGEO 2026 superou todas as expectativas com estudantes, empresas e investigadores reunidos num debate único sobre o futuro laboral e a transição energética nacional em Luanda.",
    image_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    created_at: "2026-11-23T12:00:00Z"
  },
  {
    id: "gal-2",
    event_id: "evt-5",
    event_title: "GeoTech Exhibition: Exposição de Tecnologias e Maquetes SAGEO",
    title: "Demonstração de Braço Robótico & Sensores",
    description: "Estudantes do núcleo técnico demonstram em primeira mão a integração de braços robóticos e modelação computacional sísmica sob análise de júri corporativo.",
    image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    created_at: "2026-11-25T14:30:00Z"
  }
];

export const ACADEMIC_DEPARTMENTS = [
  {
    name: "Departamento de Engenharia e Tecnologia",
    courses: [
      "Engenharia Civil",
      "Engenharia Electrotécnica",
      "Engenharia Informática",
      "Engenharia Mecânica",
      "Engenharia Química",
      "Engenharia de Produção Industrial"
    ]
  },
  {
    name: "Departamento de Geociências",
    courses: [
      "Engenharia de Petróleos",
      "Geofísica"
    ]
  },
  {
    name: "Departamento de Ciências Sociais Aplicadas",
    courses: [
      "Economia",
      "Contabilidade",
      "Gestão Empresarial"
    ]
  }
];

export const COURSES = ACADEMIC_DEPARTMENTS.flatMap(dept => dept.courses);

export const STAFF_PASSCODE = "SAGEO2026"; // Default passcode for testing

export const INITIAL_CONTRIBUTORS: Contributor[] = [
  {
    id: "cont-1",
    name: "Rocélio Da Silva",
    role: "Coordenador Geral da SAGEO",
    course: "Engenharia de Produção Industrial",
    student_number: "20220001",
    avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
    contribution: "Liderou a comissão executiva nacional da SAGEO, definiu as parcerias estratégicas principais e orientou o plano orçamental e estrutural com a coordenação de docência."
  },
  {
    id: "cont-2",
    name: "Ana Maria Sousa",
    role: "Coordenadora de Atividades Científicas",
    course: "Gestão Empresarial",
    student_number: "20220002",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    contribution: "Coordenou as mesas redondas, convites corporativos institucionais a oradores da Siemens e Bosch, homologação do plano regulamentar e a definição de créditos de currículo (ECTS)."
  },
  {
    id: "cont-3",
    name: "Manuel Mateus Antunes",
    role: "Responsável Operacional e Logística de Recinto",
    course: "Engenharia Civil",
    student_number: "20230142",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    contribution: "Planeou a distribuição estrutural de stands no Pavilhão de Eventos, supervisionou o staff de apoio logístico voluntário e operacionalizou a arena para a disputa de pontes de palitos."
  },
  {
    id: "cont-4",
    name: "Jéssica Correia de Lemos",
    role: "Diretora Tecnológica e Desenvolvimento de Plataformas",
    course: "Engenharia Informática",
    student_number: "20220551",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    contribution: "Desenvolveu o ecossistema tecnológico SAGEO digital, comissariou os terminais de QR Code integrados, o portal de credenciamento e o algoritmo de emissão autónoma de certificados curriculares."
  },
  {
    id: "cont-5",
    name: "Dércio Viegas Neto",
    role: "Coordenador de Patrocínios e Relações Corporativas",
    course: "Engenharia Electrotécnica",
    student_number: "20220311",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    contribution: "Angariou apoios estratégicos locais (Unitel, Africell e Pumangol) e mediou as apresentações corporativas entre as delegações de RH das marcas convidadas e os alunos graduados."
  }
];

export const INITIAL_EXHIBITIONS: Exhibition[] = [
  {
    id: "exb-1",
    title: "EX-01: GeoTech Exhibition",
    theme: "Exposição / Geral",
    description: "Exposição de tecnologias, equipamentos geofísicos e petrolíferos; stands de empresas parceiras nacionais, regionais e multinacionais do ramo de hidrocarbonetos.",
    exhibitor: "Núcleos e Empresas de Geotecnologia",
    exhibitor_contact: "exposidores.geotech@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Qual a relevância prática deste protótipo tecnológico?",
      answer_1: "Apresentamos ferramentas de aquisição de reflectância estrutural com alto grau de precisão sísmica e mapeamento de campos integrados.",
      question_2: "Que tecnologia de vanguarda apoia esta exposição?",
      answer_2: "Utilizamos sismógrafos portáteis calibrados no ISPTEC e coletores de dados geomagnéticos de alta sensibilidade interligados.",
      question_3: "Qual a mensagem final do expositor para os visitantes?",
      answer_3: "Os geo-recursos são a espinha dorsal do desenvolvimento industrial de Angola. Perceber como a tecnologia aperfeiçoa as margens extractivas é essencial."
    }
  },
  {
    id: "exb-2",
    title: "EX-02: Mostra de Projectos Académicos",
    theme: "Exposição / EPT+GEO",
    description: "Projectos integrados de Engenharia de Petróleos I/II e Geofísica I/II em formato estruturado de poster e banner curricular de alto impacto técnico.",
    exhibitor: "Discentes de EPT e GEO ISPTEC",
    exhibitor_contact: "projectos.estudantes@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Que tipo de investigação é apresentada nestes posters?",
      answer_1: "Trabalhos académicos originais cobrindo desde estudos térmicos de lamas de sondagem até modelos preditivos de recuperação assistida de óleo.",
      question_2: "Como foi o processo de desenvolvimento e mentoria?",
      answer_2: "Os estudantes contaram com semanas de validação nos nossos laboratórios e mentoria direta com engenheiros seniores do mercado local.",
      question_3: "Qual o benefício deste certame para o público estudantil?",
      answer_3: "Acelerar a transição entre a teoria rígida das aulas e a prática assertiva de defesa científica exigida pelas petrolíferas nacionais."
    }
  },
  {
    id: "exb-3",
    title: "EX-03: Painel Fotográfico «Angola no Campo»",
    theme: "Exposição / Geral",
    description: "Imagens reais e fascinantes de trabalhos de campo recolhidos em diversas províncias geológicas angolanas, evidenciando a nossa geodiversidade nacional.",
    exhibitor: "Comissão de Fotografia Geológica",
    exhibitor_contact: "fotoliga.sageo@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "O que procuraram capturar com estes impressionantes registos?",
      answer_1: "A essência do geólogo e do engenheiro de minas no terreno angolano, retratando valias estruturais, dobras basais e falhas geológicas únicas.",
      question_2: "Que províncias de Angola estão em destaque?",
      answer_2: "Trabalhos operados no Namibe, Kwanza Sul, Huíla e Huambo, com detalhe descritivo de afloramentos raros de rochas metamórficas.",
      question_3: "Como a fotografia apoia o ensino das Geociências?",
      answer_3: "Funciona como um primeiro catálogo visual que inspira a preservação pedagógica de patrimónios naturais e o avanço de geoturismo sustentável."
    }
  },
  {
    id: "exb-4",
    title: "EX-04: Mostra de Testemunhos, Rochas e Fósseis",
    theme: "Exposição / GEO",
    description: "Bancadas pedagógicas e microscópios activos para observação meticulosa de amostras geológicas, testemunhos de reservatório profundo e fósseis guia angolanos.",
    exhibitor: "Laboratório Clínico de Litografia & Geofísica",
    exhibitor_contact: "rochas.lab@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515516969-d4008cc6241a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Qual a peça de maior raridade nesta mostra?",
      answer_1: "Temos fósseis de relevância histórica global, amonites de bacias cretácicas nacionais e perfis cilíndricos de folhelhos retirados a km de fundura.",
      question_2: "De que forma o público pode interagir com os fósseis?",
      answer_2: "Disponibilizámos lupas binoculares e microscópios de luz polarizada para estudar lâminas petrográficas ultrafinas em directo.",
      question_3: "Qual a lição principal deste stand didático?",
      answer_3: "Compreender que as rochas guardam o código do tempo. Para perfurar com segurança extraordinária, é preciso saber ler a história mineral da rocha."
    }
  },
  {
    id: "exb-5",
    title: "EX-05: Simuladores Virtuais de Operações Offshore",
    theme: "Exposição / EPT",
    description: "Cabines de realidade virtual imersivas reproduzindo gabinetes de perfuração direcional, controlo de kick de gás sob pressões severas e manobras em plataformas.",
    exhibitor: "Clube de Inovação de Petróleos ISPTEC",
    exhibitor_contact: "drilling.vr@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Qual o maior desafio de simular o ambiente offshore?",
      answer_1: "Conseguir replicar o peso psicológico e a rapidez tática exigidos para atenuar anomalias de pressão subterrânea sem provocar perdas operativas.",
      question_2: "Que motores de software foram calibrados na experiência?",
      answer_2: "Construímos o simulador dinâmico em Unity, parametrizando física real de perda de carga de fluidos e condutividade térmica hidráulica.",
      question_3: "Como os simuladores reduzem os riscos de acidentes no setor?",
      answer_3: "Treinar em simulação permite errar com zero perdas e 100% de ganho analítico. O aluno chega às operadoras ciente de todos os canais de pânico."
    }
  },
  {
    id: "exb-6",
    title: "EX-06: Feira de Emprego Integrada",
    theme: "Exposição / Geral",
    description: "Stands corporativos de recrutamento activo e submissão assistida de currículos junto das maiores marcas e delegações de RH do setor.",
    exhibitor: "Gabinete de Carreira e Alumni SAGEO",
    exhibitor_contact: "oportunidades.sageo@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Quais as áreas mais procuradas pelas marcas parceiras neste ano?",
      answer_1: "Encontramos vagas importantes focadas em Engenharia de Reservatórios, Análise de Dados Geofísicos e Gestão Ambiental Integrada.",
      question_2: "Que conselho prático dão aos estudantes no momento da recolha?",
      answer_2: "Não foquem apenas nas qualificações rígidas de média escolar. Expliquem as vossas participações proactivas em maquetes e dinâmicas da SAGEO.",
      question_3: "Qual a taxa esperada de inserção profissional pós-evento?",
      answer_3: "Estimamos um aumento de 35% na colocação de estágios de fim de curso graças a esta ponte directa e sem processos burocráticos."
    }
  },
  {
    id: "exb-7",
    title: "EX-07: Feira Científica e Empresarial de Geociências",
    theme: "Exposição / Geral",
    description: "Espaço empresarial integrando exposição comercial de marcas do setor, projectos estudantis originais e soluções de engenharia mineral circular.",
    exhibitor: "Delegação de Negócios Energéticos do ISPTEC",
    exhibitor_contact: "feira.empresas@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Como as empresas locais encaram esta mostra integrada?",
      answer_1: "Como uma oportunidade ímpar para validar ideias ousadas de estudantes e capturar parcerias conjuntas de inovação em laboratório.",
      question_2: "Que marcas relevantes marcaram presença presencial?",
      answer_2: "A Sonangol, Pumangol e prestadoras globais enviaram equipas de engenharia e operações para debate em stand de vanguarda.",
      question_3: "Qual o balanço dinâmico do networking em andamento?",
      answer_3: "Extraordinário. Trata-se da maior vitrine académica de Geociências em Angola, unificando a vanguarda científica ao mercado real activo."
    }
  },
  {
    id: "exb-8",
    title: "EX-08: Galeria Fotográfica «Angola Geológica»",
    theme: "Exposição / Geral",
    description: "Exposição fotográfica em alta definição dedicada a cenários de exploração mineral nacional, bacias fluviais, afloramentos e minas históricas de Angola.",
    exhibitor: "Sociedade de Geólogos do ISPTEC",
    exhibitor_contact: "geolink.fotos@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Como o material visual ajuda a documentar a riqueza angolana?",
      answer_1: "Ilustramos a expressiva complexidade deposicional de Angola, desde depósitos clásticos costeiros a intrusões magmáticas complexas de leste.",
      question_2: "Qual a fotografia com melhor feedback estético dos visitantes?",
      answer_2: "Uma vista aérea de alta resolução de uma formação estratificada no deserto costeiro, mostrando ciclos climáticos de milhões de anos.",
      question_3: "Como apoiar e financiar estas missões de campo fotográficas?",
      answer_3: "Os fundos de fomento do ISPTEC apoiam o registo científico ativo de alunos em benefício de dissertações de doutoramento futuras."
    }
  },
  {
    id: "exb-9",
    title: "EX-09: Exposição de Minerais e Fósseis",
    theme: "Exposição / GEO",
    description: "Mostra didática e interactiva cobrindo cristais raros, gemas nacionais angolanas, amostras metalíferas e organismos fósseis históricos bem preservados.",
    exhibitor: "Gabinete de Mineralogia Curricular",
    exhibitor_contact: "fossildoc@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "O que torna esta exposição didática essencial para iniciantes?",
      answer_1: "Reunir numa única bancada mais de 100 espécies de minerais e explicar graficamente as suas durezas, clivagens e condutividades.",
      question_2: "De onde foram extraídas as pedras semi-preciosas?",
      answer_2: "Amostras recolhidas na província da Huíla, do Namibe e de explorações de diamantes de base legal no norte e leste do país.",
      question_3: "Qual a relação dos minerais críticos com o nosso lema?",
      answer_3: "Angola possui lítio, cobalto e minerais de terras raras vitais para baterias elétricas. Mostramos no stand como extrair estes recursos com o menor impacto possível."
    }
  },
  {
    id: "exb-10",
    title: "EX-10: Geo‐Tech Expo com Demonstrações Tecnológicas",
    theme: "Exposição / Geral",
    description: "Ensaios reais de processamento de sinais, modelação numérica tridimensional de falhas e mapeamento integrado raster e vectorial por drones térmicos.",
    exhibitor: "Laboratório de Sistemas de Informação Geográfica (SIG)",
    exhibitor_contact: "gis.drone@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Como os drones térmicos estão a inovar as geociências?",
      answer_1: "Eles nos deixam identificar assinaturas termais de afloramentos com rápida identificação de humidade residual e fraquezas de cisalhamento.",
      question_2: "Qual a suite computacional demonstrada ao vivo?",
      answer_2: "Demonstrámos o uso integrado de software de topografia digital com exportações raster para modelações hidrológicas tridimensionais operacionais.",
      question_3: "De que forma esta automação mitiga os custos de mapeamento?",
      answer_3: "Reduz o tempo de campanhas de equipas de meses para escassas horas de mapeamento coordenado a partir do ar com precisão centimétrica."
    }
  },
  {
    id: "exb-11",
    title: "EX-11: Painel de Talentos ISPTEC",
    theme: "Exposição / Geral",
    description: "Mostra competitiva avaliando e selecionando as melhores patentes e ideias de negócio estudantis perante representantes e engenheiros de multinacionais.",
    exhibitor: "Comissão Científica Executiva SAGEO",
    exhibitor_contact: "comissao.talentos@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Como funciona a avaliação dos jurados convidados?",
      answer_1: "Os representantes de empresas preenchem formulários de conformidade técnica pontuando a aplicabilidade económica e a maturidade tecnológica.",
      question_2: "Que prémios serão atribuídos aos modelos vencedores?",
      answer_2: "Bolsas de estágio integrais na indústria de energia, financiamento do protótipo no laboratório e mentoria executiva de topo.",
      question_3: "Qual a qualidade média observada nos concorrentes?",
      answer_3: "Excecional. Os estudantes de geociências do ISPTEC apresentam consistência científica sólida e visão mercadológica assertiva e comercial."
    }
  },
  {
    id: "exb-12",
    title: "EX-12: Sessão de Pósteres e Defesa de Projectos",
    theme: "Exposição / Geral",
    description: "Espaço aberto de apresentação e defesa pública de teses académicas, relatórios de estágio integrado e resumos de teses de fim de curso.",
    exhibitor: "Candidatos ao TCC ISPTEC",
    exhibitor_contact: "defesa.post@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Quais os temas predominantes nesta ronda de defesas?",
      answer_1: "Otimização de rotas de escoamento de ramas, filtragem sísmica, mineração sustentável de quartzo e lógicas estocásticas de reservório.",
      question_2: "Como estes posters enriquecem o debate nacional de geociências?",
      answer_2: "Eles compilam investigação recente e fornecem caminhos técnicos aplicáveis em Angola sem necessidade de licenciamento internacional.",
      question_3: "Há abertura para o público externa assistir às defesas?",
      answer_3: "Sim, todos os estudantes de outras instituições académicas e quadros seniores corporativos são muito bem-vindos a participar e questionar."
    }
  },
  {
    id: "exb-13",
    title: "EX-13: Mostra Tecnológica com Softwares de Geofísica",
    theme: "Exposição / GEO",
    description: "Estações computacionais ativas dedicadas ao processamento sísmico integrado, análise de poço e modelação tridimensional estrutural.",
    exhibitor: "Núcleo de Geofísica Computacional",
    exhibitor_contact: "geo.software@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Que softwares líderes de mercado estão acessíveis aos visitantes?",
      answer_1: "Demonstrámos workflows avançados nas ferramentas integradas de geo-modelagem de maior prestígio utilizadas nos gabinetes das operadoras.",
      question_2: "Os estudantes já saem daqui habilitados nessas ferramentas?",
      answer_2: "O currículo do ISPTEC garante horas extensas de treino nestas suites, e no stand os visitantes podem executar importações rápidas.",
      question_3: "Qual a relevância de dominar estes softwares no mercado global?",
      answer_3: "Vital. O processamento sísmico define onde perfurar poços milionários. Errar a modelação informática significa desperdiçar recursos enormes."
    }
  },
  {
    id: "exb-14",
    title: "EX-14: Maquetes Interativas de Sistemas Petrolíferos",
    theme: "Exposição / EPT",
    description: "Modelos tridimensionais à escala física real de FPSOs operacionais, plataformas semi-submersíveis e sistemas integrados de elevação artificial.",
    exhibitor: "Equipa de Maquetes do DCC",
    exhibitor_contact: "maquetes.petroliferas@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Quais as mecânicas das maquetes interativas?",
      answer_1: "Temos modelos secionados que mostram em tempo real a circulação de lamas de perfuração, com eixos motorizados mostrando o gas-lift.",
      question_2: "Que materiais foram seleccionados para a maquete?",
      answer_2: "Acrílicos de alta densidade usinados por CNC, conexões elétricas de microcontroladores integrados e impressão 3D de alta gama.",
      question_3: "Como esse protótipo apoia a aprendizagem visual estudantil?",
      answer_3: "A engenharia no mar é invisível aos olhos curtos. Ver a plataforma à nossa escala descomprime os conceitos espaciais mecânicos."
    }
  },
  {
    id: "exb-15",
    title: "EX-15: Exposição de Empresas de Serviços e Operadoras",
    theme: "Exposição / Geral",
    description: "Bancadas e stands de operadoras multinacionais petrolíferas e prestadoras de serviços petrolíferos cooperativas integradas ao ISPTEC.",
    exhibitor: "Petrolíferas Nacionais e Internacionais",
    exhibitor_contact: "comissao.patrocinios@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Qual a visão das operadoras seniores perante os engenheiros angolanos?",
      answer_1: "Há um imenso apreço pelo rigor curricular do ISPTEC. Procuramos profissionais versáteis que unifiquem geologia à transformação eletrónica em curso.",
      question_2: "Que programas de estágios estão abertos nas operadoras parceiras?",
      answer_2: "Estágios integrados na equipa operacional de reservatórios em terra, química em laboratório e planeamento de segurança operacional.",
      question_3: "Qual a melhor via para se candidatar de imediato?",
      answer_3: "Submeter dados curriculares reais no ecrã de recrutamento ou deixar os contactos estudantis nos stands presenciais."
    }
  },
  {
    id: "exb-16",
    title: "EX-16: Mostra de Maquetes Geológicas e Protótipos Tecnológicos",
    theme: "Exposição / GEO",
    description: "Modelos geomecânicos simulando dobras de bacias, ensaios de gravimetria detalhada e inovadoras propostas para geoturismo pedagógico.",
    exhibitor: "Clubes de Geologia e Mestrado ISPTEC",
    exhibitor_contact: "geostruct@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "Como conceberam este modelo de evolução geoturística?",
      answer_1: "Identificámos e registámos as falhas e grutas nacionais de extrema relevância, promovendo mapas pedagógicos para fomento turístico.",
      question_2: "Que sensores foram montados para o teste estrutural de dobras?",
      answer_2: "Sensores de tensão que mostram o limite crítico de rutura de camadas lodosas sob compressão axial severa.",
      question_3: "Quem patrocina estas iniciativas de mestrado e doutoramento?",
      answer_3: "Parcerias de amparo curricular da SAGEO que incentivam a criação de bibliotecas físicas de modelos reais de Angola."
    }
  },
  {
    id: "exb-17",
    title: "EX-17: Exposição de equipamento de perfuração",
    theme: "Exposição / EPT",
    description: "Mostra didática fática e táctil contendo brocas de diamante reais raras de poços profundos, camisas de aço de última geração e tubulações industriais.",
    exhibitor: "Delegação Técnica de Sondagens Mecânicas",
    exhibitor_contact: "bits.ept@isptec.co.ao",
    photos: [
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"
    ],
    interview: {
      question_1: "O que mais espanta o público ao interagir com as brocas de diamante?",
      answer_1: "O peso brutal dos materiais e a sofisticada engenharia de corte necessária para transpor as camadas mais consolidadas sem deformação.",
      question_2: "De que operadoras parceiras foram obtidos os equipamentos reais?",
      answer_2: "Doação de parceiros técnicos para amparo prático pedagógico nas oficinas do nosso campus ISPTEC.",
      question_3: "Qual o conselho principal para os futuros profissionais do mar?",
      answer_3: "A perfuração exige resiliência máxima, precisão estocástica e respeito inabalável às regras severas de segurança."
    }
  }
];

export const THEMATIC_AXES: ThematicAxis[] = [
  {
    id: "axis-1",
    title: "Transição Energética e Futuro Energético",
    description: "Aborda o papel pioneiro de Angola na economia de baixo carbono, descarbonização de operações upstream, energias renováveis (solar, hídrica e eólica), hidrogénio verde, geotermia e debate rumo à matriz diversificada."
  },
  {
    id: "axis-2",
    title: "Inteligência Artificial e Transformação Digital",
    description: "Explora o uso de machine learning aplicado para interpretação sísmica e de dados de poço, digital twins, automação profunda de refinarias e geofísica assistida por inteligência artificial estruturada."
  },
  {
    id: "axis-3",
    title: "Minerais Críticos e Recursos Estratégicos",
    description: "Mapeamento das províncias metalogenéticas de Angola, o potencial do Pré-Sal e do Cinturão de Cobre do Leste, exploração de lítio, cobalto, cobre, terras raras (ex: Projeto Longonjo no Huambo) e sua relevância de base para infraestruturas verdes."
  },
  {
    id: "axis-4",
    title: "Geofísica e Tecnologias de Exploração",
    description: "Geofísica moderna de exploração (sísmica, gravimetria, geomagnetismo e interpretação), geoquímica orgânica avançada casada com a avaliação de sistemas petrolíferos de bacias nacionais (Kwanza e Lower Congo)."
  },
  {
    id: "axis-5",
    title: "Petróleo Offshore e Engenharia Petrolífera",
    description: "Exploração offshore em águas profundas e ultra profundas, engenharia de reservatórios digitais, perfuração de poços de alto pânico físico, processos industriais, comissionamento de poços e refino."
  }
];

export const BRAIN_IDEAS: BrainstormingIdea[] = [
  {
    id: "idea-g1",
    author: "Geral",
    title: "Transição energética e o futuro da indústria petrolífera",
    description: "Estudo sobre como as oscilações do mercado mundial e políticas ecológicas redefinem os horizontes de rentabilidade das operadoras em Angola."
  },
  {
    id: "idea-g2",
    author: "Geral",
    title: "Gestão ambiental nas indústrias extrativas",
    description: "Técnicas de tratamento eficaz de lodos e lamas salinas, mitigação de efluentes no offshore e proteção biológica marinha."
  },
  {
    id: "idea-lub-1",
    author: "Lubazandio",
    title: "Minerais Estratégicos e o Papel de Angola na Transição Energética Mundial",
    suggested_guests: "Endiama, Ministério dos Recursos Minerais",
    description: "Mapeamento geoestratégico de recursos minerais para fabrico de baterias e eletrónicos verdes sob alta análise curricular."
  },
  {
    id: "idea-lub-2",
    author: "Lubazandio",
    title: "Exploração Offshore em Águas Profundas: Desafios Tecnológicos e Ambientais",
    suggested_guests: "TotalEnergies, Exxonmobil",
    description: "Análise profunda de cabeças de poços submarinas marinhas sob pressões colossais, controlo de kick de gás e conformações ecológicas."
  },
  {
    id: "idea-lub-3",
    author: "Lubazandio",
    title: "Geofísica Moderna: Como os Dados Sísmicos Estão a Revolucionar a Exploração",
    suggested_guests: "Schlumberger ou Baker Hughes",
    description: "Discussão das maiores e melhores suites computacionais com processamento integrado 3D de reflectância acústica de subsolo marinho."
  },
  {
    id: "idea-lub-4",
    author: "Lubazandio",
    title: "Economia do petróleo: o futuro dos blocos em águas ultra profundas",
    description: "Simulações de fomento financeiro, margens de risco exploratórias e taxas de recuperação assistida de óleo em reservatórios profundos."
  },
  {
    id: "idea-lub-5",
    author: "Lubazandio",
    title: "Técnicas de comissionamento de poços",
    suggested_guests: "EXPRO",
    description: "Estudo de etapas sequenciais cruciais e fluxos de segurança aplicados sobre novos furos petrolíferos antes da entrada de produção."
  },
  {
    id: "idea-tek-1",
    author: "Teka",
    title: "Estudos de Caso de Falhas: Análise de acidentes históricos e lições aprendidas em engenharia e segurança",
    description: "Uma análise fática dos maiores sinistros em plataformas petrolíferas mundiais para retirar lições e guias preventivos para Angola."
  },
  {
    id: "idea-tek-2",
    author: "Teka",
    title: "O Futuro do Setor (Painel Principal): Debate sobre o papel do petróleo no mix energético mundial em 2030-2050",
    description: "Mesa magna discutindo a velocidade real da descarbonização e o fornecimento seguro de energia à sociedade industrial."
  },
  {
    id: "idea-tek-3",
    author: "Teka",
    title: "Histórias de Alunos e Mentorias: Mesa-redonda com ex-alunos (alumni) a partilhar os seus percursos profissionais",
    description: "Ponte informal extremamente produtiva de partilha de e-mails, processos e guias para estágios e exames de admissão."
  },
  {
    id: "idea-tek-4",
    author: "Teka",
    title: "Maratonas de Ideias (Datathons): Palestras dinâmicas de 15 minutos ao estilo TED Talks com foco em inovação",
    description: "Sessões dinâmicas de pitch técnico onde estudantes expõem soluções de programação aplicáveis a poços de alta viscosidade."
  },
  {
    id: "idea-tek-5",
    author: "Teka",
    title: "Sessões de Apresentação de Pósteres: Espaço para os estudantes defenderem os seus projetos de investigação",
    description: "Exposição de banners e defesas públicas em frente a jurados de topo do MIREMPET e petroleiras locais."
  },
  {
    id: "idea-mir-1",
    author: "Mirian",
    title: "Angola no mercado global do petróleo: desafios e perspectivas 2025–2035",
    suggested_speaker: "Técnico Sénior da Sonangol E&P (Divisão de Exploração ou Geologia de Produção)",
    content: "Situação actual da produção angolana, reservas, novos blocos e estratégia da Sonangol para a próxima década.",
    description: "Estudo pormenorizado do regime concessionário e metas da agência reguladora e da operadora de bandeira Sonangol."
  },
  {
    id: "idea-mir-2",
    author: "Mirian",
    title: "Transição energética e o papel de Angola na economia de baixo carbono",
    suggested_speaker: "Docente do ISPTEC / Técnica do Ministério da Energia e Águas (MINEA)",
    content: "Política energética nacional, metas de diversificação e papel das energias renováveis no mix angolano.",
    description: "Metas de sustentabilidade elétrica, eletrificação do interior e projetos de parques solares em Angola."
  },
  {
    id: "idea-mir-3",
    author: "Mirian",
    title: "Minerais críticos em Angola: Potencial do Pré-Sal e do Cinturão de Cobre do Leste",
    suggested_speaker: "Técnico da ENDIAMA ou do MIREMPET",
    content: "Mapeamento dos recursos minerais críticos angolanos (lítio, cobalto, cobre, terras raras) e sua relevância para a indústria de baterias e electrodomésticos verdes.",
    description: "Roteiro tecnológico e geomecânico focado na transição verde das cadeias produtivas de Angola."
  },
  {
    id: "idea-mir-4",
    author: "Mirian",
    title: "Geoquímica orgânica e avaliação de sistemas petrolíferos angolanos",
    suggested_speaker: "Docente do ISPTEC ou Técnico da Sonangol Pesquisa & Produção / Sonangol I&C",
    content: "Metodologias de avaliação de rochas geradoras (Rock Eval, biomarcadores, BRo), com casos de estudo das bacias Kwanza e Lower Congo.",
    description: "Ensaios de pirólise computadorizados, mapeamento térmico de xistos e refinaria orgânica profunda."
  },
  {
    id: "idea-mir-5",
    author: "Mirian",
    title: "Energia renovável e hidrogénio verde em Angola: oportunidades e desafios",
    suggested_speaker: "Técnico do Ministério da Energia e Recursos (MINERES) / PRODEL (Gabinete de Energias Renováveis e Eficiência Energética)",
    content: "Potencial solar, hídrico e eólico de Angola; perspectivas do hidrogénio verde como vector de exportação energética.",
    description: "Análise hidrografia do rio Kwanza para fomento de matrizes de hidrólise limpas voltadas para a exportação sustentável."
  },
  {
    id: "idea-roc-1",
    author: "Rocélio",
    title: "Geologia de Angola: das Bacias Sedimentares ao Potencial de Recursos",
    description: "Roteiro didático pelas sequências sedimentares, sills vulcânicos e bacias de rift costeiras de alta relevância exploradora."
  },
  {
    id: "idea-roc-2",
    author: "Rocélio",
    title: "Engenharia de Reservatórios na Era Digital: IA, Simulação e Dados",
    description: "Modelos dinâmicos de fluxo numérico de óleo em meios porosos assistidos por algoritmos de Machine Learning."
  },
  {
    id: "idea-roc-3",
    author: "Rocélio",
    title: "Geofísica de Exploração: Sísmica, Gravimetria e Interpretação",
    description: "Oficina prática sobre calibração de dados sísmicos, inversão acústica estrutural e filtragem tridimensional de ruídos."
  },
  {
    id: "idea-roc-4",
    author: "Rocélio",
    title: "Perfuração de Poços em Águas Profundas: Tecnologias e Desafios Operacionais",
    description: "Estudo matemático de pressões em poço de profundidade severa (HPHT), reologia de lamas e ancoragens subaquáticas."
  },
  {
    id: "idea-roc-5",
    author: "Rocélio",
    title: "Processos Industriais e Tratamento de Fluídos Petrolíferos: da Produção ao Refino",
    description: "Dimensionamento de eixos separadores gas-oil-water, desidratação química profunda e tratamento primário de resíduos biológicos."
  },
  {
    id: "idea-roc-6",
    author: "Rocélio",
    title: "Transição Energética e o Futuro do Engenheiro Angolano",
    description: "Foco nas competências requeridas de transição entre o engenheiro clássico de upstream e o profissional multipropósito de baixo carbono."
  },
  {
    id: "idea-roc-7",
    author: "Rocélio",
    title: "Carreiras em Geociências: Trajectórias, Oportunidades e o Mercado Global",
    description: "Análise histórica e comparativa de perfis ISPTEC bem sucedidos internacionalmente."
  },
  {
    id: "idea-edv-1",
    author: "Edvânio",
    title: "O Futuro do Upstream Angolano na Era da Transição Energética",
    description: "Estratégias de mitigação da queima de gás tocha, eficiência ecológica de plataformas e otimização de furos exploradores."
  },
  {
    id: "idea-edv-2",
    author: "Edvânio",
    title: "Sustentabilidade & Inovação: CCS, descarbonização e técnicas avançadas de recuperação",
    description: "Visão técnica sobre captura e sequestro de carbono (Carbon Capture and Storage) assistida por simulação geofísica."
  },
  {
    id: "idea-edv-3",
    author: "Edvânio",
    title: "Monetização do Gás Natural e o seu papel estratégico como combustível de transição para impulsionar a matriz econômica de Angola",
    description: "Delineamento econômico da cadeia de transporte e purificação do gás associado angolano."
  },
  {
    id: "idea-edv-4",
    author: "Edvânio",
    title: "Inovações em Inteligência artificial, Digital Twins, Automação e Mini-Curso prático de Machine Learning Aplicado à Interpretação Sísmica",
    description: "Modelação estocástica baseada em python para identificação automática de falhas, arenitos de reservatório e sal estrutural do Pré-Sal."
  },
  {
    id: "idea-edv-5",
    author: "Edvânio",
    title: "Estudos promissores sobre Geotermia, Hidrogênio e o papel crucial do geólogo no cenário de diversificação da matriz energética angolana",
    description: "Exploração de reservatórios geotermais fósseis nacionais e mapeamento de gradientes térmicos com termografia por satélite."
  },
  {
    id: "idea-edv-6",
    author: "Edvânio",
    title: "Debate sobre a guinada rumo aos elementos essenciais para a transição energética global",
    description: "Análise de resiliência e viabilidade comercial de baterias alcalinas, carros verdes e o impacto imediato sobre Angola."
  },
  {
    id: "idea-edv-7",
    author: "Edvânio",
    title: "Prospecção de Futuro: Migração de esforços para a identificação de minerais críticos",
    description: "Como adequar a capacitação académica de mecânica de poços para operações industriais de mineração sólida de terras raras."
  },
  {
    id: "idea-eli-1",
    author: "Eliúd",
    title: "O papel da Sonangol e das multinacionais na descarbonização das operações de upstream em Angola",
    description: "Análise analítica de relatórios corporativos ESG, fomento ecológico de plataformas offshore e metas estipuladas ao nível estatal."
  },
  {
    id: "idea-eli-2",
    author: "Eliúd",
    title: "Províncias Metalogenéticas de Angola: Onde estão e como mapear os minerais do futuro?",
    description: "Geolocalização de pegmatitos litiníferos, kimberlitos de topo e complexos metalíferos no sul-leste angolano."
  },
  {
    id: "idea-eli-3",
    author: "Eliúd",
    title: "Estudo de Caso: O Projeto de Terras Raras de Longonjo (Huambo) e a inserção de Angola na cadeia global de alta tecnologia",
    description: "Revisão prática das lógicas de refinação de neodímio, certificações e contratos comerciais de alta-tecnologia mundial."
  },
  {
    id: "idea-eli-4",
    author: "Eliúd",
    title: "Inteligência Artificial e Machine Learning aplicados à prospeção mineral e modelação de sistemas aquíferos",
    description: "Mapeamento algorítmico multicamadas unificando georradar, imagiologia por satélite e dados estocásticos de lençol freático."
  }
];
