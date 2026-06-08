import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import { tasksService } from '../../services/api';
import { EventClickArg } from '@fullcalendar/core';
import type { Task } from '../../types';
import styles from './CalendarPage.module.css';

interface CalendarEvent {
  id:       string;
  title:    string;
  date:     string;
  color:    string;
  extendedProps: { noteId: string; is_completed: boolean };
}

export default function CalendarPage() {
  const [events,  setEvents]  = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    tasksService.getUpcoming()
      .then((tasks: Task[]) => {
        setEvents(tasks
          .filter(t => t.due_date)
          .map(t => ({
            id:    t.id,
            title: t.title,
            date:  t.due_date!,
            color: t.is_completed ? '#22c55e' : '#7C5FFF',
            extendedProps: {
              noteId:       t.note_id,
              is_completed: t.is_completed,
            },
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleEventClick(info: EventClickArg) {
    navigate(`/?list=${info.event.extendedProps.noteId}`);
  }

  if (loading) return <div className={styles.loading}>Cargando calendario…</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Calendario</h1>
      <div className={styles.calendarWrap}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="es"
          events={events}
          eventClick={handleEventClick}
          height="auto"
          headerToolbar={{
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,dayGridWeek',
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week:  'Semana',
          }}
        />
      </div>
    </div>
  );
}