export type RarityTier = "common" | "uncommon" | "rare" | "ultra_rare";
export type CreatureType = "shelf" | "logistics" | "checkout" | "scalper" | "hype" | "clearance" | "backroom" | "corporate";

export interface CreatureEntry {
  id: number;
  name: string;
  type: CreatureType;
  rarityTier: RarityTier;
  description: string;
}

export const CREATURE_DATA: CreatureEntry[] = [
  // --- 001–009 (former Starters, now distributed) ---
  { id: 1, name: "Stocklit", type: "shelf", rarityTier: "uncommon", description: "A small flickering spirit born from the first scan of a new inventory system. Often seen hovering near freshly stocked shelves." },
  { id: 2, name: "Facelisk", type: "shelf", rarityTier: "uncommon", description: "Arranges products face-out with obsessive precision. Becomes agitated when customers leave items backwards." },
  { id: 3, name: "Planogor", type: "corporate", rarityTier: "uncommon", description: "Carries a crumpled planogram like a treasure map. Will rearrange entire aisles overnight if left unchecked." },
  { id: 4, name: "Scannit", type: "checkout", rarityTier: "uncommon", description: "Its single red eye emits a beam that reads any barcode. Obsessively scans everything, including things that aren't products." },
  { id: 5, name: "Tillimp", type: "checkout", rarityTier: "uncommon", description: "A mischievous imp that nests inside cash registers. Responsible for mysteriously jammed receipt printers." },
  { id: 6, name: "Cashrath", type: "checkout", rarityTier: "uncommon", description: "When a register drawer slams shut with fury, Cashrath has awakened. Its anger grows with each voided transaction." },
  { id: 7, name: "Docklet", type: "logistics", rarityTier: "uncommon", description: "A timid creature that hides behind loading dock doors. Only emerges when it hears the beep of a reversing truck." },
  { id: 8, name: "Baydrake", type: "backroom", rarityTier: "uncommon", description: "Patrols warehouse bays with territorial intensity. Marks its domain with strategically placed zip ties." },
  { id: 9, name: "Forklord Minor", type: "logistics", rarityTier: "uncommon", description: "A juvenile Forklord that can only lift small boxes. Dreams of one day commanding entire pallets." },

  // --- 010–029 Shelf ---
  { id: 10, name: "Blisterfang", type: "shelf", rarityTier: "common", description: "A feral creature that guards empty shelves. Its fangs are made of torn blister packaging, sharp enough to slice fingers." },
];

export const TOTAL_CREATURES = CREATURE_DATA.length;

export function getSpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}.png`;
}

export function getShinySpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}-shiny.png`;
}
