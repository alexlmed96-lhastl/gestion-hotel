import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private apiUrl = 'http://localhost:4000/api/reservas'; 
  private huespedesUrl = 'http://localhost:4000/api/huespedes'; // <-- Nueva ruta base para huéspedes añadida

  constructor(private http: HttpClient) { }

  // --- CRUD ORIGINAL DE RESERVAS (Intacto) ---
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

  // --- FUNCIONES PARA HUÉSPEDES (Rutas corregidas) ---
  getHuespedesPorReserva(idReserva: number): Observable<any[]> {
    // Corregido: Apunta a /api/huespedes/reserva/:idReserva
    return this.http.get<any[]>(`${this.huespedesUrl}/reserva/${idReserva}`);
  }

  addHuespedAReserva(idReserva: number, docId: string): Observable<any> {
    // Asegúrate de que el body contenga ambos campos tal como lo pide tu backend
    return this.http.post('http://localhost:4000/api/huespedes', { 
      idReserva: idReserva, 
      docId: docId 
    });
  }
  // NUEVO: Para poder quitar un acompañante si el recepcionista se equivoca
  quitarHuespedDeReserva(idReserva: number, docId: string): Observable<any> {
    return this.http.delete(`${this.huespedesUrl}/${idReserva}/${docId}`);
  }

  // --- FUNCIONES DE ESTADO (Check-in / Check-out) ---
  confirmarCheckIn(idReserva: number): Observable<any> {
    // Corregido: Cambiado de POST a PATCH para que coincida con backend
    return this.http.patch(`${this.apiUrl}/${idReserva}/checkin`, {});
  }

  // NUEVO: Agregado el método para Check-out
  confirmarCheckOut(idReserva: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${idReserva}/checkout`, {});
  }

  // NUEVO: Agregado el método para Cancelar
  cancelarReserva(idReserva: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${idReserva}/cancelar`, {});
  }

  // --- SERVICIOS EXTRA (Intactos, apuntan bien al backend) ---
  getCatalogoServicios(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:4000/api/servicios`); 
  }

  getServiciosConsumidos(idReserva: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:4000/api/servicios/reserva/${idReserva}`); 
  }

  agregarServicio(datos: { idReserva: number, idServicio: number, cantidad: number }): Observable<any> {
    return this.http.post(`http://localhost:4000/api/servicios/consumo`, datos);
  }
}