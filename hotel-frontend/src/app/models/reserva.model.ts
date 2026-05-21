export interface Reserva {
    id: number | string;
    fecha: string | Date;
    fechaEntrada: string | Date;
    fechaSalida: string | Date;
    estado: string;
    precio: number;
    idEmpleado: number;
    docIdCliente: string;
    idHabitacion: string;
}