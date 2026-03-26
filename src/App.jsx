import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/common/Navigation';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import PriorityOrderPage from './pages/PriorityOrderPage';
import DataTablePage from './pages/DataTablePage';
import './styles/App.scss';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [project, setProject] = useState(null);

  useEffect(() => {
    // Load from localStorage on startup
    const savedProject = localStorage.getItem('priorityProject');
    if (savedProject) {
      try {
        const parsed = JSON.parse(savedProject);
        // Ensure all required fields exist
        if (parsed && parsed.project !== undefined && parsed.columns !== undefined && parsed.data !== undefined) {
          setProject(parsed);
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
    localStorage.removeItem('priorityProject');
    setCurrentPage('home');
  }, []);

  const renderPage = () => {
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
          />
        );
    }
  };

  return (
    <div className="app">
      {project && currentPage !== 'home' && (
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