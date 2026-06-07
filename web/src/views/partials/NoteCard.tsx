import { useState, useRef, useEffect } from 'react';
import type { Note, NoteColor } from '../../types';
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
  onEdit,
  onPin,
  onArchive,
  onUnarchive,
  onSoftDelete,
  onRestore,
  onHardDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const preview = note.content
    ? note.content.slice(0, 160) + (note.content.length > 160 ? '…' : '')
    : null;

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
        <h3 className={styles.title}>{note.title || 'Sin título'}</h3>
        {preview && <p className={styles.preview}>{preview}</p>}
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
