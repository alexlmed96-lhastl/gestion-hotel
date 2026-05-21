import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Persona } from '../models/persona.model';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  private apiUrl = 'http://localhost:4000/api/personas'; 

  constructor(private http: HttpClient) { }

  getPersonas(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.apiUrl);
  }

  crearPersona(persona: Persona): Observable<Persona> {
    return this.http.post<Persona>(this.apiUrl, persona);
  }

  actualizarPersona(id: string, persona: Persona): Observable<Persona> {
    return this.http.put<Persona>(`${this.apiUrl}/${id}`, persona);
  }

  eliminarPersona(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}