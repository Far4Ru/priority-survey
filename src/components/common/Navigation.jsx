import React from 'react';
import { Home, Settings, ListOrdered, Table } from 'lucide-react';
import './Navigation.scss';

const Navigation = ({ currentPage, onNavigate, projectName }) => {
  const pages = [
    { id: 'project', label: 'Настройки проекта', icon: Settings },
    { id: 'priority', label: 'Порядок приоритетов', icon: ListOrdered },
    { id: 'data', label: 'Таблица данных', icon: Table },
  ];

  return (
    <nav className="navigation">
      <div className="navigation__container">
        <div className="navigation__project-name">{projectName}</div>
        <div className="navigation__links">
          {currentPage !== 'home' && (
            <button
              className="navigation__link navigation__link--home"
              onClick={() => onNavigate('home')}
            >
              <Home size={16} />
              <span>Главная</span>
            </button>
          )}
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <button
                key={page.id}
                className={`navigation__link ${currentPage === page.id ? 'active' : ''}`}
                onClick={() => onNavigate(page.id)}
              >
                <Icon size={16} />
                <span>{page.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;