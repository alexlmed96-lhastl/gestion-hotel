import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Habitacion } from '../models/habitacion.model';

@Injectable({
  providedIn: 'root'
})
export class HabitacionService {
  private apiUrl = 'http://localhost:4000/api/habitaciones'; 

  constructor(private http: HttpClient) { }

  getHabitaciones(): Observable<Habitacion[]> {
    return this.http.get<Habitacion[]>(this.apiUrl);
  }

  crearHabitacion(habitacion: Habitacion): Observable<Habitacion> {
    return this.http.post<Habitacion>(this.apiUrl, habitacion);
  }

  actualizarHabitacion(id: string | number, habitacion: Habitacion): Observable<Habitacion> {
  return this.http.put<Habitacion>(`${this.apiUrl}/${id}`, habitacion);
}

eliminarHabitacion(id: string | number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}`);
}
// AHORA SÍ: Usamos PATCH para coincidir exactamente con tu backend
  changeEstado(id: string, estado: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, { estado: estado });
  }
  
}