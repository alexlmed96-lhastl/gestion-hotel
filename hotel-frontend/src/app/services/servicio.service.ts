import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Servicio } from '../models/servicio.model';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private apiUrl = 'http://localhost:4000/api/servicios'; 

  constructor(private http: HttpClient) { }

  // --- CRUD ORIGINAL DE SERVICIOS ---
  getServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(this.apiUrl);
  }

  crearServicio(servicio: Servicio): Observable<Servicio> {
    return this.http.post<Servicio>(this.apiUrl, servicio);
  }

  actualizarServicio(id: string | number, servicio: Servicio): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.apiUrl}/${id}`, servicio);
  }

  eliminarServicio(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}