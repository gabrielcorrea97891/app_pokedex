import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, forkJoin } from 'rxjs';
import { Pokemon, PokemonListResponse, PokemonListItem } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private http = inject(HttpClient);
  private baseUrl: string = 'https://pokeapi.co/api/v2/pokemon';
  private imageUrl: string = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

  getPokemonList(offset: number = 0, limit: number = 20): Observable<PokemonListItem[]> {
    return this.http.get<PokemonListResponse>(`${this.baseUrl}?offset=${offset}&limit=${limit}`).pipe(
      map(response => response.results),
      map(pokemonList => {
        return pokemonList.map((poke, index) => {
          const pokeIndex = offset + index + 1;
          return {
            ...poke,
            pokeIndex: pokeIndex,
            image: `${this.imageUrl}${pokeIndex}.png`
          };
        });
      })
    );
  }

  getPokemonDetails(id: number): Observable<Pokemon> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(poke => this.transformPokemonData(poke))
    );
  }

  getPokemonDetailsByName(name: string): Observable<Pokemon> {
    return this.http.get<any>(`${this.baseUrl}/${name}`).pipe(
      map(poke => this.transformPokemonData(poke))
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

  private transformPokemonData(poke: any): Pokemon {
    return {
      id: poke.id,
      name: poke.name,
      url: `${this.baseUrl}/${poke.id}`,
      image: `${this.imageUrl}${poke.id}.png`,
      types: poke.types.map((t: any) => t.type.name),
      height: poke.height / 10, // Convert to meters
      weight: poke.weight / 10, // Convert to kilograms
      stats: poke.stats,
      abilities: poke.abilities,
      species: poke.species
    };
  }
}