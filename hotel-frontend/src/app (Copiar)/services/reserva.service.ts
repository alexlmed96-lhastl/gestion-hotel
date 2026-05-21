import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private apiUrl = 'http://localhost:4000/api/reservas'; 

  constructor(private http: HttpClient) { }

  // --- CRUD ORIGINAL DE RESERVAS ---
  getReservas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearReserva(datos: any): Observable<any> {
    return this.http.post(this.apiUrl, datos);
  }

  actualizarReserva(id: string | number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, datos);
  }

  eliminarReserva(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // --- NUEVAS FUNCIONES PARA EL CHECK-IN ---
  getHuespedesPorReserva(idReserva: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${idReserva}/huespedes`);
  }

  addHuespedAReserva(idReserva: number, docId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idReserva}/huespedes`, { docId });
  }

  confirmarCheckIn(idReserva: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idReserva}/checkin`, {});
  }
  // Busca el catálogo general de servicios usando el controlador de servicios
  getCatalogoServicios(): Observable<any[]> {
    // Apunta directamente a /api/servicios
    return this.http.get<any[]>(`http://localhost:4000/api/servicios`); 
  }

  // Busca los consumos YA REALIZADOS de una reserva usando la función 'getByReserva'
  getServiciosConsumidos(idReserva: number): Observable<any[]> {
    // Apunta a /api/servicios/reserva/:id
    return this.http.get<any[]>(`http://localhost:4000/api/servicios/reserva/${idReserva}`); 
  }

  // Guarda un nuevo consumo usando la función 'consumo' de tu controlador
  agregarServicio(datos: { idReserva: number, idServicio: number, cantidad: number }): Observable<any> {
    // Apunta a /api/servicios/consumo
    return this.http.post(`http://localhost:4000/api/servicios/consumo`, datos);
  }
  
}