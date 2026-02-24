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
  return `/sprites/${creatureId}.svg`;
}

export function getShinySpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}-shiny.svg`;
}
