export type ConfigValueType = 'json' | 'string';

export interface RemoteConfigKeyMeta {
  key: string;
  type: ConfigValueType;
  description: string;
  sourcePage: string | null;
  sourceLabel: string | null;
}

export interface RemoteConfigEntry {
  key: string;
  type: ConfigValueType;
  description: string;
  value: string;
  updatedAt: string | null;
  updatedBy: string | null;
  sourcePage: string | null;
  sourceLabel: string | null;
}

export const REMOTE_CONFIG_KEYS: RemoteConfigKeyMeta[] = [
  {
    key: 'event_schedule_json',
    type: 'json',
    description: 'Programa completo del evento para el hero banner y el itinerario',
    sourcePage: '/admin/timeline',
    sourceLabel: 'Timeline',
  },
  {
    key: 'venues_json',
    type: 'json',
    description: 'Lista de venues con coordenadas y direcciones a pie',
    sourcePage: '/admin/content',
    sourceLabel: 'Contenido',
  },
  {
    key: 'time_gates_json',
    type: 'json',
    description: 'Timestamps de desbloqueo para menús y carta de asientos',
    sourcePage: '/admin/content/time-gated',
    sourceLabel: 'Contenido Programado',
  },
  {
    key: 'seating_chart_json',
    type: 'json',
    description: 'Asignación de mesas y asientos por invitado',
    sourcePage: '/admin/guests',
    sourceLabel: 'Invitados',
  },
  {
    key: 'quick_contacts_json',
    type: 'json',
    description: 'Números de teléfono de coordinadores y taxis',
    sourcePage: '/admin/content',
    sourceLabel: 'Contenido',
  },
  {
    key: 'wind_tips_json',
    type: 'json',
    description: 'Mensajes de consejos de Levante/Poniente',
    sourcePage: '/admin/content',
    sourceLabel: 'Contenido',
  },
  {
    key: 'development_trigger_time',
    type: 'string',
    description: 'Fecha límite de revelado de fotos de la cámara (ISO 8601)',
    sourcePage: null,
    sourceLabel: null,
  },
];

export const CONFIG_COLLECTION = 'remote_config';
