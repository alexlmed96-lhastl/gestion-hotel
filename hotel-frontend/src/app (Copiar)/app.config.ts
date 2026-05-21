import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http'; 
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Importamos la configuración visual de PrimeNG
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/lara';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()), 
    provideAnimationsAsync(),
    // Activamos el tema "Lara" (un diseño muy limpio y corporativo)
    providePrimeNG({
        theme: {
            preset: Lara,
            options: { darkModeSelector: false || 'none' } // Forzamos el modo claro para que se vea limpio
        }
    })
  ]
};