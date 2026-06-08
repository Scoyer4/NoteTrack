import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const navMain = [
  { to: '/',         label: 'Todas las notas', end: true },
  { to: '/pinned',   label: 'Fijadas' },
  { to: '/archived', label: 'Archivadas' },
  { to: '/trash',    label: 'Papelera' },
];

const navTasks = [
  { to: '/lists',    label: 'Mis listas' },
  { to: '/calendar', label: 'Calendario' },
];

const navOrg = [
  { to: '/tags', label: 'Etiquetas' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
                `${styles.navItem} ${isActive ? styles.active : ''}`
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
          {navTasks.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={styles.navSection}>
        <span className={styles.label}>Organizar</span>
        <nav>
          {navOrg.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
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