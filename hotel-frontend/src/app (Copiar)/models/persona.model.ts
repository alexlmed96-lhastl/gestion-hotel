export interface Persona {
    docId: string;
    nombres: string;
    apellidos: string;
    correo?: string;
    nacionalidad?: string;
    fechaNac?: string | Date;
    sexo?: string;
}