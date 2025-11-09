import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: './pokemon-detail.page.html',
  styleUrls: ['./pokemon-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PokemonDetailPage implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private favoritesService = inject(FavoritesService);
  private pokemonService = inject(PokemonService);

  pokemon: Pokemon | null = null;
  isLoading: boolean = false;
  isFavorite: boolean = false;
  activeSegment: string = 'about';

  ngOnInit() {
    const pokemonId = this.activatedRoute.snapshot.paramMap.get('id');
    if (pokemonId) {
      this.loadPokemonDetails(+pokemonId);
    }
  }

  loadPokemonDetails(id: number) {
    this.isLoading = true;

    this.pokemonService.getPokemonDetails(id).subscribe({
      next: (pokemonData: Pokemon) => {
        this.pokemon = pokemonData;
        this.isFavorite = this.favoritesService.isFavorite(id);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading Pokémon details:', error);
        this.isLoading = false;
      }
    });
  }

  toggleFavorite() {
    if (!this.pokemon) return;

    this.favoritesService.toggleFavorite(this.pokemon.id);
    this.isFavorite = !this.isFavorite;
  }

  segmentChanged(event: any) {
    this.activeSegment = event.detail.value;
  }

  getStatPercentage(statValue: number): number {
    const maxStat = 255;
    return (statValue / maxStat) * 100;
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

  goBack() {
    this.router.navigate(['/']);
  }

  getStatName(statName: string): string {
    const statNames: { [key: string]: string } = {
      'hp': 'HP',
      'attack': 'Ataque',
      'defense': 'Defesa',
      'special-attack': 'Sp. Atk',
      'special-defense': 'Sp. Def',
      'speed': 'Velocidade'
    };
    
    return statNames[statName] || statName;
  }

  getTotalStats(): number {
    if (!this.pokemon) return 0;
    return this.pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }
}