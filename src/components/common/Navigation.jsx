import React from 'react';
import './Navigation.scss';

const Navigation = ({ currentPage, onNavigate, projectName }) => {
  const pages = [
    { id: 'project', label: 'Project' },
    { id: 'priority', label: 'Priority Order' },
    { id: 'data', label: 'Data Table' },
  ];

  return (
    <nav className="navigation">
      <div className="navigation__container">
        <div className="navigation__project-name">{projectName}</div>
        <div className="navigation__links">
          {pages.map(page => (
            <button
              key={page.id}
              className={`navigation__link ${currentPage === page.id ? 'active' : ''}`}
              onClick={() => onNavigate(page.id)}
            >
              {page.label}
            </button>
          ))}
          <button
            className="navigation__link navigation__link--home"
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;