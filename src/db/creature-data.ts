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
  { id: 11, name: "Grandblister", type: "shelf", rarityTier: "uncommon", description: "The evolved form of Blisterfang. Its entire body is encased in hardened clamshell plastic that no human can open without tools." },
  { id: 12, name: "Pegloom", type: "shelf", rarityTier: "common", description: "Dangles from pegboard hooks in the dark. Customers who reach for products often grab a Pegloom by mistake." },
  { id: 13, name: "Endcapra", type: "shelf", rarityTier: "uncommon", description: "Claims endcap displays as its personal throne. Refuses to share promotional real estate with lesser creatures." },
  { id: 14, name: "Promoctaur", type: "shelf", rarityTier: "uncommon", description: "Half creature, half promotional stand. It charges down aisles waving sale signs and trampling anything in its path." },
  { id: 15, name: "Cartivore", type: "shelf", rarityTier: "uncommon", description: "Feeds on abandoned shopping carts. The more carts it consumes, the wider it becomes, eventually blocking entire aisles." },
  { id: 16, name: "Cartitan", type: "shelf", rarityTier: "rare", description: "A Cartivore that consumed an entire corral of carts. Its body is a rolling fortress of nested metal baskets." },
  { id: 17, name: "Overstockle", type: "shelf", rarityTier: "common", description: "Appears whenever a shelf is loaded beyond capacity. It thrives in chaos, toppling neatly stacked products for fun." },
  { id: 18, name: "Shelf Impaler", type: "shelf", rarityTier: "uncommon", description: "Uses broken shelf brackets as weapons. Night stockers speak of finding its scratch marks on gondola uprights." },
  { id: 19, name: "Facelace", type: "shelf", rarityTier: "common", description: "A delicate creature that weaves itself between products to keep them perfectly faced. Disintegrates when a customer reaches past it." },
  { id: 20, name: "Aislefiend", type: "shelf", rarityTier: "uncommon", description: "Lurks at the intersection of two aisles, tripping anyone who rounds the corner too quickly." },
  { id: 21, name: "Aisle Tyrant", type: "shelf", rarityTier: "rare", description: "Commands entire aisles as its domain. Store associates must request permission before restocking its territory." },
  { id: 22, name: "Velcraptor", type: "shelf", rarityTier: "uncommon", description: "Hunts in packs along clearance racks. Its hook-like claws stick to any fabric or packaging it touches." },
  { id: 23, name: "Labelisk", type: "shelf", rarityTier: "uncommon", description: "Peels price labels and relocates them to the wrong products. The source of most price-check requests." },
  { id: 24, name: "Labelisk Prime", type: "shelf", rarityTier: "rare", description: "A master of deception that can forge entire shelf tags. Has caused store-wide repricing events single-handedly." },
  { id: 25, name: "Stockroach", type: "shelf", rarityTier: "common", description: "Skitters across stockroom floors in the dark. Impossible to fully eliminate no matter how many times the exterminator visits." },
  { id: 26, name: "Dustmire", type: "shelf", rarityTier: "common", description: "A slow-moving creature made of accumulated shelf dust. Found under bottom shelves where no one has cleaned in months." },
  { id: 27, name: "Dustmourn", type: "shelf", rarityTier: "uncommon", description: "The sorrowful evolved form of Dustmire. It weeps clouds of dust that trigger the fire alarm sprinklers." },
  { id: 28, name: "Hangtail", type: "shelf", rarityTier: "common", description: "Swings from ceiling-mounted signage by its prehensile tail. Responsible for signs that mysteriously fall overnight." },
  { id: 29, name: "Shelfquake", type: "shelf", rarityTier: "rare", description: "When it stomps, entire gondola runs wobble. Has been blamed for at least three major product avalanches this quarter." },

  // --- 030–049 Logistics ---
  { id: 30, name: "Dockrake", type: "logistics", rarityTier: "common", description: "Scrapes along loading dock edges with its flat body. Delivery drivers have learned to check under dock plates before stepping." },
  { id: 31, name: "Dockrake Prime", type: "logistics", rarityTier: "uncommon", description: "An evolved Dockrake large enough to block an entire bay door. Demands tribute in the form of shrink wrap before allowing entry." },
  { id: 32, name: "Cratejaw", type: "logistics", rarityTier: "common", description: "Its mouth is a splintered wooden crate that snaps shut on unsuspecting hands. Thrives in poorly lit receiving areas." },
  { id: 33, name: "Truckulus", type: "logistics", rarityTier: "common", description: "A lumbering beast that mimics the shape of a delivery truck. It honks involuntarily when startled." },
  { id: 34, name: "Truckalisk", type: "logistics", rarityTier: "uncommon", description: "A Truckulus that absorbed too many late shipments. Now it arrives at random times and blocks the dock for hours." },
  { id: 35, name: "Manifestor", type: "logistics", rarityTier: "uncommon", description: "Generates phantom shipping manifests that lead workers on wild goose chases through the warehouse." },
  { id: 36, name: "Manifestor Prime", type: "logistics", rarityTier: "rare", description: "Can alter actual shipping records with a touch. Entire pallets have vanished from inventory because of this creature." },
  { id: 37, name: "Shrinkhorn", type: "logistics", rarityTier: "common", description: "Its horn is made of compressed shrink wrap. Charges at loose pallets to bind them tight, whether they need it or not." },
  { id: 38, name: "Palletusk", type: "logistics", rarityTier: "uncommon", description: "Tusks carved from broken pallet boards. It stacks things compulsively, even items that should never be stacked." },
  { id: 39, name: "Palleteus", type: "logistics", rarityTier: "rare", description: "A towering creature made entirely of interlocked pallets. Warehouse workers report hearing it creak and shift at night." },
  { id: 40, name: "Stackjaw", type: "logistics", rarityTier: "common", description: "Its jaw unhinges to swallow boxes whole. Regurgitates them later in the wrong location, always." },
  { id: 41, name: "Bayleech", type: "logistics", rarityTier: "common", description: "Attaches itself to warehouse bay walls and slowly drains the organization from any nearby inventory system." },
  { id: 42, name: "Forkliftitan", type: "logistics", rarityTier: "rare", description: "A colossal creature whose arms function as forklift tines. Can move an entire aisle's worth of product in one trip." },
  { id: 43, name: "Overnox", type: "logistics", rarityTier: "rare", description: "Only appears during overnight shifts. Emits a drowsy aura that makes stock workers lose track of time." },
  { id: 44, name: "Skidmaw", type: "logistics", rarityTier: "common", description: "Slides across warehouse floors on a permanent layer of pallet dust. Leaves skid marks that never wash out." },
  { id: 45, name: "Liftrune", type: "logistics", rarityTier: "uncommon", description: "Ancient symbols glow on its body whenever heavy objects need moving. Some say it channels the spirit of forklifts past." },
  { id: 46, name: "Cartonix", type: "logistics", rarityTier: "common", description: "A small creature that nests inside empty cardboard boxes. Flattens itself when the baler approaches." },
  { id: 47, name: "Boxeon", type: "logistics", rarityTier: "common", description: "Evolved from Cartonix by absorbing too much packing tape. Now permanently sealed inside its own cardboard armor." },
  { id: 48, name: "Wraptor", type: "logistics", rarityTier: "uncommon", description: "Hunts by launching strands of stretch wrap at its prey. Entire pallets have been found mummified by this creature." },
  { id: 49, name: "Shrinkwrath", type: "logistics", rarityTier: "rare", description: "The furious spirit of inventory shrinkage given form. Its mere presence causes stock counts to drop mysteriously." },

  // --- 050–069 Checkout ---
  { id: 50, name: "Tilltomb", type: "checkout", rarityTier: "common", description: "An ancient register that refused to die. Its drawer opens on its own, spilling coins that roll to unreachable places." },
  { id: 51, name: "Tillreign", type: "checkout", rarityTier: "uncommon", description: "Commands a row of self-checkout machines with an iron will. Forces customers to wait for attendant approval on every item." },
  { id: 52, name: "Scanraith", type: "checkout", rarityTier: "uncommon", description: "A ghostly scanner beam that appears when no one is at the register. Beeps endlessly at nothing." },
  { id: 53, name: "Couponyx", type: "checkout", rarityTier: "common", description: "Feeds on expired coupons. Grows stronger each time a customer argues about an expired promotion." },
  { id: 54, name: "Couponyx Prime", type: "checkout", rarityTier: "rare", description: "Can generate convincing counterfeit coupons from thin air. Responsible for the downfall of three loyalty programs." },
  { id: 55, name: "Taxling", type: "checkout", rarityTier: "common", description: "A tiny creature that adds unexpected charges to receipts. No one can explain where the extra pennies go." },
  { id: 56, name: "Voidchange", type: "checkout", rarityTier: "common", description: "Born from voided transactions. Exists in a state between purchased and returned, never fully real." },
  { id: 57, name: "Pinpadra", type: "checkout", rarityTier: "common", description: "Lives inside card readers and scrambles PIN entries. Responsible for the 'please try again' message everyone dreads." },
  { id: 58, name: "Swipegeist", type: "checkout", rarityTier: "uncommon", description: "The ghost of a demagnetized card. It haunts chip readers and causes mysterious 'card not read' errors." },
  { id: 59, name: "Declinodon", type: "checkout", rarityTier: "uncommon", description: "Feeds on the embarrassment of declined transactions. Grows visibly larger when a line forms behind the victim." },
  { id: 60, name: "Declinodon Max", type: "checkout", rarityTier: "rare", description: "So powerful it can decline cards that have sufficient funds. Even store managers fear its authority." },
  { id: 61, name: "Changelisk", type: "checkout", rarityTier: "common", description: "Hides in the coin return slot and steals quarters one at a time. Has amassed a fortune over the years." },
  { id: 62, name: "POSpire", type: "checkout", rarityTier: "uncommon", description: "A vampiric creature that drains the life from POS terminals. Systems crash whenever it feeds." },
  { id: 63, name: "Changegeist", type: "checkout", rarityTier: "common", description: "The spirit of exact change. Appears when someone holds up the line counting pennies from a coin purse." },
  { id: 64, name: "Priceflare", type: "checkout", rarityTier: "common", description: "Emits bursts of conflicting prices that confuse both customers and registers. Thrives on pricing discrepancies." },
  { id: 65, name: "Tickerjaw", type: "checkout", rarityTier: "uncommon", description: "Its jaw prints receipt tape endlessly. The receipts it produces are always three feet longer than necessary." },
  { id: 66, name: "Rebaterex", type: "checkout", rarityTier: "rare", description: "Promises massive rebates that never arrive. Its lair is lined with thousands of unprocessed mail-in forms." },
  { id: 67, name: "Subtotem", type: "checkout", rarityTier: "uncommon", description: "A totem pole of stacked subtotals. Each face represents a different hidden fee that appeared from nowhere." },
  { id: 68, name: "Auditron", type: "checkout", rarityTier: "uncommon", description: "Scans transaction logs with mechanical precision. When it finds an error, it emits a piercing alarm that echoes through the store." },
  { id: 69, name: "Audititan", type: "checkout", rarityTier: "rare", description: "The final form of Auditron. Its audits are so thorough they have shut down entire store locations for recounting." },

  // --- 070–089 Scalper ---
  { id: 70, name: "Scalpizard", type: "scalper", rarityTier: "common", description: "Snatches products off shelves the moment they're stocked. Can empty a display before the stocker turns around." },
  { id: 71, name: "Scalpizard Prime", type: "scalper", rarityTier: "rare", description: "Commands a network of Scalpizards that coordinate raids across multiple store locations simultaneously." },
  { id: 72, name: "Botwyrm", type: "scalper", rarityTier: "uncommon", description: "A digital serpent that slithers through online checkout systems, adding items to cart faster than any human." },
  { id: 73, name: "Botwyrm Apex", type: "scalper", rarityTier: "rare", description: "Has evolved beyond simple cart-sniping. Can bypass CAPTCHAs and purchase limits through sheer computational fury." },
  { id: 74, name: "Refreshion", type: "scalper", rarityTier: "common", description: "Refreshes product pages thousands of times per second. Its F5 key wore through the keyboard long ago." },
  { id: 75, name: "Snagoyle", type: "scalper", rarityTier: "uncommon", description: "Perches atop store entrances like a gargoyle, watching for delivery trucks. Swoops in the moment new stock arrives." },
  { id: 76, name: "Queuezilla", type: "scalper", rarityTier: "rare", description: "So massive it takes up an entire queue. Uses its bulk to intimidate other customers out of limited product lines." },
  { id: 77, name: "Flipfang", type: "scalper", rarityTier: "common", description: "Buys products solely to resell them at markup. Its fangs are shaped like dollar signs." },
  { id: 78, name: "Flipfang Elite", type: "scalper", rarityTier: "rare", description: "Has perfected the art of the flip. Can appraise an item's resale value within milliseconds of touching it." },
  { id: 79, name: "Markupine", type: "scalper", rarityTier: "common", description: "Covered in quills that each display a different inflated price. The more desperate the buyer, the sharper they get." },
  { id: 80, name: "Stockviper", type: "scalper", rarityTier: "uncommon", description: "Strikes when stock levels are lowest. Hoards products in hidden caches throughout the store parking lot." },
  { id: 81, name: "Bulkbeast", type: "scalper", rarityTier: "uncommon", description: "Buys in absurd quantities to corner local markets. Its shopping cart overflows with multiples of the same item." },
  { id: 82, name: "Bulkbeast Goliath", type: "scalper", rarityTier: "rare", description: "Has grown so large from hoarding that it requires a flatbed truck to transport its purchases." },
  { id: 83, name: "Rafflotaur", type: "scalper", rarityTier: "uncommon", description: "Enters every raffle and giveaway using dozens of aliases. Has won the same limited release four times." },
  { id: 84, name: "Cancelisk", type: "scalper", rarityTier: "common", description: "Places massive orders then cancels them at the last second, crashing inventory systems in the confusion." },
  { id: 85, name: "Outofstockra", type: "scalper", rarityTier: "uncommon", description: "Wherever it appears, shelves go bare. Some believe it doesn't buy the stock but simply wills it out of existence." },
  { id: 86, name: "Waitlistor", type: "scalper", rarityTier: "common", description: "Signs up for every waitlist under multiple accounts. It has been first in line at six stores simultaneously." },
  { id: 87, name: "Cartjackal", type: "scalper", rarityTier: "common", description: "Steals items directly from other shoppers' carts when they aren't looking. Denies everything if confronted." },
  { id: 88, name: "Inflatradon", type: "scalper", rarityTier: "uncommon", description: "Breathes out waves of artificial scarcity that inflate prices on secondary markets overnight." },
  { id: 89, name: "Speculisk", type: "scalper", rarityTier: "rare", description: "A prophetic scalper that can predict which products will become scarce. Its forecasts are terrifyingly accurate." },

  // --- 090–109 Hype ---
  { id: 90, name: "Hypewyrm", type: "hype", rarityTier: "common", description: "Generates buzz by slithering through social media feeds. Leaves a trail of hype that makes ordinary products seem rare." },
  { id: 91, name: "Trendragon", type: "hype", rarityTier: "uncommon", description: "Rides waves of trending topics. Its scales shift color to match whatever product is currently going viral." },
  { id: 92, name: "Viralope", type: "hype", rarityTier: "common", description: "Runs so fast that blurry photos of it go viral, creating demand for products it was merely standing near." },
  { id: 93, name: "Leakwyrm", type: "hype", rarityTier: "common", description: "Slithers through corporate firewalls to leak product announcements early. Feeds on the frenzy that follows." },
  { id: 94, name: "Dropfang", type: "hype", rarityTier: "common", description: "Appears moments before a limited product drop. Its fangs drip with anticipation and energy drink residue." },
  { id: 95, name: "Dropzilla", type: "hype", rarityTier: "rare", description: "So massive that when it arrives for a product drop, the building shakes. Entire release events have been cancelled at its approach." },
  { id: 96, name: "Paniclaw", type: "hype", rarityTier: "common", description: "Scratches frantic messages into store windows: 'LAST ONE' and 'SELLING FAST.' Most of the time, it's lying." },
  { id: 97, name: "FOMOgre", type: "hype", rarityTier: "uncommon", description: "Feeds on the fear of missing out. Whispers 'you'll regret not buying this' into shoppers' ears." },
  { id: 98, name: "FOMOgre Prime", type: "hype", rarityTier: "rare", description: "Its FOMO aura is so powerful that people buy things they don't need, can't afford, and didn't know existed." },
  { id: 99, name: "Adstorm", type: "hype", rarityTier: "common", description: "A swirling vortex of pop-up ads and sponsored posts. Anyone caught in its storm impulse-buys for hours." },
  { id: 100, name: "Sirenstock", type: "hype", rarityTier: "uncommon", description: "Sings an irresistible song that lures customers toward products they never intended to buy. Its melody is a jingle." },
  { id: 101, name: "Blackfright", type: "hype", rarityTier: "uncommon", description: "Emerges on the darkest shopping day of the year. Its shadow causes shoppers to stampede toward doorbuster deals." },
  { id: 102, name: "Doorcrashra", type: "hype", rarityTier: "rare", description: "Has literally crashed through store doors on opening day. Security guards have a wanted poster for this creature." },
  { id: 103, name: "Rumblecart", type: "hype", rarityTier: "common", description: "A possessed shopping cart that careens through stores at high speed during sales events, collecting products on its own." },
  { id: 104, name: "Crowdrake", type: "hype", rarityTier: "uncommon", description: "Materializes wherever crowds gather. The denser the mob, the more powerful it becomes." },
  { id: 105, name: "Queuephantom", type: "hype", rarityTier: "uncommon", description: "An invisible creature that stands in line, making queues seem longer than they are and generating false urgency." },
  { id: 106, name: "Dropocalypse", type: "hype", rarityTier: "rare", description: "When it appears, product drops descend into total chaos. Websites crash, stores lock their doors, and no one gets what they came for." },
  { id: 107, name: "Speculatron", type: "hype", rarityTier: "uncommon", description: "A mechanical creature that processes hype data and generates speculative demand forecasts, most of them wildly wrong." },
  { id: 108, name: "Flashfang", type: "hype", rarityTier: "uncommon", description: "Appears during flash sales and bites anyone who hesitates. Its venom causes immediate impulse purchasing." },
  { id: 109, name: "Bundlord", type: "hype", rarityTier: "rare", description: "Forces unrelated products into bundles no one asked for. Its bundles always include one desirable item and four no one wants." },

  // --- 110–129 Clearance ---
  { id: 110, name: "Clearadon", type: "clearance", rarityTier: "common", description: "Roams clearance aisles marking down prices with its horn. Products flee its path to avoid depreciation." },
  { id: 111, name: "Clearaclysm", type: "clearance", rarityTier: "rare", description: "A catastrophic markdown event given form. When it passes through, everything drops to seventy percent off." },
  { id: 112, name: "Rollbacken", type: "clearance", rarityTier: "common", description: "Rolls prices back with a wave of its tail. The prices keep rolling back until the item is practically free." },
  { id: 113, name: "Discountaur", type: "clearance", rarityTier: "common", description: "Charges through stores applying discounts indiscriminately. Its horns are made of stacked percentage signs." },
  { id: 114, name: "Clearance Wisp", type: "clearance", rarityTier: "common", description: "A faint glow that hovers over the clearance endcap. Following it always leads to expired seasonal merchandise." },
  { id: 115, name: "Bargraith", type: "clearance", rarityTier: "uncommon", description: "A wraith that haunts the bargain bin. It pulls shoppers in with promises of deals and traps them there for hours." },
  { id: 116, name: "Markdownix", type: "clearance", rarityTier: "common", description: "Leaves a trail of red markdown stickers wherever it walks. Store associates can track it by the sticker trail." },
  { id: 117, name: "Tagwraith", type: "clearance", rarityTier: "common", description: "Haunts the space between the original price and the sale price. It feeds on the difference." },
  { id: 118, name: "Labelurk", type: "clearance", rarityTier: "common", description: "Lurks beneath clearance labels, peeling them off to reveal even lower prices hidden underneath." },
  { id: 119, name: "Salegeist", type: "clearance", rarityTier: "common", description: "The ghost of a sale that ended yesterday. Customers swear they can still see the promotional signage." },
  { id: 120, name: "Understockle", type: "clearance", rarityTier: "common", description: "A pitiful creature born from chronically understocked items. It wanders empty shelves looking for company." },
  { id: 121, name: "Overstackle", type: "clearance", rarityTier: "common", description: "The opposite of Understockle. Buried under mountains of product that nobody wants to buy." },
  { id: 122, name: "Shrinklurk", type: "clearance", rarityTier: "common", description: "Slowly shrinks product sizes while keeping prices the same. Customers never notice until it's too late." },
  { id: 123, name: "Returnoid", type: "clearance", rarityTier: "common", description: "A creature made entirely of returned merchandise. It keeps trying to return itself but the service desk won't accept it." },
  { id: 124, name: "Dustgloom", type: "clearance", rarityTier: "common", description: "A cloud of despair that settles over products that haven't sold in months. Everything it touches gets a final markdown." },
  { id: 125, name: "Pricegeist", type: "clearance", rarityTier: "uncommon", description: "A poltergeist that rearranges price tags in the dead of night. Morning shift always finds chaos in its wake." },
  { id: 126, name: "Pricegeist Supreme", type: "clearance", rarityTier: "rare", description: "Has transcended mere tag-swapping. Can alter the prices in the computer system itself with a spectral touch." },
  { id: 127, name: "Marginox", type: "clearance", rarityTier: "uncommon", description: "Feeds on profit margins, thinning them until products sell at a loss. Finance departments live in fear of it." },
  { id: 128, name: "Changelord", type: "clearance", rarityTier: "rare", description: "Master of all price changes. A single decree from this creature can reset an entire store's pricing structure." },
  { id: 129, name: "Tallyshade", type: "clearance", rarityTier: "uncommon", description: "Keeps a running tally of every penny lost to clearance markdowns. Its shadow grows longer with each discount." },

  // --- 130–140 Backroom ---
  { id: 130, name: "Backstockadon", type: "backroom", rarityTier: "common", description: "Dwells in the deepest corner of the backroom. Hoards overstock behind unlabeled boxes that no one dares move." },
  { id: 131, name: "Overlordstock", type: "backroom", rarityTier: "uncommon", description: "Rules the backroom with an iron claw. Decides which products make it to the floor and which stay buried forever." },
  { id: 132, name: "Clerkshade", type: "backroom", rarityTier: "common", description: "The shadow of every employee who got lost in the backroom and was never seen again. It whispers 'check in back' endlessly." },
  { id: 133, name: "Raftergeist", type: "backroom", rarityTier: "common", description: "Swings from backroom rafters, knocking boxes off top steel shelving onto unsuspecting associates below." },
  { id: 134, name: "Baygoyle", type: "backroom", rarityTier: "common", description: "A stone-like creature that perches motionless atop backroom bays. Comes alive only when someone mislabels a bin." },
  { id: 135, name: "Planogrammon", type: "backroom", rarityTier: "uncommon", description: "A creature obsessed with perfect planogram compliance. It rearranges the backroom to match a blueprint only it can see." },
  { id: 136, name: "Planogod", type: "backroom", rarityTier: "rare", description: "The divine authority of store layouts. Its planograms are law, and any deviation triggers its terrible wrath." },
  { id: 137, name: "Fulfillisk", type: "backroom", rarityTier: "uncommon", description: "Picks online orders at inhuman speed. Unfortunately, it picks the wrong items with equal efficiency." },
  { id: 138, name: "Deliveraith", type: "backroom", rarityTier: "uncommon", description: "A wraith that delivers packages to the wrong addresses. Customers blame the carrier but it's always Deliveraith." },
  { id: 139, name: "Stockfinity", type: "backroom", rarityTier: "rare", description: "Claims to have infinite stock of everything. When you actually check, the shelves are mysteriously bare." },
  { id: 140, name: "Retailisk", type: "backroom", rarityTier: "rare", description: "The apex predator of the backroom. Other creatures scatter when its footsteps echo through the warehouse." },

  // --- 141–151 Corporate ---
  { id: 141, name: "Palleteus Prime", type: "corporate", rarityTier: "ultra_rare", description: "The ultimate evolution of Palleteus. Commands vast warehouse networks and can reroute supply chains with a thought." },
  { id: 142, name: "Forklord", type: "corporate", rarityTier: "ultra_rare", description: "The final form of Forklord Minor. Its tines can lift entire store sections. Warehouse workers bow when it passes." },
  { id: 143, name: "Barcodon Omega", type: "corporate", rarityTier: "ultra_rare", description: "Every barcode in existence is encoded in its DNA. It can identify any product ever manufactured with a single glance." },
  { id: 144, name: "Cartaclysm", type: "corporate", rarityTier: "ultra_rare", description: "A shopping cart of apocalyptic proportions. When it rolls, store foundations crack and inventory systems worldwide glitch." },
  { id: 145, name: "Shelfus Rex", type: "corporate", rarityTier: "ultra_rare", description: "The king of all shelving units. Entire store layouts reorganize themselves in its presence out of respect." },
  { id: 146, name: "Grand Aisle", type: "corporate", rarityTier: "ultra_rare", description: "An aisle so grand it stretches beyond the horizon. Products from every era of retail line its infinite shelves." },
  { id: 147, name: "Scarcityra", type: "corporate", rarityTier: "ultra_rare", description: "The embodiment of scarcity itself. Markets tremble at its name, and product allocations shift at its whim." },
  { id: 148, name: "Retailoth", type: "corporate", rarityTier: "ultra_rare", description: "An ancient retail titan that has existed since the first marketplace. All commerce flows through its domain." },
  { id: 149, name: "Hoardlord", type: "corporate", rarityTier: "ultra_rare", description: "The supreme commander of all hoarders. Its vault contains one of every product ever marked as limited edition." },
  { id: 150, name: "Restock Eternis", type: "corporate", rarityTier: "ultra_rare", description: "The eternal promise that shelves will be refilled. It exists in a perpetual state of 'arriving next Tuesday.'" },
  { id: 151, name: "Logistigon", type: "corporate", rarityTier: "ultra_rare", description: "The final creature in the catalog. Master of all logistics, its supply chain is perfect and its inventory never shrinks." },
];

export const TOTAL_CREATURES = CREATURE_DATA.length;

export const MAX_SPRITE_ID = 20;

export function getSpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}.png`;
}

export function getShinySpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}-shiny.png`;
}
