import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Plus, Download, Link as LinkIcon } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import './ProjectPage.scss';

const SortableDataItem = ({ item, index, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`project-page__data-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="data-item__drag-handle" {...attributes} {...listeners}>
        <GripVertical size={18} />
      </div>
      <span className="data-item__name">{item.name}</span>
      <div className="data-item__actions">
        <Button variant="danger" size="small" onClick={() => onDelete(item.id)}>
          <Trash2 size={14} />
          Удалить
        </Button>
      </div>
    </div>
  );
};

const ProjectPage = ({ project, onUpdate }) => {
  const [editingColumn, setEditingColumn] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newDataName, setNewDataName] = useState('');
  const [newLink, setNewLink] = useState('');
  const [dataItems, setDataItems] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (project && project.data) {
      const sortedData = [...project.data].sort((a, b) => a.position - b.position);
      const itemsWithId = sortedData.map((item, idx) => ({
        ...item,
        id: `data-${item.id}-${idx}`,
        originalId: item.id,
      }));
      setDataItems(itemsWithId);
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
      name: 'Новый показатель',
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
      columns: (project.columns || []).map((col) =>
        col.id === id ? { ...col, name } : col
      ),
    });
    setShowColumnModal(false);
  };

  const handleDeleteColumn = (id) => {
    if (window.confirm('Удалить этот показатель?')) {
      onUpdate({
        ...project,
        columns: (project.columns || []).filter((col) => col.id !== id),
        data: (project.data || []).map((dataItem) => ({
          ...dataItem,
          order: (dataItem.order || []).filter((order) => order.column_id !== id),
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
      order: (project.columns || []).map((column) => ({
        column_id: column.id,
        position: 1,
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
    if (window.confirm('Удалить этот элемент данных?')) {
      const updatedData = (project.data || []).filter((item) => item.id !== id);
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

  const handleDataDragEnd = useCallback(
    (event) => {
      const { active, over } = event;

      if (active.id !== over.id) {
        const oldIndex = dataItems.findIndex((item) => item.id === active.id);
        const newIndex = dataItems.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(dataItems, oldIndex, newIndex);
        const updatedItems = newItems.map((item, idx) => ({
          ...item,
          position: idx + 1,
        }));

        setDataItems(updatedItems);

        const updatedData = updatedItems.map(({ originalId, name, position, order }) => ({
          id: originalId,
          name,
          position,
          order,
        }));

        onUpdate({
          ...project,
          data: updatedData,
        });
      }
    },
    [dataItems, project, onUpdate]
  );

  const exportRespondentFile = () => {
    const respondentSurvey = {
      role: 'respondent',
      project: project.project,
      links: project.links || [],
      bg_color: project.bg_color || '#f8fafc',
      text_color: project.text_color || '#1e293b',
      card_color: project.card_color || '#ffffff',
      image_url: project.image_url || '',
      columns: project.columns || [],
      data: {
        id: null,
        name: '',
        position: 1,
        order: (project.columns || []).map((column, index) => ({
          column_id: column.id,
          position: index + 1,
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
  };

  const itemIds = useMemo(() => dataItems.map((item) => item.id), [dataItems]);

  return (
    <div className="project-page">
      <div className="project-page__section">
        <h2>Настройки проекта</h2>

        <div className="project-page__field">
          <label>Название проекта</label>
          <input
            type="text"
            value={project.project || ''}
            onChange={(e) => handleProjectUpdate('project', e.target.value)}
            placeholder="Введите название проекта"
          />
        </div>

        <div className="project-page__field">
          <label>Ссылки</label>
          <div className="links-list">
            {(project.links || []).map((link, index) => (
              <div key={index} className="link-item">
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <LinkIcon size={14} />
                  {link}
                </a>
                <Button variant="danger" size="small" onClick={() => handleRemoveLink(index)}>
                  <Trash2 size={14} />
                  Удалить
                </Button>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="small" onClick={() => setShowLinkModal(true)}>
            <Plus size={14} />
            Добавить еще
          </Button>
        </div>

        <div className="project-page__field">
          <label>Цвет фона</label>
          <input
            type="color"
            value={project.bg_color || '#f8fafc'}
            onChange={(e) => handleProjectUpdate('bg_color', e.target.value)}
          />
        </div>

        <div className="project-page__field">
          <label>Цвет текста</label>
          <input
            type="color"
            value={project.text_color || '#1e293b'}
            onChange={(e) => handleProjectUpdate('text_color', e.target.value)}
          />
        </div>

        <div className="project-page__field">
          <label>Цвет карточек</label>
          <input
            type="color"
            value={project.card_color || '#ffffff'}
            onChange={(e) => handleProjectUpdate('card_color', e.target.value)}
          />
        </div>

        <div className="project-page__field">
          <label>URL баннера</label>
          <input
            type="url"
            value={project.image_url || ''}
            onChange={(e) => handleProjectUpdate('image_url', e.target.value)}
            placeholder="https://example.com/banner.jpg"
          />
          {project.image_url && (
            <div className="banner-preview">
              <img src={project.image_url} alt="Превью баннера" />
            </div>
          )}
        </div>
      </div>

      <div className="project-page__section">
        <div className="project-page__header">
          <h2>Показатели</h2>
          <Button variant="primary" size="small" onClick={handleAddColumn}>
            <Plus size={14} />
            Добавить показатель
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
                  <Pencil size={14} />
                  Редактировать
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDeleteColumn(column.id)}
                >
                  <Trash2 size={14} />
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="project-page__section">
        <div className="project-page__header">
          <h2>Респонденты:</h2>
          <Button variant="primary" size="small" onClick={() => setShowDataModal(true)}>
            <Plus size={14} />
            Добавить респодента вручную
          </Button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDataDragEnd}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <div className="project-page__data-items">
              {dataItems.map((item, index) => (
                <SortableDataItem
                  key={item.id}
                  item={item}
                  index={index}
                  onDelete={handleDeleteData}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="project-page__section">
        <div className="project-page__header">
          <h2>Опрос для респондентов</h2>
          <Button variant="success" size="medium" onClick={exportRespondentFile}>
            <Download size={16} />
            Скачать файл опроса
          </Button>
        </div>
        <p className="respondent-hint">
          Скачайте этот файл и поделитесь им с респондентами. Они смогут открыть его для прохождения опроса.
        </p>
      </div>

      <Modal isOpen={showColumnModal} onClose={() => setShowColumnModal(false)} title="Редактировать показатель">
        {editingColumn && (
          <>
            <input
              type="text"
              defaultValue={editingColumn.name}
              placeholder="Название показателя"
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
                Сохранить
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={showDataModal} onClose={() => setShowDataModal(false)} title="Добавить респондента">
        <input
          type="text"
          value={newDataName}
          onChange={(e) => setNewDataName(e.target.value)}
          placeholder="ФИО респондента"
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
            Добавить
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="Добавить ссылку">
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
            Добавить
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectPage;