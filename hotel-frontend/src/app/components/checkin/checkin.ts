import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { ReservaService } from '../../services/reserva.service';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, InputTextModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './checkin.html',
  styleUrls: ['./checkin.css']
})
export class CheckinComponent implements OnInit {
  todasLasReservasConfirmadas: any[] = [];
  reservasPendientes: any[] = [];
  
  fechaBusqueda: string = new Date().toISOString().split('T')[0];
  textoBusqueda: string = ''; 

  checkinDialog: boolean = false;
  reservaSeleccionada: any = null;
  nuevoHuespedDni: string = '';
  huespedesActuales: any[] = [];

  constructor(
    private reservaService: ReservaService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
  }

  cargarReservas() {
    this.reservaService.getReservas().subscribe({
      next: (data) => {
        let confirmadas = data.filter((r: any) => r.estado?.trim().toUpperCase() === 'CONFIRMADA');
        this.todasLasReservasConfirmadas = Array.from(new Set(confirmadas.map((r: any) => r.id)))
          .map(id => confirmadas.find((r: any) => r.id === id));

        this.aplicarFiltrosInteligentes(); 
      }
    });
  }

  // --- FILTRO MANUAL A PRUEBA DE FALLOS ---
  aplicarFiltrosInteligentes() {
    const texto = this.textoBusqueda ? this.textoBusqueda.trim().toLowerCase() : '';

    if (texto.length > 0) {
      // 1. MODO OMNIBOX: Si hay texto, buscamos coincidencias e ignoramos la fecha
      this.reservasPendientes = this.todasLasReservasConfirmadas.filter(r => {
        const cliente = r.cliente ? r.cliente.toLowerCase() : '';
        const dni = r.docIdCliente ? r.docIdCliente.toLowerCase() : '';
        const hab = r.idHabitacion ? r.idHabitacion.toString().toLowerCase() : '';
        
        return cliente.includes(texto) || dni.includes(texto) || hab.includes(texto);
      });
    } else {
      // 2. MODO NORMAL: Si no hay texto, mostramos las de la fecha elegida
      this.reservasPendientes = this.todasLasReservasConfirmadas.filter(r => {
        const fechaEntrada = r.fechaEntrada ? r.fechaEntrada.split('T')[0] : '';
        return fechaEntrada === this.fechaBusqueda;
      });
    }
    
    this.cdr.detectChanges();
  }

  // Al limpiar el texto manualmente, forzamos que vuelva al modo normal
  limpiarBusqueda() {
    this.textoBusqueda = '';
    this.aplicarFiltrosInteligentes();
  }

  abrirCheckin(reserva: any) {
    this.reservaSeleccionada = reserva;
    this.cargarHuespedesReserva(reserva.id);
    this.checkinDialog = true;
  }

  cargarHuespedesReserva(idReserva: number) {
    this.reservaService.getHuespedesPorReserva(idReserva).subscribe({
      next: (data) => {
        this.huespedesActuales = data;
        this.cdr.detectChanges();
      }
    });
  }

  agregarAcompanante() {
    if (!this.nuevoHuespedDni) return;
    this.reservaService.addHuespedAReserva(this.reservaSeleccionada.id, this.nuevoHuespedDni).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Agregado', detail: 'Acompañante registrado.' });
        this.cargarHuespedesReserva(this.reservaSeleccionada.id);
        this.nuevoHuespedDni = '';
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El DNI no existe.' })
    });
  }

  confirmarCheckIn() {
    this.reservaService.confirmarCheckIn(this.reservaSeleccionada.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Check-In completado.' });
        this.checkinDialog = false;
        this.cargarReservas(); 
      }
    });
  }
}