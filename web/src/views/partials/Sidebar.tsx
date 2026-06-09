import { useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTags } from '../../controllers/useTags';
import styles from './Sidebar.module.css';

const navMain = [
  { to: '/',         label: 'Todas las notas', end: true },
  { to: '/archived', label: 'Archivadas' },
  { to: '/trash',    label: 'Papelera' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { tags, fetchTags } = useTags();

  const [searchParams] = useSearchParams();
  const activeTagId = searchParams.get('tagId');

  useEffect(() => { fetchTags(); }, [fetchTags]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <aside className={styles.sidebar}>

      <div className={styles.top}>
        <div className={styles.logo}>NoteTrack</div>
      </div>

      <div className={styles.navSection}>
        <span className={styles.label}>Notas</span>
        <nav>
          {navMain.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive && !activeTagId ? styles.active : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={styles.navSection}>
        <span className={styles.label}>Tareas</span>
        <nav>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            Calendario
          </NavLink>
        </nav>
      </div>

      <div className={styles.navSection}>
        <span className={styles.label}>Organizar</span>
        <nav>

          {tags.map(tag => (
            <NavLink
              key={tag.id}
              to={`/?tagId=${tag.id}`}
              className={() =>
                `${styles.navItem} ${activeTagId === tag.id ? styles.active : ''}`
              }
            >
              <span className={styles.folderDot} style={{ background: tag.color }} />
              {tag.name}
            </NavLink>
          ))}

          <NavLink
            to="/tags"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            + Gestionar etiquetas
          </NavLink>

          <div className={styles.divider} />

          <NavLink
            to="/folders"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            Carpetas
          </NavLink>

        </nav>
      </div>

      <div className={styles.footer}>
        {user && (
          <div className={styles.userBlock}>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

    </aside>
  );
}
