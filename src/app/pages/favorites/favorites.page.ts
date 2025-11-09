import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FavoritesService } from '../../services/favorites.service';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class FavoritesPage implements OnInit, OnDestroy {
  private favoritesService = inject(FavoritesService);
  private pokemonService = inject(PokemonService);
  private router = inject(Router);

  favoritePokemon: Pokemon[] = [];
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadFavorites();
    
    this.favoritesService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadFavorites();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFavorites() {
    const favoriteIds = this.favoritesService.getFavorites();
    
    if (favoriteIds.length === 0) {
      this.favoritePokemon = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    
    this.pokemonService.getMultiplePokemonDetails(favoriteIds).subscribe({
      next: (pokemonList) => {
        this.favoritePokemon = pokemonList;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading favorite Pokémon:', error);
        this.isLoading = false;
      }
    });
  }

  viewPokemonDetails(pokemon: Pokemon) {
    this.router.navigate(['/pokemon-detail', pokemon.id]);
  }

  removeFromFavorites(pokemon: Pokemon, event: Event) {
    event.stopPropagation();
    this.favoritesService.removeFavorite(pokemon.id);
  }

  getTypeColor(type: string): string {
    const typeColors: { [key: string]: string } = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC'
    };
    
    return typeColors[type] || '#68A090';
  }

  trackByPokemonId(index: number, pokemon: Pokemon): number {
    return pokemon.id;
  }
}