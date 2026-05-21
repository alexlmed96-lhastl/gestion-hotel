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
import { PersonaService } from '../../services/persona.service';
import { PagoService } from '../../services/pago.service';



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
  servicios: Servicio[] = []; // <-- Usaremos este para todo el catálogo
  
  // Variables de control operativas para consumos
  serviciosConsumidos: any[] = [];
  gestionDialog: boolean = false;
  idServicioSeleccionado: any = null;
  cantidadServicio: number = 1;
  
  // Variables para gestión de Huéspedes
  huespedesDialog: boolean = false;
  huespedesDeReserva: any[] = [];
  nuevoHuespedDoc: string = '';

  // Variables para el resumen total del Estado de Cuenta
  detalleDialog: boolean = false;
  totalGeneral: number = 0;

  // Variables Globales de Selección
  reservaSeleccionada: any = null;

  // Variables de formularios
  reservaDialog: boolean = false;
  reservaForm!: FormGroup;
  modoEdicion: boolean = false;
  idActual?: number | string;
  nuevaPersonaDialog: boolean = false;
  personaForm!: FormGroup;
  // Variables para la Ficha / Pagos
  pagosRealizados: any[] = [];
  totalPagado: number = 0;
  saldoPendiente: number = 0;

  // Variables para el formulario de pago rápido
  nuevoPagoMonto: number = 0;
  nuevoPagoMetodo: string = 'Efectivo';

  // AÑADE ESTA LÍNEA AQUÍ
  serviciosDisponibles: any[] = []; 
  

  constructor(
    private reservaService: ReservaService,
    private servicioService: ServicioService,
    private personaService: PersonaService,
    private pagoService: PagoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {
    this.crearFormularios();
  }

  ngOnInit(): void {
    // Usamos forkJoin para cargar todo en paralelo y asegurar que la vista 
    // solo se renderice cuando los datos estén presentes.
    import('rxjs').then(({ forkJoin }) => {
      forkJoin({
        reservas: this.reservaService.getReservas(),
        servicios: this.servicioService.getServicios()
      }).subscribe({
        next: (data) => {
          this.reservas = data.reservas;
          this.servicios = data.servicios;
          this.serviciosDisponibles = data.servicios;
          this.cdr.detectChanges(); // Solo detectamos cambios una vez que ambos llegaron
        },
        error: (err) => console.error("Error al cargar datos iniciales", err)
      });
    });

    this.route.queryParams.subscribe(params => {
        if (params['hab']) {
            this.abrirNuevo();
            this.reservaForm.patchValue({ idHabitacion: params['hab'] });
        }
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
    
    this.personaForm = this.fb.group({
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
    this.servicioService.getServicios().subscribe({
      next: (data) => {
        this.servicios = data;
      }
    });
  }

  cargarReservas() {
    this.reservaService.getReservas().subscribe({
      next: (data) => {
        this.reservas = data;
      }
    });
  }

  // ==========================================
  // OPERACIONES DE CRUD RESERVA
  // ==========================================
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
    
    const datosFormateados = {
      ...reserva,
      fechaEntrada: reserva.fechaEntrada ? (reserva.fechaEntrada as string).split('T')[0] : '',
      fechaSalida: reserva.fechaSalida ? (reserva.fechaSalida as string).split('T')[0] : ''
    };

    this.reservaForm.patchValue(datosFormateados);
    this.reservaDialog = true;
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
    if(confirm('¿Está seguro de que desea eliminar esta reserva? Esta acción borrará su historial.')) {
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

  // ==========================================
  // FLUJO DE ESTADO: CHECK-IN / CHECK-OUT
  // ==========================================
  hacerCheckIn(reserva: any) {
    if (confirm(`¿Desea registrar la entrada (Check-in) para la reserva RES-${reserva.id}? La habitación pasará a estado OCUPADA.`)) {
      this.reservaService.confirmarCheckIn(reserva.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Check-In', detail: 'Entrada registrada con éxito.' });
          this.cargarReservas(); 
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo realizar el check-in.' });
        }
      });
    }
  }

  hacerCheckOut(reserva: any) {
    if (confirm(`¿Desea registrar la salida (Check-out) de la reserva RES-${reserva.id}? La habitación pasará a estado LIMPIEZA.`)) {
      this.reservaService.confirmarCheckOut(reserva.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Check-Out', detail: 'Salida registrada. Habitación en limpieza.' });
          this.cargarReservas(); 
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo realizar el check-out.' });
        }
      });
    }
  }

  // ==========================================
  // GESTIÓN DE CONSUMOS EXTRAS (ROOM SERVICE)
  // ==========================================
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
      },
      error: (err) => console.error(err)
    });
  }

  agregarServicio() {
    if (!this.idServicioSeleccionado || !this.reservaSeleccionada) return;

    const payload = {
      idReserva: this.reservaSeleccionada.id,
      idServicio: Number(this.idServicioSeleccionado),
      cantidad: this.cantidadServicio
    };

    this.reservaService.agregarServicio(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Cargado', detail: 'Servicio cargado a la cuenta.' });
        this.idServicioSeleccionado = null;
        this.cantidadServicio = 1;
        this.cargarConsumosActuales(); 
      },
      error: (err) => {
        console.error("Error al cargar servicio", err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el consumo.' });
      }
    });
  }

  // ==========================================
  // GESTIÓN DE HUÉSPEDES
  // ==========================================
  abrirHuespedes(reserva: any) {
    this.reservaSeleccionada = reserva;
    this.nuevoHuespedDoc = '';
    this.huespedesDialog = true;
    this.cargarHuespedesActuales();
  }

  cargarHuespedesActuales() {
    if (!this.reservaSeleccionada) return;
    this.reservaService.getHuespedesPorReserva(this.reservaSeleccionada.id).subscribe({
      next: (data) => {
        this.huespedesDeReserva = data;
      },
      error: (err) => console.error(err)
    });
  }

  agregarHuesped(docId: string) {
    if (!docId || !this.reservaSeleccionada) return;
    
    this.reservaService.addHuespedAReserva(this.reservaSeleccionada.id, docId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Añadido', detail: 'Huésped registrado en la habitación.' });
        this.nuevoHuespedDoc = '';
        this.cargarHuespedesActuales();
      },
      error: (err) => {
        const mensajeError = err.error?.error || err.message || 'Error desconocido';
        if (mensajeError.includes('Persona no existe')) {
          this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El DNI no existe. Utilice "Registrar Nuevo Acompañante".' });
        } else if (mensajeError.includes('ya agregado') || mensajeError.includes('Duplicate')) {
          this.messageService.add({ severity: 'info', summary: 'Aviso', detail: 'Esta persona ya está hospedada aquí.' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: mensajeError });
        }
      }
    });
  }

  quitarHuesped(docId: string) {
    if (!this.reservaSeleccionada) return;
    this.reservaService.quitarHuespedDeReserva(this.reservaSeleccionada.id, docId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Removido', detail: 'Huésped retirado de la reserva.' });
        this.cargarHuespedesActuales();
      }
    });
  }

  // ==========================================
  // FLUJO PARA REGISTRAR NUEVA PERSONA Y ASIGNARLA
  // ==========================================
  abrirNuevaPersona() {
    this.personaForm.reset({ nacionalidad: 'Peruana', sexo: 'M' });
    this.nuevaPersonaDialog = true;
  }

  guardarNuevaPersonaYAsignar() {
    if (this.personaForm.invalid) return;
    const datosPersona = this.personaForm.value;

    this.personaService.crearPersona(datosPersona).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Persona Registrada', detail: 'Añadiendo a la reserva...' });
        this.nuevaPersonaDialog = false;
        this.agregarHuesped(datosPersona.docId);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la persona.' });
      }
    });
  }

  // ==========================================
  // NUEVA FUNCIÓN: ABRIR FICHA DETALLADA / FACTURA
  // ==========================================
  // ==========================================
  // ESTADO DE CUENTA, PAGOS Y FACTURACIÓN
  // ==========================================
  abrirDetalleCompleto(reserva: any) {
    this.reservaSeleccionada = reserva;
    this.totalGeneral = 0;
    this.totalPagado = 0;
    this.saldoPendiente = 0;
    this.huespedesDeReserva = [];
    this.serviciosConsumidos = [];
    this.pagosRealizados = [];
    this.nuevoPagoMonto = 0;
    this.nuevoPagoMetodo = 'Efectivo';

    this.reservaService.getHuespedesPorReserva(reserva.id).subscribe({
      next: (huespedes) => this.huespedesDeReserva = huespedes
    });

    this.reservaService.getServiciosConsumidos(reserva.id).subscribe({
      next: (consumos) => {
        this.serviciosConsumidos = consumos;
        const totalExtra = consumos.reduce((acum, item) => acum + Number(item.subTotal || item.subtotal || 0), 0);
        this.totalGeneral = Number(reserva.precio) + totalExtra;
        this.calcularSaldo();
      }
    });

    this.cargarPagosHistorial(reserva.id);
    this.detalleDialog = true;
  }

  cargarPagosHistorial(idReserva: number) {
    this.pagoService.getPagosPorReserva(idReserva).subscribe({
      next: (pagos) => {
        this.pagosRealizados = pagos;
        this.totalPagado = pagos.reduce((acum, item) => acum + Number(item.monto || 0), 0);
        this.calcularSaldo();
      }
    });
  }

  calcularSaldo() {
    this.saldoPendiente = this.totalGeneral - this.totalPagado;
    // Evitamos saldos negativos si hay redondeos extraños
    if (this.saldoPendiente < 0) this.saldoPendiente = 0; 
    
    // Autocompletamos el input de pago con lo que falta pagar
    this.nuevoPagoMonto = this.saldoPendiente;
  }

  procesarPago() {
    if (!this.reservaSeleccionada || this.nuevoPagoMonto <= 0) return;

    const payload = {
      idReserva: this.reservaSeleccionada.id,
      monto: this.nuevoPagoMonto,
      metodoPago: this.nuevoPagoMetodo,
      observacion: 'Pago en caja'
    };

    this.pagoService.registrarPago(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Pago Registrado', detail: 'El abono se guardó correctamente.' });
        this.cargarPagosHistorial(this.reservaSeleccionada.id); // Recargamos para actualizar el saldo
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el pago.' });
      }
    });
  }

  // GENERADOR DE BOLETA PARA IMPRIMIR (SÚPER PROFESIONAL)
  // GENERADOR DE BOLETA PARA IMPRIMIR (LIMPIO Y BASADO EN HTML)
  imprimirBoleta() {
    // 1. Extraemos el HTML que ya fue calculado y llenado por Angular
    const contenidoHTML = document.getElementById('zona-impresion-boleta')?.innerHTML;
    if (!contenidoHTML) return;

    // 2. Abrimos una nueva ventana en blanco
    const ventanaImpresion = window.open('', '', 'width=800,height=600');
    if (!ventanaImpresion) return;

    // 3. Pegamos el contenido y le damos un estilo base para la fuente
    const htmlCompleto = `
      <html>
        <head>
          <title>Boleta de Pago - COMPUTECHA HOTEL</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          </style>
        </head>
        <body>
          ${contenidoHTML}
        </body>
      </html>
    `;

    ventanaImpresion.document.write(htmlCompleto);
    ventanaImpresion.document.close();
    
    // 4. Esperamos un instante y lanzamos el panel de impresión de Windows
    setTimeout(() => {
      ventanaImpresion.print();
    }, 500);
  }
}