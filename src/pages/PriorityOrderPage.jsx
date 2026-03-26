import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import './PriorityOrderPage.scss';

const PriorityOrderPage = ({ project, onUpdate }) => {
  const [selectedDataId, setSelectedDataId] = useState(null);
  const [showNewDataModal, setShowNewDataModal] = useState(false);
  const [newDataName, setNewDataName] = useState('');
  const [columns, setColumns] = useState([]);
  const [currentData, setCurrentData] = useState(null);

  useEffect(() => {
    if (project && project.columns) {
      const sortedColumns = [...project.columns].sort((a, b) => 
        (a.final_position || a.position || 0) - (b.final_position || b.position || 0)
      );
      setColumns(sortedColumns);
    }
  }, [project]);

  useEffect(() => {
    if (project && project.data && project.data.length > 0 && !selectedDataId) {
      setSelectedDataId(project.data[0].id);
    }
    if (selectedDataId && project && project.data) {
      const data = project.data.find(d => d.id === selectedDataId);
      setCurrentData(data);
    }
  }, [project, selectedDataId]);

  const handleDragEnd = (result) => {
    if (!result.destination || !currentData) return;

    const items = Array.from(currentData.order || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedOrder = items.map((item, idx) => ({
      ...item,
      position: idx + 1,
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
  };

  const handleMove = (index, direction) => {
    if (!currentData) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= (currentData.order?.length || 0)) return;

    const items = Array.from(currentData.order || []);
    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    const updatedOrder = items.map((item, idx) => ({
      ...item,
      position: idx + 1,
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
  };

  const handlePositionChange = (index, value) => {
    if (!currentData) return;
    
    const position = parseInt(value);
    if (isNaN(position) || position < 1 || position > (currentData.order?.length || 0)) return;

    const items = Array.from(currentData.order || []);
    const [movedItem] = items.splice(index, 1);
    items.splice(position - 1, 0, movedItem);

    const updatedOrder = items.map((item, idx) => ({
      ...item,
      position: idx + 1,
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
  };

  const handleAddData = () => {
    if (!newDataName.trim()) {
      alert('Please enter a data item name');
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
    
    onUpdate({
      ...project,
      data: [...(project.data || []), newData],
    });
    
    setNewDataName('');
    setShowNewDataModal(false);
    setSelectedDataId(newData.id);
    alert('Data item added successfully!');
  };

  const handleDeleteData = (dataId) => {
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
      }
    }
  };

  if (!project || !project.columns || project.columns.length === 0) {
    return (
      <div className="priority-order-page">
        <div className="priority-order__empty">
          <h2>No Columns Available</h2>
          <p>Please add columns in the Project Settings page first.</p>
          <Button variant="primary" onClick={() => window.location.hash = '#/project'}>
            Go to Project Settings
          </Button>
        </div>
      </div>
    );
  }

  if (!project.data || project.data.length === 0) {
    return (
      <div className="priority-order-page">
        <div className="priority-order__empty">
          <h2>No Data Items</h2>
          <p>Please add data items to configure priority order.</p>
          <Button variant="primary" onClick={() => setShowNewDataModal(true)}>
            Create Data Item
          </Button>
        </div>
        
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
  }

  const currentOrder = currentData?.order || [];
  const sortedOrder = [...currentOrder].sort((a, b) => a.position - b.position);

  return (
    <div className="priority-order-page">
      <div className="priority-order__header">
        <h2>Priority Order Configuration</h2>
        <div className="data-selector">
          <label>Select Data Item:</label>
          <select 
            value={selectedDataId || ''} 
            onChange={(e) => setSelectedDataId(parseInt(e.target.value))}
            className="data-selector__select"
          >
            {project.data.map(data => (
              <option key={data.id} value={data.id}>
                {data.name}
              </option>
            ))}
          </select>
          <Button variant="success" size="small" onClick={() => setShowNewDataModal(true)}>
            + New Data
          </Button>
          {currentData && (
            <Button 
              variant="danger" 
              size="small" 
              onClick={() => handleDeleteData(currentData.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="priority-order__content">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns-order">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`priority-order__list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
              >
                {sortedOrder.map((orderItem, index) => {
                  const column = project.columns.find(c => c.id === orderItem.column_id);
                  return (
                    <Draggable 
                      key={orderItem.column_id} 
                      draggableId={String(orderItem.column_id)} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`priority-order__item ${snapshot.isDragging ? 'dragging' : ''}`}
                        >
                          <div className="item__drag-handle">⋮⋮</div>
                          <div className="item__position">
                            <input
                              type="number"
                              value={orderItem.position}
                              onChange={(e) => handlePositionChange(index, e.target.value)}
                              min="1"
                              max={sortedOrder.length}
                            />
                          </div>
                          <div className="item__name">{column?.name || 'Unknown Column'}</div>
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
                              disabled={index === sortedOrder.length - 1}
                            >
                              ↓
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

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

export default PriorityOrderPage;