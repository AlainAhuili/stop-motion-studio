export const CATALOGUE = {
  landscape: ['tree', 'road', 'mountain', 'forest', 'lake', 'sea', 'river', 'sun'],
  animal: ['human', 'dog', 'bird', 'fish', 'horse'],
  vehicle: ['car', 'plane', 'boat', 'bicycle'],
} as const;

export type Category = keyof typeof CATALOGUE;
export type Kind = (typeof CATALOGUE)[Category][number];

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

export function categoryOf(kind: Kind): Category {
  for (const category of Object.keys(CATALOGUE) as Category[]) {
    if ((CATALOGUE[category] as readonly string[]).includes(kind)) return category;
  }
  throw new Error(`Unknown participant kind: ${kind}`);
}

export function canMove(category: Category): boolean {
  return category !== 'landscape';
}
