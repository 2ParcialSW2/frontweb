// Interfaces para Maquinaria
export interface Maquinaria {
  id: number;
  nombre: string;
  estado: string;
  descripcion: string;
}

export interface MaquinariaDTO {
  id?: number;
  nombre: string;
  estado: string;
  descripcion: string;
}

// Interfaces para MaquinariaCarpintero (Asignaciones)
export interface MaquinariaCarpintero {
  id: number;
  estado: string;
  maquinaria: Maquinaria;
  carpintero: {
    id: number;
    nombre_completo: string;
    email: string;
    telefono: string;
    direccion: string;
    estado: boolean;
    rol: {
      id: number;
      nombre: string;
    };
  };
}

export interface MaquinariaCarpinteroDTO {
  id?: number;
  estado: string;
  maquinariaId: number;
  carpinteroId: number;
}

// Estados disponibles para maquinarias
export const ESTADOS_MAQUINARIA = [
  'disponible',
  'en_uso',
  'mantenimiento',
  'fuera_de_servicio'
] as const;

// Estados disponibles para asignaciones
export const ESTADOS_ASIGNACION = [
  'disponible',
  'en_uso',
  'reservada'
] as const;

// Tipos para mejorar la type safety
export type EstadoMaquinaria = typeof ESTADOS_MAQUINARIA[number];
export type EstadoAsignacion = typeof ESTADOS_ASIGNACION[number];

// Interface para obtener información completa de una maquinaria
export interface MaquinariaConAsignaciones {
  maquinaria: Maquinaria;
  asignaciones: MaquinariaCarpintero[];
  disponible: boolean;
}

// Interface para información resumida de maquinaria con estado de disponibilidad
export interface MaquinariaDisponible {
  maquinaria: Maquinaria;
  disponible: boolean;
}

// Interface para resumen de asignaciones por carpintero
export interface ResumenCarpintero {
  todasAsignaciones: MaquinariaCarpintero[];
  maquinariasEnUso: MaquinariaCarpintero[];
  totalMaquinariasEnUso: number;
  totalAsignaciones: number;
}