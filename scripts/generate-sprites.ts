/**
 * Generate pixel art sprites for all 151 Cardboard Creatures using DALL-E 3.
 *
 * Usage:
 *   npx tsx scripts/generate-sprites.ts              # Generate all missing sprites
 *   npx tsx scripts/generate-sprites.ts --from 50    # Start from creature #50
 *   npx tsx scripts/generate-sprites.ts --only 10,42 # Generate specific IDs only
 *   npx tsx scripts/generate-sprites.ts --shiny      # Generate shiny variants only
 *
 * Requires OPENAI_API_KEY in .env.local
 * Cost: ~$0.04 per image × 151 = ~$6.04 for all normal sprites
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { CREATURE_DATA } from "../src/db/creature-data";

dotenv.config({ path: ".env.local" });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SPRITES_DIR = path.join(process.cwd(), "public", "sprites");

const TYPE_PALETTE_HINTS: Record<string, string> = {
  shelf: "amber, brown, and retail yellow tones",
  logistics: "steel blue and industrial gray tones",
  checkout: "emerald green and register-screen teal tones",
  scalper: "angry red and dark crimson tones",
  hype: "hot pink and neon magenta tones",
  clearance: "orange and markdown-red tones",
  backroom: "dim gray and shadow tones",
  corporate: "royal purple and gold tones",
};

// Visual-only descriptions for image generation (avoids safety filter triggers).
// These describe appearance only — no violence, threat, or aggressive language.
const VISUAL_OVERRIDES: Record<number, string> = {
  1: "A small glowing spirit made of light, hovering near a shelf. Indigo energy flickers around it.",
  2: "A lizard-like creature with product labels as scales, standing upright arranging items carefully.",
  3: "A stout golem carrying a rolled-up paper map. Sturdy body made of corrugated cardboard.",
  4: "A one-eyed creature with a red scanner beam eye. Mechanical body with barcode patterns.",
  5: "A tiny impish creature sitting inside an open cash register drawer. Mischievous grin.",
  6: "A fiery creature emerging from a cash register. Its body radiates orange energy waves.",
  7: "A shy small creature peeking from behind a large door. Blue-gray coloring, timid posture.",
  8: "A drake-like creature with warehouse markings on its wings. Territorial stance, zip ties on tail.",
  9: "A small mechanical creature shaped like a miniature forklift. Yellow and gray, determined expression.",
  10: "A canine creature made of torn plastic packaging. Clear plastic teeth, crumpled cardboard body armor.",
  11: "An armored creature encased in thick clamshell plastic layers. Elder appearance, crystalline shell.",
  12: "A shadowy wisp creature hanging from pegboard hooks. Melancholy expression, translucent body.",
  13: "A goat-like creature standing proudly on a retail display endcap. Eye-catching colorful body.",
  14: "A centaur-like creature with promotional signs mounted on its back like banners. Bold coloring.",
  15: "A shopping cart that has become alive — the basket is a mouth with bent wire teeth, small legs underneath.",
  16: "A massive beast made of dozens of shopping carts merged together. Chrome and red, towering.",
  17: "A blobby creature squeezed between overstacked products. Anxious expression, soft squishy body.",
  18: "A creature with a shelf bracket as its spine. Metallic body, angular and geometric design.",
  19: "A delicate creature with thin weaving tendrils, arranging small items in rows. Graceful posture.",
  20: "A dark creature lurking between narrow walls. Wide flat body, glowing eyes in shadows.",
  21: "A commanding creature standing tall in a corridor. Crown-like shelf piece on head, authoritative pose.",
  22: "A raptor-like creature covered in hook-and-loop fabric strips. Fast-looking, aerodynamic body.",
  23: "A serpentine creature made of curling price label strips. Coiled body, constantly shedding labels.",
  24: "An evolved serpent covered in contradictory overlapping price tags. Larger, more ornate than Labelisk.",
  25: "A cockroach-like creature made of retail materials. Extremely durable looking, hiding behind dividers.",
  26: "A slow-moving mass of accumulated dust and debris. Lumpy body with twist ties and old coupons embedded.",
  27: "A floating melancholy ghost made of dust particles. Trails wisps behind it. Sad glowing eyes.",
  28: "A monkey-like creature with a long prehensile tail, hanging from a shelf edge. Playful expression.",
  29: "A massive seismic creature made of collapsed shelving units. Heavy, ground-shaking appearance.",
  30: "A crab-like creature with pallet nail claws, scraping along a concrete surface. Rusty coloring.",
  31: "An armored crab creature with reinforced steel claws. Battle-worn appearance, stronger than Dockrake.",
  32: "A creature whose body is a wooden shipping crate with a hinged jaw. Boxy and sturdy.",
  33: "A lumbering beast with a box truck as its body. Headlights as eyes, big and slow.",
  34: "An enormous 18-wheeled creature. Multiple axle legs, massive and imposing on a dock.",
  35: "A wizard-like creature conjuring paper documents from thin air. Floating manifests surround it.",
  36: "A grand wizard creature with perfect glowing manifests orbiting it. More powerful than Manifestor.",
  37: "A horned creature with a single growing horn made of crystallized material. Horn glows faintly.",
  38: "A tusked beast with broken pallet board tusks. Protective stance over a stack of goods.",
  39: "An ancient massive creature whose body IS a perfectly wrapped pallet of goods. Regal and immovable.",
  40: "A creature with powerful jaws stacking boxes endlessly. Tower of boxes balanced on its back.",
  41: "A leech-like creature attached to a large door. Cool blue coloring, draining warmth visually.",
  42: "A colossal mechanical creature built from forklift parts. Hydraulic arms, industrial yellow body.",
  43: "A creature with glowing eyes visible in darkness. Nocturnal appearance, dark body with luminous details.",
  44: "A creature riding a pallet jack. Wheeled lower body, leaves marks on the floor behind it.",
  45: "A mystical creature covered in glowing runic symbols. Each symbol resembles a different barcode or SKU.",
  46: "A humanoid golem assembled entirely from flattened cardboard boxes. Brown and sturdy.",
  47: "An elegant creature evolved from cardboard energy. Smooth corrugated patterns, multiple size forms.",
  48: "A raptor-like creature wrapped in stretch film. Fast-looking, plastic wrap trailing from its body.",
  49: "A dark wraith-like creature that causes things to vanish around it. Shadowy, ethereal body.",
  50: "An ancient register-shaped creature with worn smooth keys. Boxy, mechanical, retro appearance.",
  51: "A regal register creature with an iron drawer jaw. Mechanical and commanding presence.",
  52: "A ghostly transparent creature hovering near a self-checkout screen. Glitchy, pixelated appearance.",
  53: "A creature made of stacked expired coupons. Paper body, determined expression.",
  54: "A majestic creature wallpapered in legendary golden coupons. Ornate and impressive paper body.",
  55: "A tiny gremlin creature hiding behind a receipt. Small, sneaky, adding numbers to paper.",
  56: "A translucent creature existing between states. Flickering, half-visible, liminal appearance.",
  57: "A nervous creature with a screen face living inside a PIN pad. Flickering display eyes.",
  58: "A ghostly creature shaped like a magnetic card reader. Vintage, slightly transparent.",
  59: "A creature that feeds on embarrassment. Red-faced, growing larger, sheepish expression.",
  60: "A massive evolved form of Declinodon. Enormous, can disrupt energy around it. Dark red and black.",
  61: "A serpentine creature made of loose coins coiled together. Jingling, metallic body.",
  62: "A towering creature made of stacked POS terminals. Each screen shows different symbols.",
  63: "A spirit made of exact change — pennies, nickels, dimes forming a humanoid shape.",
  64: "A creature that causes screens to flicker with price changes. Electric, sparking body.",
  65: "A creature with a receipt printer jaw that unspools endlessly. Long paper tongue trailing out.",
  66: "A sly creature holding rebate forms. Trickster appearance, forms always just out of reach.",
  67: "A totem-pole shaped creature displaying running numbers. Mystical retail totem, glowing digits.",
  68: "A mechanical creature with a single scanning red eye. Precise, cold, robotic appearance.",
  69: "A massive mechanical titan with multiple scanning eyes. Enormous robotic audit creature.",
  70: "A cold-blooded lizard creature carrying shopping bags. Calculating eyes, multiple grabbing arms.",
  71: "An evolved lizard with multiple arms carrying bags and boxes. Faster, more arms than Scalpizard.",
  72: "A digital serpent made of code and pixels. Slithers through digital space, neon green body.",
  73: "A massive digital serpent commanding smaller pixel snakes. Apex of digital creatures.",
  74: "A creature obsessively pressing a button. Worn-down key under its finger, frantic energy.",
  75: "A gargoyle perched atop a doorframe. Stone-like, watching from above, ready to swoop.",
  76: "A massive creature occupying a large space. Carrying a folding chair, enormous and immovable.",
  77: "A creature with price sticker teeth. Each tooth shows a different inflated number.",
  78: "An elite version with golden price sticker teeth. Larger, more connected, alpha of its kind.",
  79: "A porcupine-like creature with price tag quills. Each quill shows a different marked-up price.",
  80: "A snake-like creature slithering through back channels. Sleek, dark, well-connected appearance.",
  81: "A beast with an overflowing cart body. Massive, always carrying too much. Bulging shape.",
  82: "A goliath-sized Bulkbeast needing a flatbed truck. Enormous, warehouse-filling size.",
  83: "A centaur-like creature holding multiple raffle tickets. Lucky appearance, four-leaf clover patterns.",
  84: "A serpentine creature coiled around a stack of cancelled order slips. Paper-themed body.",
  85: "A creature that appears near empty shelves. Ghostly, associated with out-of-stock signs.",
  86: "A creature buried in notification alerts and emails. Buzzing, surrounded by floating envelopes.",
  87: "A jackal-like creature stalking through aisles. Sneaky, low to the ground, watchful eyes.",
  88: "A hulking creature that inflates prices around it. Balloon-like body that swells and grows.",
  89: "A cunning serpent coiled around hoarded boxes. Intelligent eyes, surrounded by speculation.",
  90: "A wyrm creature wrapped around social media icons. Amplifying energy, glowing neon body.",
  91: "A dragon riding a wave of trending hashtags. Grows and shrinks with popularity, flashy.",
  92: "An antelope-like creature moving at viral speed. Blur lines trailing behind it, incredibly fast.",
  93: "A wyrm that oozes information droplets. Leaking data, semi-transparent with visible info inside.",
  94: "A creature poised at a starting line, bookmark in hand. Alert, ready to spring, auto-fill ready.",
  95: "A massive creature so large websites crash around it. Digital titan, server-breaking size.",
  96: "A creature with sharp claws that shreds calm. Chaotic energy swirling around it.",
  97: "A large ogre with enormous bulging eyes. Panicked expression, clutching a crumpled shopping list.",
  98: "An ascended ogre radiating panic waves. Glowing eyes, causing FOMO in everything around it.",
  99: "A swirling vortex creature made of pop-up ads and notifications. Blocks everything around it.",
  100: "A siren-like creature singing an irresistible song. Musical notes and product images swirl around it.",
  101: "A dark creature born from a major sale event. Its arrival causes excitement and chaos. Dark purple aura.",
  102: "A battering ram creature of pure consumer demand. Massive head, charging forward posture.",
  103: "A possessed shopping cart rolling on its own. Glowing wheels, items jumping into it by themselves.",
  104: "A creature that materializes in crowds. Made of collective energy, humanoid mass of people shapes.",
  105: "A phantom of queues past. Ghostly line of transparent figures. Ethereal, anxiety-inducing aura.",
  106: "An apocalyptic product drop given form. Massive, digital, servers melting around it. Ultimate scale.",
  107: "A mechanical oracle creature with gears and prediction screens. Steampunk aesthetic, glowing displays.",
  108: "A lightning-fast creature that strikes during sales. Electric, blinding speed, flash of light body.",
  109: "A lordly creature that bundles things together. Carries multiple items chained together, commanding.",
  110: "A creature roaming clearance aisles absorbing red stickers into its hide. Orange-red body.",
  111: "A catastrophic clearance creature. When it appears, prices plummet to nothing. Massive, devastating.",
  112: "A cheerful rolling pin creature that rolls prices back. Round body, happy expression.",
  113: "A bull-like creature with horns that leave yellow sticker trails. Charging through aisles.",
  114: "A faint glowing wisp in a bargain section. Ethereal, guides people, vanishes when spotted.",
  115: "A creature that rearranges jumbled items into chaos. Lives in bins, thrives on disorder.",
  116: "A phoenix made of price tags. Bursts into light and is reborn at lower value. Fiery and cyclical.",
  117: "A spectral figure draped in dangling price tags. Each tag shows a former price. Ghostly.",
  118: "A creature hiding behind price labels. Peeking out, mischievous, causing price discrepancies.",
  119: "A ghost of past sales. Whispers, transparent, holds a fading receipt. Wistful appearance.",
  120: "A withered creature counting remaining items on bony fingers. Thin, depleted, worried.",
  121: "A creature buried peacefully under towers of unsold product. Accepting, calm, surrounded by boxes.",
  122: "A lurking creature in inventory systems. Digital, shadow-like, silently reducing visible counts.",
  123: "A creature that grows near a returns desk. Fed by returned items, expanding blob shape.",
  124: "A heavy dark cloud creature settling over unwanted products. Gloomy, oppressive, dust-colored.",
  125: "A poltergeist that changes price labels. Transparent, mischievous, swapping tags around.",
  126: "The supreme pricing chaos creature. Every item shows different prices. Massive, reality-bending.",
  127: "A creature that consumes profit margins. Breathing in golden energy, exhaling empty air.",
  128: "A regal creature presiding over coin-counting machines. Imperial crown, coins as regalia.",
  129: "A shadow creature that falls across counting sheets, making numbers blur. Dark, mathematical.",
  130: "A massive creature surrounded by months-old product in deep storage. Large, dusty, patient.",
  131: "A ruling creature of the backroom. Massive, commanding, decides what moves. Dark and powerful.",
  132: "A shadow of a retail employee. Knows all the backroom secrets. Translucent, knowledgeable.",
  133: "A creature haunting steel rafters above. Perched high up, dropping small objects. Gargoyle-like.",
  134: "A stone guardian perched on warehouse markers. Comes alive at night. Gothic, stone texture.",
  135: "A demon-like creature summoned by store layout plans. Forces items into exact positions. Geometric.",
  136: "A deity of store layouts. Massive, cosmic, dictates where everything goes. Glowing grid patterns.",
  137: "A serpent coiled around order staging areas. Constricting grip on packages. Logistical.",
  138: "A delivery wraith that haunts doorsteps. Rings bells and vanishes. Ethereal, fast-moving.",
  139: "A creature existing in a state of infinite inventory. Impossible, theoretical, glowing with potential.",
  140: "A basilisk whose gaze transforms things. Intense eyes, powerful stare. Reptilian and regal.",
  141: "The supreme pallet entity. An entire warehouse compressed into one creature. Impossibly dense.",
  142: "The ultimate forklift titan. Hydraulic arms, forks as a crown. Everything bows before it. Industrial yellow and steel.",
  143: "The final barcode creature. Every product encoded on its body. Massive, code-covered being.",
  144: "Thousands of shopping carts fused into one massive rolling creature. Chrome, enormous, unstoppable.",
  145: "The king of all shelving. A towering gondola creature. Shadow covers departments. Regal.",
  146: "An infinite aisle given form. Stretches endlessly. Every product visible somewhere within.",
  147: "The embodiment of scarcity. Decides what becomes limited. Hooded, mysterious, controlling.",
  148: "An ancient being as old as commerce. Was there for the first sale. Primordial, wise.",
  149: "The sovereign of hoarding. Vault-like body containing one of everything. Massive, sealed, ornate.",
  150: "The eternal promise of restock. Always coming, never here. Ghostly shelves, hopeful glow.",
  151: "The final boss of the supply chain. A polygon of pure logistics energy. Geometric, cosmic, perfect.",
};

function buildPrompt(creature: (typeof CREATURE_DATA)[number], shiny: boolean): string {
  const palette = TYPE_PALETTE_HINTS[creature.type] || "varied tones";
  const shinyNote = shiny
    ? " Use an alternate color palette with metallic gold, iridescent, and shimmering coloring instead of the normal palette."
    : "";

  // Use visual-only override to avoid safety filter triggers
  const visualDesc = VISUAL_OVERRIDES[creature.id] || creature.description;

  return `Pixel art game sprite, 96x96 pixels, transparent background, cute retro game creature design similar to classic GBA monster-collecting RPGs. ${visualDesc} Use ${palette}.${shinyNote} Clean pixel outlines, limited color palette, front-facing game sprite pose. Single creature centered on transparent background, no text, no labels, no background elements, no humans.`;
}

async function generateSprite(
  creature: (typeof CREATURE_DATA)[number],
  shiny: boolean
): Promise<Buffer> {
  const prompt = buildPrompt(creature, shiny);
  const suffix = shiny ? "-shiny" : "";

  console.log(`  Generating ${creature.name}${shiny ? " (shiny)" : ""}...`);

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json",
    quality: "standard",
  });

  const b64 = response.data[0]?.b64_json;
  if (!b64) throw new Error(`No image data for ${creature.name}`);

  return Buffer.from(b64, "base64");
}

async function downloadAndSave(
  creature: (typeof CREATURE_DATA)[number],
  shiny: boolean
): Promise<void> {
  const suffix = shiny ? "-shiny" : "";
  const filename = `${creature.id}${suffix}.png`;
  const filepath = path.join(SPRITES_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    console.log(`  ⊘ ${filename} already exists, skipping`);
    return;
  }

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const buffer = await generateSprite(creature, shiny);
      fs.writeFileSync(filepath, buffer);
      console.log(`  ✓ ${filename} saved (${(buffer.length / 1024).toFixed(1)}KB)`);
      return;
    } catch (error: any) {
      if (attempt < maxRetries) {
        const waitMs = attempt * 5000;
        console.log(`  ⚠ Attempt ${attempt} failed: ${error.message}. Retrying in ${waitMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, waitMs));
      } else {
        console.error(`  ✗ FAILED ${filename} after ${maxRetries} attempts: ${error.message}`);
        // Write failure log
        fs.appendFileSync(
          path.join(SPRITES_DIR, "_failures.log"),
          `${new Date().toISOString()} | ${filename} | ${error.message}\n`
        );
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fromIdx = args.includes("--from") ? parseInt(args[args.indexOf("--from") + 1]) : 1;
  const onlyIds = args.includes("--only")
    ? args[args.indexOf("--only") + 1].split(",").map(Number)
    : null;
  const shinyOnly = args.includes("--shiny");
  const normalOnly = args.includes("--normal");

  fs.mkdirSync(SPRITES_DIR, { recursive: true });

  let creatures = CREATURE_DATA;

  if (onlyIds) {
    creatures = creatures.filter((c) => onlyIds.includes(c.id));
    console.log(`Generating ${creatures.length} specific creatures: ${onlyIds.join(", ")}`);
  } else {
    creatures = creatures.filter((c) => c.id >= fromIdx);
    console.log(`Generating sprites for creatures #${fromIdx}-151 (${creatures.length} creatures)`);
  }

  const doNormal = !shinyOnly;
  const doShiny = !normalOnly;

  const totalImages = creatures.length * (doNormal && doShiny ? 2 : 1);
  const estimatedCost = totalImages * 0.04;
  console.log(`Total images: ${totalImages} | Estimated cost: $${estimatedCost.toFixed(2)}`);
  console.log(`Output: ${SPRITES_DIR}\n`);

  // Rate limit: DALL-E 3 allows ~5 images/minute on lower tiers
  // We do 1 at a time with a 3-second pause to be safe
  let generated = 0;

  for (const creature of creatures) {
    console.log(`[${creature.id}/151] ${creature.name} (${creature.type})`);

    if (doNormal) {
      await downloadAndSave(creature, false);
      generated++;
      // Rate limit pause
      if (generated < totalImages) await new Promise((r) => setTimeout(r, 3000));
    }

    if (doShiny) {
      await downloadAndSave(creature, true);
      generated++;
      if (generated < totalImages) await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n✅ Done! Generated ${generated} sprites.`);

  // Check for failures
  const failLog = path.join(SPRITES_DIR, "_failures.log");
  if (fs.existsSync(failLog)) {
    const failures = fs.readFileSync(failLog, "utf-8").trim().split("\n");
    console.log(`⚠ ${failures.length} failures logged in ${failLog}`);
  }
}

main().catch(console.error);
