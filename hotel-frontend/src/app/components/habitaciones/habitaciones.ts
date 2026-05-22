import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api'; 

import { HabitacionService } from '../../services/habitacion.service';
import { ReservaService } from '../../services/reserva.service'; 
import { ServicioService } from '../../services/servicio.service'; 
import { PersonaService } from '../../services/persona.service'; 

@Component({
  selector: 'app-habitaciones',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, FormsModule, ReactiveFormsModule, DialogModule, InputTextModule],
  providers: [MessageService], 
  templateUrl: './habitaciones.html',
  styleUrls: ['./habitaciones.css']
})
export class HabitacionesComponent implements OnInit {
  habitaciones: any[] = [];
  habitacionesFiltradas: any[] = [];
  sucursales: any[] = []; 
  pisos: any[] = [];
  servicios: any[] = []; 
  
  sucursalSeleccionada: any = "null"; 
  stats = { total: 0, disponibles: 0, ocupadas: 0, mantenimiento: 0, ocupacionPorcentaje: 0 };

  reservaDialog: boolean = false;
  reservaForm!: FormGroup;

  clienteDialog: boolean = false;
  clienteForm!: FormGroup;
  // ... tus variables existentes ...
  fechaConsulta: string = new Date().toISOString().split('T')[0]; // Hoy por defecto
  todasLasReservas: any[] = []; // Guardaremos las reservas aquí para cruzar datos

  constructor(
    private habitacionService: HabitacionService,
    private reservaService: ReservaService,
    private servicioService: ServicioService,
    private personaService: PersonaService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService 
  ) {
    this.crearFormularios();
  }

  ngOnInit(): void {
    // Cargamos habitaciones y reservas al mismo tiempo
    this.habitacionService.getHabitaciones().subscribe((habs: any[]) => {
      this.habitaciones = habs;
      
      const mapSucursales = new Map();
      habs.forEach((h: any) => {
        if (h.idSucursal && h.sucursal) mapSucursales.set(h.idSucursal, { id: h.idSucursal, nombre: h.sucursal });
      });
      this.sucursales = Array.from(mapSucursales.values());
      
      // SOLUCIÓN AL ERROR NG0100: Avisamos a Angular que acabamos de llenar el select
      this.cdr.detectChanges(); 

      // Ahora pedimos las reservas para cruzar los datos
      this.reservaService.getReservas().subscribe(reservas => {
        this.todasLasReservas = reservas;
        this.cargarServicios();
        this.filtrarPorSucursal(); 
      });
    });
  }

  crearFormularios() {
    this.reservaForm = this.fb.group({
      fecha: [new Date().toISOString().split('T')[0]],
      fechaEntrada: ['', Validators.required],
      fechaSalida: ['', Validators.required],
      estado: ['CONFIRMADA', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      idEmpleado: ['', Validators.required],
      docIdCliente: ['', Validators.required],
      idHabitacion: ['', Validators.required]
    });

    this.clienteForm = this.fb.group({
      docId: ['', [Validators.required, Validators.maxLength(11)]],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      nacionalidad: ['Peruana', Validators.required],
      fechaNac: ['', Validators.required],
      sexo: ['M', Validators.required]
    });
  }

  cargarServicios() {
    this.servicioService.getServicios().subscribe(data => this.servicios = data);
  }

  cargarHabitaciones() {
    this.habitacionService.getHabitaciones().subscribe({
      next: (data: any[]) => { 
        this.habitaciones = data;
        const mapSucursales = new Map();
        data.forEach((h: any) => {
          if (h.idSucursal && h.sucursal) mapSucursales.set(h.idSucursal, { id: h.idSucursal, nombre: h.sucursal });
        });
        this.sucursales = Array.from(mapSucursales.values());
        this.filtrarPorSucursal(); 
      }
    });
  }

  filtrarPorSucursal() {
    if (this.sucursalSeleccionada !== "null" && this.sucursalSeleccionada !== null) {
      this.habitacionesFiltradas = this.habitaciones.filter(h => h.idSucursal == this.sucursalSeleccionada);
    } else {
      this.habitacionesFiltradas = this.habitaciones;
    }
    this.procesarHabitaciones();
  }

  procesarHabitaciones() {
    // 1. CÁLCULO DE DISPONIBILIDAD REAL
    // En habitaciones.ts, dentro de procesarHabitaciones()
// Reemplaza el bloque del forEach por este:
this.habitacionesFiltradas.forEach(h => {
  const reservaActiva = this.todasLasReservas.find(r => {
    if (r.idHabitacion !== h.id) return false;
    if (r.estado === 'CANCELADA' || r.estado === 'FINALIZADA') return false;
    const checkIn  = r.fechaEntrada ? r.fechaEntrada.split('T')[0] : '';
    const checkOut = r.fechaSalida  ? r.fechaSalida.split('T')[0]  : '';
    return this.fechaConsulta >= checkIn && this.fechaConsulta < checkOut;
  });

  if (reservaActiva) {
    // Hay reserva activa → el estado lo manda la reserva
    h.estadoVisual = reservaActiva.estado === 'CHECKIN' ? 'OCUPADA' : 'RESERVADA';
  } else {
    // Sin reserva activa → respetamos el estado real de la BD
    const estadoBD = h.estado?.toUpperCase();
    if (estadoBD === 'MANTENIMIENTO') {
      h.estadoVisual = 'MANTENIMIENTO';
    } else if (estadoBD === 'OCUPADA' || estadoBD === 'OCUPADO') {
      h.estadoVisual = 'OCUPADA';
    } else {
      h.estadoVisual = 'DISPONIBLE';
    }
  }
});
    // 2. TUS ESTADÍSTICAS (Ahora basadas en el estadoVisual real)
    this.stats.total = this.habitacionesFiltradas.length;
    this.stats.disponibles = this.habitacionesFiltradas.filter(h => h.estadoVisual === 'DISPONIBLE').length;
    this.stats.ocupadas = this.habitacionesFiltradas.filter(h => h.estadoVisual === 'OCUPADA' || h.estadoVisual === 'RESERVADA').length;
    this.stats.mantenimiento = this.habitacionesFiltradas.filter(h => h.estadoVisual === 'MANTENIMIENTO').length; // Opcional si manejas mantenimientos
    this.stats.ocupacionPorcentaje = this.stats.total > 0 ? Math.round((this.stats.ocupadas / this.stats.total) * 100) : 0;

    // 3. AGRUPAR POR PISOS (Tu código actual)
    const grupos = this.habitacionesFiltradas.reduce((acc, obj) => {
      const nombrePiso = `Piso ${obj.piso}`;
      if (!acc[nombrePiso]) acc[nombrePiso] = [];
      obj.precioVisily = obj.tipo.includes('SUITE') ? 210 : (obj.tipo.includes('INDIVIDUAL') ? 65 : 85);
      acc[nombrePiso].push(obj);
      return acc;
    }, {});

    this.pisos = Object.keys(grupos).map(key => ({ nombre: key, habitaciones: grupos[key] })).sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.cdr.detectChanges();
  }

  getSeverity(estado: string) {
    const e = estado?.trim().toUpperCase();
    if (e === 'OCUPADA' || e === 'RESERVADA') return 'danger'; // Rojo
    if (e === 'MANTENIMIENTO') return 'warn'; // Naranja/Amarillo
    return 'success'; // Verde para DISPONIBLE
  }

  cambiarEstado(id: string, nuevoEstado: string) {
    this.habitacionService.changeEstado(id, nuevoEstado).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Estado Actualizado', detail: `Habitación ${id} ahora está ${nuevoEstado}` });
        this.cargarHabitaciones(); 
      },
      error: (err: any) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message })
    });
  }

  abrirReservaModal(idHabitacion: string, precioBase: number) {
    this.reservaForm.reset({
      fecha: new Date().toISOString().split('T')[0],
      estado: 'CONFIRMADA',
      idHabitacion: idHabitacion,
      precio: precioBase,
      idEmpleado: 1  // ← agrega esta línea
    });
    this.reservaDialog = true;
  }

  guardarReservaRapida() {
    if (this.reservaForm.invalid) return;
    const datos = this.reservaForm.getRawValue();

    this.reservaService.crearReserva(datos).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Reserva Exitosa', detail: 'Huésped registrado.' });
        this.reservaDialog = false;
        this.cambiarEstado(datos.idHabitacion, 'OCUPADA'); 
      },
      error: (err: any) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Verifique los IDs.' })
    });
  }

  // --- LAS FUNCIONES DEL BOTÓN "+" ---
  abrirModalNuevoCliente() {
    this.clienteForm.reset({ nacionalidad: 'Peruana', sexo: 'M' });
    this.clienteDialog = true;
  }

  guardarNuevoCliente() {
    if (this.clienteForm.invalid) return;
    const datos = this.clienteForm.getRawValue();

    this.personaService.crearPersona(datos).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente registrado.' });
        this.clienteDialog = false;
        // Pega el DNI en el input de la reserva automáticamente
        this.reservaForm.patchValue({ docIdCliente: datos.docId });
      },
      error: (err: any) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message })
    });
  }
}