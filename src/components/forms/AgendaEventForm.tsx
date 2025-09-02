import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AgendaEvent } from '../../types';

interface AgendaEventFormProps {
  event?: AgendaEvent | null;
  onSubmit: (event: Omit<AgendaEvent, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  defaultDate?: string | null;
}

const EVENT_TYPES = [
  { value: 'evento', label: 'Evento' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'pagamento', label: 'Pagamento' },
  { value: 'cobranca', label: 'Cobrança' },
  { value: 'entrega', label: 'Entrega' },
  { value: 'outros', label: 'Outros' }
];

const PRIORITY_LEVELS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' }
];

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'adiado', label: 'Adiado' }
];

export function AgendaEventForm({ event, onSubmit, onCancel, defaultDate }: AgendaEventFormProps) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || defaultDate || new Date().toISOString().split('T')[0],
    time: event?.time || '',
    type: event?.type || 'evento',
    priority: event?.priority || 'media',
    status: event?.status || 'pendente',
    reminderDate: event?.reminderDate || '',
    observations: event?.observations || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.title.trim()) {
      alert('Por favor, informe o título do evento.');
      return;
    }
    
    // Clean data - ensure empty strings become null for optional fields
    const cleanedData = {
      ...formData,
      title: formData.title.trim(),
      description: !formData.description || formData.description.trim() === '' ? null : formData.description.trim(),
      time: !formData.time || formData.time.trim() === '' ? null : formData.time,
      reminderDate: !formData.reminderDate || formData.reminderDate.trim() === '' ? null : formData.reminderDate,
      observations: !formData.observations || formData.observations.trim() === '' ? null : formData.observations.trim()
    };
    
    console.log('📝 Enviando evento:', cleanedData);
    onSubmit(cleanedData as Omit<AgendaEvent, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {event ? 'Editar Evento' : 'Novo Evento'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group md:col-span-2">
                <label className="form-label">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="Título do evento"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Horário</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="input-field"
                  required
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Prioridade *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="input-field"
                  required
                >
                  {PRIORITY_LEVELS.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="input-field"
                  required
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Data de Lembrete</label>
                <input
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminderDate: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Descrição detalhada do evento..."
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Observações</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary group"
              >
                {event ? 'Atualizar Evento' : 'Criar Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}