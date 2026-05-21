export interface Habitacion {
    id: string | number; 
    tipo: string;
    piso: string | number;
    estado?: string;
    idSucursal: number;
    sucursal?: string; // Este viene del JOIN de tu API
}