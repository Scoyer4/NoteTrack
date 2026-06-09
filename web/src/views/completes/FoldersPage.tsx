import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFolders } from '../../controllers/useFolders';
import ConfirmDialog from '../partials/ConfirmDialog';
import type { Folder } from '../../types';
import styles from './FoldersPage.module.css';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#14b8a6', '#64748b',
];

const PRESET_ICONS = ['📁', '📂', '⭐', '🎯', '💡', '📚', '🔖', '🏠', '💼', '🎨', '🔬', '🛠️'];

export default function FoldersPage() {
  const { folders, loading, fetchFolders, createFolder, deleteFolder } = useFolders();
  const navigate = useNavigate();

  const [name,        setName]        = useState('');
  const [color,       setColor]       = useState(PRESET_COLORS[0]);
  const [icon,        setIcon]        = useState(PRESET_ICONS[0]);
  const [creating,    setCreating]    = useState(false);
  const [error,       setError]       = useState('');
  const [confirmId,   setConfirmId]   = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState('');

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    setCreating(true);
    setError('');
    try {
      await createFolder({ name: name.trim(), color, icon });
      setName('');
    } catch {
      setError('Error al crear la carpeta. Inténtalo de nuevo.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteFolder(confirmId);
    } catch { /* silent */ } finally {
      setConfirmId(null);
    }
  }

  function openFolder(folder: Folder) {
    navigate(`/?folderId=${folder.id}`);
  }

  function askDelete(folder: Folder) {
    setConfirmId(folder.id);
    setConfirmName(folder.name);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>📁 Carpetas</h1>
        <p className={styles.subtitle}>Organiza tus notas en carpetas</p>
      </div>

      {/* Create form */}
      <form className={styles.form} onSubmit={handleCreate}>
        <h2 className={styles.formTitle}>Nueva carpeta</h2>

        <div className={styles.formRow}>
          <input
            id="folder-name-input"
            className={styles.nameInput}
            placeholder="Nombre de la carpeta…"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            maxLength={60}
          />
        </div>

        {/* Icon picker */}
        <div className={styles.pickerGroup}>
          <span className={styles.pickerLabel}>Icono</span>
          <div className={styles.iconGrid}>
            {PRESET_ICONS.map(ic => (
              <button
                key={ic}
                type="button"
                className={`${styles.iconBtn} ${icon === ic ? styles.iconActive : ''}`}
                onClick={() => setIcon(ic)}
                title={ic}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className={styles.pickerGroup}>
          <span className={styles.pickerLabel}>Color</span>
          <div className={styles.colorGrid}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={`${styles.colorDot} ${color === c ? styles.colorActive : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <button
          id="folder-create-btn"
          type="submit"
          className={styles.createBtn}
          disabled={creating || !name.trim()}
        >
          {creating ? 'Creando…' : '+ Crear carpeta'}
        </button>
      </form>

      {/* Folder grid */}
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📂</div>
          <h2 className={styles.emptyTitle}>Sin carpetas todavía</h2>
          <p className={styles.emptyText}>Crea tu primera carpeta arriba para empezar a organizar tus notas.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {folders.map(folder => (
            <div
              key={folder.id}
              className={styles.card}
              style={{
                '--folder-color': folder.color || '#6366f1',
                '--folder-color-dim': `${folder.color || '#6366f1'}15`,
              } as React.CSSProperties}
            >
              {/* Folder tab shape decoration */}
              <div className={styles.folderTab} />
              
              <button
                className={styles.folderCardMain}
                onClick={() => openFolder(folder)}
                title={`Ver notas de "${folder.name}"`}
              >
                <div className={styles.cardIcon} style={{ borderColor: folder.color || '#6366f1' }}>
                  <span className={styles.folderIconText}>{folder.icon || '📁'}</span>
                </div>
                <div className={styles.cardInfo}>
                  <span className={styles.folderName}>{folder.name}</span>
                  <span className={styles.folderSubtitle}>Ver notas</span>
                </div>
              </button>
              
              <div className={styles.cardActions}>
                <button
                  className={styles.deleteBtn}
                  onClick={() => askDelete(folder)}
                  title="Eliminar carpeta"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete */}
      {confirmId && (
        <ConfirmDialog
          title="¿Eliminar carpeta?"
          message={`La carpeta "${confirmName}" será eliminada. Las notas que contiene no se borrarán, pero quedarán sin carpeta asignada.`}
          confirmLabel="Eliminar carpeta"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
