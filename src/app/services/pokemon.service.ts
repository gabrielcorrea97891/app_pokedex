import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, forkJoin, of, switchMap } from 'rxjs';
import { Pokemon, PokemonListResponse, PokemonListItem, Sprites, Cries } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private http = inject(HttpClient);
  private baseUrl: string = 'https://pokeapi.co/api/v2/pokemon';
  private imageUrl: string = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
  private speciesUrl: string = 'https://pokeapi.co/api/v2/pokemon-species';

  private cache = new Map<string, any>();
  private cacheTimeout = 300000; 

  getPokemonList(offset: number = 0, limit: number = 20): Observable<PokemonListItem[]> {
    const cacheKey = `list-${offset}-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return of(cached.data);
    }

    return this.http.get<PokemonListResponse>(`${this.baseUrl}?offset=${offset}&limit=${limit}`).pipe(
      map(response => response.results),
      map(pokemonList => {
        const enhancedList = pokemonList.map((poke, index) => {
          const pokeIndex = offset + index + 1;
          return {
            ...poke,
            pokeIndex: pokeIndex,
            image: `${this.imageUrl}${pokeIndex}.png`,
            types: [] 
          };
        });
        
        this.cache.set(cacheKey, {
          data: enhancedList,
          timestamp: Date.now()
        });
        
        return enhancedList;
      })
    );
  }

  getPokemonDetails(id: number): Observable<Pokemon> {
    const cacheKey = `pokemon-${id}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return of(cached.data);
    }

    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      switchMap(pokemonData => {
        const baseSpeciesId = this.getBaseSpeciesId(pokemonData);
        
        if (baseSpeciesId && baseSpeciesId !== id) {
          return this.http.get<any>(`${this.speciesUrl}/${baseSpeciesId}`).pipe(
            map(speciesData => {
              const transformed = this.transformPokemonData(pokemonData, speciesData, id);

              this.cache.set(cacheKey, {
                data: transformed,
                timestamp: Date.now()
              });
              
              return transformed;
            })
          );
        } else {
          return this.http.get<any>(`${this.speciesUrl}/${id}`).pipe(
            map(speciesData => {
              const transformed = this.transformPokemonData(pokemonData, speciesData, id);
              
              this.cache.set(cacheKey, {
                data: transformed,
                timestamp: Date.now()
              });
              
              return transformed;
            })
          );
        }
      })
    );
  }

  getPokemonDetailsByName(name: string): Observable<Pokemon> {
    const cacheKey = `pokemon-name-${name}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return of(cached.data);
    }

    return this.http.get<any>(`${this.baseUrl}/${name}`).pipe(
      switchMap(pokemonData => {
        const baseSpeciesId = this.getBaseSpeciesId(pokemonData);
        const speciesId = baseSpeciesId || pokemonData.id;
        
        return this.http.get<any>(`${this.speciesUrl}/${speciesId}`).pipe(
          map(speciesData => {
            const transformed = this.transformPokemonData(pokemonData, speciesData, pokemonData.id);
            
            this.cache.set(cacheKey, {
              data: transformed,
              timestamp: Date.now()
            });
            
            return transformed;
          })
        );
      })
    );
  }

  getMultiplePokemonDetails(ids: number[]): Observable<Pokemon[]> {
    const requests = ids.map(id => this.getPokemonDetails(id));
    return forkJoin(requests);
  }

  getGenerationPokemon(generation: number): Observable<PokemonListItem[]> {
    const ranges: { [key: number]: { start: number, end: number } } = {
      1: { start: 1, end: 151 },
      5: { start: 494, end: 649 }
    };

    const range = ranges[generation];
    if (!range) {
      throw new Error(`Generation ${generation} not supported`);
    }

    const count = range.end - range.start + 1;
    return this.getPokemonList(range.start - 1, count);
  }

  getEvolutionChain(url: string): Observable<any> {
    const cacheKey = `evolution-${btoa(url)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return of(cached.data);
    }

    return this.http.get(url).pipe(
      map(data => {
        this.cache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
        return data;
      })
    );
  }

  getMovesByLevelUp(pokemon: Pokemon): any[] {
    if (!pokemon.moves) return [];
    
    return pokemon.moves.filter((move: any) => {
      return move.version_group_details.some((detail: any) => 
        detail.move_learn_method.name === 'level-up'
      );
    }).map((move: any) => {
      const levelDetail = move.version_group_details.find((detail: any) => 
        detail.move_learn_method.name === 'level-up'
      );
      return {
        name: move.move.name,
        level: levelDetail?.level_learned_at || 0
      };
    }).sort((a, b) => a.level - b.level);
  }

  getPokemonForms(formUrls: string[]): Observable<any[]> {
    const requests = formUrls.map(url => this.http.get(url));
    return forkJoin(requests);
  }

  getPokemonSpecies(pokemonId: number): Observable<any> {
    return this.http.get<any>(`${this.speciesUrl}/${pokemonId}`);
  }

  getPokemonForm(url: string): Observable<any> {
    return this.http.get<any>(url);
  }

  getPokemonFormById(formId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${formId}`);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getBaseSpeciesId(pokemonData: any): number | null {
    if (pokemonData.species && pokemonData.species.url) {
      const matches = pokemonData.species.url.match(/\/pokemon-species\/(\d+)\//);
      return matches ? parseInt(matches[1], 10) : null;
    }
    return null;
  }

  private transformPokemonData(poke: any, species?: any, originalId?: number): Pokemon {
    const englishFlavorText = species?.flavor_text_entries?.find((entry: any) => 
      entry.language.name === 'en'
    );

    const pokemonId = originalId || poke.id;

    const sprites: Sprites = {
      front_default: poke.sprites.front_default,
      front_shiny: poke.sprites.front_shiny,
      front_female: poke.sprites.front_female,
      front_shiny_female: poke.sprites.front_shiny_female,
      back_default: poke.sprites.back_default,
      back_shiny: poke.sprites.back_shiny,
      back_female: poke.sprites.back_female,
      back_shiny_female: poke.sprites.back_shiny_female,
      other: {
        'official-artwork': {
          front_default: poke.sprites.other?.['official-artwork']?.front_default,
          front_shiny: poke.sprites.other?.['official-artwork']?.front_shiny
        },
        home: {
          front_default: poke.sprites.other?.home?.front_default,
          front_shiny: poke.sprites.other?.home?.front_shiny
        },
        'dream_world': {
          front_default: poke.sprites.other?.dream_world?.front_default
        }
      },
      versions: poke.sprites.versions
    };

    const cries: Cries = {
      latest: poke.cries?.latest,
      legacy: poke.cries?.legacy
    };

    return {
      id: pokemonId,
      name: poke.name,
      url: `${this.baseUrl}/${pokemonId}`,
      image: `${this.imageUrl}${pokemonId}.png`,
      types: poke.types.map((t: any) => t.type.name),
      height: poke.height / 10,
      weight: poke.weight / 10,
      stats: poke.stats,
      abilities: poke.abilities,
      species: poke.species,
      moves: poke.moves,
      evolution_chain: species?.evolution_chain,
      description: englishFlavorText?.flavor_text?.replace(/\f/g, ' ') || 'No description available.',
      habitat: species?.habitat?.name || 'Unknown',
      growth_rate: species?.growth_rate?.name || 'Unknown',
      base_happiness: species?.base_happiness || 0,
      capture_rate: species?.capture_rate || 0,
      sprites: sprites,
      cries: cries,
      forms: poke.forms
    };
  }
}