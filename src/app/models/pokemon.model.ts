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
}