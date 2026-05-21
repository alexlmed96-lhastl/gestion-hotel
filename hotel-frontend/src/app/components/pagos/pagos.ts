import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';

import { PagoService } from '../../services/pago.service';
import { ReservaService } from '../../services/reserva.service';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, InputTextModule, FormsModule, ReactiveFormsModule, ToastModule, TagModule],
  providers: [MessageService],
  templateUrl: './pagos.html',
  styleUrls: ['./pagos.css'] // Puedes usar el mismo CSS de checkin/habitaciones
})
export class PagosComponent implements OnInit {
  @ViewChild('dt') dt: Table | undefined;

  pagos: any[] = [];
  reservasActivas: any[] = []; // Para el selector del formulario
  
  stats = { totalIngresos: 0, efectivo: 0, tarjeta: 0, transferencia: 0 };

  pagoDialog: boolean = false;
  pagoForm!: FormGroup;

  constructor(
    private pagoService: PagoService,
    private reservaService: ReservaService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.pagoForm = this.fb.group({
      idReserva: ['', Validators.required],
      monto: ['', [Validators.required, Validators.min(1)]],
      metodo: ['Efectivo', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarPagos();
    this.cargarReservas();
  }

  cargarPagos() {
    this.pagoService.getPagos().subscribe({
      next: (data) => {
        this.pagos = data;
        this.calcularEstadisticas();
        this.cdr.detectChanges();
      }
    });
  }

  cargarReservas() {
    // Cargamos reservas para que el recepcionista elija a quién cobrarle
    this.reservaService.getReservas().subscribe({
      next: (data) => {
        this.reservasActivas = data.filter((r: any) => 
          r.estado?.toUpperCase() === 'CONFIRMADA' || r.estado?.toUpperCase() === 'CHECKIN'
        );
      }
    });
  }

  calcularEstadisticas() {
    this.stats.totalIngresos = this.pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    this.stats.efectivo = this.pagos.filter(p => p.metodo === 'Efectivo').reduce((sum, p) => sum + parseFloat(p.monto), 0);
    this.stats.tarjeta = this.pagos.filter(p => p.metodo === 'Tarjeta').reduce((sum, p) => sum + parseFloat(p.monto), 0);
    this.stats.transferencia = this.pagos.filter(p => p.metodo === 'Transferencia').reduce((sum, p) => sum + parseFloat(p.monto), 0);
  }

  aplicarFiltroGlobal(event: any) {
    this.dt?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getMetodoColor(metodo: string): any {
    if (metodo === 'Efectivo') return 'success';
    if (metodo === 'Tarjeta') return 'info';
    return 'warn'; // Transferencia
  }

  abrirNuevoPago() {
    this.pagoForm.reset({ metodo: 'Efectivo' });
    this.pagoDialog = true;
  }

  guardarPago() {
    if (this.pagoForm.invalid) return;
    
    // Obtenemos los valores y agregamos la observación manualmente
    const datos = {
        ...this.pagoForm.value,
        observacion: 'Pago registrado desde el sistema' // <--- AÑADIDO
    };

    this.pagoService.registrarPago(datos).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pago registrado.' });
        this.pagoDialog = false;
        this.cargarPagos(); 
      },
      error: (err) => {
        // Esto te mostrará el error real que viene del servidor en un Toast
        const msg = err.error?.error || 'Error al procesar el pago.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    });
  }
  // Variables para la lógica del negocio
  estadoCuentaActual: any = null;
  vuelto: number = 0;

  // Cuando el recepcionista elige la reserva en el modal
  onReservaChange(idReservaValor: any) {
    const id = Number(idReservaValor);

    if (!id) {
      this.estadoCuentaActual = null;
      this.pagoForm.patchValue({ monto: '' });
      this.vuelto = 0;
      return;
    }

    // Llamamos al backend para que haga las matemáticas
    this.pagoService.getEstadoCuenta(id).subscribe({
      next: (data) => {
        this.estadoCuentaActual = data;
        // Autocompletamos el input con lo que debe el cliente
        this.pagoForm.patchValue({ monto: data.saldo });
        this.calcularVuelto();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener el estado de cuenta.' });
      }
    });
  }

  // Se ejecuta cada vez que el recepcionista teclea un número en el input
  calcularVuelto() {
    const montoAPagar = this.estadoCuentaActual?.saldo || 0;
    const montoRecibido = this.pagoForm.get('monto')?.value || 0;
    
    if (montoRecibido > montoAPagar) {
      this.vuelto = montoRecibido - montoAPagar;
    } else {
      this.vuelto = 0;
    }
  }
}