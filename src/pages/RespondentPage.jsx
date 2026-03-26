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
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import './RespondentPage.scss';

// Компонент для сортируемого элемента приоритета
const SortablePriorityItem = ({ item, index, column, onPositionChange, onMove, totalItems, textColor, bgColor, cardColor }) => {
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
      className={`priority-order__item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="item__drag-handle" {...attributes} {...listeners}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="6" cy="5" r="1.5" fill={textColor || '#999'} />
          <circle cx="6" cy="10" r="1.5" fill={textColor || '#999'} />
          <circle cx="6" cy="15" r="1.5" fill={textColor || '#999'} />
          <circle cx="14" cy="5" r="1.5" fill={textColor || '#999'} />
          <circle cx="14" cy="10" r="1.5" fill={textColor || '#999'} />
          <circle cx="14" cy="15" r="1.5" fill={textColor || '#999'} />
        </svg>
      </div>
      <div className="item__position">
        <input
          type="number"
          value={item.position}
          onChange={(e) => onPositionChange(index, e.target.value)}
          min="1"
          max={totalItems}
          onClick={(e) => e.stopPropagation()}
          style={{
            borderColor: textColor + '40',
            color: textColor,
            backgroundColor: cardColor
          }}
        />
      </div>
      <div className="item__name" style={{ color: textColor }}>
        {column?.name || 'Unknown'}
      </div>
      <div className="item__actions">
        <button
          className="move-button"
          onClick={() => onMove(index, 'up')}
          disabled={index === 0}
          style={{
            borderColor: textColor + '40',
            color: textColor
          }}
        >
          ↑
        </button>
        <button
          className="move-button"
          onClick={() => onMove(index, 'down')}
          disabled={index === totalItems - 1}
          style={{
            borderColor: textColor + '40',
            color: textColor
          }}
        >
          ↓
        </button>
      </div>
    </div>
  );
};

const RespondentPage = ({ project, onUpdate, onComplete }) => {
  const [respondentName, setRespondentName] = useState('');
  const [order, setOrder] = useState([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [columns, setColumns] = useState([]);

  // Настройка сенсоров для dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (project && project.columns) {
      const sortedColumns = [...project.columns].sort((a, b) => 
        (a.final_position || a.position || 0) - (b.final_position || b.position || 0)
      );
      setColumns(sortedColumns);
      
      // Initialize order from project data
      if (project.data && project.data.order && project.data.order.length > 0) {
        const sortedOrder = [...project.data.order].sort((a, b) => a.position - b.position);
        // Добавляем уникальные ID для dnd-kit
        const orderWithId = sortedOrder.map((item, idx) => ({
          ...item,
          id: `priority-${item.column_id}-${idx}`,
        }));
        setOrder(orderWithId);
      } else if (sortedColumns.length > 0) {
        const initialOrder = sortedColumns.map((col, idx) => ({
          column_id: col.id,
          position: idx + 1,
          id: `priority-${col.id}-${idx}`,
        }));
        setOrder(initialOrder);
        
        // Update project data with initial order
        if (project.data) {
          const updatedData = {
            ...project.data,
            order: initialOrder.map(({ column_id, position }) => ({
              column_id,
              position
            }))
          };
          onUpdate({
            ...project,
            data: updatedData
          });
        }
      }
    }
  }, [project]);

  const handleMove = useCallback((index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.length) return;

    const newOrder = arrayMove(order, index, newIndex);
    
    const updatedOrder = newOrder.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));

    setOrder(updatedOrder);
    
    // Update project data
    if (project.data) {
      const updatedData = {
        ...project.data,
        order: updatedOrder.map(({ column_id, position }) => ({
          column_id,
          position
        }))
      };
      onUpdate({
        ...project,
        data: updatedData
      });
    }
  }, [order, project, onUpdate]);

  const handlePositionChange = useCallback((index, value) => {
    const position = parseInt(value);
    if (isNaN(position) || position < 1 || position > order.length) return;

    const newOrder = Array.from(order);
    const [movedItem] = newOrder.splice(index, 1);
    newOrder.splice(position - 1, 0, movedItem);

    const updatedOrder = newOrder.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));

    setOrder(updatedOrder);
    
    // Update project data
    if (project.data) {
      const updatedData = {
        ...project.data,
        order: updatedOrder.map(({ column_id, position }) => ({
          column_id,
          position
        }))
      };
      onUpdate({
        ...project,
        data: updatedData
      });
    }
  }, [order, project, onUpdate]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = order.findIndex((item) => item.id === active.id);
      const newIndex = order.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(order, oldIndex, newIndex);
      
      const updatedOrder = newOrder.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));

      setOrder(updatedOrder);
      
      // Update project data
      if (project.data) {
        const updatedData = {
          ...project.data,
          order: updatedOrder.map(({ column_id, position }) => ({
            column_id,
            position
          }))
        };
        onUpdate({
          ...project,
          data: updatedData
        });
      }
    }
  }, [order, project, onUpdate]);

  const handleComplete = () => {
    if (!respondentName.trim()) {
      alert('Please enter your name');
      return;
    }

    // Update respondent name in data
    if (project.data) {
      const updatedData = {
        ...project.data,
        id: Date.now(),
        name: respondentName,
        position: 1,
        order: order.map(({ column_id, position }) => ({
          column_id,
          position
        }))
      };
      
      onUpdate({
        ...project,
        data: updatedData
      });
    }

    setShowCompleteModal(true);
  };

  const handleExport = () => {
    const respondentData = {
      role: 'respondent',
      project: project.project,
      links: project.links || [],
      bg_color: project.bg_color || '#f5f7fa',
      text_color: project.text_color || '#2c3e50',
      card_color: project.card_color || '#ffffff',
      image_url: project.image_url || '',
      columns: project.columns || [],
      data: {
        id: Date.now(),
        name: respondentName,
        position: 1,
        order: order.map(({ column_id, position }) => ({
          column_id,
          position
        })),
      },
    };

    const dataStr = JSON.stringify(respondentData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respondent_${project.project}_${respondentName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const respondentData = {
      role: 'respondent',
      project: project.project,
      links: project.links || [],
      bg_color: project.bg_color || '#f5f7fa',
      text_color: project.text_color || '#2c3e50',
      card_color: project.card_color || '#ffffff',
      image_url: project.image_url || '',
      columns: project.columns || [],
      data: {
        id: Date.now(),
        name: respondentName,
        position: 1,
        order: order.map(({ column_id, position }) => ({
          column_id,
          position
        })),
      },
    };

    const dataStr = JSON.stringify(respondentData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const file = new File([blob], `respondent_${project.project}_${respondentName}.json`, { type: 'application/json' });
    
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        title: 'Survey Response',
        text: `Priority survey response from ${respondentName}`,
        files: [file],
      }).catch(console.error);
    } else {
      alert('Web Share API not supported. Please use the save option.');
    }
  };

  const handleFinish = () => {
    setShowCompleteModal(false);
    onComplete();
  };

  // Получаем ID элементов для SortableContext
  const itemIds = useMemo(() => order.map(item => item.id), [order]);

  // Validate that project has columns
  if (!project || !project.columns || project.columns.length === 0) {
    return (
      <div className="respondent-page" style={{
        backgroundColor: project?.bg_color || '#f5f7fa',
        color: project?.text_color || '#2c3e50'
      }}>
        <div className="respondent-page__error">
          <h2 style={{ color: project?.text_color || '#2c3e50' }}>Invalid Survey</h2>
          <p style={{ color: project?.text_color || '#2c3e50' }}>This survey is not properly configured. Missing columns.</p>
          <p style={{ color: project?.text_color || '#2c3e50' }}>Please contact the survey administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="respondent-page" style={{
      backgroundColor: project.bg_color || '#f5f7fa',
      color: project.text_color || '#2c3e50'
    }}>
      {project.image_url && (
        <div className="respondent-page__banner">
          <img src={project.image_url} alt={project.project} />
        </div>
      )}

      <div className="respondent-page__container" style={{
        backgroundColor: project.card_color || '#ffffff',
        color: project.text_color || '#2c3e50'
      }}>
        <h1 className="respondent-page__title" style={{ color: project.text_color || '#2c3e50' }}>
          {project.project}
        </h1>
        
        {project.links && project.links.length > 0 && (
          <div className="respondent-page__links">
            {project.links.map((link, index) => (
              <a 
                key={index} 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="respondent-page__link"
                style={{ 
                  color: project.text_color || '#3498db',
                  backgroundColor: `${project.text_color}10`,
                  borderColor: `${project.text_color}30`
                }}
              >
                {link}
              </a>
            ))}
          </div>
        )}

        <div className="respondent-page__form">
          <div className="form__field">
            <label style={{ color: project.text_color || '#2c3e50' }}>Your Name:</label>
            <input
              type="text"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder="Enter your name"
              style={{
                borderColor: project.text_color + '40',
                color: project.text_color,
                backgroundColor: `${project.card_color}`
              }}
            />
          </div>

          <h3 style={{ color: project.text_color || '#2c3e50' }}>Priority Order</h3>
          <p className="priority-instruction" style={{ color: project.text_color || '#7f8c8d' }}>
            Please rank the following items in order of priority (1 = highest priority):
          </p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itemIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="priority-order__list">
                {order.map((orderItem, index) => {
                  const column = columns.find(c => c.id === orderItem.column_id);
                  return (
                    <SortablePriorityItem
                      key={orderItem.id}
                      item={orderItem}
                      index={index}
                      column={column}
                      onPositionChange={handlePositionChange}
                      onMove={handleMove}
                      totalItems={order.length}
                      textColor={project.text_color}
                      bgColor={project.bg_color}
                      cardColor={project.card_color}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          <Button variant="primary" size="large" onClick={handleComplete} className="submit-button">
            Complete Survey
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Thank You!"
      >
        <div className="completion-modal">
          <div className="completion-modal__icon">🎉</div>
          <p className="completion-modal__message">
            Thank you for completing the priority assessment survey!
          </p>
          <p className="completion-modal__name">
            Respondent: <strong>{respondentName}</strong>
          </p>
          <div className="completion-modal__actions">
            <Button variant="primary" onClick={handleShare}>
              Share Response
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              Save Response
            </Button>
            <Button variant="success" onClick={handleFinish}>
              Finish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RespondentPage;