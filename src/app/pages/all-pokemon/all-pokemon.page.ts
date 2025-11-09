import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { PokemonListItem } from '../../models/pokemon.model';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-all-pokemon',
  templateUrl: './all-pokemon.page.html',
  styleUrls: ['./all-pokemon.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AllPokemonPage implements OnInit {
  private pokemonService = inject(PokemonService);
  private router = inject(Router);

  pokemon: PokemonListItem[] = [];
  offset: number = 0;
  limit: number = 50;
  isLoading: boolean = false;
  hasMore: boolean = true;

  ngOnInit() {
    this.loadPokemon();
  }

  loadPokemon(event?: any) {
    if (this.isLoading) return;

    this.isLoading = true;
    
    this.pokemonService.getPokemonList(this.offset, this.limit).subscribe({
      next: (newPokemon) => {
        this.pokemon = [...this.pokemon, ...newPokemon];
        this.offset += this.limit;
        this.hasMore = newPokemon.length === this.limit;
        this.isLoading = false;
        
        if (event) {
          event.target.complete();
        }
      },
      error: (error) => {
        console.error('Erro carregando pokémon:', error);
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  loadMore(event: any) {
    this.loadPokemon(event);
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