import { useState, useEffect } from 'react';
import { useTags } from '../../controllers/useTags';
import ConfirmDialog from '../partials/ConfirmDialog';
import styles from './TagsPage.module.css';

const PRESET_COLORS = [
  '#8b5cf6', '#3b82f6', '#22c55e', '#eab308',
  '#f97316', '#ef4444', '#ec4899', '#14b8a6',
];

export default function TagsPage() {
  const { tags, loading, fetchTags, createTag, removeTag } = useTags();

  const [showForm,  setShowForm]  = useState(false);
  const [name,      setName]      = useState('');
  const [color,     setColor]     = useState(PRESET_COLORS[0]);
  const [saving,    setSaving]    = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createTag({ name: name.trim(), color });
      setName('');
      setShowForm(false);
    } catch (err) {
      console.error('Error creando etiqueta:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await removeTag(id);
    setConfirmId(null);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Etiquetas</h1>
        <button
          id="tags-new-btn"
          className={styles.newBtn}
          onClick={() => setShowForm(p => !p)}
        >
          {showForm ? 'Cancelar' : '+ Nueva etiqueta'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.formRow}>
            <input
              id="tag-name-input"
              className={styles.nameInput}
              placeholder="Nombre de la etiqueta…"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              maxLength={40}
            />
            <div className={styles.colorRow}>
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
            <button
              type="submit"
              className={styles.createBtn}
              disabled={saving || !name.trim()}
            >
              {saving ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && tags.length === 0 && (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Sin etiquetas</h2>
          <p className={styles.emptyText}>Crea etiquetas para categorizar tus notas fácilmente.</p>
        </div>
      )}

      {/* Tags list */}
      {!loading && tags.length > 0 && (
        <div className={styles.list}>
          {tags.map(tag => (
            <div key={tag.id} className={styles.tagRow}>
              <div className={styles.tagDot} style={{ background: tag.color }} />
              <span className={styles.tagName}>{tag.name}</span>
              <span className={styles.tagDate}>
                {new Date(tag.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <button
                className={styles.deleteBtn}
                onClick={() => setConfirmId(tag.id)}
                title="Eliminar etiqueta"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          title="¿Eliminar etiqueta?"
          message="La etiqueta se eliminará de todas las notas a las que está asignada."
          confirmLabel="Eliminar etiqueta"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
