import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { HabitacionService } from '../../services/habitacion.service';
import { Habitacion, Sucursal, TIPOS_HABITACION } from '../../models/habitacion.model';

@Component({
  selector: 'app-gestion-habitaciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, DialogModule, InputTextModule,
    TagModule, ConfirmDialogModule, ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestion-habitaciones.html',
  styleUrls: ['./gestion-habitaciones.css']
})
export class GestionHabitacionesComponent implements OnInit {

  habitaciones: Habitacion[] = [];
  habitacionesFiltradas: Habitacion[] = [];
  sucursales: Sucursal[] = [];
  tiposHabitacion = TIPOS_HABITACION;

  filtroBusqueda = '';
  filtroSucursal = '';
  filtroTipo = '';

  cargando = false;
  modoEdicion = false;
  dialogVisible = false;
  habitacionEditandoId = '';

  stats = { total: 0, disponibles: 0, ocupadas: 0, mantenimiento: 0 };

  form!: FormGroup;

  constructor(
    private habitacionService: HabitacionService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { this.crearFormulario(); }

  ngOnInit(): void { this.cargarDatos(); }

  crearFormulario() {
    this.form = this.fb.group({
      id:          ['', [Validators.required, Validators.pattern(/^H\d{3,4}$/)]],
      tipo:        ['Simple', Validators.required],
      piso:        [1,  [Validators.required, Validators.min(1), Validators.max(50)]],
      camas:       [1,  [Validators.required, Validators.min(1), Validators.max(10)]],
      precioNoche: [65, [Validators.required, Validators.min(0)]],
      idSucursal:  ['', Validators.required],
    });
  }

  cargarDatos() {
    this.cargando = true;
    this.habitacionService.getSucursales().subscribe({
      next: (suc) => { this.sucursales = suc; this.cargarHabitaciones(); },
      error: ()    => { this.cargarHabitaciones(); }   // fallback: extraer del JOIN
    });
  }

  cargarHabitaciones() {
    this.habitacionService.getHabitaciones().subscribe({
      next: (data) => {
        this.habitaciones = data;
        // Fallback si getSucursales no existe aún en el backend
        if (this.sucursales.length === 0) {
          const mapa = new Map<number, Sucursal>();
          data.forEach(h => {
            if (h.idSucursal && h.sucursal)
              mapa.set(h.idSucursal, { id: h.idSucursal, nombre: h.sucursal });
          });
          this.sucursales = Array.from(mapa.values());
        }
        this.calcularStats();
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.toast('error', 'Error', 'No se pudo cargar las habitaciones');
      }
    });
  }

  calcularStats() {
    const e = (h: Habitacion) => h.estado?.toUpperCase() ?? '';
    this.stats.total         = this.habitaciones.length;
    this.stats.disponibles   = this.habitaciones.filter(h => e(h) === 'DISPONIBLE').length;
    this.stats.ocupadas      = this.habitaciones.filter(h => ['OCUPADA','OCUPADO','RESERVADA'].includes(e(h))).length;
    this.stats.mantenimiento = this.habitaciones.filter(h => e(h) === 'MANTENIMIENTO').length;
  }

  aplicarFiltros() {
    let lista = [...this.habitaciones];
    if (this.filtroBusqueda.trim()) {
      const q = this.filtroBusqueda.toLowerCase();
      lista = lista.filter(h =>
        h.id.toLowerCase().includes(q) ||
        h.tipo.toLowerCase().includes(q) ||
        h.sucursal?.toLowerCase().includes(q)
      );
    }
    if (this.filtroSucursal) lista = lista.filter(h => h.idSucursal == +this.filtroSucursal);
    if (this.filtroTipo)     lista = lista.filter(h => h.tipo === this.filtroTipo);
    this.habitacionesFiltradas = lista;
    this.cdr.detectChanges();
  }

  limpiarFiltros() {
    this.filtroBusqueda = '';
    this.filtroSucursal = '';
    this.filtroTipo = '';
    this.aplicarFiltros();
  }

  // ── CRUD ──

  abrirNueva() {
    this.modoEdicion = false;
    this.habitacionEditandoId = '';
    this.form.reset({ tipo: 'Simple', piso: 1, camas: 1, precioNoche: 65 });
    this.form.get('id')?.enable();
    this.dialogVisible = true;
  }

  abrirEditar(h: Habitacion) {
    this.modoEdicion = true;
    this.habitacionEditandoId = h.id;
    this.form.patchValue({
      id:          h.id,
      tipo:        h.tipo,
      piso:        h.piso,
      camas:       h.camas ?? 1,
      precioNoche: h.precioNoche ?? 0,
      idSucursal:  h.idSucursal,
    });
    this.form.get('id')?.disable();
    this.dialogVisible = true;
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const datos = this.form.getRawValue() as Habitacion;

    const obs = this.modoEdicion
      ? this.habitacionService.actualizarHabitacion(this.habitacionEditandoId, datos)
      : this.habitacionService.crearHabitacion(datos);

    const msgOk = this.modoEdicion
      ? `Habitación ${this.habitacionEditandoId} actualizada`
      : `Habitación ${datos.id} registrada`;

    obs.subscribe({
      next: () => { this.toast('success', 'Listo', msgOk); this.dialogVisible = false; this.cargarHabitaciones(); },
      error: (err: any) => this.toast('error', 'Error', err.error?.message ?? 'Operación fallida')
    });
  }

  confirmarEliminar(h: Habitacion) {
    this.confirmationService.confirm({
      message: `¿Eliminar la habitación <strong>${h.id}</strong>? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.habitacionService.eliminarHabitacion(h.id).subscribe({
          next: () => { this.toast('success', 'Eliminada', `Habitación ${h.id} eliminada`); this.cargarHabitaciones(); },
          error: (err: any) => this.toast('error', 'Error', err.error?.message ?? 'No se puede eliminar')
        });
      }
    });
  }

  // ── Helpers UI ──

  getSeverity(estado?: string): 'success' | 'danger' | 'warn' | 'secondary' {
    const e = estado?.toUpperCase();
    if (e === 'DISPONIBLE')    return 'success';
    if (e === 'MANTENIMIENTO') return 'warn';
    if (['OCUPADA','OCUPADO','RESERVADA'].includes(e ?? '')) return 'danger';
    return 'secondary';
  }

  getIconoTipo(tipo: string): string {
    return this.tiposHabitacion.find(t => t.value === tipo)?.icono ?? '🛏️';
  }

  /** Al cambiar el tipo, sugiere camas y precio por defecto */
  aplicarDefaults() {
    const tipo = this.form.get('tipo')?.value;
    const def  = this.tiposHabitacion.find(t => t.value === tipo);
    if (def) this.form.patchValue({ camas: def.camasDefault, precioNoche: def.precioDefault });
  }

  campo(name: string): AbstractControl { return this.form.get(name)!; }
  esInvalido(name: string): boolean {
    const c = this.campo(name);
    return c.invalid && (c.dirty || c.touched);
  }

  private toast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}