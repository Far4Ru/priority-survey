import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './DataTablePage.scss';

const DataTablePage = ({ project, onUpdate }) => {
  const [dataItems, setDataItems] = useState(project.data);

  // Calculate positions based on order and column priorities
  const calculateResults = () => {
    const results = [];

    // Sort data by position
    const sortedData = [...dataItems].sort((a, b) => a.position - b.position);

    sortedData.forEach((item, idx) => {
      let totalScore = 0;
      const columnScores = {};

      // Calculate scores for each column based on order positions
      project.columns.forEach(column => {
        const orderItem = item.order.find(o => o.column_id === column.id);
        if (orderItem) {
          const weight = column.final_position;
          const score = orderItem.position * weight;
          columnScores[column.id] = score;
          totalScore += score;
        }
      });

      results.push({
        id: item.id,
        name: item.name,
        position: idx + 1,
        totalScore,
        columnScores,
      });
    });

    // Sort by totalScore (lower score = higher priority)
    const sortedResults = [...results].sort((a, b) => a.totalScore - b.totalScore);
    
    // Add final ranking
    return sortedResults.map((result, idx) => ({
      ...result,
      finalRank: idx + 1,
    }));
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

  const handleOrderChange = (dataId, columnId, value) => {
    const position = parseInt(value);
    if (isNaN(position) || position < 1) return;

    const updatedData = dataItems.map(item => {
      if (item.id === dataId) {
        const updatedOrder = item.order.map(order =>
          order.column_id === columnId
            ? { ...order, position }
            : order
        );
        return { ...item, order: updatedOrder };
      }
      return item;
    });

    setDataItems(updatedData);
    onUpdate({
      ...project,
      data: updatedData,
    });
  };

  const results = calculateResults();
  const sortedColumns = [...project.columns].sort((a, b) => a.final_position - b.final_position);

  return (
    <div className="data-table-page">
      <h2>Priority Assessment Results</h2>
      
      <div className="data-table__container">
        <DragDropContext onDragEnd={handleDataDragEnd}>
          <Droppable droppableId="data-items">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="data-table"
              >
                <div className="data-table__header">
                  <div className="header__cell">#</div>
                  <div className="header__cell">Name</div>
                  {sortedColumns.map(column => (
                    <div key={column.id} className="header__cell">
                      {column.name}
                    </div>
                  ))}
                  <div className="header__cell">Total</div>
                  <div className="header__cell">Rank</div>
                </div>

                {dataItems.map((item, index) => {
                  const result = results.find(r => r.id === item.id);
                  return (
                    <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`data-table__row ${snapshot.isDragging ? 'dragging' : ''}`}
                        >
                          <div className="row__cell drag-handle" {...provided.dragHandleProps}>
                            ⋮⋮
                          </div>
                          <div className="row__cell">{index + 1}</div>
                          <div className="row__cell">{item.name}</div>
                          {sortedColumns.map(column => {
                            const orderItem = item.order.find(o => o.column_id === column.id);
                            return (
                              <div key={column.id} className="row__cell">
                                <input
                                  type="number"
                                  value={orderItem?.position || 1}
                                  onChange={(e) => handleOrderChange(item.id, column.id, e.target.value)}
                                  min="1"
                                  className="priority-input"
                                />
                              </div>
                            );
                          })}
                          <div className="row__cell">{result?.totalScore || 0}</div>
                          <div className="row__cell rank-cell">{result?.finalRank || '-'}</div>
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
    </div>
  );
};

export default DataTablePage;