import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Clock, MapPin, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface AgendaEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  attendees?: string[];
  type: 'meeting' | 'appointment' | 'reminder' | 'task';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export default function Agenda() {
  const { loading } = useAppContext();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Agenda</h1>
            <p className="text-slate-600 text-lg">Gerencie seus compromissos e tarefas</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Evento
        </button>
      </div>

      {/* Date Selector */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-900">Selecionar Data</h3>
        </div>
        
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-field max-w-xs"
        />
      </div>

      {/* Events List */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <Clock className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-900">
            Eventos para {new Date(selectedDate).toLocaleDateString('pt-BR')}
          </h3>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              Nenhum evento agendado
            </h3>
            <p className="text-slate-500">
              Adicione um novo evento para começar a organizar sua agenda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                        event.type === 'appointment' ? 'bg-green-100 text-green-800' :
                        event.type === 'reminder' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {event.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        event.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                        event.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">{event.title}</h4>
                    {event.description && (
                      <p className="text-slate-600 mb-2">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.time}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {event.attendees.length} participante(s)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}