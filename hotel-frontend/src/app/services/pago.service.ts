import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = 'http://localhost:4000/api/pagos'; // Asegúrate de que el puerto coincida con tu backend

  constructor(private http: HttpClient) { }

  getPagos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getPagosPorReserva(idReserva: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reserva/${idReserva}`);
  }

  registrarPago(datos: any): Observable<any> {
    return this.http.post(this.apiUrl, datos);
  }
  // ESTA ES LA FUNCIÓN CLAVE QUE FALTA
  getEstadoCuenta(idReserva: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estado-cuenta/${idReserva}`);
  }
}