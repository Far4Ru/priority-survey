import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/common/Navigation';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import PriorityOrderPage from './pages/PriorityOrderPage';
import DataTablePage from './pages/DataTablePage';
import RespondentPage from './pages/RespondentPage';
import { Toaster } from 'react-hot-toast';
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
          <>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 1000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 1000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 1000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <HomePage
              project={project}
              onLoad={saveProject}
              onClear={clearProject}
              onNavigate={setCurrentPage}
              setUserRole={setUserRole}
            />
          </>
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
      <main className="app__main">
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />{renderPage()}</main>
    </div>
  );
};

export default App;