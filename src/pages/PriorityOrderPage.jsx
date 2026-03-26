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
import './PriorityOrderPage.scss';

// Компонент для сортируемого элемента
const SortableItem = ({ item, index, column, onPositionChange, onMove, totalItems }) => {
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
          <circle cx="6" cy="5" r="1.5" fill="#999" />
          <circle cx="6" cy="10" r="1.5" fill="#999" />
          <circle cx="6" cy="15" r="1.5" fill="#999" />
          <circle cx="14" cy="5" r="1.5" fill="#999" />
          <circle cx="14" cy="10" r="1.5" fill="#999" />
          <circle cx="14" cy="15" r="1.5" fill="#999" />
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
        />
      </div>
      <div className="item__name">
        {column?.name || 'Unknown Column'}
      </div>
      <div className="item__actions">
        <button
          className="move-button"
          onClick={() => onMove(index, 'up')}
          disabled={index === 0}
        >
          ↑
        </button>
        <button
          className="move-button"
          onClick={() => onMove(index, 'down')}
          disabled={index === totalItems - 1}
        >
          ↓
        </button>
      </div>
    </div>
  );
};

const PriorityOrderPage = ({ project, onUpdate }) => {
  const [selectedDataId, setSelectedDataId] = useState(null);
  const [showNewDataModal, setShowNewDataModal] = useState(false);
  const [newDataName, setNewDataName] = useState('');
  const [currentData, setCurrentData] = useState(null);
  const [items, setItems] = useState([]);

  // Настройка сенсоров для dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Минимальное расстояние для начала drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Загружаем данные при изменении project или selectedDataId
  useEffect(() => {
    if (project && project.data && project.data.length > 0 && !selectedDataId) {
      setSelectedDataId(project.data[0].id);
    }

    if (selectedDataId && project && project.data) {
      const data = project.data.find(d => d.id === selectedDataId);
      setCurrentData(data);

      if (data && data.order && data.order.length > 0) {
        const sortedItems = [...data.order]
          .sort((a, b) => a.position - b.position)
          .map((item, idx) => ({
            ...item,
            id: `${item.column_id}-${Date.now()}-${idx}`, // Уникальный ID для dnd-kit
            originalPosition: item.position,
          }));
        setItems(sortedItems);
      } else if (data && project.columns && project.columns.length > 0) {
        // Создаем начальный порядок
        const initialOrder = project.columns.map((column, idx) => ({
          column_id: column.id,
          position: idx + 1,
          id: `${column.id}-initial-${idx}`,
        }));
        setItems(initialOrder);

        // Обновляем данные
        const updatedData = project.data.map(dataItem =>
          dataItem.id === selectedDataId
            ? {
                ...dataItem,
                order: initialOrder.map(({ column_id, position }) => ({
                  column_id,
                  position,
                })),
              }
            : dataItem
        );

        onUpdate({
          ...project,
          data: updatedData,
        });
      } else {
        setItems([]);
      }
    }
  }, [project, selectedDataId, onUpdate]);

  // Обработчик окончания drag&drop
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;

      if (active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Обновляем позиции
        const updatedItems = newItems.map((item, idx) => ({
          ...item,
          position: idx + 1,
        }));

        setItems(updatedItems);

        // Обновляем данные в project
        if (currentData && project) {
          const updatedOrder = updatedItems.map(({ column_id, position }) => ({
            column_id,
            position,
          }));

          const updatedData = project.data.map(dataItem =>
            dataItem.id === selectedDataId
              ? { ...dataItem, order: updatedOrder }
              : dataItem
          );

          onUpdate({
            ...project,
            data: updatedData,
          });
        }
      }
    },
    [items, currentData, project, selectedDataId, onUpdate]
  );

  const handleMove = useCallback(
    (index, direction) => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return;

      const newItems = arrayMove(items, index, newIndex);

      const updatedItems = newItems.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));

      setItems(updatedItems);

      if (currentData && project) {
        const updatedOrder = updatedItems.map(({ column_id, position }) => ({
          column_id,
          position,
        }));

        const updatedData = project.data.map(dataItem =>
          dataItem.id === selectedDataId
            ? { ...dataItem, order: updatedOrder }
            : dataItem
        );

        onUpdate({
          ...project,
          data: updatedData,
        });
      }
    },
    [items, currentData, project, selectedDataId, onUpdate]
  );

  const handlePositionChange = useCallback(
    (index, value) => {
      const position = parseInt(value);
      if (isNaN(position) || position < 1 || position > items.length) return;

      const newItems = Array.from(items);
      const [movedItem] = newItems.splice(index, 1);
      newItems.splice(position - 1, 0, movedItem);

      const updatedItems = newItems.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));

      setItems(updatedItems);

      if (currentData && project) {
        const updatedOrder = updatedItems.map(({ column_id, position }) => ({
          column_id,
          position,
        }));

        const updatedData = project.data.map(dataItem =>
          dataItem.id === selectedDataId
            ? { ...dataItem, order: updatedOrder }
            : dataItem
        );

        onUpdate({
          ...project,
          data: updatedData,
        });
      }
    },
    [items, currentData, project, selectedDataId, onUpdate]
  );

  const handleAddData = useCallback(() => {
    if (!newDataName.trim()) {
      alert('Please enter a data item name');
      return;
    }

    const newData = {
      id: Date.now(),
      name: newDataName,
      position: (project.data?.length || 0) + 1,
      order: (project.columns || []).map((column, idx) => ({
        column_id: column.id,
        position: idx + 1,
      })),
    };

    onUpdate({
      ...project,
      data: [...(project.data || []), newData],
    });

    setNewDataName('');
    setShowNewDataModal(false);
    setSelectedDataId(newData.id);
  }, [newDataName, project, onUpdate]);

  const handleDeleteData = useCallback(
    (dataId) => {
      if (window.confirm('Delete this data item?')) {
        const updatedData = project.data.filter(item => item.id !== dataId);
        const reorderedData = updatedData.map((item, idx) => ({
          ...item,
          position: idx + 1,
        }));

        onUpdate({
          ...project,
          data: reorderedData,
        });

        if (selectedDataId === dataId && reorderedData.length > 0) {
          setSelectedDataId(reorderedData[0].id);
        } else if (reorderedData.length === 0) {
          setSelectedDataId(null);
          setCurrentData(null);
          setItems([]);
        }
      }
    },
    [project, selectedDataId, onUpdate]
  );

  // Получаем ID элементов для SortableContext
  const itemIds = useMemo(() => items.map(item => item.id), [items]);

  // Проверка наличия данных
  if (!project || !project.columns || project.columns.length === 0) {
    return (
      <div className="priority-order-page">
        <div className="priority-order__empty">
          <h2>Нет доступных колонок</h2>
          <p>Пожалуйста, добавьте колонки на странице настроек проекта.</p>
        </div>
      </div>
    );
  }

  if (!project.data || project.data.length === 0) {
    return (
      <div className="priority-order-page">
        <div className="priority-order__empty">
          <h2>Нет элементов данных</h2>
          <p>Пожалуйста, добавьте элементы данных для настройки порядка приоритетов.</p>
          <Button variant="primary" onClick={() => setShowNewDataModal(true)}>
            Создать элемент данных
          </Button>
        </div>

        <Modal
          isOpen={showNewDataModal}
          onClose={() => setShowNewDataModal(false)}
          title="Создать новый элемент данных"
        >
          <input
            type="text"
            value={newDataName}
            onChange={e => setNewDataName(e.target.value)}
            placeholder="Введите название элемента данных"
            className="modal__input"
            onKeyPress={e => {
              if (e.key === 'Enter') {
                handleAddData();
              }
            }}
            autoFocus
          />
          <div className="modal__actions">
            <Button variant="primary" onClick={handleAddData}>
              Создать
            </Button>
            <Button variant="secondary" onClick={() => setShowNewDataModal(false)}>
              Отмена
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="priority-order-page">
      <div className="priority-order__header">
        <h2>Настройка порядка приоритетов</h2>
        <div className="data-selector">
          <label>Выберите элемент данных:</label>
          <select
            value={selectedDataId || ''}
            onChange={e => setSelectedDataId(parseInt(e.target.value))}
            className="data-selector__select"
          >
            {project.data.map(data => (
              <option key={data.id} value={data.id}>
                {data.name}
              </option>
            ))}
          </select>
          <Button variant="success" size="small" onClick={() => setShowNewDataModal(true)}>
            + Новый элемент
          </Button>
          {currentData && (
            <Button
              variant="danger"
              size="small"
              onClick={() => handleDeleteData(currentData.id)}
            >
              Удалить
            </Button>
          )}
        </div>
      </div>

      <div className="priority-order__content">
        {items.length > 0 ? (
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
                {items.map((item, index) => {
                  const column = project.columns.find(c => c.id === item.column_id);
                  return (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      column={column}
                      onPositionChange={handlePositionChange}
                      onMove={handleMove}
                      totalItems={items.length}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="priority-order__empty">
            <p>Нет элементов для отображения</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showNewDataModal}
        onClose={() => setShowNewDataModal(false)}
        title="Создать новый элемент данных"
      >
        <input
          type="text"
          value={newDataName}
          onChange={e => setNewDataName(e.target.value)}
          placeholder="Введите название элемента данных"
          className="modal__input"
          onKeyPress={e => {
            if (e.key === 'Enter') {
              handleAddData();
            }
          }}
          autoFocus
        />
        <div className="modal__actions">
          <Button variant="primary" onClick={handleAddData}>
            Создать
          </Button>
          <Button variant="secondary" onClick={() => setShowNewDataModal(false)}>
            Отмена
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PriorityOrderPage;