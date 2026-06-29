import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determining the navigation links based on the user's role
  const getNavLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard' },
          { path: '/admin/tickets', label: 'Tickets' },
          { path: '/admin/visitors', label: 'Visitors' },
          { path: '/admin/finances', label: 'Finances' },
          { path: '/admin/community', label: 'Community' },
          { path: '/admin/directory', label: 'Directory' },
        ];
      case 'resident':
        return [
          { path: '/resident/feed', label: 'Community Feed' },
          { path: '/resident/notices', label: 'Society Notices' },
          { path: '/resident/finances', label: 'My Finances' },
          { path: '/resident/visitors', label: 'My Visitors' },
          { path: '/resident/directory', label: 'Directory' },
        ];
      case 'guard':
        return [
            { path: '/guard/dashboard', label: 'Visitor Logs' },
            { path: '/guard/directory', label: 'Society Directory' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();
  return (
    <div
        style={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: '#f4f6f9'
        }}
    >
      {/* Displaying the sidebar navigation */}
      <aside
          style={{
              width: '210px',
              backgroundColor: '#1e293b',
              color: 'white',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
          }}
      >
        <div
            style={{
                borderBottom: '1px solid #475569',
                paddingBottom: '20px',
                marginBottom: '20px'
            }}
        >
            <h2
                style={{
                    margin: 0,
                    fontSize: '18px'
                }}
            >
                Community CMS
            </h2>

            <p
                style={{
                    marginTop: '5px',
                    fontSize: '15px',
                    color: '#ffffff',
                    fontWeight: '600'
                }}
            >
                {user?.societyName}
            </p>

            <p
                style={{
                    marginTop: '4px',
                    fontSize: '14px',
                    color: '#cbd5e1'
                }}
            >
                {user?.role} Portal
            </p>
        </div>
        
       <nav style={{ flex: 1 }}>
          {navLinks.map((link) => (
              <NavLink
                  key={link.path}
                  to={link.path}
                  style={({ isActive }) => ({
                      display: 'block',
                      padding: '9px 14px',
                    marginBottom: '6px',
                    borderRadius: '5px',
                    fontSize: '15px',
                      color: 'white',
                      textDecoration: 'none',
                      backgroundColor: isActive ? '#2563eb' : 'transparent'
                  })}
              >
                  {link.label}
              </NavLink>
          ))}
      </nav>

        <div
            style={{
                borderTop: '1px solid #475569',
                paddingTop: '20px'
            }}
        >
            <NavLink
                to="/profile"
                style={({ isActive }) => ({
                    display: 'block',
                    padding: '9px 14px',
                    marginBottom: '6px',
                    borderRadius: '5px',
                    fontSize: '15px',
                    color: 'white',
                    textDecoration: 'none',
                    backgroundColor: isActive ? '#2563eb' : 'transparent'
                })}
            >
                My Profile
            </NavLink>

            <button
                onClick={handleLogout}
                style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                Logout
            </button>
        </div>
      </aside>

      {/* Displaying the main application layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Displaying the top navigation bar */}
        <header
            style={{
                backgroundColor: 'white',
                padding: '14px 24px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}
        >
            <h2
                style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1e293b'
                }}
            >
                
            </h2>

            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'none' 
                }}
            >
                ☰
            </button>
        </header>

        {/* Rendering the current page content */}
        <main
            style={{
                flex: 1,
                overflowY: 'auto',
                padding: '22px',
                backgroundColor: '#f4f6f9'
            }}
        >
          {/* Rendering the active route */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;