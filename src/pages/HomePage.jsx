import React, { useRef, useState } from 'react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FileUpload from '../components/common/FileUpload';
import './HomePage.scss';

const HomePage = ({ project, onLoad, onClear, onNavigate }) => {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewDataModal, setShowNewDataModal] = useState(false);
  const [newDataName, setNewDataName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileLoad = (content) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.project !== undefined && parsed.columns !== undefined && parsed.data !== undefined) {
        onLoad(parsed);
        alert('Project loaded successfully!');
      } else {
        alert('Invalid project file format. Missing required fields.');
      }
    } catch (e) {
      alert('Failed to parse project file. Please make sure it\'s a valid JSON file.');
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
    alert('New project created!');
  };

  const handleAddData = () => {
    if (!newDataName.trim()) {
      alert('Please enter a data item name');
      return;
    }
    
    if (!project) {
      alert('Please load or create a project first');
      return;
    }
    
    const newData = {
      id: Date.now(),
      name: newDataName,
      position: (project.data?.length || 0) + 1,
      order: (project.columns || []).map(column => ({
        column_id: column.id,
        position: 1
      })),
    };
    
    onLoad({
      ...project,
      data: [...(project.data || []), newData],
    });
    
    setNewDataName('');
    setShowNewDataModal(false);
    alert('Data item added successfully!');
  };

  const handleExport = () => {
    if (!project) return;
    
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

  const handleClearProject = () => {
    onClear();
    alert('Project cleared successfully!');
  };

  return (
    <div className="home-page">
      <div className="home-page__container">
        <h1 className="home-page__title">Priority Survey Tool</h1>
        <p className="home-page__subtitle">Create and manage priority assessment surveys</p>
        
        <div className="home-page__actions">
          <FileUpload onFileLoad={handleFileLoad}>
            <div className="home-page__upload-area">
              <div className="upload-area__icon">📁</div>
              <div className="upload-area__text">
                <strong>Drag & Drop</strong> or <strong>click to browse</strong>
              </div>
              <div className="upload-area__hint">Upload JSON project file</div>
            </div>
          </FileUpload>

          {project && (
            <>
              <Button variant="secondary" size="large" onClick={handleExport} className="home-page__button">
                📥 Download Project
              </Button>
              <Button variant="success" size="large" onClick={() => setShowNewDataModal(true)} className="home-page__button">
                ➕ Create New Data Item
              </Button>
            </>
          )}

          <Button 
            variant={project ? "danger" : "primary"} 
            size="large" 
            onClick={() => setShowNewProjectModal(true)}
            className="home-page__button"
          >
            ✨ Create New Project
          </Button>

          {project && (
            <>
              <div className="home-page__divider">
                <span>Project Navigation</span>
              </div>
              <div className="home-page__nav-buttons">
                <Button 
                  variant="primary" 
                  size="medium" 
                  onClick={() => onNavigate('project')}
                  className="nav-button"
                >
                  ⚙️ Project Settings
                </Button>
                {project.columns && project.columns.length > 0 && (
                  <>
                    <Button 
                      variant="primary" 
                      size="medium" 
                      onClick={() => onNavigate('priority')}
                      className="nav-button"
                    >
                      📊 Priority Order
                    </Button>
                    <Button 
                      variant="primary" 
                      size="medium" 
                      onClick={() => onNavigate('data')}
                      className="nav-button"
                    >
                      📈 Data Table
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {project && (
          <div className="home-page__info">
            <div className="info-card">
              <div className="info-card__title">Current Project</div>
              <div className="info-card__name">{project.project}</div>
              {project.link && (
                <div className="info-card__link">
                  <a href={project.link} target="_blank" rel="noopener noreferrer">
                    {project.link}
                  </a>
                </div>
              )}
              <div className="info-card__stats">
                <span>📊 {project.columns?.length || 0} columns</span>
                <span>📝 {project.data?.length || 0} data items</span>
              </div>
              <Button 
                variant="danger" 
                size="small" 
                onClick={handleClearProject}
                className="info-card__clear"
              >
                Clear Project
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        title="Create New Project"
      >
        <div className="modal__warning-icon">⚠️</div>
        <p className="modal__warning-text">
          Are you sure you want to create a new project?
        </p>
        <p className="modal__warning-message">
          <strong>Warning:</strong> Current project data will be permanently deleted and cannot be recovered!
        </p>
        {project && (
          <div className="modal__current-project">
            Current project: <strong>"{project.project}"</strong>
          </div>
        )}
        <div className="modal__actions">
          <Button variant="danger" onClick={handleNewProject}>
            Create New Project
          </Button>
          <Button variant="secondary" onClick={() => setShowNewProjectModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showNewDataModal}
        onClose={() => setShowNewDataModal(false)}
        title="Create New Data Item"
      >
        <input
          type="text"
          value={newDataName}
          onChange={(e) => setNewDataName(e.target.value)}
          placeholder="Enter data item name"
          className="modal__input"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddData();
            }
          }}
          autoFocus
        />
        <div className="modal__actions">
          <Button variant="primary" onClick={handleAddData}>
            Create
          </Button>
          <Button variant="secondary" onClick={() => setShowNewDataModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;