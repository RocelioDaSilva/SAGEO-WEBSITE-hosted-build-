import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  ComposedChart, 
  Line 
} from 'recharts';
import { Event, Registration } from '../types';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Award, 
  CheckCircle, 
  UserCheck, 
  PieChart as PieIcon, 
  Flame, 
  Hourglass,
  Layers
} from 'lucide-react';

interface OrganizerDashboardProps {
  events: Event[];
  registrations: Registration[];
}

export default function OrganizerDashboard({ events, registrations }: OrganizerDashboardProps) {
  
  // 1. STATS CALCULATIONS
  const stats = useMemo(() => {
    const totalRegs = registrations.length;
    const confirmedRegs = registrations.filter(r => r.confirmed);
    const totalConfirmed = confirmedRegs.length;
    const totalCheckins = registrations.filter(r => r.checked_in).length;
    
    // Overall turnout rate percentage
    const turnoutRate = totalConfirmed > 0 ? Math.round((totalCheckins / totalConfirmed) * 100) : 0;
    
    // Calculate registrations by event
    const regsByEventMap: Record<string, number> = {};
    const checkinsByEventMap: Record<string, number> = {};
    
    registrations.forEach(r => {
      if (r.confirmed) {
        regsByEventMap[r.event_id] = (regsByEventMap[r.event_id] || 0) + 1;
        if (r.checked_in) {
          checkinsByEventMap[r.event_id] = (checkinsByEventMap[r.event_id] || 0) + 1;
        }
      }
    });

    // Build event popularity metrics
    const eventMetrics = events.map(evt => {
      const registeredCount = regsByEventMap[evt.id] || 0;
      // Use either tracked check-ins or completed report attendance as fallback
      const actualAttendance = checkinsByEventMap[evt.id] || (evt.is_completed ? evt.report?.attendance || 0 : 0);
      const capacity = evt.capacity || 1;
      const fillRate = Math.round((registeredCount / capacity) * 100);
      const attendanceRate = registeredCount > 0 ? Math.round((actualAttendance / registeredCount) * 100) : 0;

      return {
        id: evt.id,
        title: evt.title.replace(/^[^-]+-\d+:\s*/, '').slice(0, 32) + (evt.title.length > 32 ? '...' : ''),
        fullTitle: evt.title,
        category: evt.category,
        capacity,
        registered: registeredCount,
        attendance: actualAttendance,
        fillRate: Math.min(fillRate, 100),
        attendanceRate: Math.min(attendanceRate, 100),
      };
    });

    // Sort popular events (by registered count)
    const topPopularEvents = [...eventMetrics]
      .sort((a, b) => b.registered - a.registered)
      .slice(0, 6);

    // Distribution by course/department
    const courseDistributionMap: Record<string, number> = {};
    const courseCheckinMap: Record<string, number> = {};
    
    registrations.forEach(r => {
      if (r.confirmed) {
        const course = r.course || 'Outros';
        courseDistributionMap[course] = (courseDistributionMap[course] || 0) + 1;
        if (r.checked_in) {
          courseCheckinMap[course] = (courseCheckinMap[course] || 0) + 1;
        }
      }
    });

    const courseData = Object.entries(courseDistributionMap).map(([name, count]) => {
      const checkins = courseCheckinMap[name] || 0;
      return {
        name: name.replace('Engenharia de ', 'Eng. ').replace('Engenharia ', 'Eng. '),
        fullName: name,
        vagas: count,
        checkins,
      };
    }).sort((a, b) => b.vagas - a.vagas).slice(0, 5);

    // Distribution by category
    const categoryStatsMap: Record<string, { regs: number; checkins: number; count: number }> = {};
    events.forEach(evt => {
      const cat = evt.category || 'Geral';
      if (!categoryStatsMap[cat]) {
        categoryStatsMap[cat] = { regs: 0, checkins: 0, count: 0 };
      }
      categoryStatsMap[cat].count += 1;
      categoryStatsMap[cat].regs += regsByEventMap[evt.id] || 0;
      categoryStatsMap[evt.category || 'Geral'].checkins += checkinsByEventMap[evt.id] || (evt.is_completed ? evt.report?.attendance || 0 : 0);
    });

    const categoryData = Object.entries(categoryStatsMap).map(([category, data]) => {
      const avgRegs = data.count > 0 ? Math.round(data.regs / data.count) : 0;
      const totalAtt = data.checkins;
      
      let formattedCategoryName = category;
      switch (category) {
        case 'grande_exposicao': formattedCategoryName = 'Grande Exposição'; break;
        case 'workshop': formattedCategoryName = 'Workshops Práticos'; break;
        case 'mini_curso': formattedCategoryName = 'Mini Cursos'; break;
        case 'concurso': formattedCategoryName = 'Concursos SAGEO'; break;
        case 'mesa_redonda': formattedCategoryName = 'Mesas Redondas'; break;
        case 'cultural': formattedCategoryName = 'Atividades Culturais'; break;
        case 'palestra': formattedCategoryName = 'Palestras Gerais'; break;
        case 'integracao': formattedCategoryName = 'Sessões Integração'; break;
      }

      return {
        category: formattedCategoryName,
        avgRegistrations: avgRegs,
        totalAttendance: totalAtt,
        eventCount: data.count,
      };
    });

    // Attendance Trends by Event Date
    const dateAttendanceMap: Record<string, { checkins: number; regs: number }> = {};
    events.forEach(evt => {
      const dateStr = evt.date; // YYYY-MM-DD
      if (!dateAttendanceMap[dateStr]) {
        dateAttendanceMap[dateStr] = { checkins: 0, regs: 0 };
      }
      dateAttendanceMap[dateStr].regs += regsByEventMap[evt.id] || 0;
      dateAttendanceMap[dateStr].checkins += checkinsByEventMap[evt.id] || (evt.is_completed ? evt.report?.attendance || 0 : 0);
    });

    const dateTimelineData = Object.entries(dateAttendanceMap).map(([date, data]) => {
      // Format YYYY-MM-DD to DD/MM
      const parts = date.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
      return {
        dateStr: formattedDate,
        rawDate: date,
        inscritos: data.regs,
        comparência: data.checkins,
      };
    }).sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    // Waitlist weight
    const isPopularChamp = topPopularEvents[0];

    return {
      totalRegs,
      totalConfirmed,
      totalCheckins,
      turnoutRate,
      topPopularEvents,
      courseData,
      categoryData,
      dateTimelineData,
      champEvent: isPopularChamp ? isPopularChamp.fullTitle : 'Nenhum',
      champCount: isPopularChamp ? isPopularChamp.registered : 0,
    };
  }, [events, registrations]);

  // Color palette for Pie Charts
  const PIE_COLORS = ['#dfac34', '#06b6d4', '#d946ef', '#f59e0b', '#3b82f6'];

  return (
    <div className="space-y-8 animate-fade-in text-slate-200">
      
      {/* 1. ROW OF EXECUTIVE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="glass-morphic bg-slate-900/40 border border-[#dfac34]/15 p-5 rounded-2xl relative overflow-hidden group hover:border-[#dfac34]/30 transition-all duration-300">
          <div className="absolute right-3.5 top-3.5 text-slate-800/60 group-hover:text-[#dfac34]/20 transition-colors">
            <Users className="w-12 h-12" />
          </div>
          <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold tracking-wider">Inscritos Totais</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-serif font-black text-white">{stats.totalRegs}</span>
            <span className="text-xs text-[#dfac34] font-medium">({stats.totalConfirmed} confirmados)</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-sans">
            Registos consolidados em toda a rede de cursos
          </p>
        </div>

        <div className="glass-morphic bg-slate-900/40 border border-[#dfac34]/15 p-5 rounded-2xl relative overflow-hidden group hover:border-[#dfac34]/30 transition-all duration-300">
          <div className="absolute right-3.5 top-3.5 text-slate-800/60 group-hover:text-[#dfac34]/20 transition-colors">
            <UserCheck className="w-12 h-12" />
          </div>
          <p className="text-[10px] font-mono text-[#dfac34] uppercase font-bold tracking-wider">Taxa de Presença (Turnout)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-serif font-black text-[#dfac34]">{stats.turnoutRate}%</span>
            <span className="text-xs text-emerald-400 font-medium">({stats.totalCheckins} check-ins)</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-sans">
            Comunicação instantânea de QR Code validada
          </p>
        </div>

        <div className="glass-morphic bg-slate-900/40 border border-[#dfac34]/15 p-5 rounded-2xl relative overflow-hidden group hover:border-[#dfac34]/30 transition-all duration-300">
          <div className="absolute right-3.5 top-3.5 text-slate-800/60 group-hover:text-[#dfac34]/20 transition-colors">
            <Flame className="w-12 h-12" />
          </div>
          <p className="text-[10px] font-mono text-amber-500 uppercase font-bold tracking-wider">Evento mais Popular</p>
          <div className="mt-2 truncate">
            <span className="text-sm font-serif font-black text-white block truncate" title={stats.champEvent}>
              {stats.champEvent}
            </span>
            <span className="text-xs text-slate-400 font-semibold mt-1 inline-block">
              {stats.champCount} Estudantes Inscritos
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">
            Maior aglomeração letiva do secretariado
          </p>
        </div>

        <div className="glass-morphic bg-slate-900/40 border border-[#dfac34]/15 p-5 rounded-2xl relative overflow-hidden group hover:border-[#dfac34]/30 transition-all duration-300">
          <div className="absolute right-3.5 top-3.5 text-slate-800/60 group-hover:text-[#dfac34]/20 transition-colors">
            <Calendar className="w-12 h-12" />
          </div>
          <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold tracking-wider">Atividades no Cronograma</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-serif font-black text-white">{events.length}</span>
            <span className="text-xs text-slate-400">({events.filter(e => e.is_completed).length} concluídas)</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-sans">
            Palestras, mini-cursos e competições no ISPTEC
          </p>
        </div>

      </div>

      {/* 2. MAIN CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CHART A: POPULARITY BY REGISTRATIONS & CAPACITY RESERVATION */}
        <div className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-serif font-black text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#dfac34]" /> Ocupação de Vagas (Top 6 Eventos)
              </h4>
              <p className="text-[10px] text-slate-400 font-sans font-light">Proporção de inscritos confirmados em relação à capacidade útil máxima</p>
            </div>
            <span className="text-[9px] bg-[#dfac34]/10 text-[#dfac34] px-2 py-0.5 rounded border border-[#dfac34]/20 font-mono font-bold">RECHARTS BAR</span>
          </div>

          <div className="h-64 sm:h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.topPopularEvents}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                barCategoryGap={12}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="title" 
                  stroke="#64748b" 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0f1d', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(223, 172, 52, 0.25)',
                    color: '#f8fafc' 
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ fontWeight: 'bold', color: '#dfac34', fontSize: '11px', marginBottom: '4px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={32}
                  iconSize={10}
                  wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                />
                <Bar name="Estudantes Reservados" dataKey="registered" fill="#dfac34" radius={[4, 4, 0, 0]} />
                <Bar name="Lotação Máxima" dataKey="capacity" fill="#1e293b" stroke="rgba(223, 172, 52, 0.2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART B: REAL-TIME COMPARÊNCIA / TURNOUT RATE */}
        <div className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-serif font-black text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Presença Realizada vs Reservas
              </h4>
              <p className="text-[10px] text-slate-400 font-sans font-light">Quantidade de check-ins homologados fisicamente na portaria do ISPTEC</p>
            </div>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-bold">RECHARTS AREA</span>
          </div>

          <div className="h-64 sm:h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.dateTimelineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorInscritos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dfac34" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#dfac34" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorComparência" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="dateStr" 
                  stroke="#64748b" 
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0f1d', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(223, 172, 52, 0.25)',
                    color: '#f8fafc' 
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#dfac34', fontSize: '11px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={32}
                  iconSize={10}
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <Area type="monotone" name="Inscrições Ativas" dataKey="inscritos" stroke="#dfac34" fillOpacity={1} fill="url(#colorInscritos)" strokeWidth={2} />
                <Area type="monotone" name="Check-ins Homologados" dataKey="comparência" stroke="#06b6d4" fillOpacity={1} fill="url(#colorComparência)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. ROW THREE: COURSE ENGAGEMENT & SECTOR SUCCESS RATES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART C: DEPARTMENT / COURSE DONUT DISTRIBUTION */}
        <div className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 rounded-3xl p-6 shadow-xl space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-serif font-black text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#dfac34]" /> Alunos por Curso
              </h4>
              <p className="text-[10px] text-slate-400 font-sans font-light">Divisão das inscrições consolidadas</p>
            </div>
          </div>

          <div className="h-44 w-full flex items-center justify-center relative text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.courseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="vagas"
                >
                  {stats.courseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0f1d', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(223, 172, 52, 0.25)', 
                    fontSize: '11px' 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Absolute center indicator */}
            <div className="absolute text-center flex flex-col justify-center items-center">
              <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider font-bold">Eventos</span>
              <span className="text-xl font-serif font-black text-white">{stats.totalConfirmed}</span>
            </div>
          </div>

          {/* Custom Custom Legend Grid for Pie */}
          <div className="space-y-2 text-xs pt-2 border-t border-slate-800/30">
            {stats.courseData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span className="text-slate-300 truncate font-semibold text-[11px] leading-none" title={item.fullName}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 font-bold shrink-0">
                  <span>{item.vagas} vagas</span>
                  <span className="text-[8px] text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded leading-none">{item.checkins} checks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART D: CATEGORY ENGAGEMENT METRICS */}
        <div className="glass-morphic bg-slate-900/30 border border-[#dfac34]/15 rounded-3xl p-6 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-serif font-black text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#dfac34]" /> Desempenho por Categoria de Evento
              </h4>
              <p className="text-[10px] text-slate-400 font-sans font-light">Média de inscrições e comparência agregadas por formatos letivos da SAGEO</p>
            </div>
          </div>

          <div className="h-68 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={stats.categoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <YAxis stroke="#64748b" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0f1d', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(223, 172, 52, 0.25)',
                    color: '#f8fafc' 
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#dfac34', fontSize: '11px' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
                <Bar name="Média de Inscrições / Evento" dataKey="avgRegistrations" fill="#dfac34" radius={[4, 4, 0, 0]} barSize={18} />
                <Line name="Check-ins Totais Realizados" type="monotone" dataKey="totalAttendance" stroke="#d946ef" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. REAL-TIME RETROSPECTIVE ADVISORY */}
      <div className="p-5 bg-slate-900/10 border border-[#dfac34]/15 rounded-3xl flex flex-col md:flex-row items-center gap-5 justify-between">
        <div className="flex gap-4 items-start text-xs text-left max-w-2xl">
          <div className="p-3 bg-[#dfac34]/10 rounded-2xl border border-[#dfac34]/25 shrink-0 text-[#dfac34]">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h5 className="font-serif font-black text-slate-100 uppercase tracking-wide">Relatório Analítico de Sucesso SAGEO 2026</h5>
            <p className="text-slate-400 font-sans leading-relaxed text-[11px] font-light">
              Com base nos dados integrados, a 3.ª Semana Académica obteve uma taxa global de comparência (turnout) de <strong className="text-[#dfac34] font-bold">{stats.turnoutRate}%</strong>. O maior impulsionador de participação destaca o curso de <strong>Engenharia de Petróleos e Geofísica</strong>, indicando forte sintonia entre a temática de transição energética e os interesses curriculares dos discentes do ISPTEC.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-1 shrink-0 p-3 bg-slate-950/30 border border-slate-850 rounded-2xl min-w-[200px]">
          <span className="text-[9px] uppercase font-mono font-bold text-[#dfac34]">Auditores de Resgaste</span>
          <span className="text-xs font-sans text-slate-400">Total de Registos</span>
          <span className="text-2xl font-serif font-black text-white">{stats.totalRegs}</span>
        </div>
      </div>

    </div>
  );
}
