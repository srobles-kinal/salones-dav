import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ESTADO_COLORS = {
  PENDIENTE: { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-400', dot: 'bg-yellow-500' },
  APROBADA: { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-400', dot: 'bg-green-500' },
  COMPLETADA: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-400', dot: 'bg-blue-500' },
};

const toDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseLocalDate = (str) => {
  // "2026-05-25T10:30:00" → Date local sin shift de timezone
  if (!str) return null;
  const [datePart, timePart] = str.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, mi] = (timePart || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, h, mi);
};

// ===== VISTA MES =====
function MonthView({ currentDate, events, onDayClick, onEventClick }) {
  const grid = useMemo(() => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOffset = firstDay.getDay(); // 0=Dom
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    const cells = [];
    // Días previos del mes anterior
    const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDays - i);
      cells.push({ date: d, inMonth: false });
    }
    // Mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i), inMonth: true });
    }
    // Completar a 6 semanas
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return cells;
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const e of events) {
      const key = toDateKey(parseLocalDate(e.start));
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [events]);

  const today = toDateKey(new Date());

  return (
    <div>
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-t-lg overflow-hidden">
        {DAY_NAMES.map(d => (
          <div key={d} className="bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-600">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-b-lg overflow-hidden">
        {grid.map((cell, i) => {
          const key = toDateKey(cell.date);
          const dayEvents = eventsByDay[key] || [];
          const isToday = key === today;
          return (
            <div
              key={i}
              onClick={() => onDayClick(cell.date)}
              className={`bg-white min-h-[100px] p-1.5 cursor-pointer hover:bg-blue-50 transition-colors ${!cell.inMonth ? 'bg-slate-50' : ''}`}
            >
              <div className={`text-xs font-medium mb-1 flex items-center justify-between ${!cell.inMonth ? 'text-slate-400' : isToday ? 'text-white' : 'text-slate-700'}`}>
                <span className={isToday ? 'bg-muni-primary text-white rounded-full w-6 h-6 inline-flex items-center justify-center' : ''}>
                  {cell.date.getDate()}
                </span>
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-slate-500">+{dayEvents.length - 3}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => {
                  const c = ESTADO_COLORS[ev.estado] || ESTADO_COLORS.PENDIENTE;
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                      className={`text-[10px] px-1 py-0.5 rounded ${c.bg} ${c.text} truncate cursor-pointer hover:opacity-80`}
                      title={ev.title}
                    >
                      {ev.start.split('T')[1]?.slice(0, 5)} · {ev.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== VISTA SEMANA =====
function WeekView({ currentDate, events, onSlotClick, onEventClick }) {
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay()); // Domingo
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [startOfWeek]);

  // Horario operativo de 7am a 7pm
  const hours = Array.from({ length: 13 }, (_, i) => i + 7);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const e of events) {
      const start = parseLocalDate(e.start);
      const key = toDateKey(start);
      if (!map[key]) map[key] = [];
      const end = parseLocalDate(e.end);
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      map[key].push({ ...e, startHour, endHour });
    }
    return map;
  }, [events]);

  const today = toDateKey(new Date());
  const HOUR_HEIGHT = 56; // px

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header con días */}
        <div className="grid border-b border-slate-200 sticky top-0 bg-white z-10" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div></div>
          {days.map((d, i) => {
            const isToday = toDateKey(d) === today;
            return (
              <div key={i} className={`px-2 py-2 text-center border-l border-slate-200 ${isToday ? 'bg-blue-50' : ''}`}>
                <div className="text-xs text-slate-500">{DAY_NAMES[d.getDay()]}</div>
                <div className={`text-lg font-semibold ${isToday ? 'text-muni-primary' : 'text-slate-900'}`}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Grid horario */}
        <div className="grid relative" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          {/* Columna de horas */}
          <div>
            {hours.map(h => (
              <div key={h} className="text-[10px] text-slate-500 text-right pr-2 border-b border-slate-100" style={{ height: HOUR_HEIGHT }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 7 columnas día */}
          {days.map((day, dayIdx) => {
            const key = toDateKey(day);
            const dayEvents = eventsByDay[key] || [];
            return (
              <div key={dayIdx} className="relative border-l border-slate-200">
                {hours.map(h => (
                  <div
                    key={h}
                    onClick={() => onSlotClick(day, h)}
                    className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {/* Eventos absolutamente posicionados */}
                {dayEvents.map(ev => {
                  const top = (ev.startHour - 7) * HOUR_HEIGHT;
                  const height = Math.max(28, (ev.endHour - ev.startHour) * HOUR_HEIGHT - 2);
                  const c = ESTADO_COLORS[ev.estado] || ESTADO_COLORS.PENDIENTE;
                  if (ev.startHour < 7 || ev.startHour >= 20) return null;
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                      className={`absolute left-0.5 right-0.5 ${c.bg} ${c.text} border-l-2 ${c.border} rounded px-1.5 py-1 text-[11px] cursor-pointer overflow-hidden hover:opacity-90`}
                      style={{ top, height }}
                      title={ev.title}
                    >
                      <div className="font-semibold truncate">{ev.title}</div>
                      <div className="text-[10px] opacity-80">{ev.start.split('T')[1]?.slice(0,5)}-{ev.end.split('T')[1]?.slice(0,5)}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function ReservationsCalendar({ events, onCreateReservation, onEventClick }) {
  const [view, setView] = useState('month'); // 'month' | 'week'
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + 7 * dir);
    setCurrentDate(d);
  };

  const handleDayClick = (date) => {
    // En vista mes, click en día → crear reserva ese día a 9am
    const fecha = toDateKey(date);
    onCreateReservation({ fecha, hora_inicio: '09:00', hora_fin: '10:00' });
  };

  const handleSlotClick = (date, hour) => {
    const fecha = toDateKey(date);
    const startH = String(hour).padStart(2, '0') + ':00';
    const endH = String(hour + 1).padStart(2, '0') + ':00';
    onCreateReservation({ fecha, hora_inicio: startH, hora_fin: endH });
  };

  const title = view === 'month'
    ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : (() => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0,3)} - ${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0,3)} ${end.getFullYear()}`;
      })();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
            Hoy
          </button>
          <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Siguiente">
            <ChevronRight size={18} />
          </button>
          <h3 className="text-base font-semibold text-slate-900 ml-2 flex items-center gap-2">
            <CalIcon size={18} className="text-muni-primary" />
            {title}
          </h3>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${view === 'month' ? 'bg-white shadow text-muni-primary' : 'text-slate-600'}`}
          >Mes</button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${view === 'week' ? 'bg-white shadow text-muni-primary' : 'text-slate-600'}`}
          >Semana</button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mb-3 text-xs flex-wrap">
        {Object.entries(ESTADO_COLORS).map(([estado, c]) => (
          <div key={estado} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`}></span>
            <span className="text-slate-600">{estado}</span>
          </div>
        ))}
      </div>

      {view === 'month' ? (
        <MonthView
          currentDate={currentDate}
          events={events}
          onDayClick={handleDayClick}
          onEventClick={onEventClick}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          events={events}
          onSlotClick={handleSlotClick}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
}
