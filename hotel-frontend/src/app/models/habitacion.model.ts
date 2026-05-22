export interface Habitacion {
  id: string;
  tipo: string;
  piso: number;
  camas: number;          // nombre real en BD
  precioNoche: number;    // nombre real en BD
  estado?: string;
  idSucursal: number;
  sucursal?: string;      // viene del JOIN
}

export interface Sucursal {
  id: number;
  nombre: string;
}

export const TIPOS_HABITACION = [
  { value: 'Simple',   label: 'Simple',   icono: '🛏️',         camasDefault: 1, precioDefault: 65  },
  { value: 'Doble',    label: 'Doble',    icono: '🛏️🛏️',      camasDefault: 2, precioDefault: 85  },
  { value: 'Triple',   label: 'Triple',   icono: '🛏️🛏️🛏️',   camasDefault: 3, precioDefault: 120 },
  { value: 'Suite',    label: 'Suite',    icono: '👑',          camasDefault: 3, precioDefault: 210 },
  { value: 'Familiar', label: 'Familiar', icono: '🏠',          camasDefault: 4, precioDefault: 150 },
];