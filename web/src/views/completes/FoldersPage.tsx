import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFolders } from '../../controllers/useFolders';
import ConfirmDialog from '../partials/ConfirmDialog';
import styles from './FoldersPage.module.css';

const PRESET_COLORS = [
  '#8b5cf6', '#3b82f6', '#22c55e', '#eab308',
  '#f97316', '#ef4444', '#ec4899', '#14b8a6',
];

const PRESET_ICONS = ['📁', '📂', '🗂️', '📚', '💡', '🎯', '🔖', '⭐', '🏠', '💼'];

export default function FoldersPage() {
  const { folders, loading, fetchFolders, createFolder, removeFolder } = useFolders();
  const navigate = useNavigate();

  const [showForm,   setShowForm]   = useState(false);
  const [name,       setName]       = useState('');
  const [color,      setColor]      = useState(PRESET_COLORS[0]);
  const [icon,       setIcon]       = useState(PRESET_ICONS[0]);
  const [saving,     setSaving]     = useState(false);
  const [confirmId,  setConfirmId]  = useState<string | null>(null);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createFolder({ name: name.trim(), color, icon });
      setName('');
      setShowForm(false);
    } catch (err) {
      console.error('Error creando carpeta:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await removeFolder(id);
    setConfirmId(null);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Carpetas</h1>
        <button
          id="folders-new-btn"
          className={styles.newBtn}
          onClick={() => setShowForm(p => !p)}
        >
          {showForm ? 'Cancelar' : '+ Nueva carpeta'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form className={styles.form} onSubmit={handleCreate}>
          <input
            id="folder-name-input"
            className={styles.nameInput}
            placeholder="Nombre de la carpeta…"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            maxLength={60}
          />

          <div className={styles.formRow}>
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
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={styles.createBtn}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Creando…' : 'Crear carpeta'}
          </button>
        </form>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && folders.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📁</div>
          <h2 className={styles.emptyTitle}>Sin carpetas</h2>
          <p className={styles.emptyText}>Crea una carpeta para organizar tus notas.</p>
        </div>
      )}

      {/* Folders grid */}
      {!loading && folders.length > 0 && (
        <div className={styles.grid}>
          {folders.map(folder => (
            <div key={folder.id} className={styles.card}>
              <div
                className={styles.cardIcon}
                style={{ background: `${folder.color}22`, borderColor: `${folder.color}44` }}
              >
                <span>{folder.icon}</span>
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.folderName}>{folder.name}</span>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.viewBtn}
                  onClick={() => navigate(`/?folderId=${folder.id}`)}
                  title="Ver notas de esta carpeta"
                >
                  Ver notas
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => setConfirmId(folder.id)}
                  title="Eliminar carpeta"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          title="¿Eliminar carpeta?"
          message="Las notas de esta carpeta no se eliminarán, solo se desasignarán de la carpeta."
          confirmLabel="Eliminar carpeta"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
