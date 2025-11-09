import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { PokemonListItem } from '../../models/pokemon.model';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-generations',
  templateUrl: './generations.page.html',
  styleUrls: ['./generations.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class GenerationsPage implements OnInit {
  private pokemonService = inject(PokemonService);
  private router = inject(Router);

  selectedGeneration: number = 1;
  generations = [
    { id: 1, name: 'Generation I', range: '1-151' },
    { id: 5, name: 'Generation V', range: '494-649' }
  ];
  
  pokemon: PokemonListItem[] = [];
  isLoading: boolean = false;

  ngOnInit() {
    this.loadGenerationPokemon(1);
  }

  onGenerationChange(event: any) {
    this.selectedGeneration = event.detail.value;
    this.loadGenerationPokemon(this.selectedGeneration);
  }

  loadGenerationPokemon(generation: number) {
    this.isLoading = true;
    this.pokemon = [];

    this.pokemonService.getGenerationPokemon(generation).subscribe({
      next: (pokemonList) => {
        this.pokemon = pokemonList;
        this.isLoading = false;
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