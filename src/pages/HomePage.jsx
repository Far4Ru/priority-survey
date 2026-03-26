import React, { useRef, useState } from 'react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FileUpload from '../components/common/FileUpload';
import './HomePage.scss';

const HomePage = ({ project, onLoad, onClear, onNavigate }) => {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileLoad = (content) => {
    try {
      const parsed = JSON.parse(content);
      // Validate project structure
      if (parsed.project && parsed.columns && parsed.data) {
        onLoad(parsed);
      } else {
        alert('Invalid project file format');
      }
    } catch (e) {
      alert('Failed to parse project file');
    }
  };

  const handleNewProject = () => {
    const newProject = {
      project: 'New Project',
      link: '',
      columns: [],
      data: [],
    };
    onLoad(newProject);
    setShowNewProjectModal(false);
    onNavigate('project');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.project || 'project'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="home-page">
      <div className="home-page__container">
        <h1 className="home-page__title">Priority Survey Tool</h1>
        
        <div className="home-page__actions">
          <FileUpload onFileLoad={handleFileLoad}>
            <Button variant="primary" size="large">
              Load Project
            </Button>
          </FileUpload>

          {project && (
            <>
              <Button variant="secondary" size="large" onClick={handleExport}>
                Export Project
              </Button>
              <Button variant="danger" size="large" onClick={() => setShowNewProjectModal(true)}>
                New Project
              </Button>
            </>
          )}

          {project && (
            <div className="home-page__nav-buttons">
              <Button variant="primary" size="medium" onClick={() => onNavigate('project')}>
                Project Settings
              </Button>
              {project.columns.length > 0 && (
                <>
                  <Button variant="primary" size="medium" onClick={() => onNavigate('priority')}>
                    Priority Order
                  </Button>
                  <Button variant="primary" size="medium" onClick={() => onNavigate('data')}>
                    Data Table
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        title="Create New Project"
      >
        <p>Are you sure you want to create a new project?</p>
        <p className="modal__warning">Warning: Current project data will be lost!</p>
        <div className="modal__actions">
          <Button variant="danger" onClick={handleNewProject}>
            Create New
          </Button>
          <Button variant="secondary" onClick={() => setShowNewProjectModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;