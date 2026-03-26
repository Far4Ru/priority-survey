import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import './RespondentPage.scss';

const RespondentPage = ({ project, onUpdate, onComplete }) => {
  const [respondentName, setRespondentName] = useState('');
  const [order, setOrder] = useState([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (project && project.columns) {
      const sortedColumns = [...project.columns].sort((a, b) => 
        (a.final_position || a.position || 0) - (b.final_position || b.position || 0)
      );
      setColumns(sortedColumns);
      
      // Initialize order from project data
      if (project.data && project.data.order) {
        setOrder(project.data.order);
      } else if (sortedColumns.length > 0) {
        const initialOrder = sortedColumns.map((col, idx) => ({
          column_id: col.id,
          position: idx + 1
        }));
        setOrder(initialOrder);
        
        // Update project data with initial order
        if (project.data) {
          const updatedData = {
            ...project.data,
            order: initialOrder
          };
          onUpdate({
            ...project,
            data: updatedData
          });
        }
      }
    }
  }, [project]);

  const handleMove = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.length) return;

    const items = Array.from(order);
    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    const updatedOrder = items.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));

    setOrder(updatedOrder);
    
    // Update project data
    if (project.data) {
      const updatedData = {
        ...project.data,
        order: updatedOrder
      };
      onUpdate({
        ...project,
        data: updatedData
      });
    }
  };

  const handlePositionChange = (index, value) => {
    const position = parseInt(value);
    if (isNaN(position) || position < 1 || position > order.length) return;

    const items = Array.from(order);
    const [movedItem] = items.splice(index, 1);
    items.splice(position - 1, 0, movedItem);

    const updatedOrder = items.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));

    setOrder(updatedOrder);
    
    // Update project data
    if (project.data) {
      const updatedData = {
        ...project.data,
        order: updatedOrder
      };
      onUpdate({
        ...project,
        data: updatedData
      });
    }
  };

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
        order: order
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
        order: order,
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
        order: order,
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

  // Validate that project has columns
  if (!project || !project.columns || project.columns.length === 0) {
    return (
      <div className="respondent-page" style={{
        backgroundColor: '#f5f7fa',
        color: '#2c3e50'
      }}>
        <div className="respondent-page__error">
          <h2>Invalid Survey</h2>
          <p>This survey is not properly configured. Missing columns.</p>
          <p>Please contact the survey administrator.</p>
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
        <h1 className="respondent-page__title">{project.project}</h1>
        
        {project.links && project.links.length > 0 && (
          <div className="respondent-page__links">
            {project.links.map((link, index) => (
              <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="respondent-page__link">
                {link}
              </a>
            ))}
          </div>
        )}

        <div className="respondent-page__form">
          <div className="form__field">
            <label>Your Name:</label>
            <input
              type="text"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder="Enter your name"
              style={{
                borderColor: project.text_color + '40',
                color: project.text_color
              }}
            />
          </div>

          <h3>Priority Order</h3>
          <p className="priority-instruction">Please rank the following items in order of priority (1 = highest priority):</p>
          <div className="priority-order__list">
            {order.map((orderItem, index) => {
              const column = columns.find(c => c.id === orderItem.column_id);
              return (
                <div key={orderItem.column_id} className="priority-order__item" style={{
                  backgroundColor: project.bg_color + '30',
                  borderColor: project.text_color + '20'
                }}>
                  <div className="item__position">
                    <input
                      type="number"
                      value={orderItem.position}
                      onChange={(e) => handlePositionChange(index, e.target.value)}
                      min="1"
                      max={order.length}
                      style={{
                        borderColor: project.text_color + '40',
                        color: project.text_color
                      }}
                    />
                  </div>
                  <div className="item__name">{column?.name || 'Unknown'}</div>
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
                      disabled={index === order.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

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