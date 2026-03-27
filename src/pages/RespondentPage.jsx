import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimation,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown, Share2, Save, CheckCircle, ExternalLink } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import './RespondentPage.scss';
import toast, { Toaster } from 'react-hot-toast';

const SortablePriorityItem = ({
  item,
  index,
  column,
  onPositionChange,
  onMove,
  totalItems,
  textColor,
  bgColor,
  cardColor,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: false, // Отключаем drag&drop во время редактирования
  });

  const [localPosition, setLocalPosition] = useState(item.position);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalPosition(item.position);
  }, [item.position]);

  // Фокус на инпут при активации редактирования
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handlePositionBlur = () => {
    // Небольшая задержка, чтобы не конфликтовать с другими событиями
    setTimeout(() => {
      setIsEditing(false);
      if (localPosition !== item.position && localPosition !== '') {
        onPositionChange(index, localPosition);
      } else {
        setLocalPosition(item.position);
      }
    }, 100);
  };

  const handlePositionKeyDown = (e) => {
    e.stopPropagation(); // Останавливаем всплытие события

    if (e.key === 'Enter') {
      e.preventDefault(); // Предотвращаем стандартное поведение
      setIsEditing(false);
      if (localPosition !== item.position && localPosition !== '') {
        onPositionChange(index, localPosition);
      } else {
        setLocalPosition(item.position);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setLocalPosition(item.position);
    }
  };

  const handlePositionChangeLocal = (e) => {
    const value = e.target.value;
    // Разрешаем ввод только чисел
    if (value === '' || /^\d+$/.test(value)) {
      setLocalPosition(value);
    }
  };

  const handleClickDisplay = (e) => {
    e.stopPropagation(); // Останавливаем всплытие, чтобы не активировать drag
    setIsEditing(true);
  };

  const handleInputClick = (e) => {
    e.stopPropagation(); // Останавливаем всплытие
  };

  const handleInputMouseDown = (e) => {
    e.stopPropagation(); // Предотвращаем активацию drag при клике на инпут
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderColor: textColor + '40',
        color: textColor,
        backgroundColor: cardColor,
      }}
      className={`priority-order__item ${isDragging ? 'dragging' : ''} ${isEditing ? 'editing' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="item__drag-handle">
        <GripVertical size={20}
          style={{
            color: textColor,
          }} />
      </div>
      <div className="item__position">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localPosition}
            onChange={handlePositionChangeLocal}
            onKeyDown={handlePositionKeyDown}
            onBlur={handlePositionBlur}
            onClick={handleInputClick}
            onMouseDown={handleInputMouseDown}
            min="1"
            max={totalItems}
            style={{
              borderColor: textColor + '40',
              color: textColor,
              backgroundColor: cardColor,
            }}
          />
        ) : (
          <div
            className="position-display"
            onClick={handleClickDisplay}
            onMouseDown={(e) => e.stopPropagation()} // Предотвращаем активацию drag
            style={{
              borderColor: textColor + '40',
              color: textColor,
              backgroundColor: cardColor,
            }}
          >
            {item.position}
          </div>
        )}
      </div>
      <div className="item__name" style={{ color: textColor }}>
        {column?.name || 'Неизвестно'}
      </div>
      <div className="item__actions">
        <button
          className="move-button"
          onClick={(e) => {
            e.stopPropagation();
            onMove(index, 'up');
          }}
          disabled={index === 0}
          style={{
            borderColor: textColor + '40',
            color: textColor,
          }}
        >
          <ChevronUp size={16} />
        </button>
        <button
          className="move-button"
          onClick={(e) => {
            e.stopPropagation();
            onMove(index, 'down');
          }}
          disabled={index === totalItems - 1}
          style={{
            borderColor: textColor + '40',
            color: textColor,
          }}
        >
          <ChevronDown size={16} />
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
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Настройка анимации падения
  const dropAnimation = {
    ...defaultDropAnimation,
    duration: 200,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
  };

  useEffect(() => {
    if (project && project.columns) {
      const sortedColumns = [...project.columns].sort(
        (a, b) => (a.final_position || a.position || 0) - (b.final_position || b.position || 0)
      );
      setColumns(sortedColumns);

      if (project.data && project.data.order && project.data.order.length > 0) {
        const sortedOrder = [...project.data.order].sort((a, b) => a.position - b.position);
        const orderWithId = sortedOrder.map((item, idx) => ({
          ...item,
          id: `priority-${item.column_id}-${Date.now()}-${idx}`,
        }));
        setOrder(orderWithId);
      } else if (sortedColumns.length > 0) {
        const initialOrder = sortedColumns.map((col, idx) => ({
          column_id: col.id,
          position: idx + 1,
          id: `priority-${col.id}-${Date.now()}-${idx}`,
        }));
        setOrder(initialOrder);

        if (project.data) {
          const updatedData = {
            ...project.data,
            order: initialOrder.map(({ column_id, position }) => ({
              column_id,
              position,
            })),
          };
          onUpdate({
            ...project,
            data: updatedData,
          });
        }
      }
    }
  }, [project]);

  const handleMove = useCallback(
    (index, direction) => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= order.length) return;

      const newOrder = arrayMove(order, index, newIndex);
      const updatedOrder = newOrder.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));

      setOrder(updatedOrder);

      if (project.data) {
        const updatedData = {
          ...project.data,
          order: updatedOrder.map(({ column_id, position }) => ({
            column_id,
            position,
          })),
        };
        onUpdate({
          ...project,
          data: updatedData,
        });
      }
    },
    [order, project, onUpdate]
  );

  const handlePositionChange = useCallback(
    (index, value) => {
      // Проверяем, что введено число
      if (!value || value.trim() === '') return;

      const newPosition = parseInt(value);

      // Проверяем валидность позиции
      if (isNaN(newPosition)) return;

      // Ограничиваем позицию в допустимых пределах
      const clampedPosition = Math.min(Math.max(newPosition, 1), order.length);

      // Если позиция не изменилась, ничего не делаем
      if (clampedPosition === index + 1) return;

      // Создаем новый массив с перемещенным элементом
      const newOrder = Array.from(order);
      const [movedItem] = newOrder.splice(index, 1);
      newOrder.splice(clampedPosition - 1, 0, movedItem);

      // Обновляем позиции для всех элементов
      const updatedOrder = newOrder.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));

      setOrder(updatedOrder);

      // Сохраняем изменения в проекте
      if (project.data) {
        const updatedData = {
          ...project.data,
          order: updatedOrder.map(({ column_id, position }) => ({
            column_id,
            position,
          })),
        };
        onUpdate({
          ...project,
          data: updatedData,
        });
      }

      // Показываем уведомление об успешном изменении
      toast.success(`Позиция изменена на ${clampedPosition}`);
    },
    [order, project, onUpdate]
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
    // Предотвращаем прокрутку страницы
    document.body.style.overflow = 'hidden';
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;

      setActiveId(null);
      // Восстанавливаем прокрутку страницы
      document.body.style.overflow = '';

      if (active.id !== over.id) {
        const oldIndex = order.findIndex((item) => item.id === active.id);
        const newIndex = order.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(order, oldIndex, newIndex);
        const updatedOrder = newOrder.map((item, idx) => ({
          ...item,
          position: idx + 1,
        }));

        setOrder(updatedOrder);

        if (project.data) {
          const updatedData = {
            ...project.data,
            order: updatedOrder.map(({ column_id, position }) => ({
              column_id,
              position,
            })),
          };
          onUpdate({
            ...project,
            data: updatedData,
          });
        }
      }
    },
    [order, project, onUpdate]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    document.body.style.overflow = '';
  }, []);

  const handleComplete = () => {
    if (!respondentName.trim()) {
      toast.error('Пожалуйста, введите ваше имя');
      return;
    }

    if (project.data) {
      const updatedData = {
        ...project.data,
        id: Date.now(),
        name: respondentName,
        position: 1,
        order: order.map(({ column_id, position }) => ({
          column_id,
          position,
        })),
      };

      onUpdate({
        ...project,
        data: updatedData,
      });
    }

    setShowCompleteModal(true);
  };

  const handleExport = () => {
    const respondentData = {
      role: 'respondent',
      project: project.project,
      links: project.links || [],
      bg_color: project.bg_color || '#f8fafc',
      text_color: project.text_color || '#1e293b',
      card_color: project.card_color || '#ffffff',
      image_url: project.image_url || '',
      columns: project.columns || [],
      data: {
        id: Date.now(),
        name: respondentName,
        position: 1,
        order: order.map(({ column_id, position }) => ({
          column_id,
          position,
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

    toast.success('Файл сохранен успешно!');
  };

  const handleShare = () => {
    const respondentData = {
      role: 'respondent',
      project: project.project,
      links: project.links || [],
      bg_color: project.bg_color || '#f8fafc',
      text_color: project.text_color || '#1e293b',
      card_color: project.card_color || '#ffffff',
      image_url: project.image_url || '',
      columns: project.columns || [],
      data: {
        id: Date.now(),
        name: respondentName,
        position: 1,
        order: order.map(({ column_id, position }) => ({
          column_id,
          position,
        })),
      },
    };

    const dataStr = JSON.stringify(respondentData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const file = new File([blob], `respondent_${project.project}_${respondentName}.json`, {
      type: 'application/json',
    });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator
        .share({
          title: 'Ответ на опрос',
          text: `Результаты оценки приоритетов от ${respondentName}`,
          files: [file],
        })
        .then(() => toast.success('Поделились успешно!'))
        .catch(() => toast.error('Не удалось поделиться'));
    } else {
      toast.error('Web Share API не поддерживается. Пожалуйста, используйте сохранение.');
    }
  };

  const handleFinish = () => {
    setShowCompleteModal(false);
    onComplete();
    toast.success('Спасибо за участие в опросе!');
  };

  const itemIds = useMemo(() => order.map((item) => item.id), [order]);

  // Находим активный элемент для DragOverlay
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    const activeOrderItem = order.find((item) => item.id === activeId);
    if (!activeOrderItem) return null;
    const column = columns.find((c) => c.id === activeOrderItem.column_id);
    return { ...activeOrderItem, column };
  }, [activeId, order, columns]);

  if (!project || !project.columns || project.columns.length === 0) {
    return (
      <>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <div
          className="respondent-page"
          style={{
            backgroundColor: project?.bg_color || '#f8fafc',
            color: project?.text_color || '#1e293b',
          }}
        >
          <div className="respondent-page__error">
            <h2 style={{ color: project?.text_color || '#1e293b' }}>Неверный опрос</h2>
            <p style={{ color: project?.text_color || '#1e293b' }}>
              Этот опрос не настроен корректно. Отсутствуют показатели.
            </p>
            <p style={{ color: project?.text_color || '#1e293b' }}>
              Пожалуйста, свяжитесь с администратором опроса.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div
        className="respondent-page"
        style={{
          backgroundColor: project.bg_color || '#f8fafc',
          color: project.text_color || '#1e293b',
        }}
      >
        {project.image_url && (
          <div className="respondent-page__banner">
            <img src={project.image_url} alt={project.project} />
          </div>
        )}

        <div
          className="respondent-page__container"
          style={{
            backgroundColor: project.card_color || '#ffffff',
            color: project.text_color || '#1e293b',
          }}
        >
          <h1 className="respondent-page__title" style={{ color: project.text_color || '#1e293b' }}>
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
                    color: project.text_color || '#3b82f6',
                    backgroundColor: `${project.text_color}10`,
                    borderColor: `${project.text_color}30`,
                  }}
                >
                  <ExternalLink size={14} />
                  {link}
                </a>
              ))}
            </div>
          )}

          <div className="respondent-page__form">
            <div className="form__field">
              <label style={{ color: project.text_color || '#1e293b' }}>Ваше имя:</label>
              <input
                type="text"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="Введите ваше имя"
                style={{
                  borderColor: project.text_color + '40',
                  color: project.text_color,
                  backgroundColor: `${project.card_color}`,
                }}
              />
            </div>

            <h3 style={{ color: project.text_color || '#1e293b' }}>Порядок приоритетов</h3>
            <p className="priority-instruction" style={{ color: project.text_color || '#64748b' }}>
              Пожалуйста, расположите следующие пункты в порядке приоритета (1 = наивысший приоритет):
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              dropAnimation={dropAnimation}
            >
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <div className="priority-order__list">
                  {order.map((orderItem, index) => {
                    const column = columns.find((c) => c.id === orderItem.column_id);
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

              <DragOverlay
                dropAnimation={dropAnimation}
                style={{ cursor: 'grabbing' }}
              >
                {activeItem ? (
                  <div
                    className="priority-order__item dragging-overlay"
                    style={{
                      borderColor: project.text_color + '40',
                      color: project.text_color,
                      backgroundColor: project.card_color,
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                      cursor: 'grabbing',
                    }}
                  >
                    <div className="item__drag-handle">
                      <GripVertical size={20} style={{ color: project.text_color }} />
                    </div>
                    <div className="item__position">
                      <span style={{ padding: '6px 8px' }}>{activeItem.position}</span>
                    </div>
                    <div className="item__name" style={{ color: project.text_color }}>
                      {activeItem.column?.name || 'Неизвестно'}
                    </div>
                    <div className="item__actions">
                      <div className="move-button-placeholder" style={{ width: '28px' }} />
                      <div className="move-button-placeholder" style={{ width: '28px' }} />
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            <Button variant="primary" size="large" onClick={handleComplete} className="submit-button">
              <CheckCircle size={18} />
              Завершить опрос
            </Button>
          </div>
        </div>

        <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Спасибо!">
          <div className="completion-modal">
            <div className="completion-modal__icon">🎉</div>
            <p className="completion-modal__message">Спасибо за прохождение опроса по оценке приоритетов!</p>
            <p className="completion-modal__name">
              Респондент: <strong>{respondentName}</strong>
            </p>
            <div className="completion-modal__actions">
              <Button variant="primary" onClick={handleShare}>
                <Share2 size={16} />
                Поделиться
              </Button>
              <Button variant="secondary" onClick={handleExport}>
                <Save size={16} />
                Сохранить
              </Button>
              <Button variant="success" onClick={handleFinish}>
                Завершить
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default RespondentPage;