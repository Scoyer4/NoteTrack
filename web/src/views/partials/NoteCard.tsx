import { useState, useRef, useEffect } from 'react';
import type { Folder, Note, NoteColor, Task } from '../../types';
import { CHECKLIST_MARKER } from '../../types';
import { tasksService } from '../../services/api';
import styles from './NoteCard.module.css';

const NOTE_BG: Record<NoteColor, string> = {
  default: 'var(--note-default)',
  yellow:  'var(--note-yellow)',
  green:   'var(--note-green)',
  blue:    'var(--note-blue)',
  purple:  'var(--note-purple)',
  pink:    'var(--note-pink)',
  red:     'var(--note-red)',
  orange:  'var(--note-orange)',
};

const NOTE_BORDER: Record<NoteColor, string> = {
  default: 'var(--border)',
  yellow:  'rgba(234, 179, 8,   0.3)',
  green:   'rgba(34,  197, 94,  0.3)',
  blue:    'rgba(59,  130, 246, 0.3)',
  purple:  'rgba(139, 92,  246, 0.3)',
  pink:    'rgba(236, 72,  153, 0.3)',
  red:     'rgba(239, 68,  68,  0.3)',
  orange:  'rgba(249, 115, 22,  0.3)',
};

export type CardVariant = 'default' | 'archived' | 'trash';

interface Props {
  note: Note;
  variant?: CardVariant;
  folder?: Folder | null;
  onEdit?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onSoftDelete?: () => void;
  onRestore?: () => void;
  onHardDelete?: () => void;
}

export default function NoteCard({
  note,
  variant = 'default',
  folder,
  onEdit,
  onPin,
  onArchive,
  onUnarchive,
  onSoftDelete,
  onRestore,
  onHardDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tasks,    setTasks]    = useState<Task[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const isChecklist = note.content === CHECKLIST_MARKER;

  useEffect(() => {
    if (!isChecklist) return;
    tasksService.getByNote(note.id).then(setTasks).catch(() => {});
  }, [isChecklist, note.id]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const bg     = NOTE_BG[note.color]     ?? NOTE_BG.default;
  const border = NOTE_BORDER[note.color] ?? NOTE_BORDER.default;

  const date = new Date(note.updated_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short',
  });

  const preview = !isChecklist && note.content
    ? note.content.replace(/<[^>]*>/g, '').slice(0, 160) + (note.content.replace(/<[^>]*>/g, '').length > 160 ? '…' : '')
    : null;

  const PREVIEW_LIMIT = 5;

  return (
    <article
      className={styles.card}
      style={{ background: bg, borderColor: border }}
      onClick={onEdit}
      role={onEdit ? 'button' : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onKeyDown={e => { if (e.key === 'Enter' && onEdit) onEdit(); }}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <div className={styles.pinDot} title="Nota fijada" />
      )}

      <div className={styles.body}>
        <h3 className={styles.title}>
          {note.title || 'Sin título'}
        </h3>

        {folder && (
          <div className={styles.folderBadge} title={folder.name}>
            <span
              className={styles.folderBadgeDot}
              style={{ background: folder.color || '#6366f1' }}
            />
            {folder.icon && <span>{folder.icon}</span>}
            {folder.name}
          </div>
        )}
        {isChecklist && tasks.length > 0 && (
          <div className={styles.taskPreview}>
            {tasks.slice(0, PREVIEW_LIMIT).map(task => (
              <div
                key={task.id}
                className={styles.taskItem}
                onClick={e => {
                  e.stopPropagation();
                  tasksService.update(task.id, { is_completed: !task.is_completed })
                    .then(updated => setTasks(prev => prev.map(t => t.id === task.id ? updated : t)))
                    .catch(() => {});
                }}
              >
                <span className={`${styles.checkDot} ${task.is_completed ? styles.checkDotDone : ''}`} />
                <span className={`${styles.taskLabel} ${task.is_completed ? styles.taskLabelDone : ''}`}>
                  {task.title}
                </span>
              </div>
            ))}
            {tasks.length > PREVIEW_LIMIT && (
              <p className={styles.taskMore}>+{tasks.length - PREVIEW_LIMIT} más</p>
            )}
          </div>
        )}

        {preview && <p className={styles.preview}>{preview}</p>}

        {note.tags && note.tags.length > 0 && (
          <div className={styles.tagChips}>
            {note.tags.map(tag => (
              <span key={tag.id} className={styles.tagChip} style={{ borderColor: tag.color }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer} onClick={e => e.stopPropagation()}>
        <time className={styles.date}>{date}</time>

        <div className={styles.menuWrap} ref={menuRef}>
          <button
            id={`note-menu-${note.id}`}
            className={styles.menuBtn}
            onClick={() => setMenuOpen(p => !p)}
            title="Opciones"
            aria-label="Opciones de nota"
          >
            ⋯
          </button>

          {menuOpen && (
            <div className={styles.menu} role="menu">
              {variant === 'default' && (
                <>
                  {onPin && (
                    <button onClick={() => { onPin(); setMenuOpen(false); }}>
                      {note.is_pinned ? 'Desfijar' : 'Fijar'}
                    </button>
                  )}
                  {onArchive && (
                    <button onClick={() => { onArchive(); setMenuOpen(false); }}>
                      Archivar
                    </button>
                  )}
                  {onSoftDelete && (
                    <button
                      className={styles.danger}
                      onClick={() => { onSoftDelete(); setMenuOpen(false); }}
                    >
                      Mover a papelera
                    </button>
                  )}
                </>
              )}

              {variant === 'archived' && (
                <>
                  {onUnarchive && (
                    <button onClick={() => { onUnarchive(); setMenuOpen(false); }}>
                      Desarchivar
                    </button>
                  )}
                  {onHardDelete && (
                    <button
                      className={styles.danger}
                      onClick={() => { onHardDelete(); setMenuOpen(false); }}
                    >
                      Eliminar definitivamente
                    </button>
                  )}
                </>
              )}

              {variant === 'trash' && (
                <>
                  {onRestore && (
                    <button onClick={() => { onRestore(); setMenuOpen(false); }}>
                      Restaurar
                    </button>
                  )}
                  {onHardDelete && (
                    <button
                      className={styles.danger}
                      onClick={() => { onHardDelete(); setMenuOpen(false); }}
                    >
                      Eliminar definitivamente
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
