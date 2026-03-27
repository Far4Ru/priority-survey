import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Button from '../components/common/Button';
import './DataTablePage.scss';

const DataTablePage = ({ project, onUpdate }) => {
  const [dataItems, setDataItems] = useState([]);

  useEffect(() => {
    if (project && project.data) {
      const initializedData = project.data.map((item) => ({
        ...item,
        order: item.order || [],
        position: item.position || 1,
      }));
      setDataItems(initializedData);
    }
  }, [project]);

  const calculateResults = () => {
    if (!dataItems.length || !project.columns.length) return new Map();

    const results = new Map();
    const sortedData = [...dataItems].sort((a, b) => a.position - b.position);

    sortedData.forEach((item) => {
      let totalScore = 0;
      const columnScores = new Map();

      project.columns.forEach((column) => {
        const orderItem = item.order.find((o) => o.column_id === column.id);
        if (orderItem) {
          const weight = column.final_position || column.position || 1;
          const score = orderItem.position * weight;
          columnScores.set(column.id, score);
          totalScore += score;
        }
      });

      results.set(item.id, {
        id: item.id,
        name: item.name,
        totalScore,
        columnScores,
      });
    });

    // Sort by totalScore for ranking (lower score = higher priority)
    const sortedResults = Array.from(results.values()).sort((a, b) => a.totalScore - b.totalScore);
    const rankedResults = new Map();
    sortedResults.forEach((result, idx) => {
      rankedResults.set(result.id, {
        ...result,
        finalRank: idx + 1,
      });
    });

    return rankedResults;
  };

  const handleOrderChange = (dataId, columnId, value) => {
    const position = parseInt(value);
    if (isNaN(position) || position < 1) return;

    const updatedData = dataItems.map((item) => {
      if (item.id === dataId) {
        const existingOrder = item.order.find((o) => o.column_id === columnId);
        let updatedOrder;

        if (existingOrder) {
          updatedOrder = item.order.map((order) =>
            order.column_id === columnId ? { ...order, position } : order
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
  const sortedDataItems = [...dataItems].sort((a, b) => a.position - b.position);
  const sortedColumns = [...(project?.columns || [])].sort(
    (a, b) => (a.final_position || a.position || 0) - (b.final_position || b.position || 0)
  );

  const exportToCSV = () => {
    const headers = ['Название показателя', ...sortedDataItems.map((item) => item.name), 'Сумма балов', 'Итоговое место'];

    const rows = sortedColumns.map((column) => {
      const row = [column.name];

      sortedDataItems.forEach((item) => {
        const orderItem = item.order.find((o) => o.column_id === column.id);
        row.push(orderItem?.position || 1);
      });

      let totalScore = 0;
      sortedDataItems.forEach((item) => {
        const orderItem = item.order.find((o) => o.column_id === column.id);
        if (orderItem) {
          totalScore += orderItem.position;
        }
      });
      row.push(totalScore);
      row.push('-');

      return row;
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${project.project}_data_table.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!project || !project.columns || project.columns.length === 0) {
    return (
      <div className="data-table-page">
        <div className="data-table__empty">
          <h2>Нет доступных данных</h2>
          <p>Пожалуйста, сначала добавьте показатели на странице настроек проекта.</p>
        </div>
      </div>
    );
  }

  if (!dataItems.length) {
    return (
      <div className="data-table-page">
        <div className="data-table__empty">
          <h2>Нет элементов данных</h2>
          <p>Пожалуйста, добавьте элементы данных для начала оценки приоритетов.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-page">
      <div className="data-table__header-section">
        <h2>Результаты оценки приоритетов</h2>
        <Button variant="primary" size="medium" onClick={exportToCSV}>
          <Download size={16} />
          Экспорт в CSV
        </Button>
      </div>

      <div className="data-table__container">
        <div className="data-table">
          <div className="data-table__header">
            <div className="header__cell">Название показателя</div>
            {sortedDataItems.map((item) => (
              <div key={item.id} className="header__cell">
                {item.name}
              </div>
            ))}
            <div className="header__cell">Общая оценка</div>
            <div className="header__cell">Финальный ранг</div>
          </div>

          <div className="data-table__body">
            {sortedColumns.map((column) => {
              let totalScore = 0;
              sortedDataItems.forEach((item) => {
                const orderItem = item.order.find((o) => o.column_id === column.id);
                if (orderItem) {
                  totalScore += orderItem.position;
                }
              });

              return (
                <div key={column.id} className="data-table__row">
                  <div className="row__cell row__cell--column-name">{column.name}</div>
                  {sortedDataItems.map((item) => {
                    const orderItem = item.order.find((o) => o.column_id === column.id);
                    return (
                      <div key={item.id} className="row__cell">
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
                  <div className="row__cell row__cell--score">{totalScore}</div>
                  <div className="row__cell row__cell--rank">-</div>
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