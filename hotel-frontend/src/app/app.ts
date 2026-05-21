import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], 
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  items: any[] = [];

  ngOnInit() {
    this.items = [
      { label: 'Inicio', icon: 'pi pi-home', routerLink: '/' },
      { label: 'Habitaciones', icon: 'pi pi-key', routerLink: '/habitaciones' },
      { label: 'Clientes', icon: 'pi pi-users', routerLink: '/personas' },
      { label: 'Servicios', icon: 'pi pi-briefcase', routerLink: '/servicios' },
      { label: 'Reservas', icon: 'pi pi-calendar', routerLink: '/reservas' },
      { label: 'Check-In', icon: 'pi pi-sign-in', routerLink: '/checkin' },
      { label: 'Pagos', icon: 'pi pi-dollar', routerLink: '/pagos' }
    ];
  }
}