import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import './ProjectPage.scss';

const ProjectPage = ({ project, onUpdate }) => {
  const [editingColumn, setEditingColumn] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newDataName, setNewDataName] = useState('');
  const [newLink, setNewLink] = useState('');
  const [dataItems, setDataItems] = useState([]);

  useEffect(() => {
    if (project && project.data) {
      setDataItems([...project.data].sort((a, b) => a.position - b.position));
    }
  }, [project]);

  const handleProjectUpdate = (field, value) => {
    onUpdate({
      ...project,
      [field]: value,
    });
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    const updatedLinks = [...(project.links || []), newLink];
    handleProjectUpdate('links', updatedLinks);
    setNewLink('');
    setShowLinkModal(false);
  };

  const handleRemoveLink = (index) => {
    const updatedLinks = project.links.filter((_, i) => i !== index);
    handleProjectUpdate('links', updatedLinks);
  };

  const handleAddColumn = () => {
    const newColumn = {
      id: Date.now(),
      name: 'New Column',
      final_position: (project.columns?.length || 0) + 1,
    };
    onUpdate({
      ...project,
      columns: [...(project.columns || []), newColumn],
    });
  };

  const handleUpdateColumn = (id, name) => {
    onUpdate({
      ...project,
      columns: (project.columns || []).map(col =>
        col.id === id ? { ...col, name } : col
      ),
    });
    setShowColumnModal(false);
  };

  const handleDeleteColumn = (id) => {
    if (window.confirm('Delete this column?')) {
      onUpdate({
        ...project,
        columns: (project.columns || []).filter(col => col.id !== id),
        data: (project.data || []).map(dataItem => ({
          ...dataItem,
          order: (dataItem.order || []).filter(order => order.column_id !== id),
        })),
      });
    }
  };

  const handleAddData = () => {
    if (!newDataName.trim()) return;
    
    const newData = {
      id: Date.now(),
      name: newDataName,
      position: (project.data?.length || 0) + 1,
      order: (project.columns || []).map(column => ({
        column_id: column.id,
        position: 1
      })),
    };
    
    onUpdate({
      ...project,
      data: [...(project.data || []), newData],
    });
    
    setNewDataName('');
    setShowDataModal(false);
  };

  const handleDeleteData = (id) => {
    if (window.confirm('Delete this data item?')) {
      const updatedData = (project.data || []).filter(item => item.id !== id);
      const reorderedData = updatedData.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));
      onUpdate({
        ...project,
        data: reorderedData,
      });
    }
  };

  const handleDataDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(dataItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedData = items.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));

    setDataItems(updatedData);
    onUpdate({
      ...project,
      data: updatedData,
    });
  };

  const exportRespondentFile = () => {
    // Create a complete respondent survey file with all project configuration
    const respondentSurvey = {
      role: 'respondent',
      project: project.project,
      links: project.links || [],
      bg_color: project.bg_color || '#f5f7fa',
      text_color: project.text_color || '#2c3e50',
      card_color: project.card_color || '#ffffff',
      image_url: project.image_url || '',
      columns: project.columns || [],
      data: {
        id: null,
        name: '',
        position: 1,
        order: (project.columns || []).map(column => ({
          column_id: column.id,
          position: 1
        })),
      },
    };

    const dataStr = JSON.stringify(respondentSurvey, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.project}_respondent_survey.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Respondent survey file downloaded! Share this file with respondents.');
  };

  return (
    <div className="project-page">
      <div className="project-page__section">
        <h2>Project Settings</h2>
        <div className="project-page__field">
          <label>Project Name</label>
          <input
            type="text"
            value={project.project || ''}
            onChange={(e) => handleProjectUpdate('project', e.target.value)}
          />
        </div>

        <div className="project-page__field">
          <label>Links</label>
          <div className="links-list">
            {(project.links || []).map((link, index) => (
              <div key={index} className="link-item">
                <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                <Button variant="danger" size="small" onClick={() => handleRemoveLink(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="small" onClick={() => setShowLinkModal(true)}>
            Add Link
          </Button>
        </div>

        <div className="project-page__field">
          <label>Background Color</label>
          <input
            type="color"
            value={project.bg_color || '#f5f7fa'}
            onChange={(e) => handleProjectUpdate('bg_color', e.target.value)}
          />
        </div>

        <div className="project-page__field">
          <label>Text Color</label>
          <input
            type="color"
            value={project.text_color || '#2c3e50'}
            onChange={(e) => handleProjectUpdate('text_color', e.target.value)}
          />
        </div>

        <div className="project-page__field">
          <label>Card Color</label>
          <input
            type="color"
            value={project.card_color || '#ffffff'}
            onChange={(e) => handleProjectUpdate('card_color', e.target.value)}
          />
        </div>

        <div className="project-page__field">
          <label>Banner Image URL</label>
          <input
            type="url"
            value={project.image_url || ''}
            onChange={(e) => handleProjectUpdate('image_url', e.target.value)}
            placeholder="https://example.com/banner.jpg"
          />
          {project.image_url && (
            <div className="banner-preview">
              <img src={project.image_url} alt="Banner preview" />
            </div>
          )}
        </div>
      </div>

      <div className="project-page__section">
        <div className="project-page__header">
          <h2>Columns</h2>
          <Button variant="primary" size="small" onClick={handleAddColumn}>
            Add Column
          </Button>
        </div>
        <div className="project-page__columns">
          {(project.columns || []).map((column) => (
            <div key={column.id} className="project-page__column-item">
              <span className="column-name">{column.name}</span>
              <div className="column-actions">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setEditingColumn(column);
                    setShowColumnModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDeleteColumn(column.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="project-page__section">
        <div className="project-page__header">
          <h2>Data Items (Drag to reorder)</h2>
          <Button variant="primary" size="small" onClick={() => setShowDataModal(true)}>
            Add Data Item
          </Button>
        </div>
        <DragDropContext onDragEnd={handleDataDragEnd}>
          <Droppable droppableId="project-data-droppable">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`project-page__data-items ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
              >
                {dataItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={`project-data-${item.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`project-page__data-item ${snapshot.isDragging ? 'dragging' : ''}`}
                      >
                        <div className="data-item__drag-handle" {...provided.dragHandleProps}>
                          ⋮⋮
                        </div>
                        <span className="data-item__name">{item.name}</span>
                        <div className="data-item__actions">
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleDeleteData(item.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="project-page__section">
        <div className="project-page__header">
          <h2>Respondent Survey</h2>
          <Button variant="success" size="medium" onClick={exportRespondentFile}>
            📥 Download Respondent Survey
          </Button>
        </div>
        <p className="respondent-hint">
          Download this file and share it with respondents. They can open it to complete the priority survey.
          The file contains all project configuration (columns, colors, links) for the respondent.
        </p>
      </div>

      <Modal isOpen={showColumnModal} onClose={() => setShowColumnModal(false)} title="Edit Column">
        {editingColumn && (
          <>
            <input
              type="text"
              defaultValue={editingColumn.name}
              placeholder="Column name"
              className="modal__input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateColumn(editingColumn.id, e.target.value);
                }
              }}
            />
            <div className="modal__actions">
              <Button
                variant="primary"
                onClick={(e) => {
                  const input = document.querySelector('.modal__input');
                  handleUpdateColumn(editingColumn.id, input.value);
                }}
              >
                Save
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={showDataModal} onClose={() => setShowDataModal(false)} title="Add Data Item">
        <input
          type="text"
          value={newDataName}
          onChange={(e) => setNewDataName(e.target.value)}
          placeholder="Data item name"
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
            Add
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="Add Link">
        <input
          type="url"
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="https://..."
          className="modal__input"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddLink();
            }
          }}
          autoFocus
        />
        <div className="modal__actions">
          <Button variant="primary" onClick={handleAddLink}>
            Add
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectPage;