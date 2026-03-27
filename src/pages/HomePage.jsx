import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Upload, Plus, Sparkles, Trash2, FileJson, AlertTriangle } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FileUpload from '../components/common/FileUpload';
import Navigation from '../components/common/Navigation';
import './HomePage.scss';

const HomePage = ({ project, onLoad, onClear, onNavigate, setUserRole }) => {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewDataModal, setShowNewDataModal] = useState(false);
  const [newDataName, setNewDataName] = useState('');
  const [showRespondentUpload, setShowRespondentUpload] = useState(false);

  const handleFileLoad = (content) => {
    try {
      const parsed = JSON.parse(content);

      // Check if it's a respondent file (has role: 'respondent')
      if (parsed.role === 'respondent') {
        if (parsed.project && parsed.columns && parsed.data) {
          if (parsed.columns.length === 0) {
            toast.error('Неверный файл респондента: в опросе не определены показатели.');
            return;
          }

          onLoad(parsed);
          setUserRole('respondent');
          // toast.success('Файл опроса респондента загружен успешно!');
        } else {
          toast.error('Неверный формат файла респондента. Отсутствуют обязательные поля (project, columns или data).');
        }
      }
      // Check if it's an admin project file
      else if (parsed.project !== undefined && parsed.columns !== undefined && parsed.data !== undefined) {
        const adminProject = { ...parsed, role: 'admin' };
        onLoad(adminProject);
        setUserRole('admin');
        toast.success('Проект загружен успешно!');
      } else {
        toast.error('Неверный формат файла. Пожалуйста, загрузите корректный JSON файл проекта или респондента.');
      }
    } catch (e) {
      console.error('Parse error:', e);
      toast.error('Не удалось разобрать файл. Убедитесь, что это корректный JSON файл.');
    }
  };

  const handleNewProject = () => {
    const newProject = {
      project: 'Новый проект',
      role: 'admin',
      links: [],
      bg_color: '#f8fafc',
      text_color: '#1e293b',
      card_color: '#ffffff',
      image_url: '',
      columns: [],
      data: [],
    };
    onLoad(newProject);
    setUserRole('admin');
    setShowNewProjectModal(false);
    toast.success('Новый проект создан успешно!');
  };

  const handleAddData = () => {
    if (!newDataName.trim()) {
      toast.error('Пожалуйста, введите название элемента данных');
      return;
    }

    if (!project) {
      toast.error('Пожалуйста, сначала загрузите или создайте проект');
      return;
    }

    const newData = {
      id: Date.now(),
      name: newDataName,
      position: (project.data?.length || 0) + 1,
      order: (project.columns || []).map((column) => ({
        column_id: column.id,
        position: 1,
      })),
    };

    onLoad({
      ...project,
      data: [...(project.data || []), newData],
    });

    setNewDataName('');
    setShowNewDataModal(false);
    onNavigate('priority');
    toast.success('Элемент данных добавлен! Перенаправление на страницу порядка приоритетов...');
  };

  const handleRespondentUpload = (content) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.role === 'respondent' && parsed.project === project?.project) {
        const updatedData = [...(project.data || []), parsed.data];
        const updatedProject = {
          ...project,
          data: updatedData,
        };
        onLoad(updatedProject);
        toast.success(`Данные респондента "${parsed.data.name}" добавлены успешно!`);
        setShowRespondentUpload(false);
      } else {
        toast.error('Несовпадение названия проекта или неверный файл респондента.');
      }
    } catch (e) {
      toast.error('Не удалось загрузить файл респондента.');
    }
  };

  const handleExport = () => {
    if (!project) return;

    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.project || 'project'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Проект экспортирован успешно!');
  };

  const handleClearProject = () => {
    onClear();
    setUserRole(null);
    toast.success('Проект очищен успешно!');
  };

  return (
    <div className="home-page">
      {project && (
        <Navigation
          currentPage="home"
          onNavigate={onNavigate}
          projectName={project.project}
        />
      )}

      <div className="home-page__container">

        {project && project.role === 'admin' && (
          <div className="home-page__action-bar">
            <div className="action-bar__container">
              <Button variant="secondary" size="medium" onClick={handleExport}>
                <Download size={14} />
                Скачать проект
              </Button>
              <Button variant="success" size="medium" onClick={() => setShowRespondentUpload(true)}>
                <Upload size={14} />
                Загрузить данные респондента
              </Button>
              <Button variant="danger" size="medium" onClick={() => setShowNewProjectModal(true)}>
                <Sparkles size={14} />
                Новый проект
              </Button>
              <Button variant="danger" size="medium" onClick={handleClearProject}>
                <Trash2 size={14} />
                Очистить
              </Button>
            </div>
          </div>
        )}
        <div className="home-page__card">
          <h1 className="home-page__title">Опрос по приоритетам</h1>
          <p className="home-page__subtitle">Создавайте и управляйте опросами по оценке приоритетов</p>

          <div className="home-page__actions">
            <FileUpload onFileLoad={handleFileLoad}>
              <div className="home-page__upload-area">
                <div className="upload-area__icon">
                  <FileJson size={48} />
                </div>
                <div className="upload-area__text">
                  <strong>Перетащите файл</strong> или <strong>нажмите для выбора</strong>
                </div>
                <div className="upload-area__hint">Загрузите JSON файл проекта или респондента</div>
              </div>
            </FileUpload>

            {!project && (
              <Button variant="primary" size="large" onClick={() => setShowNewProjectModal(true)}>
                <Sparkles size={18} />
                Создать новый проект
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showNewProjectModal} onClose={() => setShowNewProjectModal(false)} title="Создать новый проект">
        <div className="modal__warning-icon">
          <AlertTriangle size={48} />
        </div>
        <p className="modal__warning-text">Вы уверены, что хотите создать новый проект?</p>
        <p className="modal__warning-message">
          <strong>Внимание:</strong> Текущие данные проекта будут безвозвратно удалены!
        </p>
        <div className="modal__actions">
          <Button variant="danger" onClick={handleNewProject}>
            Создать новый проект
          </Button>
          <Button variant="secondary" onClick={() => setShowNewProjectModal(false)}>
            Отмена
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showNewDataModal} onClose={() => setShowNewDataModal(false)} title="Создать новый элемент данных">
        <input
          type="text"
          value={newDataName}
          onChange={(e) => setNewDataName(e.target.value)}
          placeholder="Введите название элемента данных"
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
            Создать
          </Button>
          <Button variant="secondary" onClick={() => setShowNewDataModal(false)}>
            Отмена
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showRespondentUpload}
        onClose={() => setShowRespondentUpload(false)}
        title="Загрузить данные респондента"
      >
        <FileUpload onFileLoad={handleRespondentUpload}>
          <div className="modal__upload-area">
            <div className="upload-area__icon">
              <Upload size={32} />
            </div>
            <div className="upload-area__text">Нажмите для загрузки JSON файла респондента</div>
          </div>
        </FileUpload>
      </Modal>
    </div>
  );
};

export default HomePage;