import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FavoritesService } from '../../services/favorites.service';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, Subscription } from 'rxjs';

interface PokemonForm {
  id: number;
  name: string;
  types: string[];
  sprites: any;
  image: string;
  is_default: boolean;
  form_name: string;
}

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: './pokemon-detail.page.html',
  styleUrls: ['./pokemon-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PokemonDetailPage implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private favoritesService = inject(FavoritesService);
  private pokemonService = inject(PokemonService);
  private http = inject(HttpClient);

  pokemon: Pokemon | null = null;
  isLoading: boolean = false;
  isFavorite: boolean = false;
  activeSegment: string = 'about';
  evolutionChain: any[] = [];
  levelUpMoves: any[] = [];
  
  // Forms properties
  megaEvolutions: PokemonForm[] = [];
  gigantamaxForms: PokemonForm[] = [];
  regionalForms: PokemonForm[] = [];
  otherForms: PokemonForm[] = [];
  hasSpecialForms: boolean = false;

  selectedSprite: string = 'front_default';
  isPlayingCry: boolean = false;
  audio: HTMLAudioElement | null = null;

  spriteTypes = [
    { key: 'front_default', label: 'Normal' },
    { key: 'front_shiny', label: 'Shiny' },
    { key: 'back_default', label: 'Back' },
    { key: 'back_shiny', label: 'Back Shiny' }
  ];

  private favoritesSubscription!: Subscription;

  ngOnInit() {
    const pokemonId = this.activatedRoute.snapshot.paramMap.get('id');
    if (pokemonId) {
      this.loadPokemonDetails(+pokemonId);
    }

    // Subscribe to favorites changes to keep the UI in sync
    this.favoritesSubscription = this.favoritesService.favorites$.subscribe(() => {
      if (this.pokemon) {
        this.isFavorite = this.favoritesService.isFavorite(this.pokemon.id);
      }
    });
  }

  loadPokemonDetails(id: number) {
    this.isLoading = true;

    this.pokemonService.getPokemonDetails(id).subscribe({
      next: (pokemonData: Pokemon) => {
        this.pokemon = pokemonData;
        this.isFavorite = this.favoritesService.isFavorite(id);
        this.isLoading = false;
        
        // Load evolution chain if available
        if (this.pokemon.evolution_chain) {
          this.loadEvolutionChain(this.pokemon.evolution_chain.url);
        }
        
        // Get level-up moves
        this.levelUpMoves = this.pokemonService.getMovesByLevelUp(this.pokemon);

        // Load special forms for base Pokémon only (not for forms themselves)
        if (this.isBaseForm()) {
          this.loadSpecialForms(id);
        }
      },
      error: (error: any) => {
        console.error('Error loading Pokémon details:', error);
        this.isLoading = false;
        // Try alternative approach for special forms
        this.tryAlternativeLoad(id);
      }
    });
  }

  private tryAlternativeLoad(id: number) {
    // Direct API call as fallback
    this.http.get<any>(`https://pokeapi.co/api/v2/pokemon/${id}`).subscribe({
      next: (pokemonData: any) => {
        const transformedPokemon: Pokemon = {
          id: pokemonData.id,
          name: pokemonData.name,
          url: `https://pokeapi.co/api/v2/pokemon/${pokemonData.id}`,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonData.id}.png`,
          types: pokemonData.types.map((t: any) => t.type.name),
          height: pokemonData.height / 10,
          weight: pokemonData.weight / 10,
          stats: pokemonData.stats,
          abilities: pokemonData.abilities,
          species: pokemonData.species,
          moves: pokemonData.moves,
          description: 'Special form Pokémon',
          habitat: 'Unknown',
          growth_rate: 'Unknown',
          base_happiness: 0,
          capture_rate: 0,
          sprites: pokemonData.sprites,
          cries: pokemonData.cries || { latest: '', legacy: '' },
          forms: pokemonData.forms
        };

        this.pokemon = transformedPokemon;
        this.isFavorite = this.favoritesService.isFavorite(id);
        this.isLoading = false;
        
        this.levelUpMoves = this.pokemonService.getMovesByLevelUp(this.pokemon);
      },
      error: (error: any) => {
        console.error('Error in alternative load:', error);
        this.isLoading = false;
      }
    });
  }

  private isBaseForm(): boolean {
    if (!this.pokemon) return false;
    
    // Check if this is a base form (not a mega, gmax, etc.)
    const formName = this.pokemon.name.toLowerCase();
    return !formName.includes('-mega') && 
           !formName.includes('-gmax') && 
           !formName.includes('-alola') &&
           !formName.includes('-galar') &&
           !formName.includes('-hisui') &&
           !formName.includes('-paldea');
  }

  loadSpecialForms(pokemonId: number) {
    this.pokemonService.getPokemonSpecies(pokemonId).subscribe({
      next: (speciesData: any) => {
        const varieties = speciesData.varieties || [];
        
        // Filter out the default form and get special forms
        const specialForms = varieties.filter((variety: any) => 
          !variety.is_default
        );

        if (specialForms.length > 0) {
          this.loadFormsDetails(specialForms.map((v: any) => v.pokemon.url));
        }
      },
      error: (error: any) => {
        console.error('Error loading Pokémon species:', error);
      }
    });
  }

  loadFormsDetails(formUrls: string[]) {
    const formRequests = formUrls.map(url => 
      this.http.get<any>(url).pipe(
        map((formData: any) => ({
          id: formData.id,
          name: formData.name,
          types: formData.types.map((t: any) => t.type.name),
          sprites: formData.sprites,
          image: formData.sprites?.other?.['official-artwork']?.front_default || 
                 formData.sprites?.front_default ||
                 `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${formData.id}.png`,
          is_default: formData.is_default,
          form_name: formData.form_name
        }))
      )
    );
    
    forkJoin(formRequests).subscribe({
      next: (formsData: any[]) => {
        this.categorizeForms(formsData);
        this.hasSpecialForms = this.megaEvolutions.length > 0 || 
                              this.gigantamaxForms.length > 0 || 
                              this.regionalForms.length > 0 ||
                              this.otherForms.length > 0;
      },
      error: (error: any) => {
        console.error('Error loading form details:', error);
      }
    });
  }

  categorizeForms(forms: any[]) {
    // Clear previous forms
    this.megaEvolutions = [];
    this.gigantamaxForms = [];
    this.regionalForms = [];
    this.otherForms = [];

    forms.forEach((form: any) => {
      if (this.isMegaEvolution(form.name)) {
        this.megaEvolutions.push(form);
      } else if (this.isGigantamaxForm(form.name)) {
        this.gigantamaxForms.push(form);
      } else if (this.isRegionalForm(form.name)) {
        this.regionalForms.push(form);
      } else {
        this.otherForms.push(form);
      }
    });
  }

  isMegaEvolution(formName: string): boolean {
    return formName.includes('-mega') || formName.includes('mega-');
  }

  isGigantamaxForm(formName: string): boolean {
    return formName.includes('-gmax');
  }

  isRegionalForm(formName: string): boolean {
    const regionalPatterns = ['alola', 'galar', 'hisui', 'paldea', 'alolan', 'galarian', 'hisuian', 'paldean'];
    return regionalPatterns.some(pattern => formName.includes(pattern));
  }

  getFormDisplayName(formName: string): string {
    if (!this.pokemon) return formName;

    const baseName = this.pokemon.name;
    let displayName = formName.replace(`${baseName}-`, '');
    
    // Replace hyphens with spaces and capitalize
    displayName = displayName.replace(/-/g, ' ');
    
    // Special formatting
    if (displayName.includes('mega')) {
      if (displayName.includes('x')) {
        return 'Mega X';
      } else if (displayName.includes('y')) {
        return 'Mega Y';
      } else {
        return 'Mega';
      }
    } else if (displayName.includes('gmax')) {
      return 'Gigantamax';
    }
    
    // Capitalize first letter of each word
    return displayName.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getRegionalName(formName: string): string {
    if (formName.includes('alola')) return 'Alolan';
    if (formName.includes('galar')) return 'Galarian';
    if (formName.includes('hisui')) return 'Hisuian';
    if (formName.includes('paldea')) return 'Paldean';
    return 'Regional';
  }

  viewForm(form: PokemonForm) {
    this.router.navigate(['/pokemon-detail', form.id]);
  }

  loadEvolutionChain(url: string) {
    this.pokemonService.getEvolutionChain(url).subscribe({
      next: (chainData: any) => {
        this.evolutionChain = this.parseEvolutionChain(chainData.chain);
      },
      error: (error: any) => {
        console.error('Error loading evolution chain:', error);
      }
    });
  }

  parseEvolutionChain(chain: any): any[] {
    const evolutionChain = [];
    let current = chain;
    
    while (current) {
      const speciesId = this.getPokemonIdFromUrl(current.species.url);
      evolutionChain.push({
        name: current.species.name,
        id: speciesId,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${speciesId}.png`
      });
      
      current = current.evolves_to && current.evolves_to.length > 0 ? current.evolves_to[0] : null;
    }
    
    return evolutionChain;
  }

  getPokemonIdFromUrl(url: string): number {
    const matches = url.match(/\/pokemon-species\/(\d+)\//);
    return matches ? parseInt(matches[1], 10) : 0;
  }

  playCry() {
    if (!this.pokemon?.cries?.latest || this.isPlayingCry) return;

    this.isPlayingCry = true;
    this.audio = new Audio(this.pokemon.cries.latest);
    this.audio.play().catch((error: any) => {
      console.error('Error playing Pokémon cry:', error);
      this.isPlayingCry = false;
    });

    this.audio.onended = () => {
      this.isPlayingCry = false;
    };

    this.audio.onerror = () => {
      this.isPlayingCry = false;
    };
  }

  stopCry() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlayingCry = false;
    }
  }

  selectSprite(spriteKey: string) {
    this.selectedSprite = spriteKey;
  }

  getCurrentSprite(): string {
    if (!this.pokemon?.sprites) return '';
    
    const sprite = this.pokemon.sprites[this.selectedSprite as keyof typeof this.pokemon.sprites];
    return sprite || this.pokemon.sprites.front_default || this.pokemon.image || '';
  }

  getSpriteLabel(): string {
    const spriteType = this.spriteTypes.find(s => s.key === this.selectedSprite);
    return spriteType ? spriteType.label : 'Normal';
  }

  async toggleFavorite() {
    if (!this.pokemon) return;

    const wasFavorite = this.isFavorite;
    
    const heartIcon = document.querySelector('.favorite-btn ion-icon');
    if (heartIcon) {
      heartIcon.classList.add('heart-pulse');
      setTimeout(() => heartIcon.classList.remove('heart-pulse'), 500);
    }

    this.favoritesService.toggleFavorite(this.pokemon.id);
    

    const toastMessage = wasFavorite 
      ? `${this.pokemon.name} Removido dos Favoritos` 
      : `❤️ ${this.pokemon.name} Adicionado aos favoritos!`;
    
    this.showFavoriteToast(toastMessage, wasFavorite ? 'warning' : 'success');
  }

  private async showFavoriteToast(message: string, color: 'success' | 'warning' = 'success') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.position = 'bottom';
    toast.color = color;
    toast.buttons = [
      {
        text: 'Ver Favoritos',
        handler: () => {
          this.router.navigate(['/favorites']);
        }
      }
    ];

    document.body.appendChild(toast);
    await toast.present();
  }

  goToFavorites(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/favorites']);
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
      'attack': 'Attack',
      'defense': 'Defense',
      'special-attack': 'Sp. Atk',
      'special-defense': 'Sp. Def',
      'speed': 'Speed'
    };
    
    return statNames[statName] || statName;
  }

  getTotalStats(): number {
    if (!this.pokemon) return 0;
    return this.pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }

  viewEvolutionPokemon(pokemonId: number) {
    this.router.navigate(['/pokemon-detail', pokemonId]);
  }

  ngOnDestroy() {
    if (this.favoritesSubscription) {
      this.favoritesSubscription.unsubscribe();
    }
    this.stopCry();
  }
}