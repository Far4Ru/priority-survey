import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Button from '../components/common/Button';
import './PriorityOrderPage.scss';

const PriorityOrderPage = ({ project, onUpdate }) => {
  const [columns, setColumns] = useState(project.columns);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedColumns = items.map((col, idx) => ({
      ...col,
      final_position: idx + 1,
    }));

    setColumns(updatedColumns);
    onUpdate({
      ...project,
      columns: updatedColumns,
    });
  };

  const handleMove = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const items = Array.from(columns);
    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    const updatedColumns = items.map((col, idx) => ({
      ...col,
      final_position: idx + 1,
    }));

    setColumns(updatedColumns);
    onUpdate({
      ...project,
      columns: updatedColumns,
    });
  };

  const handlePositionChange = (index, value) => {
    const position = parseInt(value);
    if (isNaN(position) || position < 1 || position > columns.length) return;

    const items = Array.from(columns);
    const [movedItem] = items.splice(index, 1);
    items.splice(position - 1, 0, movedItem);

    const updatedColumns = items.map((col, idx) => ({
      ...col,
      final_position: idx + 1,
    }));

    setColumns(updatedColumns);
    onUpdate({
      ...project,
      columns: updatedColumns,
    });
  };

  return (
    <div className="priority-order-page">
      <h2>Priority Order Configuration</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="priority-order__list"
            >
              {columns.map((column, index) => (
                <Draggable key={column.id} draggableId={String(column.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`priority-order__item ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <div className="item__position">
                        <input
                          type="number"
                          value={column.final_position}
                          onChange={(e) => handlePositionChange(index, e.target.value)}
                          min="1"
                          max={columns.length}
                        />
                      </div>
                      <div className="item__name">{column.name}</div>
                      <div className="item__actions">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === columns.length - 1}
                        >
                          ↓
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
  );
};

export default PriorityOrderPage;