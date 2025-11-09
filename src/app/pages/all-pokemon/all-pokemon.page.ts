import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { FavoritesService } from '../../services/favorites.service';
import { PokemonListItem, Pokemon } from '../../models/pokemon.model';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
export class AllPokemonPage implements OnInit, OnDestroy {
  private pokemonService = inject(PokemonService);
  private router = inject(Router);
  private favoritesService = inject(FavoritesService);

  pokemon: PokemonListItem[] = [];
  filteredPokemon: PokemonListItem[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 50;
  totalItems: number = 1302;
  totalPages: number = 0;
  isLoading: boolean = false;
  searchTerm: string = '';
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.calculateTotalPages();
    this.loadPokemon();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  loadPokemon() {
    if (this.isLoading) return;

    this.isLoading = true;
    const offset = (this.currentPage - 1) * this.itemsPerPage;
    
    this.pokemonService.getPokemonList(offset, this.itemsPerPage).subscribe({
      next: (newPokemon) => {
        if (newPokemon.length === 0) {
          this.isLoading = false;
          return;
        }

        const detailRequests = newPokemon.map(poke => 
          this.pokemonService.getPokemonDetails(poke.pokeIndex!)
        );

        forkJoin(detailRequests).subscribe({
          next: (pokemonDetails: Pokemon[]) => {
            const enhancedPokemon = newPokemon.map((poke, index) => ({
              ...poke,
              types: pokemonDetails[index].types
            }));

            this.pokemon = enhancedPokemon;
            this.filteredPokemon = [...this.pokemon]; 
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading Pokémon details:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading Pokémon:', error);
        this.isLoading = false;
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    
    this.currentPage = page;
    this.loadPokemon();
    
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(500);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value?.toLowerCase() || '';
    this.filterPokemon();
  }

  filterPokemon() {
    if (!this.searchTerm.trim()) {
      this.filteredPokemon = [...this.pokemon];
      return;
    }

    this.filteredPokemon = this.pokemon.filter(poke => 
      poke.name.toLowerCase().includes(this.searchTerm) ||
      poke.pokeIndex?.toString().includes(this.searchTerm) ||
      poke.types?.some(type => type.toLowerCase().includes(this.searchTerm))
    );
  }

  viewPokemonDetails(pokemon: PokemonListItem) {
    this.router.navigate(['/pokemon-detail', pokemon.pokeIndex]);
  }

  toggleFavorite(pokemon: PokemonListItem, event: Event) {
    event.stopPropagation();
    const wasFavorite = this.isFavorite(pokemon);
    this.favoritesService.toggleFavorite(pokemon.pokeIndex!);
    

    console.log(`${pokemon.name} ${wasFavorite ? 'removed from' : 'added to'} favorites`);
  }

  isFavorite(pokemon: PokemonListItem): boolean {
    return this.favoritesService.isFavorite(pokemon.pokeIndex!);
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

  getTypeBackgroundColor(types: string[] | undefined): string {
    if (!types || types.length === 0) {
      return '#f0f0f0';
    }
    const mainType = types[0];
    const color = this.getTypeColor(mainType);
    return color + '20';
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredPokemon = [...this.pokemon];
  }
  onPageJump(event: any) {
  const page = parseInt(event.detail.value, 10);
  if (page && page >= 1 && page <= this.totalPages) {
    this.goToPage(page);
  }
  event.target.value = '';
}
}