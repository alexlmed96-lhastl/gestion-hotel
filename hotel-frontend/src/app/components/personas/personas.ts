import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';

import { PersonaService } from '../../services/persona.service';

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, InputTextModule, FormsModule, ReactiveFormsModule, ToastModule, AvatarModule],
  providers: [MessageService], 
  templateUrl: './personas.html',
  styleUrls: ['./personas.css'] 
})
export class PersonasComponent implements OnInit {
  @ViewChild('dt') dt: Table | undefined; 
  
  clientes: any[] = []; // Ahora lo llamamos clientes por claridad
  loading: boolean = true;

  clienteDialog: boolean = false;
  clienteForm!: FormGroup;
  modoEdicion: boolean = false;

  constructor(
    private personaService: PersonaService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef 
  ) {
    this.crearFormulario();
  }

  ngOnInit(): void {
    this.cargarClientes();
  }

  crearFormulario() {
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

  cargarClientes() {
    this.loading = true;
    this.personaService.getPersonas().subscribe({
      next: (data) => {
        // Filtramos para mostrar solo a los que son Clientes o Nuevos (evitamos Staff)
        // Esto usa la lógica de "roles inferidos" que pusimos en el Backend
        this.clientes = data.filter((p: any) => p.rol === 'CLIENTE' || p.rol === 'NUEVO');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltroGlobal(event: any) {
    this.dt?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  abrirNuevo() {
    this.clienteForm.reset({ nacionalidad: 'Peruana', sexo: 'M' });
    this.modoEdicion = false;
    this.clienteDialog = true;
  }

  editarCliente(cliente: any) {
    this.modoEdicion = true;
    let editData = { ...cliente };
    if (editData.fechaNac) editData.fechaNac = editData.fechaNac.split('T')[0];
    this.clienteForm.patchValue(editData);
    this.clienteDialog = true;
  }

  eliminarCliente(docId: string) {
    if (confirm('¿Deseas eliminar este cliente del directorio?')) {
      this.personaService.eliminarPersona(docId).subscribe(() => {
        this.cargarClientes();
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Cliente borrado.' });
      });
    }
  }

  guardarCliente() {
    if (this.clienteForm.invalid) return;
    const datos = this.clienteForm.getRawValue();

    if (this.modoEdicion) {
      this.personaService.actualizarPersona(datos.docId, datos).subscribe({
        next: () => {
          this.cargarClientes();
          this.clienteDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Datos actualizados.' });
        }
      });
    } else {
      this.personaService.crearPersona(datos).subscribe({
        next: () => {
          this.cargarClientes();
          this.clienteDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente registrado.' });
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El DNI ya existe.' })
      });
    }
  }
}