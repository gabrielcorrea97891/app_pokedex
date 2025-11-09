import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';

import { AppComponent } from './app/app.component';

const routes = [
  {
    path: '',
    loadComponent: () => import('./app/pages/all-pokemon/all-pokemon.page').then(m => m.AllPokemonPage)
  },
  {
    path: 'pokemon-detail/:id',
    loadComponent: () => import('./app/pages/pokemon-detail/pokemon-detail.page').then(m => m.PokemonDetailPage)
  },
  {
    path: 'generations',
    loadComponent: () => import('./app/pages/generations/generations.page').then(m => m.GenerationsPage)
  },
  {
    path: 'favorites',
    loadComponent: () => import('./app/pages/favorites/favorites.page').then(m => m.FavoritesPage)
  }
];

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules))
  ],
});