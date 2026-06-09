import { useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFolders } from '../../controllers/useFolders';
import styles from './Sidebar.module.css';

const navMain = [
  { to: '/',         label: 'Todas las notas', end: true },
  { to: '/pinned',   label: 'Fijadas' },
  { to: '/archived', label: 'Archivadas' },
  { to: '/trash',    label: 'Papelera' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { folders, fetchFolders } = useFolders();

  const [searchParams] = useSearchParams();
  const activeFolderId = searchParams.get('folderId');

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <aside className={styles.sidebar}>

      <div className={styles.top}>
        <div className={styles.logo}>NoteTrack</div>
        <button className={styles.newBtn} onClick={() => navigate('/')}>
          Nueva nota
        </button>
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
                // ← si hay folderId activo, "Todas las notas" no se marca
                `${styles.navItem} ${isActive && !activeFolderId ? styles.active : ''}`
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
          <NavLink
            to="/tags"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            Etiquetas
          </NavLink>

          {folders.map(folder => (
            <NavLink
              key={folder.id}
              to={`/?folderId=${folder.id}`}
              className={() =>
                `${styles.navItem} ${activeFolderId === folder.id ? styles.active : ''}`
              }
            >
              <span
                className={styles.folderDot}
                style={{ background: folder.color }}
              />
              {folder.name}
            </NavLink>
          ))}

          <NavLink
            to="/folders"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            + Gestionar carpetas
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