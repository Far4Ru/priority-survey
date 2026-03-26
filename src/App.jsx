import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/common/Navigation';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import PriorityOrderPage from './pages/PriorityOrderPage';
import DataTablePage from './pages/DataTablePage';
import RespondentPage from './pages/RespondentPage';
import './styles/App.scss';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [project, setProject] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const savedProject = localStorage.getItem('priorityProject');
    if (savedProject) {
      try {
        const parsed = JSON.parse(savedProject);
        if (parsed && parsed.project !== undefined) {
          setProject(parsed);
          setUserRole(parsed.role || 'admin');
        }
      } catch (e) {
        console.error('Failed to load project:', e);
      }
    }
  }, []);

  const saveProject = useCallback((newProject) => {
    setProject(newProject);
    localStorage.setItem('priorityProject', JSON.stringify(newProject));
  }, []);

  const clearProject = useCallback(() => {
    setProject(null);
    setUserRole(null);
    localStorage.removeItem('priorityProject');
    setCurrentPage('home');
  }, []);

  const renderPage = () => {
    if (userRole === 'respondent') {
      return <RespondentPage project={project} onUpdate={saveProject} onComplete={() => {
        setCurrentPage('home');
        clearProject();
      }} />;
    }

    switch (currentPage) {
      case 'project':
        return <ProjectPage project={project} onUpdate={saveProject} />;
      case 'priority':
        return <PriorityOrderPage project={project} onUpdate={saveProject} />;
      case 'data':
        return <DataTablePage project={project} onUpdate={saveProject} />;
      default:
        return (
          <HomePage
            project={project}
            onLoad={saveProject}
            onClear={clearProject}
            onNavigate={setCurrentPage}
            setUserRole={setUserRole}
          />
        );
    }
  };

  const shouldShowNav = () => {
    return project && currentPage !== 'home' && userRole !== 'respondent';
  };

  return (
    <div className="app">
      {shouldShowNav() && (
        <Navigation
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          projectName={project.project}
        />
      )}
      <main className="app__main">{renderPage()}</main>
    </div>
  );
};

export default App;