import React, { useState, useEffect } from 'react';
import './DataTablePage.scss';

const DataTablePage = ({ project, onUpdate }) => {
  const [dataItems, setDataItems] = useState([]);

  useEffect(() => {
    if (project && project.data) {
      const initializedData = project.data.map(item => ({
        ...item,
        order: item.order || [],
        position: item.position || 1
      }));
      setDataItems(initializedData);
    }
  }, [project]);

  const calculateResults = () => {
    if (!dataItems.length || !project.columns.length) return [];

    const results = [];
    const sortedData = [...dataItems].sort((a, b) => a.position - b.position);

    sortedData.forEach((item) => {
      let totalScore = 0;
      const columnScores = {};

      project.columns.forEach(column => {
        const orderItem = item.order.find(o => o.column_id === column.id);
        if (orderItem) {
          const weight = column.final_position || column.position || 1;
          const score = orderItem.position * weight;
          columnScores[column.id] = score;
          totalScore += score;
        }
      });

      results.push({
        id: item.id,
        name: item.name,
        totalScore,
        columnScores,
      });
    });

    const sortedResults = [...results].sort((a, b) => a.totalScore - b.totalScore);
    
    return sortedResults.map((result, idx) => ({
      ...result,
      finalRank: idx + 1,
    }));
  };

  const handleOrderChange = (dataId, columnId, value) => {
    const position = parseInt(value);
    if (isNaN(position) || position < 1) return;

    const updatedData = dataItems.map(item => {
      if (item.id === dataId) {
        const existingOrder = item.order.find(o => o.column_id === columnId);
        let updatedOrder;
        
        if (existingOrder) {
          updatedOrder = item.order.map(order =>
            order.column_id === columnId
              ? { ...order, position }
              : order
          );
        } else {
          updatedOrder = [...item.order, { column_id: columnId, position }];
        }
        
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
  const sortedColumns = [...(project?.columns || [])].sort((a, b) => 
    (a.final_position || a.position || 0) - (b.final_position || b.position || 0)
  );

  if (!project || !project.columns || project.columns.length === 0) {
    return (
      <div className="data-table-page">
        <div className="data-table__empty">
          <h2>No Data Available</h2>
          <p>Please add columns in the Project Settings page first.</p>
        </div>
      </div>
    );
  }

  if (!dataItems.length) {
    return (
      <div className="data-table-page">
        <div className="data-table__empty">
          <h2>No Data Items</h2>
          <p>Please add data items to start prioritizing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-page">
      <h2>Priority Assessment Results</h2>
      
      <div className="data-table__container">
        <div className="data-table">
          <div className="data-table__header">
            <div className="header__cell">#</div>
            <div className="header__cell">Name</div>
            {sortedColumns.map(column => (
              <div key={column.id} className="header__cell">
                {column.name}
              </div>
            ))}
            <div className="header__cell">Total Score</div>
            <div className="header__cell">Final Rank</div>
          </div>

          <div className="data-table__body">
            {dataItems.map((item, index) => {
              const result = results.find(r => r.id === item.id);
              return (
                <div key={item.id} className="data-table__row">
                  <div className="row__cell">{index + 1}</div>
                  <div className="row__cell row__cell--name">{item.name}</div>
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
                  <div className="row__cell row__cell--score">{result?.totalScore || 0}</div>
                  <div className="row__cell row__cell--rank">{result?.finalRank || '-'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTablePage;