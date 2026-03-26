import React, { useState } from 'react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import './ProjectPage.scss';

const ProjectPage = ({ project, onUpdate }) => {
  const [editingProject, setEditingProject] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);

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
      final_position: project.columns.length + 1,
    };
    onUpdate({
      ...project,
      columns: [...project.columns, newColumn],
    });
  };

  const handleUpdateColumn = (id, name) => {
    onUpdate({
      ...project,
      columns: project.columns.map(col =>
        col.id === id ? { ...col, name } : col
      ),
    });
    setShowColumnModal(false);
  };

  const handleDeleteColumn = (id) => {
    if (window.confirm('Delete this column? This will affect all data.')) {
      onUpdate({
        ...project,
        columns: project.columns.filter(col => col.id !== id),
        data: project.data.map(dataItem => ({
          ...dataItem,
          order: dataItem.order.filter(order => order.column_id !== id),
        })),
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
            value={project.project}
            onChange={(e) => handleProjectUpdate('project', e.target.value)}
          />
        </div>
        <div className="project-page__field">
          <label>Project Link</label>
          <input
            type="text"
            value={project.link}
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
          {project.columns.map((column, index) => (
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
                  const input = e.target.parentElement.previousSibling;
                  handleUpdateColumn(editingColumn.id, input.value);
                }}
              >
                Save
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ProjectPage;