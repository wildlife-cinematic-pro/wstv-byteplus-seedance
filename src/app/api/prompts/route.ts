import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SEED_TEMPLATES = [
  {
    name: 'Lion Pride Dawn Hunt',
    category: 'predator',
    promptFull: 'A magnificent lioness leads her pride across the golden savanna at dawn, muscles rippling under tawny fur as they stalk through tall amber grass. The rising sun casts long shadows while dust particles dance in the warm light. Close-up of focused amber eyes, then wide shot of the pride moving in perfect coordination through the grassland.',
    promptMini: 'Lioness leading pride across golden savanna at dawn, stalking through tall grass, warm sunrise light.',
    hookText: 'The hunt begins as golden light breaks the horizon...',
    animalType: 'lion',
    biome: 'savanna',
  },
  {
    name: 'Great White Shark Breach',
    category: 'marine',
    promptFull: 'A massive great white shark explodes from the dark ocean surface in slow motion, water cascading from its powerful body as it breaches completely airborne. Sunlight catches the spray creating a rainbow effect. The shark\'s rows of serrated teeth are visible before it crashes back into the depths, sending a tower of white spray skyward.',
    promptMini: 'Great white shark breaching from ocean in slow motion, dramatic spray, underwater to surface.',
    hookText: 'From the dark depths, a prehistoric predator launches...',
    animalType: 'shark',
    biome: 'ocean',
  },
  {
    name: 'Monarch Butterfly Migration',
    category: 'migration',
    promptFull: 'Thousands of monarch butterflies fill the sky in a breathtaking migration spectacle, their orange and black wings creating a living mosaic against the deep blue sky. They cluster on oyamel fir trees in such numbers that the branches bend under their weight. Close-up reveals delicate wing patterns as sunlight filters through their translucent wings.',
    promptMini: 'Monarch butterfly migration, thousands filling sky, clustering on fir trees, delicate wing close-ups.',
    hookText: 'A river of orange wings flows through the mountain air...',
    animalType: 'butterfly',
    biome: 'forest',
  },
  {
    name: 'Arctic Fox Winter Hunt',
    category: 'predator',
    promptFull: 'A pure white arctic fox leaps headfirst into deep snow, its body completely disappearing before it emerges with a lemming in its jaws. The frozen tundra stretches endlessly under the polar sky. Snow crystals sparkle in the pale sunlight as the fox shakes off the powder, its thick fur ruffling in the bitter wind.',
    promptMini: 'Arctic fox diving into snow, emerging with prey, white tundra, sparkling snow crystals.',
    hookText: 'A ghost of the tundra strikes from above the ice...',
    animalType: 'fox',
    biome: 'arctic',
  },
  {
    name: 'Elephant Calf First Bath',
    category: 'parenting',
    promptFull: 'A playful elephant calf takes its first bath in a shimmering waterhole, trumpeting with joy as its mother sprays water with her trunk. The calf stumbles and splashes, sending diamond-like droplets cascading through the golden afternoon light. Other herd members watch protectively as the baby elephant discovers the joy of water.',
    promptMini: 'Elephant calf first bath in waterhole, mother spraying water, joyful splashing, golden afternoon light.',
    hookText: 'A tiny trunk experiences water for the very first time...',
    animalType: 'elephant',
    biome: 'savanna',
  },
  {
    name: 'Hummingbird Aerial Combat',
    category: 'aerial',
    promptFull: 'Two male hummingbirds engage in a spectacular aerial dogfight, their iridescent throats flashing like jewels as they dive and weave at impossible speeds. Slow motion captures their wings beating 80 times per second, creating a figure-eight pattern. Feathers catch the light in bursts of emerald and ruby as they dispute territory over a field of tropical flowers.',
    promptMini: 'Two hummingbirds aerial combat, iridescent colors, slow-motion wings, tropical flowers.',
    hookText: 'A high-speed duel among the flowers...',
    animalType: 'hummingbird',
    biome: 'forest',
  },
  {
    name: 'Orca Wave Wash Hunt',
    category: 'marine',
    promptFull: 'A pod of orcas creates coordinated waves to wash a seal off an ice floe, their black and white bodies surging through the frigid Antarctic waters in perfect synchronization. The strategy unfolds with military precision — some distract while others position for the wave. The frozen landscape provides a stunning backdrop to this remarkable display of collective intelligence.',
    promptMini: 'Orca pod coordinated wave-washing seal off ice, Antarctic waters, strategic hunting, frozen landscape.',
    hookText: 'The ocean\'s most intelligent predators execute a coordinated plan...',
    animalType: 'orca',
    biome: 'ocean',
  },
  {
    name: 'Snow Leopard Mountain Descent',
    category: 'predator',
    promptFull: 'An elusive snow leopard descends a near-vertical mountain cliff face with effortless grace, its impossibly long tail providing balance on the treacherous rocky terrain. Wind sweeps snow from the ridge as the cat picks its way down, each paw placement precise and deliberate. The vast Himalayan landscape stretches below, shrouded in clouds and ice.',
    promptMini: 'Snow leopard descending steep mountain cliff, long tail balancing, Himalayan landscape, wind-blown snow.',
    hookText: 'The ghost of the mountains reveals itself on the cliff face...',
    animalType: 'leopard',
    biome: 'mountain',
  },
];

async function seedTemplates() {
  const existing = await db.promptTemplate.count();
  if (existing === 0) {
    for (const template of SEED_TEMPLATES) {
      await db.promptTemplate.create({ data: template });
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await seedTemplates();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where = category ? { category } : {};
    const templates = await db.promptTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Prompts GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, promptFull, promptMini, hookText, animalType, biome } = body;

    if (!name || !category || !promptFull || !promptMini) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, promptFull, promptMini' },
        { status: 400 }
      );
    }

    const template = await db.promptTemplate.create({
      data: {
        name,
        category,
        promptFull,
        promptMini,
        hookText: hookText || null,
        animalType: animalType || null,
        biome: biome || null,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Prompts POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt template' },
      { status: 500 }
    );
  }
}
