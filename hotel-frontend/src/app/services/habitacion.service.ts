import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Habitacion, Sucursal } from '../models/habitacion.model';

@Injectable({ providedIn: 'root' })
export class HabitacionService {
  private apiUrl = 'http://localhost:4000/api/habitaciones';

  constructor(private http: HttpClient) {}

  getHabitaciones(): Observable<Habitacion[]> {
    return this.http.get<Habitacion[]>(this.apiUrl);
  }

  getById(id: string): Observable<Habitacion> {
    return this.http.get<Habitacion>(`${this.apiUrl}/${id}`);
  }

  getSucursales(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(`${this.apiUrl}/sucursales`);
  }

  crearHabitacion(habitacion: Habitacion): Observable<any> {
    return this.http.post(this.apiUrl, habitacion);
  }

  actualizarHabitacion(id: string, habitacion: Habitacion): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, habitacion);
  }

  eliminarHabitacion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  changeEstado(id: string, estado: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, { estado });
  }
}