import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ServicioService } from '../../services/servicio.service';
import { Servicio } from '../../models/servicio.model';


@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, InputTextModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService], 
  templateUrl: './servicios.html'
})
export class ServiciosComponent implements OnInit {
  servicios: Servicio[] = [];
  
  servicioDialog: boolean = false;
  servicioForm!: FormGroup;
  modoEdicion: boolean = false;
  idActual?: number | string;

  constructor(
    private servicioService: ServicioService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService 
  ) {
    this.crearFormulario();
  }

  ngOnInit(): void {
    this.cargarServicios();
  }

  crearFormulario() {
    this.servicioForm = this.fb.group({
      id: ['', Validators.required],
      tipo: ['', Validators.required],
      descripcion: ['', Validators.required],
      precio: [0, [Validators.required, Validators.min(0)]], // <-- Agregado sin alterar el resto
      estado: ['', Validators.required]
    });
  }

  cargarServicios() {
    this.servicioService.getServicios().subscribe({
      next: (data) => {
        this.servicios = data;
        this.cdr.detectChanges(); 
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los servicios.' })
    });
  }

  abrirNuevo() {
    this.servicioForm.reset();
    this.servicioForm.get('id')?.enable();
    this.modoEdicion = false;
    this.servicioDialog = true;
  }

  editarServicio(servicio: Servicio) {
    this.servicioForm.patchValue(servicio);
    this.servicioForm.get('id')?.disable();
    this.idActual = servicio.id;
    this.modoEdicion = true;
    this.servicioDialog = true;
  }

  ocultarDialogo() {
    this.servicioDialog = false;
  }

  guardarServicio() {
    const datos = this.servicioForm.getRawValue();

    if (this.modoEdicion && this.idActual) {
      this.servicioService.actualizarServicio(this.idActual, datos).subscribe({
        next: () => {
          this.cargarServicios();
          this.ocultarDialogo();
          this.messageService.add({ severity: 'success', summary: '¡Actualizado!', detail: 'Servicio actualizado.' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' })
      });
    } else {
      this.servicioService.crearServicio(datos).subscribe({
        next: () => {
          this.cargarServicios();
          this.ocultarDialogo();
          this.messageService.add({ severity: 'success', summary: '¡Creado!', detail: 'Servicio registrado.' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El ID ya existe o es inválido.' })
      });
    }
  }

  eliminarServicio(id: number | string) {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      this.servicioService.eliminarServicio(id).subscribe({
        next: () => {
          this.cargarServicios();
          this.messageService.add({ severity: 'success', summary: '¡Eliminado!', detail: 'Servicio borrado.' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Bloqueado', detail: 'No se puede eliminar (en uso).' })
      });
    }
  }
}