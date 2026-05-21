import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

// Componentes estables de PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Servicios y Modelos
import { ReservaService } from '../../services/reserva.service';
import { Reserva } from '../../models/reserva.model';
import { ServicioService } from '../../services/servicio.service';
import { Servicio } from '../../models/servicio.model';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    DialogModule, 
    InputTextModule, 
    FormsModule, 
    ReactiveFormsModule, 
    ToastModule
  ],
  providers: [MessageService], 
  templateUrl: './reservas.html'
})
export class ReservasComponent implements OnInit {
  reservas: Reserva[] = [];
  servicios: Servicio[] = [];
  
  serviciosDisponibles: any[] = [];
  serviciosConsumidos: any[] = [];
  
  // Variables de control operativas
  reservaSeleccionada: any = null;
  gestionDialog: boolean = false;
  idServicioSeleccionado: any = null; // Guardamos el ID numérico puro
  cantidadServicio: number = 1;

  // Variables de formularios
  reservaDialog: boolean = false;
  reservaForm!: FormGroup;
  modoEdicion: boolean = false;
  idActual?: number | string;

  constructor(
    private reservaService: ReservaService,
    private servicioService: ServicioService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {
    this.crearFormularios();
  }

  ngOnInit(): void {
    this.cargarReservas();
    this.cargarServicios();

    this.route.queryParams.subscribe(params => {
        if (params['hab']) {
            this.abrirNuevo();
            this.reservaForm.patchValue({ idHabitacion: params['hab'] });
        }
    });

    // CORRECCIÓN PARA EVITAR EL ERROR NG0100
    this.reservaService.getCatalogoServicios().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.serviciosDisponibles = data;
        });
      },
      error: (err) => console.error("Error al cargar catálogo:", err)
    });
  }

  crearFormularios() {
    this.reservaForm = this.fb.group({
      id: [''],
      fecha: [new Date().toISOString().split('T')[0]],
      fechaEntrada: ['', Validators.required],
      fechaSalida: ['', Validators.required],
      estado: ['CONFIRMADA', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      idEmpleado: ['', Validators.required],
      docIdCliente: ['', Validators.required],
      idHabitacion: ['', Validators.required]
    });
  }

  cargarServicios() {
    this.servicioService.getServicios().subscribe(data => {
      this.servicios = data;
      this.cdr.detectChanges();
    });
  }

  cargarReservas() {
    this.reservaService.getReservas().subscribe(data => {
      this.reservas = data;
      this.cdr.detectChanges();
    });
  }

  abrirNuevo() {
    this.reservaForm.reset({ 
      fecha: new Date().toISOString().split('T')[0], 
      estado: 'CONFIRMADA' 
    });
    this.modoEdicion = false;
    this.reservaDialog = true;
  }

  editarReserva(reserva: Reserva) {
    this.modoEdicion = true;
    this.idActual = reserva.id;
    
    // Usamos 'as string' para calmar al compilador de TypeScript
    const datosFormateados = {
      ...reserva,
      fechaEntrada: reserva.fechaEntrada ? (reserva.fechaEntrada as string).split('T')[0] : '',
      fechaSalida: reserva.fechaSalida ? (reserva.fechaSalida as string).split('T')[0] : ''
    };

    this.reservaForm.patchValue(datosFormateados);
    this.reservaDialog = true;
  }

  abrirGestion(reserva: any) {
    this.reservaSeleccionada = reserva;
    this.idServicioSeleccionado = null;
    this.cantidadServicio = 1;
    this.gestionDialog = true;
    this.cargarConsumosActuales();
  }

  cargarConsumosActuales() {
    if (!this.reservaSeleccionada) return;
    this.reservaService.getServiciosConsumidos(this.reservaSeleccionada.id).subscribe({
      next: (data) => {
        this.serviciosConsumidos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  agregarServicio() {
    if (!this.idServicioSeleccionado || !this.reservaSeleccionada) return;

    const payload = {
      idReserva: this.reservaSeleccionada.id,
      idServicio: Number(this.idServicioSeleccionado), // Forzamos cast a número real
      cantidad: this.cantidadServicio
    };

    this.reservaService.agregarServicio(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Servicio cargado a la cuenta' });
        this.idServicioSeleccionado = null;
        this.cantidadServicio = 1;
        this.cargarConsumosActuales(); // Refrescar historial del modal
      },
      error: (err) => {
        console.error("Error al cargar servicio", err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el servicio.' });
      }
    });
  }

  guardarReserva() {
    if (this.reservaForm.invalid) return;
    const datos = this.reservaForm.getRawValue();

    if (this.modoEdicion && this.idActual) {
      this.reservaService.actualizarReserva(this.idActual, datos).subscribe({
        next: () => {
          this.cargarReservas();
          this.reservaDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva modificada correctamente.' });
        }
      });
    } else {
      const { id, ...nueva } = datos;
      this.reservaService.crearReserva(nueva as any).subscribe({
        next: () => {
          this.cargarReservas();
          this.reservaDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Nueva reserva registrada.' });
        }
      });
    }
  }

  ocultarDialogo() { this.reservaDialog = false; }

  eliminarReserva(id: any) {
    if(confirm('¿Está completamente seguro de que desea eliminar esta reserva? Esta acción afectará los registros históricos.')) {
      this.reservaService.eliminarReserva(id).subscribe({
        next: () => {
          this.cargarReservas();
          this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: 'Reserva removida del sistema.' });
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la reserva.' });
        }
      });
    }
  }
}