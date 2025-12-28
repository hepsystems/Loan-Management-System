import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: '📊' },
    { to: '/admin/applications', label: 'Applications', icon: '📄' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/loans', label: 'Loans', icon: '💰' },
    { to: '/admin/verifications', label: 'Verifications', icon: '✅' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  const officerLinks = [
    { to: '/admin', label: 'Dashboard', icon: '📊' },
    { to: '/admin/applications', label: 'Applications', icon: '📄' },
    { to: '/admin/verifications', label: 'Verifications', icon: '✅' },
  ];

  const links = user.role === 'admin' ? adminLinks : officerLinks;

  return (
    <div className="w-64 bg-gray-900 text-white h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-gray-400 text-sm mt-1">
          {user.role === 'admin' ? 'Administrator' : 'Loan Officer'}
        </p>
      </div>
      
      <nav className="mt-8">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white ${
                    isActive ? 'bg-blue-600 text-white' : ''
                  }`
                }
              >
                <span className="mr-3">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-64 p-6">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="font-bold">{user.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
