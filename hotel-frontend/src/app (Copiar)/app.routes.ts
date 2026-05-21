import { Routes } from '@angular/router';
import { HabitacionesComponent } from './components/habitaciones/habitaciones';
import { PersonasComponent } from './components/personas/personas';
import { ServiciosComponent } from './components/servicios/servicios';
import { ReservasComponent } from './components/reservas/reservas';
import { CheckinComponent } from './components/checkin/checkin'; // Ajusta la ruta a tu carpeta
import { PagosComponent } from './components/pagos/pagos';
// Aquí iremos agregando PersonaComponent, etc.

export const routes: Routes = [
  { path: 'habitaciones', component: HabitacionesComponent },
   { path: 'personas', component: PersonasComponent },
   { path: 'servicios', component: ServiciosComponent },
   { path: 'reservas', component: ReservasComponent },
    { path: 'checkin', component: CheckinComponent },
    { path: 'pagos', component: PagosComponent },
  { path: '', redirectTo: '/habitaciones', pathMatch: 'full' }, // Ruta por defecto
  
 
];