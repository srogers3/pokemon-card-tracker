# Cardboard Creatures Pivot — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all Pokemon IP references with original "Cardboard Creatures" brand — 151 retail-themed parody creatures, unboxing mechanic, Cardboardex collection, and self-hosted pixel art sprites.

**Architecture:** Data-first approach — create the new creature catalog, then update schema/migrations, then business logic, then UI. Each layer depends on the previous. No test framework exists, so verify with `npm run build` after each major task.

**Tech Stack:** Next.js 16, TypeScript 5, Drizzle ORM, Neon PostgreSQL, Tailwind CSS 4, shadcn/ui

**Design doc:** `docs/plans/2026-02-24-cardboard-creatures-pivot-design.md`

---

## Task 1: Create Creature Data File

**Files:**
- Create: `src/db/creature-data.ts`

This replaces `src/db/pokemon-data.ts` entirely. Contains all 151 creatures with id, name, type, rarity, and description.

**Step 1: Create `src/db/creature-data.ts`**

```typescript
export type RarityTier = "common" | "uncommon" | "rare" | "ultra_rare";
export type CreatureType = "starter" | "shelf" | "logistics" | "checkout" | "scalper" | "hype" | "clearance" | "backroom" | "corporate";

export interface CreatureEntry {
  id: number;
  name: string;
  type: CreatureType;
  rarityTier: RarityTier;
  description: string;
}

export const CREATURE_DATA: CreatureEntry[] = [
  // --- 001–009 Starter ---
  { id: 1, name: "Stocklit", type: "starter", rarityTier: "uncommon", description: "A small flickering spirit born from the first scan of a new inventory system. Often seen hovering near freshly stocked shelves." },
  { id: 2, name: "Facelisk", type: "starter", rarityTier: "uncommon", description: "Arranges products face-out with obsessive precision. Becomes agitated when customers leave items backwards." },
  { id: 3, name: "Planogor", type: "starter", rarityTier: "uncommon", description: "Carries a crumpled planogram like a treasure map. Will rearrange entire aisles overnight if left unchecked." },
  { id: 4, name: "Scannit", type: "starter", rarityTier: "uncommon", description: "Its single red eye emits a beam that reads any barcode. Obsessively scans everything, including things that aren't products." },
  { id: 5, name: "Tillimp", type: "starter", rarityTier: "uncommon", description: "A mischievous imp that nests inside cash registers. Responsible for mysteriously jammed receipt printers." },
  { id: 6, name: "Cashrath", type: "starter", rarityTier: "uncommon", description: "When a register drawer slams shut with fury, Cashrath has awakened. Its anger grows with each voided transaction." },
  { id: 7, name: "Docklet", type: "starter", rarityTier: "uncommon", description: "A timid creature that hides behind loading dock doors. Only emerges when it hears the beep of a reversing truck." },
  { id: 8, name: "Baydrake", type: "starter", rarityTier: "uncommon", description: "Patrols warehouse bays with territorial intensity. Marks its domain with strategically placed zip ties." },
  { id: 9, name: "Forklord Minor", type: "starter", rarityTier: "uncommon", description: "A juvenile Forklord that can only lift small boxes. Dreams of one day commanding entire pallets." },

  // --- 010–029 Shelf ---
  { id: 10, name: "Blisterfang", type: "shelf", rarityTier: "common", description: "A feral creature that guards empty shelves. Its fangs are made of torn blister packaging, sharp enough to slice fingers." },
  { id: 11, name: "Grandblister", type: "shelf", rarityTier: "uncommon", description: "An elder Blisterfang encased in layers of hardened clamshell plastic. Said to be impossible to open without scissors." },
  { id: 12, name: "Pegloom", type: "shelf", rarityTier: "common", description: "Lurks in the shadows of empty pegboard hooks. Its presence is marked by a faint sadness and missing price tags." },
  { id: 13, name: "Endcapra", type: "shelf", rarityTier: "common", description: "Claims the prime endcap territory and refuses to yield. Arranges itself into an impossibly eye-catching display." },
  { id: 14, name: "Promoctaur", type: "shelf", rarityTier: "uncommon", description: "Half creature, half promotional display. Charges through aisles carrying BOGO signs on its back like battle standards." },
  { id: 15, name: "Cartivore", type: "shelf", rarityTier: "common", description: "A shopping cart turned predator — its basket is a gaping maw of bent wire teeth. Hunts stray products left in wrong aisles." },
  { id: 16, name: "Cartitan", type: "shelf", rarityTier: "rare", description: "A massive beast formed from dozens of shopping carts fused together. The clattering of its approach echoes through parking lots." },
  { id: 17, name: "Overstockle", type: "shelf", rarityTier: "common", description: "Appears wherever too much product has been crammed onto a shelf. Feeds on the anxiety of inventory managers." },
  { id: 18, name: "Shelf Impaler", type: "shelf", rarityTier: "rare", description: "A fearsome creature whose spine is a shelf bracket. Known for violently ejecting products that don't belong in its section." },
  { id: 19, name: "Facelace", type: "shelf", rarityTier: "common", description: "Delicately weaves products into perfect rows using thin tendrils. Its work is undone within minutes of store opening." },
  { id: 20, name: "Aislefiend", type: "shelf", rarityTier: "common", description: "Lurks in narrow aisles and feeds on the frustration of shoppers trying to squeeze past each other with carts." },
  { id: 21, name: "Aisle Tyrant", type: "shelf", rarityTier: "uncommon", description: "Commands entire aisles with iron authority. Rearranges products according to its own inscrutable logic overnight." },
  { id: 22, name: "Velcraptor", type: "shelf", rarityTier: "uncommon", description: "Lightning-fast and covered in hook-and-loop strips. Latches onto passing shoppers and won't let go until they buy something." },
  { id: 23, name: "Labelisk", type: "shelf", rarityTier: "common", description: "A serpentine creature made of curling price label strips. Constantly shedding old prices and growing new ones." },
  { id: 24, name: "Labelisk Prime", type: "shelf", rarityTier: "rare", description: "The evolved form of Labelisk. Its body is covered in contradictory price tags, causing confusion in anyone who looks too closely." },
  { id: 25, name: "Stockroach", type: "shelf", rarityTier: "common", description: "Survives any clearance event. When you think the shelf is finally empty, Stockroach emerges from behind the dividers." },
  { id: 26, name: "Dustmire", type: "shelf", rarityTier: "common", description: "Forms in the back corners of neglected shelves. A slow-moving mass of accumulated dust, lost twist ties, and forgotten coupons." },
  { id: 27, name: "Dustmourn", type: "shelf", rarityTier: "uncommon", description: "The melancholy evolution of Dustmire. Drifts through abandoned store sections, mourning discontinued product lines." },
  { id: 28, name: "Hangtail", type: "shelf", rarityTier: "common", description: "Dangles from shelf edges by its prehensile tail. Specializes in knocking products onto the floor when no one is looking." },
  { id: 29, name: "Shelfquake", type: "shelf", rarityTier: "ultra_rare", description: "When an entire gondola collapses at 2 AM with no one around, Shelfquake was there. A seismic force of retail destruction." },

  // --- 030–049 Logistics ---
  { id: 30, name: "Dockrake", type: "logistics", rarityTier: "common", description: "Scrapes along loading docks collecting loose packing material. Its claws are dulled pallet nails." },
  { id: 31, name: "Dockrake Prime", type: "logistics", rarityTier: "uncommon", description: "A battle-hardened Dockrake with reinforced steel claws. Has survived countless dock plate closings unscathed." },
  { id: 32, name: "Cratejaw", type: "logistics", rarityTier: "common", description: "Its massive jaw is a wooden shipping crate that snaps shut on anything placed inside. Swallows packages whole." },
  { id: 33, name: "Truckulus", type: "logistics", rarityTier: "common", description: "A lumbering beast with a box truck body. Arrives at unpredictable hours and demands immediate attention." },
  { id: 34, name: "Truckalisk", type: "logistics", rarityTier: "uncommon", description: "An 18-wheeled terror that blocks the entire receiving dock. Nothing moves until Truckalisk decides to leave." },
  { id: 35, name: "Manifestor", type: "logistics", rarityTier: "common", description: "Conjures shipping manifests from thin air. Every manifest it produces lists slightly different quantities than what actually arrived." },
  { id: 36, name: "Manifestor Prime", type: "logistics", rarityTier: "rare", description: "Its manifests are always accurate, making it the most feared creature in any distribution center. Warehouses fight over it." },
  { id: 37, name: "Shrinkhorn", type: "logistics", rarityTier: "common", description: "Feeds on inventory shrinkage. The more product that disappears, the larger its horn grows. Loss prevention's nemesis." },
  { id: 38, name: "Palletusk", type: "logistics", rarityTier: "uncommon", description: "Its tusks are broken pallet boards. Charges at anything that threatens its carefully stacked load." },
  { id: 39, name: "Palleteus", type: "logistics", rarityTier: "rare", description: "An ancient creature whose body is an entire pallet of perfectly wrapped product. Refuses to be broken down for stocking." },
  { id: 40, name: "Stackjaw", type: "logistics", rarityTier: "common", description: "Compulsively stacks boxes higher and higher. Has no concept of weight limits or structural integrity." },
  { id: 41, name: "Bayleech", type: "logistics", rarityTier: "common", description: "Attaches itself to warehouse bay doors and drains the warmth from the building every time they open." },
  { id: 42, name: "Forkliftitan", type: "logistics", rarityTier: "rare", description: "A colossal creature that moves pallets with casual ease. The ground shakes and OSHA violations multiply in its presence." },
  { id: 43, name: "Overnox", type: "logistics", rarityTier: "uncommon", description: "Only appears during overnight shifts. Its glowing eyes are the only light in dark warehouse aisles at 3 AM." },
  { id: 44, name: "Skidmaw", type: "logistics", rarityTier: "common", description: "Rides pallet jacks like a chariot. Leaves long skid marks on warehouse floors as territorial warnings." },
  { id: 45, name: "Liftrune", type: "logistics", rarityTier: "uncommon", description: "Ancient symbols cover its body — each one a different SKU. It can locate any product in a warehouse by instinct alone." },
  { id: 46, name: "Cartonix", type: "logistics", rarityTier: "common", description: "A golem assembled from flattened cardboard boxes. Surprisingly strong but vulnerable to rain and box cutters." },
  { id: 47, name: "Boxeon", type: "logistics", rarityTier: "uncommon", description: "Evolved from pure corrugated cardboard energy. Each of its forms represents a different box size — small, medium, large." },
  { id: 48, name: "Wraptor", type: "logistics", rarityTier: "common", description: "Strikes with blinding speed, wrapping victims in stretch film before they can react. Shrink-wraps everything in sight." },
  { id: 49, name: "Shrinkwrath", type: "logistics", rarityTier: "rare", description: "The embodiment of inventory shrinkage itself. Where it walks, products vanish and counts never balance." },

  // --- 050–069 Checkout ---
  { id: 50, name: "Tilltomb", type: "checkout", rarityTier: "common", description: "An ancient register that refuses to die. Its keys are worn smooth and it still prints on carbon paper." },
  { id: 51, name: "Tillreign", type: "checkout", rarityTier: "uncommon", description: "Rules the checkout lanes with an iron drawer. No transaction happens without its grinding mechanical approval." },
  { id: 52, name: "Scanraith", type: "checkout", rarityTier: "common", description: "The ghost of every item that failed to scan. It haunts self-checkout machines, triggering 'unexpected item in bagging area' forever." },
  { id: 53, name: "Couponyx", type: "checkout", rarityTier: "common", description: "Materializes from stacks of expired coupons. Insists every coupon is still valid regardless of the printed date." },
  { id: 54, name: "Couponyx Prime", type: "checkout", rarityTier: "rare", description: "Its body is wallpapered in legendary coupons — the mythical ones that stack, have no limit, and never expire." },
  { id: 55, name: "Taxling", type: "checkout", rarityTier: "common", description: "A tiny gremlin that adds unexpected charges at the last second. No one ever sees it, but the receipt always shows its work." },
  { id: 56, name: "Voidchange", type: "checkout", rarityTier: "common", description: "Created when a transaction is voided. Exists in a liminal state between purchased and unpurchased." },
  { id: 57, name: "Pinpadra", type: "checkout", rarityTier: "common", description: "A skittish creature that lives inside PIN pads. Its screen flickers with anxiety when someone takes too long to enter their code." },
  { id: 58, name: "Swipegeist", type: "checkout", rarityTier: "uncommon", description: "The phantom of magnetic stripe readers past. Still demands you swipe when the whole world has moved to chip." },
  { id: 59, name: "Declinodon", type: "checkout", rarityTier: "common", description: "Feeds on the embarrassment of declined cards. Grows stronger with each apologetic 'try it again' from cashiers." },
  { id: 60, name: "Declinodon Max", type: "checkout", rarityTier: "rare", description: "Has consumed so much declined-card shame that it can crash an entire payment network with a single roar." },
  { id: 61, name: "Changelisk", type: "checkout", rarityTier: "common", description: "Hoards loose change in its coils. The jingling sound of its approach sends cashiers scrambling for penny rolls." },
  { id: 62, name: "POSpire", type: "checkout", rarityTier: "uncommon", description: "A towering creature made of stacked POS terminals. Each screen shows a different error message simultaneously." },
  { id: 63, name: "Changegeist", type: "checkout", rarityTier: "common", description: "The spirit of exact change. Manifests when someone holds up the line counting pennies from a coin purse." },
  { id: 64, name: "Priceflare", type: "checkout", rarityTier: "uncommon", description: "Causes prices to spike randomly on screens. Is it a glitch or Priceflare? Loss prevention can never tell." },
  { id: 65, name: "Tickerjaw", type: "checkout", rarityTier: "common", description: "Its jaw is a receipt printer that never stops. Produces CVS-length receipts for a single pack of gum." },
  { id: 66, name: "Rebaterex", type: "checkout", rarityTier: "uncommon", description: "Promises great savings that never actually arrive. Its mail-in rebate forms are designed to be impossible to complete." },
  { id: 67, name: "Subtotem", type: "checkout", rarityTier: "common", description: "A mystical totem that displays running subtotals. Shoppers worship it, hoping the number will be lower than expected." },
  { id: 68, name: "Auditron", type: "checkout", rarityTier: "uncommon", description: "Scans transactions with cold, mechanical precision. Its red eye can spot a mis-scanned item from three aisles away." },
  { id: 69, name: "Audititan", type: "checkout", rarityTier: "ultra_rare", description: "The final form of Auditron. A terrifying presence that audits entire stores in seconds. Managers tremble at its approach." },

  // --- 070–089 Scalper ---
  { id: 70, name: "Scalpizard", type: "scalper", rarityTier: "common", description: "A cold-blooded creature that buys up stock the moment it hits shelves. Has no interest in the product itself, only profit." },
  { id: 71, name: "Scalpizard Prime", type: "scalper", rarityTier: "uncommon", description: "An evolved Scalpizard with multiple arms for grabbing more product. Can empty a shelf in under 30 seconds." },
  { id: 72, name: "Botwyrm", type: "scalper", rarityTier: "common", description: "A digital serpent that slithers through online checkout pages. Fills carts faster than any human could click." },
  { id: 73, name: "Botwyrm Apex", type: "scalper", rarityTier: "rare", description: "Commands an army of lesser Botwyrms. Can purchase entire online inventories before the product page finishes loading." },
  { id: 74, name: "Refreshion", type: "scalper", rarityTier: "common", description: "Obsessively refreshes product pages thousands of times per minute. Its F5 key has been worn into a crater." },
  { id: 75, name: "Snagoyle", type: "scalper", rarityTier: "common", description: "A gargoyle that perches atop store entrances, swooping down to snag limited products before regular shoppers enter." },
  { id: 76, name: "Queuezilla", type: "scalper", rarityTier: "uncommon", description: "Massive enough to occupy an entire queue by itself. Brings folding chairs, tents, and unreasonable entitlement." },
  { id: 77, name: "Flipfang", type: "scalper", rarityTier: "common", description: "Buys at retail, sells at 300% markup. Its fangs are price stickers that always show a number higher than what it paid." },
  { id: 78, name: "Flipfang Elite", type: "scalper", rarityTier: "rare", description: "The alpha of the flipping pack. Has connections to get early stock and platforms to move it before anyone else." },
  { id: 79, name: "Markupine", type: "scalper", rarityTier: "uncommon", description: "Covered in quills, each one a different inflated price tag. Touch one and you'll pay triple what it's worth." },
  { id: 80, name: "Stockviper", type: "scalper", rarityTier: "common", description: "Slithers into stores through back channels. Has sources inside distribution that tip it off before product hits shelves." },
  { id: 81, name: "Bulkbeast", type: "scalper", rarityTier: "common", description: "Buys in absurd quantities. Its cart is always overflowing. Checkout employees wince when they see it coming." },
  { id: 82, name: "Bulkbeast Goliath", type: "scalper", rarityTier: "rare", description: "A Bulkbeast so large it needs a flatbed truck. Has cornered the market on at least three product categories." },
  { id: 83, name: "Rafflotaur", type: "scalper", rarityTier: "uncommon", description: "Enters every raffle, drawing, and lottery for limited products. Somehow wins more than probability should allow." },
  { id: 84, name: "Cancelisk", type: "scalper", rarityTier: "common", description: "Places hundreds of orders with the intent of canceling most. Holds stock hostage while deciding what to actually keep." },
  { id: 85, name: "Outofstockra", type: "scalper", rarityTier: "uncommon", description: "Appears wherever products are sold out. Some say it causes the stock-outs. Others say it just enjoys watching." },
  { id: 86, name: "Waitlistor", type: "scalper", rarityTier: "common", description: "Signs up for every waitlist, notification, and pre-order. Its inbox contains 10,000 unread restock alerts." },
  { id: 87, name: "Cartjackal", type: "scalper", rarityTier: "common", description: "Stalks shoppers who have limited items in their carts, waiting for a moment of distraction to snatch and run." },
  { id: 88, name: "Inflatradon", type: "scalper", rarityTier: "uncommon", description: "A hulking beast that inflates secondary market prices just by existing. Its mere rumor of interest raises values." },
  { id: 89, name: "Speculisk", type: "scalper", rarityTier: "rare", description: "A cunning serpent that hoards product purely on speculation. Has warehouses full of things that may never appreciate in value." },

  // --- 090–109 Hype ---
  { id: 90, name: "Hypewyrm", type: "hype", rarityTier: "common", description: "Generates excitement for products that don't deserve it. Wraps around social media feeds, amplifying every rumor." },
  { id: 91, name: "Trendragon", type: "hype", rarityTier: "uncommon", description: "Rides the wave of every trend, growing larger with each retweet. Collapses into nothing when interest fades." },
  { id: 92, name: "Viralope", type: "hype", rarityTier: "common", description: "Moves at the speed of a viral post. By the time you spot it, ten thousand others have already shared the sighting." },
  { id: 93, name: "Leakwyrm", type: "hype", rarityTier: "common", description: "Oozes unreleased product information from every pore. No NDA can contain it. Lives in the spaces between embargoes." },
  { id: 94, name: "Dropfang", type: "hype", rarityTier: "common", description: "Appears exactly 0.3 seconds after a product drop is announced. Already has the page bookmarked and auto-fill ready." },
  { id: 95, name: "Dropzilla", type: "hype", rarityTier: "rare", description: "The king of product drops. So massive that entire websites crash when it attempts to check out simultaneously." },
  { id: 96, name: "Paniclaw", type: "hype", rarityTier: "common", description: "Spreads panic buying wherever it goes. Its claws shred any sense of calm, rational purchasing decisions." },
  { id: 97, name: "FOMOgre", type: "hype", rarityTier: "uncommon", description: "A panicked ogre with bulging eyes, driven entirely by fear of missing out. Buys things it doesn't want or need." },
  { id: 98, name: "FOMOgre Prime", type: "hype", rarityTier: "rare", description: "Has ascended to a state of permanent FOMO. Now causes it in others through sheer proximity. Run." },
  { id: 99, name: "Adstorm", type: "hype", rarityTier: "common", description: "A swirling vortex of pop-up ads, banner notifications, and push alerts. Blocks your view of actual products." },
  { id: 100, name: "Sirenstock", type: "hype", rarityTier: "uncommon", description: "Sings an irresistible song about limited edition products. Shoppers follow its voice straight into impulse purchases." },
  { id: 101, name: "Blackfright", type: "hype", rarityTier: "rare", description: "Born on Black Friday and never left. Its arrival triggers stampede instincts in otherwise reasonable adults." },
  { id: 102, name: "Doorcrashra", type: "hype", rarityTier: "uncommon", description: "A battering ram of consumer demand. Has literally broken through store doors on major sale events." },
  { id: 103, name: "Rumblecart", type: "hype", rarityTier: "common", description: "A shopping cart possessed by hype energy. Rolls itself toward trending products, collecting items no one asked for." },
  { id: 104, name: "Crowdrake", type: "hype", rarityTier: "common", description: "Materializes wherever crowds form. Feeds on the collective energy of people waiting in line for something they've already forgotten." },
  { id: 105, name: "Queuephantom", type: "hype", rarityTier: "uncommon", description: "The ghost of every line you've ever stood in. When you feel phantom line anxiety at 3 AM, Queuephantom is nearby." },
  { id: 106, name: "Dropocalypse", type: "hype", rarityTier: "ultra_rare", description: "The apocalyptic product drop event given form. Servers melt, pages crash, carts empty themselves. Total retail annihilation." },
  { id: 107, name: "Speculatron", type: "hype", rarityTier: "uncommon", description: "A mechanical oracle that predicts which products will be hyped next. Its predictions are self-fulfilling prophecies." },
  { id: 108, name: "Flashfang", type: "hype", rarityTier: "common", description: "Strikes during flash sales with blinding speed. By the time the notification reaches your phone, it's already sold out." },
  { id: 109, name: "Bundlord", type: "hype", rarityTier: "rare", description: "Forces products into bundles nobody asked for. Want one item? Bundlord insists you buy three others with it." },

  // --- 110–129 Clearance ---
  { id: 110, name: "Clearadon", type: "clearance", rarityTier: "common", description: "Roams the clearance aisles, slowly absorbing red markdown stickers into its hide. Perpetually 40% off." },
  { id: 111, name: "Clearaclysm", type: "clearance", rarityTier: "rare", description: "A catastrophic clearance event given monstrous form. When it appears, entire departments are wiped to pennies." },
  { id: 112, name: "Rollbacken", type: "clearance", rarityTier: "common", description: "A cheerful creature that rolls prices back with its massive rolling pin body. Sometimes rolls them back too far." },
  { id: 113, name: "Discountaur", type: "clearance", rarityTier: "uncommon", description: "Charges through stores marking things down with its horns. Each horn scrape leaves a yellow clearance sticker behind." },
  { id: 114, name: "Clearance Wisp", type: "clearance", rarityTier: "common", description: "A faint glow in the clearance section that guides bargain hunters to the best deals. Vanishes when you look directly at it." },
  { id: 115, name: "Bargraith", type: "clearance", rarityTier: "common", description: "Haunts the bargain bins, rearranging jumbled products into even more chaotic piles. Thrives on disorganization." },
  { id: 116, name: "Markdownix", type: "clearance", rarityTier: "uncommon", description: "A phoenix that bursts into flame at full price and is reborn at 70% off. Each death-rebirth cycle lowers its value." },
  { id: 117, name: "Tagwraith", type: "clearance", rarityTier: "common", description: "A spectral figure draped in dangling price tags. Each tag shows a price that was, reminding shelves of their former glory." },
  { id: 118, name: "Labelurk", type: "clearance", rarityTier: "common", description: "Hides behind shelf labels that show one price while the register rings up another. Feeds on 'price check on aisle 5' calls." },
  { id: 119, name: "Salegeist", type: "clearance", rarityTier: "uncommon", description: "The ghost of sales past. Whispers about that incredible deal you missed last Tuesday. You will never stop thinking about it." },
  { id: 120, name: "Understockle", type: "clearance", rarityTier: "common", description: "A withered creature found wherever inventory is dangerously low. It counts the remaining units on its bony fingers." },
  { id: 121, name: "Overstackle", type: "clearance", rarityTier: "common", description: "The opposite problem incarnate. Buries itself under towers of product that will never sell. Accepts its fate peacefully." },
  { id: 122, name: "Shrinklurk", type: "clearance", rarityTier: "uncommon", description: "Lurks in inventory systems, silently reducing counts. The difference between what's on file and what's on shelf is its doing." },
  { id: 123, name: "Returnoid", type: "clearance", rarityTier: "common", description: "Every returned product carries a piece of Returnoid. It grows larger at the returns desk, fed by buyer's remorse." },
  { id: 124, name: "Dustgloom", type: "clearance", rarityTier: "common", description: "A heavy cloud of despair that settles over products no one wants. Even clearance prices can't move them while Dustgloom lingers." },
  { id: 125, name: "Pricegeist", type: "clearance", rarityTier: "uncommon", description: "A poltergeist that changes prices on shelves while no one is watching. Causes endless discrepancies between shelf and register." },
  { id: 126, name: "Pricegeist Supreme", type: "clearance", rarityTier: "ultra_rare", description: "Has achieved total pricing chaos. Every item in its domain rings up at a different price each time. No override can stop it." },
  { id: 127, name: "Marginox", type: "clearance", rarityTier: "uncommon", description: "Consumes profit margins like oxygen. Where it breathes, products sell below cost and accountants weep." },
  { id: 128, name: "Changelord", type: "clearance", rarityTier: "rare", description: "Presides over the coin-counting machines with imperial authority. Takes its 11.9% commission with zero remorse." },
  { id: 129, name: "Tallyshade", type: "clearance", rarityTier: "common", description: "A shadow that falls across inventory counts, making numbers blur and add up wrong. The source of every 'off by one' error." },

  // --- 130–140 Backroom ---
  { id: 130, name: "Backstockadon", type: "backroom", rarityTier: "uncommon", description: "A massive creature that lurks deep in backstock, surrounded by product that hasn't seen a shelf in months." },
  { id: 131, name: "Overlordstock", type: "backroom", rarityTier: "rare", description: "Rules the backroom with total authority. Decides what gets stocked and what stays buried. Managers defer to its judgment." },
  { id: 132, name: "Clerkshade", type: "backroom", rarityTier: "common", description: "The shadow of every employee who went to 'check the back' and was never seen again. It knows the backroom's secrets." },
  { id: 133, name: "Raftergeist", type: "backroom", rarityTier: "uncommon", description: "Haunts the steel rafters above the sales floor. Drops things on people who stand still too long beneath it." },
  { id: 134, name: "Baygoyle", type: "backroom", rarityTier: "uncommon", description: "A stone guardian perched atop warehouse bay markers. Comes alive at night to reorganize everything to its own preference." },
  { id: 135, name: "Planogrammon", type: "backroom", rarityTier: "rare", description: "A demon summoned by corporate planograms. Forces products into exact positions regardless of whether they physically fit." },
  { id: 136, name: "Planogod", type: "backroom", rarityTier: "ultra_rare", description: "The deity of store layouts. Its grand design dictates where every product in every store must live. Resistance is futile." },
  { id: 137, name: "Fulfillisk", type: "backroom", rarityTier: "uncommon", description: "A serpent coiled around online order staging areas. Every pick-and-pack delay is caused by its constricting grip." },
  { id: 138, name: "Deliveraith", type: "backroom", rarityTier: "uncommon", description: "The wraith of last-mile delivery. Haunts porches, rings doorbells, and vanishes before anyone can answer." },
  { id: 139, name: "Stockfinity", type: "backroom", rarityTier: "rare", description: "A creature that exists in the theoretical state of infinite inventory. An impossible ideal that supply chain managers dream about." },
  { id: 140, name: "Retailisk", type: "backroom", rarityTier: "rare", description: "A basilisk whose gaze turns products to clearance. Look it in the eye and your margin drops to zero instantly." },

  // --- 141–151 Corporate ---
  { id: 141, name: "Palleteus Prime", type: "corporate", rarityTier: "ultra_rare", description: "The supreme pallet entity. An entire warehouse compressed into a single, impossibly heavy creature. Moves continents of product." },
  { id: 142, name: "Forklord", type: "corporate", rarityTier: "ultra_rare", description: "The ultimate forklift titan. Hydraulic arms as limbs, forks as a crown. Everything in the warehouse bows before Forklord." },
  { id: 143, name: "Barcodon Omega", type: "corporate", rarityTier: "ultra_rare", description: "The final barcode. Every product in existence is encoded somewhere on its body. Scanning it crashes every POS system on Earth." },
  { id: 144, name: "Cartaclysm", type: "corporate", rarityTier: "ultra_rare", description: "A shopping cart apocalypse. Thousands of carts fused into one screaming, rolling catastrophe. The parking lot will never be the same." },
  { id: 145, name: "Shelfus Rex", type: "corporate", rarityTier: "ultra_rare", description: "The king of all shelving. A towering gondola creature whose shadow covers entire departments. All products seek its approval." },
  { id: 146, name: "Grand Aisle", type: "corporate", rarityTier: "ultra_rare", description: "An aisle so grand it stretches to infinity. Walking its length takes a lifetime. Every product ever made can be found somewhere within." },
  { id: 147, name: "Scarcityra", type: "corporate", rarityTier: "ultra_rare", description: "The embodiment of artificial scarcity. It decides what becomes limited edition, what gets discontinued, what you can never have." },
  { id: 148, name: "Retailoth", type: "corporate", rarityTier: "ultra_rare", description: "An ancient being as old as commerce itself. It was there for the first transaction and will be there for the last." },
  { id: 149, name: "Hoardlord", type: "corporate", rarityTier: "ultra_rare", description: "The sovereign of all hoarding. Its vault contains one of everything ever manufactured. It will never sell, share, or open any of it." },
  { id: 150, name: "Restock Eternis", type: "corporate", rarityTier: "ultra_rare", description: "The eternal promise of restock. It is always coming. It is never here. The shelves remain empty. Hope persists regardless." },
  { id: 151, name: "Logistigon", type: "corporate", rarityTier: "ultra_rare", description: "The final boss of the supply chain. A mythic polygon of pure logistics energy. When supply perfectly meets demand, Logistigon smiles." },
];

export function getSpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}.png`;
}

export function getShinySpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}-shiny.png`;
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/db/creature-data.ts` (or just check with build later)

**Step 3: Commit**

```bash
git add src/db/creature-data.ts
git commit -m "feat: add 151 Cardboard Creatures data catalog with types, rarity, and descriptions"
```

---

## Task 2: Create Placeholder Sprites

**Files:**
- Create: `public/sprites/` directory with 151 placeholder PNGs

Since real pixel art comes later, create a simple placeholder system so the app doesn't break on missing images.

**Step 1: Create a placeholder sprite generator script**

Create `scripts/generate-placeholder-sprites.ts`:

```typescript
// Simple script to create placeholder SVG sprites for all 151 creatures
// Run: npx tsx scripts/generate-placeholder-sprites.ts

import fs from "fs";
import path from "path";
import { CREATURE_DATA } from "../src/db/creature-data";

const TYPE_COLORS: Record<string, string> = {
  starter: "#6366f1",   // indigo
  shelf: "#f59e0b",     // amber
  logistics: "#3b82f6", // blue
  checkout: "#10b981",  // emerald
  scalper: "#ef4444",   // red
  hype: "#ec4899",      // pink
  clearance: "#f97316", // orange
  backroom: "#6b7280",  // gray
  corporate: "#8b5cf6", // violet
};

const outDir = path.join(process.cwd(), "public", "sprites");
fs.mkdirSync(outDir, { recursive: true });

for (const creature of CREATURE_DATA) {
  const color = TYPE_COLORS[creature.type] || "#888";
  const initials = creature.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  // Normal sprite
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="8" fill="${color}" opacity="0.2"/>
  <rect x="4" y="4" width="88" height="88" rx="6" fill="${color}" opacity="0.1" stroke="${color}" stroke-width="2" stroke-dasharray="4 2"/>
  <text x="48" y="40" text-anchor="middle" font-family="monospace" font-size="10" fill="${color}">#${creature.id}</text>
  <text x="48" y="60" text-anchor="middle" font-family="monospace" font-size="20" font-weight="bold" fill="${color}">${initials}</text>
  <text x="48" y="80" text-anchor="middle" font-family="monospace" font-size="8" fill="${color}" opacity="0.7">${creature.type}</text>
</svg>`;

  // Save as SVG (rename getSpriteUrl to .svg later, or convert)
  // For now, save as .svg and we'll update getSpriteUrl to use .svg
  fs.writeFileSync(path.join(outDir, `${creature.id}.svg`), svg);

  // Shiny variant (inverted colors)
  const shinySvg = svg.replace(new RegExp(color.replace("#", "#"), "g"), "#ffd700");
  fs.writeFileSync(path.join(outDir, `${creature.id}-shiny.svg`), shinySvg);
}

console.log(`Generated ${CREATURE_DATA.length * 2} placeholder sprites in public/sprites/`);
```

**Step 2: Run the script**

Run: `npx tsx scripts/generate-placeholder-sprites.ts`

**Step 3: Update `getSpriteUrl` in `creature-data.ts` to use `.svg` for placeholders**

```typescript
export function getSpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}.svg`;
}

export function getShinySpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}-shiny.svg`;
}
```

**Step 4: Commit**

```bash
git add scripts/generate-placeholder-sprites.ts public/sprites/ src/db/creature-data.ts
git commit -m "feat: add placeholder SVG sprites for all 151 creatures"
```

---

## Task 3: Update Database Schema

**Files:**
- Modify: `src/db/schema.ts`

This is the core schema change. Rename tables, enums, columns, and add the `type` column. Note: because we're using `db:push` in dev (not migrations), we can rename directly. For production, a migration will be needed.

**Step 1: Update `src/db/schema.ts`**

Replace all Pokemon references:

1. Rename `pokemonRarityEnum` → `creatureRarityEnum`, change DB name from `"pokemon_rarity"` to `"creature_rarity"`
2. In `badgeTypeEnum`, change `"pokedex_50"` → `"cardboardex_50"`, `"pokedex_complete"` → `"cardboardex_complete"`
3. Add `creatureTypeEnum` for the 9 creature types
4. Rename `pokemonCatalog` → `creatureCatalog` table (DB name `"creature_catalog"`), add `type` and `description` columns
5. Rename `pokemonEggs` → `creatureBoxes` table (DB name `"creature_boxes"`), rename columns: `wildPokemonId` → `wildCreatureId`, `pokemonId` → `creatureId`, `hatched` → `opened`, `hatchedAt` → `openedAt`
6. Update type exports: `PokemonCatalogEntry` → `CreatureCatalogEntry`, `PokemonEgg` → `CreatureBox`

The full replacement for the relevant sections of schema.ts:

```typescript
// Replace pokemonRarityEnum
export const creatureRarityEnum = pgEnum("creature_rarity", [
  "common",
  "uncommon",
  "rare",
  "ultra_rare",
]);

// Add creatureTypeEnum (new)
export const creatureTypeEnum = pgEnum("creature_type", [
  "starter",
  "shelf",
  "logistics",
  "checkout",
  "scalper",
  "hype",
  "clearance",
  "backroom",
  "corporate",
]);

// Replace badgeTypeEnum values
export const badgeTypeEnum = pgEnum("badge_type", [
  "first_report",
  "verified_10",
  "verified_50",
  "trusted_reporter",
  "top_reporter",
  "streak_7",
  "streak_30",
  "cardboardex_50",
  "cardboardex_complete",
]);

// Replace pokemonCatalog
export const creatureCatalog = pgTable("creature_catalog", {
  id: integer("id").primaryKey(), // Creature index (1-151)
  name: text("name").notNull(),
  type: creatureTypeEnum("type").notNull(),
  rarityTier: creatureRarityEnum("rarity_tier").notNull(),
  description: text("description").notNull().default(""),
  spriteUrl: text("sprite_url").notNull(),
});

// Replace pokemonEggs
export const creatureBoxes = pgTable("creature_boxes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  sightingId: uuid("sighting_id")
    .notNull()
    .references(() => restockSightings.id, { onDelete: "cascade" }),
  reportStatus: stockStatusEnum("report_status").notNull(),
  wildCreatureId: integer("wild_creature_id").references(() => creatureCatalog.id),
  opened: boolean("opened").default(false).notNull(),
  creatureId: integer("creature_id").references(() => creatureCatalog.id),
  isShiny: boolean("is_shiny").default(false).notNull(),
  openedAt: timestamp("opened_at"),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Replace type exports
export type CreatureCatalogEntry = typeof creatureCatalog.$inferSelect;
export type CreatureBox = typeof creatureBoxes.$inferSelect;
```

Remove the old `pokemonRarityEnum`, `pokemonCatalog`, `pokemonEggs`, `PokemonCatalogEntry`, `PokemonEgg` declarations.

**Step 2: Verify schema compiles**

Run: `npm run build` — expect errors in files that still import old names (that's OK, we fix those next)

**Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: rename schema from Pokemon to Cardboard Creatures — tables, enums, columns"
```

---

## Task 4: Update Seed Script

**Files:**
- Modify: `src/db/seed.ts`

**Step 1: Update imports and seeding logic**

Replace `POKEMON_DATA` / `getSpriteUrl` imports with `CREATURE_DATA` / `getSpriteUrl` from `@/db/creature-data`. Replace `pokemonCatalog` with `creatureCatalog`. Replace `pokemonEggs` with `creatureBoxes`. Update log messages.

Key changes:
```typescript
import { CREATURE_DATA, getSpriteUrl } from "./creature-data";
import { creatureCatalog, creatureBoxes } from "./schema";

// In the seed function:
console.log("Inserting creature catalog...");
await db.delete(creatureBoxes);
await db.delete(creatureCatalog);

const creatureRows = CREATURE_DATA.map((c) => ({
  id: c.id,
  name: c.name,
  type: c.type,
  rarityTier: c.rarityTier,
  description: c.description,
  spriteUrl: getSpriteUrl(c.id),
}));

for (let i = 0; i < creatureRows.length; i += 50) {
  await db.insert(creatureCatalog).values(creatureRows.slice(i, i + 50));
}
console.log(`${creatureRows.length} creatures added`);
```

**Step 2: Commit**

```bash
git add src/db/seed.ts
git commit -m "feat: update seed script for creature catalog"
```

---

## Task 5: Rename Business Logic — Boxes (was Eggs)

**Files:**
- Create: `src/lib/boxes.ts` (copy + rename from `src/lib/eggs.ts`)
- Delete: `src/lib/eggs.ts` (after all imports are updated)

**Step 1: Create `src/lib/boxes.ts`**

Copy `src/lib/eggs.ts` and make these replacements throughout:

| Old | New |
|-----|-----|
| `pokemonEggs` | `creatureBoxes` |
| `pokemonId` (column ref) | `creatureId` |
| `wildPokemonId` (column ref) | `wildCreatureId` |
| `hatched` (column ref) | `opened` |
| `hatchedAt` (column ref) | `openedAt` |
| `POKEMON_DATA` | `CREATURE_DATA` |
| `getSpriteUrl` import from `@/db/pokemon-data` | from `@/db/creature-data` |
| `createEgg` function | `createBox` |
| `hatchEgg` function | `openBox` |
| `transferPokemon` function | `transferCreature` |
| `checkPokedexBadges` function | `checkCardboardexBadges` |
| `getUserCollection` function | `getUserCollection` (keep name) |
| `getPokedexCompletion` function | `getCardboardexCompletion` |
| `getUnviewedHatches` function | `getUnviewedOpenings` |
| `markEggViewed` function | `markBoxViewed` |
| `"pokedex_50"` badge string | `"cardboardex_50"` |
| `"pokedex_complete"` badge string | `"cardboardex_complete"` |
| `pokemonName` in return types | `creatureName` |
| `wildPokemonName` in return types | `wildCreatureName` |
| `"Not your Pokemon"` error | `"Not your creature"` |
| `"Pokemon not found in catalog"` error | `"Creature not found in catalog"` |
| `"Egg not found or not hatched"` error | `"Box not found or not opened"` |
| `rollRandomPokemon` function | `rollRandomCreature` |
| `pokemonInTier` variable | `creaturesInTier` |
| `pokemon` variable | `creature` |
| `wildPokemon` variable | `wildCreature` |
| `pokemonEntry` variable | `creatureEntry` |
| `>= 151` threshold | `>= 151` (keep — same count) |

In `getUnviewedOpenings`, update the return object shape:
```typescript
return {
  id: box.id,
  creatureName: creature?.name ?? "Unknown",
  creatureId: box.creatureId!,
  rarityTier: creature?.rarityTier ?? "common",
  spriteUrl: getSpriteUrl(box.creatureId!),
  isShiny: box.isShiny,
  wasUpgrade: !!(box.wildCreatureId && box.creatureId !== box.wildCreatureId),
  wildCreatureName: wildCreature?.name ?? null,
};
```

**Step 2: Commit**

```bash
git add src/lib/boxes.ts
git commit -m "feat: create boxes.ts — unboxing engine replacing egg hatching"
```

---

## Task 6: Rename Business Logic — Wild Creature (was Wild Pokemon)

**Files:**
- Create: `src/lib/wild-creature.ts` (copy + rename from `src/lib/wild-pokemon.ts`)
- Delete: `src/lib/wild-pokemon.ts` (after all imports updated)

**Step 1: Create `src/lib/wild-creature.ts`**

```typescript
import { CREATURE_DATA, getSpriteUrl } from "@/db/creature-data";

const RARITY_WEIGHTS = [
  { tier: "common", weight: 0.60 },
  { tier: "uncommon", weight: 0.25 },
  { tier: "rare", weight: 0.12 },
  { tier: "ultra_rare", weight: 0.03 },
] as const;

export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getWildCreature(storeId: string): { id: number; name: string; spriteUrl: string; rarity: string } {
  const today = new Date().toISOString().split("T")[0];
  const seed = storeId + today;
  const hash = simpleHash(seed);
  const tierRand = (hash % 1000) / 1000;

  let selectedTier = "common";
  let cumulative = 0;
  for (const { tier, weight } of RARITY_WEIGHTS) {
    cumulative += weight;
    if (tierRand < cumulative) {
      selectedTier = tier;
      break;
    }
  }

  const tierCreatures = CREATURE_DATA.filter((c) => c.rarityTier === selectedTier);
  const idx = simpleHash(seed + "pick") % tierCreatures.length;
  const creature = tierCreatures[idx];
  return { id: creature.id, name: creature.name, spriteUrl: getSpriteUrl(creature.id), rarity: selectedTier };
}
```

**Step 2: Commit**

```bash
git add src/lib/wild-creature.ts
git commit -m "feat: create wild-creature.ts replacing wild-pokemon.ts"
```

---

## Task 7: Update Dashboard Submit Actions

**Files:**
- Modify: `src/app/dashboard/submit/actions.ts`

**Step 1: Update imports and references**

```typescript
// Old:
import { createEgg, hatchEgg } from "@/lib/eggs";
import { getWildPokemon } from "@/lib/wild-pokemon";

// New:
import { createBox, openBox } from "@/lib/boxes";
import { getWildCreature } from "@/lib/wild-creature";
```

Update usage:
```typescript
// Old:
const wildPokemon = getWildPokemon(storeId);
await createEgg(userId, sighting.id, status, wildPokemon.id);

// New:
const wildCreature = getWildCreature(storeId);
await createBox(userId, sighting.id, status, wildCreature.id);
```

Also search for any `hatchEgg` calls and replace with `openBox`.

**Step 2: Commit**

```bash
git add src/app/dashboard/submit/actions.ts
git commit -m "refactor: update submit actions to use boxes and wild creatures"
```

---

## Task 8: Update Admin/Trust References

**Files:**
- Modify: any admin files that reference `hatchEgg` or `pokemonEggs`

Search for all remaining imports of `@/lib/eggs`, `@/lib/wild-pokemon`, `pokemonEggs`, `pokemonCatalog` across the codebase and update them.

**Step 1: Find and update all remaining references**

Run: `grep -r "eggs\|wild-pokemon\|pokemonEggs\|pokemonCatalog\|hatchEgg\|POKEMON_DATA\|pokemon-data" src/ --include="*.ts" --include="*.tsx" -l`

For each file found, update imports:
- `@/lib/eggs` → `@/lib/boxes`
- `@/lib/wild-pokemon` → `@/lib/wild-creature`
- `@/db/pokemon-data` → `@/db/creature-data`
- `hatchEgg` → `openBox`
- `createEgg` → `createBox`
- `pokemonEggs` → `creatureBoxes`
- `pokemonCatalog` → `creatureCatalog`
- `POKEMON_DATA` → `CREATURE_DATA`
- `getSpriteUrl` import source → `@/db/creature-data`
- `getWildPokemon` → `getWildCreature`
- `getUnviewedHatches` → `getUnviewedOpenings`
- `markEggViewed` → `markBoxViewed`
- `getPokedexCompletion` → `getCardboardexCompletion`
- `transferPokemon` → `transferCreature`

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor: update all imports from pokemon to creature/box references"
```

---

## Task 9: Rename Unbox Reveal Modal (was Egg Hatch Modal)

**Files:**
- Create: `src/components/unbox-reveal-modal.tsx` (rename from egg-hatch-modal.tsx)
- Delete: `src/components/egg-hatch-modal.tsx` (after)

**Step 1: Create `src/components/unbox-reveal-modal.tsx`**

Copy `egg-hatch-modal.tsx` and make these changes:

1. Rename type `HatchData` → `UnboxData`:
```typescript
type UnboxData = {
  id: string;
  creatureName: string;
  creatureId: number;
  rarityTier: "common" | "uncommon" | "rare" | "ultra_rare";
  spriteUrl: string;
  isShiny: boolean;
  wasUpgrade: boolean;
  wildCreatureName: string | null;
};
```

2. Rename component `EggHatchModal` → `UnboxRevealModal`

3. Update `markEggViewedAction` import → `markBoxViewedAction` (will need to create/rename this action too)

4. Update text strings:
   - `"Egg {n} of {total}"` → `"Box {n} of {total}"`
   - The egg emoji `🥚` → `📦` (cardboard box)
   - `current.pokemonName` → `current.creatureName`
   - `alt={current.pokemonName}` → `alt={current.creatureName}`
   - `"instead of {current.wildPokemonName}"` → `"instead of {current.wildCreatureName}"`

5. Rename CSS animation reference `pokemon-reveal` → `creature-reveal` (update in globals.css in Task 12)

6. Keep all animation logic the same (wobble → crack → reveal works for boxes too — wobble = box shaking, crack = box opening)

**Step 2: Update `src/app/dashboard/actions.ts`**

Rename `markEggViewedAction` → `markBoxViewedAction`, update to call `markBoxViewed` from `@/lib/boxes`.

**Step 3: Update `src/app/dashboard/layout.tsx`**

```typescript
// Old:
import { getUnviewedHatches } from "@/lib/eggs";
import { EggHatchModal } from "@/components/egg-hatch-modal";
const unviewedHatches = await getUnviewedHatches(user.id);
{unviewedHatches.length > 0 && <EggHatchModal hatches={unviewedHatches} />}

// New:
import { getUnviewedOpenings } from "@/lib/boxes";
import { UnboxRevealModal } from "@/components/unbox-reveal-modal";
const unviewedOpenings = await getUnviewedOpenings(user.id);
{unviewedOpenings.length > 0 && <UnboxRevealModal openings={unviewedOpenings} />}
```

**Step 4: Commit**

```bash
git add src/components/unbox-reveal-modal.tsx src/app/dashboard/layout.tsx src/app/dashboard/actions.ts
git rm src/components/egg-hatch-modal.tsx
git commit -m "feat: rename egg hatch modal to unbox reveal modal"
```

---

## Task 10: Rename Map Marker (was Pokeball Marker)

**Files:**
- Create: `src/components/map/cluster-marker.tsx` (rename from pokeball-marker.tsx)
- Delete: `src/components/map/pokeball-marker.tsx` (after)

**Step 1: Create `src/components/map/cluster-marker.tsx`**

Copy `pokeball-marker.tsx` and:

1. Rename component `PokeballMarker` → `ClusterMarker`
2. Replace `getWildPokemon` import → `getWildCreature` from `@/lib/wild-creature`
3. Replace any PokeAPI sprite URLs with placeholder box icons
4. Update cluster density icons:
   - 1-2 stores: 📦 (single box)
   - 3-5 stores: 📦📦 (stacked)
   - 6+: Use pallet emoji or icon
5. Update title text: `"Wild ${name}!"` → `"${name} lurks here!"`
6. Replace `EGG_SPRITE_URL` with a box icon URL (use `/sprites/box.svg` — we'll create this)

**Step 2: Update any files that import `PokeballMarker`**

Search: `grep -r "pokeball-marker\|PokeballMarker" src/ -l`
Update each to import `ClusterMarker` from `@/components/map/cluster-marker`.

**Step 3: Commit**

```bash
git add src/components/map/cluster-marker.tsx
git rm src/components/map/pokeball-marker.tsx
git commit -m "feat: rename pokeball marker to cluster marker with box/pallet density icons"
```

---

## Task 11: Update Store Detail Panel

**Files:**
- Modify: `src/components/map/store-detail-panel.tsx`

**Step 1: Update Pokemon-referencing strings**

```typescript
// Old:
<p className="text-2xl">🥚</p>
<p className="font-semibold text-sm">Your Trainer already scouted this location today!</p>
<p className="text-xs text-muted-foreground">Come back tomorrow — a new Pokemon might be waiting.</p>

// New:
<p className="text-2xl">📦</p>
<p className="font-semibold text-sm">You already scouted this location today!</p>
<p className="text-xs text-muted-foreground">Come back tomorrow — a new creature might be lurking.</p>
```

**Step 2: Commit**

```bash
git add src/components/map/store-detail-panel.tsx
git commit -m "refactor: update store detail panel text from Pokemon to creature"
```

---

## Task 12: Update Collection Page

**Files:**
- Modify: `src/app/dashboard/collection/page.tsx`

**Step 1: Update all references**

1. Import changes:
   - `POKEMON_DATA` → `CREATURE_DATA` from `@/db/creature-data`
   - `getUserCollection, getPokedexCompletion` → `getUserCollection, getCardboardexCompletion` from `@/lib/boxes`

2. Text changes:
   - Heading: `"Pokemon Collection"` → `"Creature Collection"` or `"Cardboardex"`
   - Progress: `"{uniqueCaught}/151 caught"` → `"{uniqueCaught}/151 discovered"`
   - Any `getPokedexCompletion` calls → `getCardboardexCompletion`

3. CSS class renames:
   - `pokemon-caught` → `creature-caught`
   - `pokemon-uncaught` → `creature-uncaught`

4. Sort by creature ID using `CREATURE_DATA`

**Step 2: Commit**

```bash
git add src/app/dashboard/collection/page.tsx
git commit -m "refactor: update collection page for Cardboardex"
```

---

## Task 13: Update Leaderboard Page

**Files:**
- Modify: `src/app/dashboard/leaderboard/page.tsx`

**Step 1: Update badge labels and Pokedex references**

```typescript
// Old:
pokedex_50: "50 Pokemon",
pokedex_complete: "Pokedex Complete",

// New:
cardboardex_50: "50 Creatures",
cardboardex_complete: "Cardboardex Complete",
```

Update column headers and cell text:
```typescript
// Old: "Pokedex" → New: "Cardboardex"
// Old: "{count}/151" text stays the same (151 creatures)
```

**Step 2: Commit**

```bash
git add src/app/dashboard/leaderboard/page.tsx
git commit -m "refactor: update leaderboard for Cardboardex badges"
```

---

## Task 14: Update Branding — Metadata, Header, Landing Page

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/site-header.tsx`
- Modify: `src/lib/email.ts`
- Modify: `src/lib/places.ts`

**Step 1: Update `src/app/layout.tsx` metadata**

```typescript
// Old:
title: "Pokemon Card Tracker",
description: "Track Pokemon card restocks at retail stores",

// New:
title: "Cardboard Tracker",
description: "Track trading card restocks at retail stores",
```

**Step 2: Update `src/app/page.tsx` landing copy**

```typescript
// Old: "Track Pokemon card availability at retail stores near you."
// New: "Track trading card availability at retail stores near you. Report restocks, discover creatures, and never miss a drop."
```

**Step 3: Update `src/components/site-header.tsx`**

```typescript
// Old: "Pokemon Card Tracker"
// New: "Cardboard Tracker"
```

**Step 4: Update `src/lib/email.ts`**

```typescript
// Old: "Pokemon Card Tracker <noreply@yourdomain.com>"
// New: "Cardboard Tracker <noreply@yourdomain.com>"
```

**Step 5: Update `src/lib/places.ts`**

```typescript
// Old: "Pokemon cards"
// New: "trading cards"
```

**Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/components/site-header.tsx src/lib/email.ts src/lib/places.ts
git commit -m "refactor: rebrand to Cardboard Tracker across metadata, header, landing, email, places"
```

---

## Task 15: Update CSS Classes and Animations

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Rename Pokemon-specific class names**

```css
/* Old: */
@keyframes pokemon-reveal { ... }
.pokemon-uncaught { ... }
.pokemon-caught { ... }

/* New: */
@keyframes creature-reveal { ... }
.creature-uncaught { ... }
.creature-caught { ... }
```

Keep all the egg animation keyframes (wobble, crack, glow-burst) — they work for the box unboxing metaphor too. Optionally rename:
- `egg-wobble-mild` → `box-wobble-mild` (optional, low priority)
- `egg-wobble` → `box-wobble`
- `egg-wobble-intense` → `box-wobble-intense`
- `egg-crack` → `box-open`

But functionally these can stay as-is since they're internal animation names.

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor: rename pokemon CSS classes to creature"
```

---

## Task 16: Update Test Hatch Page

**Files:**
- Modify: `src/app/test-hatch/page.tsx` (or rename to `src/app/test-unbox/page.tsx`)

**Step 1: Update mock data**

Replace all Pokemon names and PokeAPI URLs with creature names and local sprite URLs:

```typescript
const MOCK_OPENINGS = [
  {
    id: "1",
    creatureName: "Blisterfang",
    creatureId: 10,
    rarityTier: "common" as const,
    spriteUrl: "/sprites/10.svg",
    isShiny: false,
    wasUpgrade: false,
    wildCreatureName: null,
  },
  {
    id: "2",
    creatureName: "FOMOgre",
    creatureId: 97,
    rarityTier: "uncommon" as const,
    spriteUrl: "/sprites/97.svg",
    isShiny: false,
    wasUpgrade: false,
    wildCreatureName: null,
  },
  // ... etc
];
```

Update the component import to `UnboxRevealModal`.

**Step 2: Commit**

```bash
git add src/app/test-hatch/ src/app/test-unbox/
git commit -m "refactor: update test page with creature mock data"
```

---

## Task 17: Delete Old Pokemon Files

**Files:**
- Delete: `src/db/pokemon-data.ts`
- Delete: `src/lib/eggs.ts`
- Delete: `src/lib/wild-pokemon.ts`
- Delete: `src/components/egg-hatch-modal.tsx`
- Delete: `src/components/map/pokeball-marker.tsx`

**Step 1: Verify no remaining imports reference old files**

Run: `grep -r "pokemon-data\|/eggs\|wild-pokemon\|egg-hatch-modal\|pokeball-marker" src/ --include="*.ts" --include="*.tsx"`

This should return zero results. If any remain, fix them first.

**Step 2: Delete old files**

```bash
git rm src/db/pokemon-data.ts src/lib/eggs.ts src/lib/wild-pokemon.ts src/components/egg-hatch-modal.tsx src/components/map/pokeball-marker.tsx
```

**Step 3: Commit**

```bash
git commit -m "chore: remove old Pokemon files — fully replaced by creature system"
```

---

## Task 18: Full Build Verification

**Step 1: Run full build**

Run: `npm run build`

Expected: Clean build with zero errors. Fix any remaining type errors or broken imports.

**Step 2: Run lint**

Run: `npm run lint`

Expected: Clean or only pre-existing warnings.

**Step 3: Push schema to dev DB**

Run: `npm run db:push`

This creates the new tables/enums in the dev database.

**Step 4: Seed the database**

Run: `npm run db:seed`

Verify 151 creatures are inserted.

**Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build errors from creature pivot"
```

---

## Task 19: Verify in Browser

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Manual verification checklist**

- [ ] Homepage shows "Cardboard Tracker" title and updated copy
- [ ] Site header shows "Cardboard Tracker"
- [ ] Map loads with creature sprites on store markers (placeholder SVGs OK)
- [ ] Submitting a sighting creates a sealed box (not an egg)
- [ ] Unbox reveal modal shows creature names and placeholder sprites
- [ ] Collection page shows "Cardboardex" with 151 creature grid
- [ ] Leaderboard shows "Cardboardex" column with updated badge labels
- [ ] No "Pokemon" text visible anywhere in the UI

**Step 3: Commit any final UI fixes**

```bash
git add -A
git commit -m "fix: final UI polish for Cardboard Tracker pivot"
```
