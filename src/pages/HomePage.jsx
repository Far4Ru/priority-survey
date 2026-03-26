import React, { useState } from 'react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FileUpload from '../components/common/FileUpload';
import './HomePage.scss';

const HomePage = ({ project, onLoad, onClear, onNavigate, setUserRole }) => {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewDataModal, setShowNewDataModal] = useState(false);
  const [newDataName, setNewDataName] = useState('');
  const [showRespondentUpload, setShowRespondentUpload] = useState(false);

  const handleFileLoad = (content) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.role === 'respondent') {
        // Handle respondent data
        if (parsed.project && parsed.data) {
          onLoad(parsed);
          setUserRole('respondent');
          alert('Respondent survey loaded successfully!');
        } else {
          alert('Invalid respondent file format.');
        }
      } else if (parsed.project !== undefined && parsed.columns !== undefined && parsed.data !== undefined) {
        // Admin project
        const adminProject = { ...parsed, role: 'admin' };
        onLoad(adminProject);
        setUserRole('admin');
        alert('Project loaded successfully!');
      } else {
        alert('Invalid project file format.');
      }
    } catch (e) {
      alert('Failed to parse file.');
    }
  };

  const handleNewProject = () => {
    const newProject = {
      project: 'New Project',
      role: 'admin',
      links: [],
      bg_color: '#f5f7fa',
      text_color: '#2c3e50',
      card_color: '#ffffff',
      image_url: '',
      columns: [],
      data: [],
    };
    onLoad(newProject);
    setUserRole('admin');
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
    onNavigate('priority');
    alert('Data item added! Redirecting to Priority Order...');
  };

  const handleRespondentUpload = (content) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.role === 'respondent' && parsed.project === project?.project) {
        // Add respondent data to project data array
        const updatedData = [...(project.data || []), parsed.data];
        const updatedProject = {
          ...project,
          data: updatedData,
        };
        onLoad(updatedProject);
        alert('Respondent data added successfully!');
        setShowRespondentUpload(false);
      } else {
        alert('Project name mismatch or invalid respondent file.');
      }
    } catch (e) {
      alert('Failed to load respondent file.');
    }
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
    setUserRole(null);
    alert('Project cleared successfully!');
  };

  return (
    <div className="home-page">
      {project && (
        <div className="home-page__nav-bar">
          <div className="nav-bar__buttons">
            <Button variant="primary" size="small" onClick={() => onNavigate('project')}>
              Settings
            </Button>
            {project.columns && project.columns.length > 0 && (
              <>
                <Button variant="primary" size="small" onClick={() => onNavigate('priority')}>
                  Priority
                </Button>
                <Button variant="primary" size="small" onClick={() => onNavigate('data')}>
                  Data
                </Button>
              </>
            )}
            <Button variant="danger" size="small" onClick={handleClearProject}>
              Clear
            </Button>
          </div>
        </div>
      )}

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
              <div className="upload-area__hint">Upload JSON project or respondent file</div>
            </div>
          </FileUpload>

          {project && project.role === 'admin' && (
            <>
              <Button variant="secondary" size="large" onClick={handleExport}>
                📥 Download Project
              </Button>
              <Button variant="success" size="large" onClick={() => setShowRespondentUpload(true)}>
                📤 Load Respondent Data
              </Button>
              <Button variant="success" size="large" onClick={() => setShowNewDataModal(true)}>
                ➕ Create New Data Item
              </Button>
            </>
          )}

          <Button 
            variant={project ? "danger" : "primary"} 
            size="large" 
            onClick={() => setShowNewProjectModal(true)}
          >
            ✨ Create New Project
          </Button>
        </div>
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
          <strong>Warning:</strong> Current project data will be permanently deleted!
        </p>
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

      <Modal
        isOpen={showRespondentUpload}
        onClose={() => setShowRespondentUpload(false)}
        title="Load Respondent Data"
      >
        <FileUpload onFileLoad={handleRespondentUpload}>
          <div className="modal__upload-area">
            <div className="upload-area__icon">📋</div>
            <div className="upload-area__text">Click to upload respondent JSON file</div>
          </div>
        </FileUpload>
      </Modal>
    </div>
  );
};

export default HomePage;