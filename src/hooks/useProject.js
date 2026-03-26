import React, { createContext, useContext, useState } from 'react';

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [project, setProject] = useState(null);

  const updateProject = (newProject) => {
    setProject(newProject);
    localStorage.setItem('priorityProject', JSON.stringify(newProject));
  };

  const clearProject = () => {
    setProject(null);
    localStorage.removeItem('priorityProject');
  };

  return (
    <ProjectContext.Provider value={{ project, updateProject, clearProject }}>
      {children}
    </ProjectContext.Provider>
  );
};