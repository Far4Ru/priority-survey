import React, { useState } from 'react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import './ProjectPage.scss';

const ProjectPage = ({ project, onUpdate }) => {
  const [editingColumn, setEditingColumn] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [newDataName, setNewDataName] = useState('');

  const handleProjectUpdate = (field, value) => {
    onUpdate({
      ...project,
      [field]: value,
    });
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
    if (window.confirm('Delete this column? This will affect all data.')) {
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
      // Reorder positions
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
          <label>Project Link</label>
          <input
            type="text"
            value={project.link || ''}
            onChange={(e) => handleProjectUpdate('link', e.target.value)}
            placeholder="https://..."
          />
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
          {(project.columns || []).length === 0 && (
            <p className="project-page__empty">No columns yet. Click "Add Column" to get started.</p>
          )}
        </div>
      </div>

      <div className="project-page__section">
        <div className="project-page__header">
          <h2>Data Items</h2>
          <Button variant="primary" size="small" onClick={() => setShowDataModal(true)}>
            Add Data Item
          </Button>
        </div>
        <div className="project-page__columns">
          {(project.data || []).map((item) => (
            <div key={item.id} className="project-page__column-item">
              <span className="column-name">{item.name}</span>
              <div className="column-actions">
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDeleteData(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {(project.data || []).length === 0 && (
            <p className="project-page__empty">No data items yet. Click "Add Data Item" to get started.</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        title="Edit Column"
      >
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

      <Modal
        isOpen={showDataModal}
        onClose={() => setShowDataModal(false)}
        title="Add Data Item"
      >
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
        />
        <div className="modal__actions">
          <Button variant="primary" onClick={handleAddData}>
            Add
          </Button>
          <Button variant="secondary" onClick={() => setShowDataModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectPage;