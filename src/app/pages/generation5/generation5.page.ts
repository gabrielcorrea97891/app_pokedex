import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { FavoritesService } from '../../services/favorites.service';
import { PokemonListItem, Pokemon } from '../../models/pokemon.model';
import { forkJoin } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-generation5',
  templateUrl: './generation5.page.html',
  styleUrls: ['./generation5.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Generation5Page implements OnInit {
  private pokemonService = inject(PokemonService);
  private router = inject(Router);
  private favoritesService = inject(FavoritesService);

  pokemon: PokemonListItem[] = [];
  isLoading: boolean = false;
  generation = { id: 5, name: 'Generacao V', range: '494-649', region: 'Unova' };

  ngOnInit() {
    this.loadGenerationPokemon();
  }

  loadGenerationPokemon() {
    this.isLoading = true;
    this.pokemon = [];

    this.pokemonService.getGenerationPokemon(5).subscribe({
      next: (pokemonList) => {
        const detailRequests = pokemonList.map(poke => 
          this.pokemonService.getPokemonDetails(poke.pokeIndex!)
        );

        forkJoin(detailRequests).subscribe({
          next: (pokemonDetails: Pokemon[]) => {
            this.pokemon = pokemonList.map((poke, index) => ({
              ...poke,
              types: pokemonDetails[index].types
            }));
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading Pokémon details:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading generation Pokémon:', error);
        this.isLoading = false;
      }
    });
  }

  viewPokemonDetails(pokemon: PokemonListItem) {
    this.router.navigate(['/pokemon-detail', pokemon.pokeIndex]);
  }

  toggleFavorite(pokemon: PokemonListItem, event: Event) {
    event.stopPropagation();
    this.favoritesService.toggleFavorite(pokemon.pokeIndex!);
  }

  isFavorite(pokemon: PokemonListItem): boolean {
    return this.favoritesService.isFavorite(pokemon.pokeIndex!);
  }
getTypeBackgroundColor(types: string[] | undefined): string {
  if (!types || types.length === 0) {
    return '#f0f0f0'; 
  }
  const mainType = types[0];
  const color = this.getTypeColor(mainType);
  return color + '20'; 
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
}