import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PokemonService } from './pokemon.service';
import { Pokemon } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private pokemonService = inject(PokemonService);
  
  private favoritesKey = 'pokedex_favorites';
  private favoritesSubject = new BehaviorSubject<number[]>(this.getFavoritesFromStorage());
  
  favorites$ = this.favoritesSubject.asObservable();

  private getFavoritesFromStorage(): number[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(this.favoritesKey);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  }

  private saveFavoritesToStorage(favorites: number[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
    }
  }

  addFavorite(pokemonId: number): void {
    const favorites = this.getFavoritesFromStorage();
    if (!favorites.includes(pokemonId)) {
      favorites.push(pokemonId);
      this.saveFavoritesToStorage(favorites);
      this.favoritesSubject.next(favorites);
    }
  }

  removeFavorite(pokemonId: number): void {
    const favorites = this.getFavoritesFromStorage().filter(id => id !== pokemonId);
    this.saveFavoritesToStorage(favorites);
    this.favoritesSubject.next(favorites);
  }

  getFavorites(): number[] {
    return this.getFavoritesFromStorage();
  }

  isFavorite(pokemonId: number): boolean {
    return this.getFavoritesFromStorage().includes(pokemonId);
  }

  toggleFavorite(pokemonId: number): void {
    if (this.isFavorite(pokemonId)) {
      this.removeFavorite(pokemonId);
    } else {
      this.addFavorite(pokemonId);
    }
  }
}