import { core } from './core';

// Rules: core/src/participants.cpp. This file holds the TypeScript types for them.

export type Category = 'landscape' | 'animal' | 'vehicle';
export type Kind =
  | 'tree' | 'road' | 'mountain' | 'forest' | 'lake' | 'sea' | 'river' | 'sun'
  | 'human' | 'dog' | 'bird' | 'fish' | 'horse'
  | 'car' | 'plane' | 'boat' | 'bicycle';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Participant {
  id: string;
  kind: Kind;
  category: Category;
  position: Vec3;
}

/** Every kind a child can place, by category, in display order. */
export const CATALOGUE: Readonly<Record<Category, readonly Kind[]>> = core.catalogue();

export const categoryOf = (kind: Kind): Category => core.categoryOf(kind);

export const canMove = (category: Category): boolean => core.canMove(category);
