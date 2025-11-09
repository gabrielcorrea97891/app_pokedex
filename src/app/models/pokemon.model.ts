export interface Pokemon {
  id: number;
  name: string;
  url: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
  stats: Stat[];
  abilities: Ability[];
  species: Species;
  moves: any[];
  evolution_chain?: any;
  description?: string;
  habitat?: string;
  growth_rate?: string;
  base_happiness?: number;
  capture_rate?: number;
  sprites?: Sprites;
  cries?: Cries;
  forms?: any[];
}

export interface Stat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface Ability {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

export interface Species {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export interface PokemonListItem {
  name: string;
  url: string;
  pokeIndex?: number;
  image?: string;
  types?: string[];
}

export interface Sprites {
  front_default: string;
  front_shiny: string;
  front_female?: string;
  front_shiny_female?: string;
  back_default: string;
  back_shiny: string;
  back_female?: string;
  back_shiny_female?: string;
  other: {
    'official-artwork': {
      front_default: string;
      front_shiny?: string;
    };
    home: {
      front_default: string;
      front_shiny?: string;
    };
    'dream_world': {
      front_default: string;
    };
  };
  versions?: any;
}

export interface Cries {
  latest: string;
  legacy: string;
}