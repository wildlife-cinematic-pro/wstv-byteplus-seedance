/**
 * WSTV Seedance Production Workflow - Seed Data
 *
 * Seeds:
 * - 8 WSTVPreset entries (rescue, wildlife, survival, predator, funny, emotional, rare)
 * - 7 ContentCalendar entries (next 7 days)
 * - 8 ProviderComparison entries (Seedance vs Kling vs Runway across categories)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding WSTV Production Workflow data...');

  // ─── WSTVPresets ───

  const presets = [
    {
      id: 'preset-mother-saves-baby',
      name: 'Mother saves baby',
      icon: '🐻',
      category: 'rescue',
      promptTemplate: 'A mother {animal} protects her baby from a {danger} in the {biome}. [0-3s] Wide establishing shot of {biome} atmosphere. [3-6s] Baby {animal} wanders near danger. [6-10s] Mother {animal} notices and rushes in. [10-13s] Dramatic rescue — mother shields/leads baby away. [13-15s] Safe reunion, baby nuzzles mother. Camera: slow-motion during rescue, tight on faces.',
      hookTemplate: '[0-3s] Baby {animal} inches toward {danger} — will mom reach it in time?',
      structureNotes: 'Opening: establish peaceful scene → Tension: baby in danger → Climax: mother rescues → Resolution: safe reunion. Keep rescue shot at 6-10s for maximum impact.',
      safetyRules: '["No blood or injury shown","Predator must not make contact with baby","Rescue must be physically plausible","Mother animal behavior must be species-accurate"]',
      captionStyle: 'When a mother\'s instinct kicks in 🐻❤️ No force stronger than a mom protecting her baby.',
      hashtagStyle: '#WildlifeRescue #AnimalMoms #NatureIsMetal #WildlifePhotography #WSTV',
      defaultModel: 'seedance-2.0',
      defaultResolution: '720p',
      defaultDuration: 15,
      defaultFps: 24,
      animalType: 'bear',
      biome: 'forest',
      dangerType: 'predator',
      emotionalBeat: 'rescue',
      sortOrder: 1,
      isActive: true,
    },
    {
      id: 'preset-baby-animal-learning',
      name: 'Baby animal learning',
      icon: '🐥',
      category: 'wildlife',
      promptTemplate: 'A baby {animal} learns to {skill} for the first time in the {biome}. [0-3s] Close-up of baby {animal} looking uncertain. [3-7s] First attempt — awkward, fails charmingly. [7-11s] Second attempt — improving, determined. [11-14s] Success! Baby {animal} achieves the {skill}. [14-15s] Triumphant reaction, parent watches proudly.',
      hookTemplate: '[0-3s] This baby {animal} is about to try something for the very first time...',
      structureNotes: 'Setup: baby looks uncertain → Attempt 1: cute failure → Attempt 2: better → Success: triumphant moment. Show parent reaction if possible.',
      safetyRules: '["No dangerous situations for baby animal","Environment must look safe","Learning behavior must be species-appropriate","No human interference"]',
      captionStyle: 'First steps are always the hardest 🐥 But this little one didn\'t give up!',
      hashtagStyle: '#BabyAnimals #WildlifeLearning #CuteAnimals #NatureMoments #WSTV',
      defaultModel: 'seedance-2.0',
      defaultResolution: '720p',
      defaultDuration: 15,
      defaultFps: 24,
      animalType: 'various',
      biome: 'various',
      dangerType: null,
      emotionalBeat: 'learning',
      sortOrder: 2,
      isActive: true,
    },
    {
      id: 'preset-storm-survival',
      name: 'Storm survival',
      icon: '⛈️',
      category: 'survival',
      promptTemplate: 'An {animal} endures a fierce {stormType} storm in the {biome}. [0-3s] Calm before the storm — sky darkening, wind picking up. [3-7s] Storm hits — rain/snow/wind lashing the environment. [7-11s] {Animal} takes shelter, bracing against the elements. [11-14s] Storm intensity peaks — dramatic survival moment. [14-15s] Storm passes — {animal} emerges, resilient.',
      hookTemplate: '[0-3s] The storm is coming... and this {animal} has nowhere to hide.',
      structureNotes: 'Calm → Build-up → Impact → Peak danger → Survival. Use dramatic lighting transitions. Rain/snow physics are critical for realism.',
      safetyRules: '["Animal must not appear injured","Shelter must be realistic for the species","Storm effects must be physically plausible","No flooding that would trap animal"]',
      captionStyle: 'Nature doesn\'t give second chances ⛈️ This is what survival really looks like.',
      hashtagStyle: '#StormSurvival #WildlifeSurvival #NaturePower #ExtremeWeather #WSTV',
      defaultModel: 'seedance-2.0',
      defaultResolution: '720p',
      defaultDuration: 15,
      defaultFps: 24,
      animalType: null,
      biome: null,
      dangerType: 'storm',
      emotionalBeat: 'survival',
      sortOrder: 3,
      isActive: true,
    },
    {
      id: 'preset-river-rescue',
      name: 'River rescue',
      icon: '🌊',
      category: 'rescue',
      promptTemplate: 'An {animal} is swept into a fast-moving river and struggles to survive in the {biome}. [0-3s] {Animal} near riverbank, water rushing. [3-6s] Slip/fall into the river — panic. [6-10s] Struggling against current — dramatic underwater and surface shots. [10-13s] Rescue — reaches a rock/bank/another animal helps. [13-15s] Safe on shore, exhausted but alive.',
      hookTemplate: '[0-3s] One wrong step... and this {animal} is fighting for its life in the rapids.',
      structureNotes: 'Setup: riverbank danger → Fall: unexpected slip → Struggle: water physics critical → Rescue: dramatic reach → Safety. Water rendering is key quality indicator.',
      safetyRules: '["Water physics must be realistic","Animal must not appear to drown","Rescue must be physically possible","No human rescue — must be natural","River speed must look dangerous but survivable"]',
      captionStyle: 'The current almost won 🌊 But this fighter wasn\'t ready to give up.',
      hashtagStyle: '#RiverRescue #WildlifeSurvival #NatureDrama #AnimalRescue #WSTV',
      defaultModel: 'seedance-2.0',
      defaultResolution: '720p',
      defaultDuration: 15,
      defaultFps: 24,
      animalType: null,
      biome: null,
      dangerType: 'river',
      emotionalBeat: 'rescue',
      sortOrder: 4,
      isActive: true,
    },
    {
      id: 'preset-predator-tension',
      name: 'Predator tension no gore',
      icon: '🦁',
      category: 'predator',
      promptTemplate: 'A {predator} stalks prey in the {biome} — tension builds but no contact shown. [0-3s] Wide shot — {prey} grazing peacefully, unaware. [3-7s] {Predator} spotted in background, stalking low. [7-11s] Tension peaks — {predator} gets close, {prey} senses danger. [11-13s] Chase begins — cutting between predator and prey. [13-15s] Ambiguous ending — chase continues off-frame or prey escapes.',
      hookTemplate: '[0-3s] Something is watching... and the prey has NO idea.',
      structureNotes: 'Calm → Stalker revealed → Tension builds → Chase → Ambiguous escape. NEVER show kill or contact. The tension IS the content.',
      safetyRules: '["NO blood, gore, or killing shown on screen","Predator must NOT make contact with prey","Chase must be cut before any catch","Focus on tension, not violence","Prey must have a plausible escape route"]',
      captionStyle: 'The chase is everything 🦁 In nature, tension is the real story.',
      hashtagStyle: '#PredatorPrey #WildlifeTension #NatureDrama #AnimalInstincts #WSTV',
      defaultModel: 'seedance-2.0',
      defaultResolution: '720p',
      defaultDuration: 15,
      defaultFps: 24,
      animalType: null,
      biome: null,
      dangerType: 'predator',
      emotionalBeat: 'tension',
      sortOrder: 5,
      isActive: true,
    },
    {
      id: 'preset-funny-failed-hunt',
      name: 'Funny failed hunt',
      icon: '😂',
      category: 'funny',
      promptTemplate: 'A {predator} tries to hunt {prey} but fails in a hilarious way in the {biome}. [0-3s] {Predator} sneaking up confidently. [3-6s] Pounce attempt — completely misses. [6-9s] Second attempt — trips over something unexpected. [9-12s] {Prey} looks back unimpressed/confused. [12-15s] {Predator} walks away embarrassed, {prey} resumes grazing.',
      hookTemplate: '[0-3s] This hunter thinks it\'s so sneaky... wait for it 😂',
      structureNotes: 'Confidence → Fail 1 (funny) → Fail 2 (funnier) → Prey reaction (comedy gold) → Walk of shame. Timing is everything — use quick cuts.',
      safetyRules: '["No animal is harmed or distressed","Fails must be natural and plausible","Keep it lighthearted — no suffering","Prey should look unbothered","No anthropomorphic expressions"]',
      captionStyle: 'When the hunt goes VERY wrong 😂 Even predators have bad days.',
      hashtagStyle: '#FunnyAnimals #WildlifeFails #NatureComedy #AnimalBloopers #WSTV',
      defaultModel: 'seedance-2.0',
      defaultResolution: '720p',
      defaultDuration: 15,
      defaultFps: 24,
      animalType: null,
      biome: null,
      dangerType: null,
      emotionalBeat: 'humor',
      sortOrder: 6,
      isActive: true,
    },
    {
      id: 'preset-emotional-reunion',
      name: 'Emotional reunion',
      icon: '💕',
      category: 'emotional',
      promptTemplate: 'An {animal} is reunited with its family/group after being separated in the {biome}. [0-3s] Alone — {animal} calling out, searching. [3-7s] Distant response — hope ignites. [7-11s] Running toward each other — slow motion. [11-14s] Reunion — touching, nuzzling, vocalizing. [14-15s] Group together again, peaceful.',
      hookTemplate: '[0-3s] Lost and alone... but listen — is that its family calling back?',
      structureNotes: 'Isolation → Hope → Approach → Reunion → Peace. Slow motion on the running-toward-each-other moment. Music cue is critical.',
      safetyRules: '["Reunion must be species-appropriate","Vocalizations must match the animal","No forced proximity — natural approach","Environment must support the emotional tone","No human intervention in reunion"]',
      captionStyle: 'After everything they\'ve been through... they found each other again 💕',
      hashtagStyle: '#AnimalReunion #WildlifeEmotions #NatureLove #Heartwarming #WSTV',
      defaultModel: 'seedance-2.0',
      defaultResolution: '720p',
      defaultDuration: 15,
      defaultFps: 24,
      animalType: null,
      biome: null,
      dangerType: null,
      emotionalBeat: 'reunion',
      sortOrder: 7,
      isActive: true,
    },
    {
      id: 'preset-rare-animal-behavior',
      name: 'Rare animal behavior',
      icon: '🦋',
      category: 'rare',
      promptTemplate: 'A {animal} displays rare {behavior} behavior rarely captured on camera in the {biome}. [0-3s] Wide establishing shot — unremarkable setting. [3-6s] {Animal} begins the rare behavior — subtle start. [6-11s] Full display of {behavior} — the wow moment. [11-14s] Different angle/repeat showing detail. [14-15s] Natural end — {animal} returns to normal.',
      hookTemplate: '[0-3s] You almost NEVER see this... {animal} about to do something incredible.',
      structureNotes: 'Setup: normal scene → Build: subtle start → WOW: full rare behavior → Detail: second angle → Close. The wow moment should be 6-11s for maximum retention.',
      safetyRules: '["Behavior must be scientifically documented for the species","No staged or forced behavior","Natural setting only","No baiting or luring","Behavior notes must reference source"]',
      captionStyle: 'This behavior is SO rare, most people will never see it in person 🦋',
      hashtagStyle: '#RareWildlife #AnimalBehavior #NatureWonder #WildlifeDocumentary #WSTV',
      defaultModel: 'seedance-2.0',
      defaultResolution: '720p',
      defaultDuration: 15,
      defaultFps: 24,
      animalType: null,
      biome: null,
      dangerType: null,
      emotionalBeat: 'wonder',
      sortOrder: 8,
      isActive: true,
    },
  ];

  for (const preset of presets) {
    await prisma.wSTVPreset.upsert({
      where: { id: preset.id },
      update: {},
      create: preset,
    });
  }
  console.log(`✅ ${presets.length} WSTVPreset entries seeded`);

  // ─── ContentCalendar entries (next 7 days) ───

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarEntries = [
    {
      id: 'calendar-day-1',
      scheduledDate: new Date(today.getTime() + 1 * 86400000),
      projectTitle: 'Mother Bear Saves Cub from Wolf',
      animalStoryName: 'Grizzly mother rescue',
      status: 'idea',
      presetId: 'preset-mother-saves-baby',
      notes: 'Research grizzly bear behavior — focus on real den defense patterns',
    },
    {
      id: 'calendar-day-2',
      scheduledDate: new Date(today.getTime() + 2 * 86400000),
      projectTitle: 'Baby Elephant Takes First Steps',
      animalStoryName: 'Elephant calf learning',
      status: 'master_image',
      presetId: 'preset-baby-animal-learning',
      notes: 'Need reference image of newborn elephant. Check Unsplash for master image.',
    },
    {
      id: 'calendar-day-3',
      scheduledDate: new Date(today.getTime() + 3 * 86400000),
      projectTitle: 'Arctic Fox in Blizzard',
      animalStoryName: 'Arctic fox blizzard survival',
      status: 'storyboard',
      presetId: 'preset-storm-survival',
      notes: 'Snow physics will be challenging — may need multiple retries',
    },
    {
      id: 'calendar-day-4',
      scheduledDate: new Date(today.getTime() + 4 * 86400000),
      projectTitle: 'Deer Crosses Raging River',
      animalStoryName: 'White-tailed deer river crossing',
      status: 'prompted',
      presetId: 'preset-river-rescue',
      notes: 'Water rendering test — compare Seedance vs Kling for water realism',
    },
    {
      id: 'calendar-day-5',
      scheduledDate: new Date(today.getTime() + 5 * 86400000),
      projectTitle: 'Cheetah Stalks Gazelle — No Catch',
      animalStoryName: 'Cheetah tension on savanna',
      status: 'generated',
      presetId: 'preset-predator-tension',
      notes: 'Strict no-gore rule. End with chase going off-frame.',
    },
    {
      id: 'calendar-day-6',
      scheduledDate: new Date(today.getTime() + 6 * 86400000),
      projectTitle: 'Lion Cub Falls Off Log',
      animalStoryName: 'Clumsy lion cub comedy',
      status: 'capcut_edit',
      presetId: 'preset-funny-failed-hunt',
      notes: 'Add bounce sound effect in CapCut. Caption: "Even kings have bad days"',
    },
    {
      id: 'calendar-day-7',
      scheduledDate: new Date(today.getTime() + 7 * 86400000),
      projectTitle: 'Penguin Family Reunites After Storm',
      animalStoryName: 'Emperor penguin reunion',
      status: 'scheduled',
      presetId: 'preset-emotional-reunion',
      notes: 'Post timing: 7pm EST for max US engagement. Hashtag #PenguinLove',
    },
  ];

  for (const entry of calendarEntries) {
    await prisma.contentCalendar.upsert({
      where: { id: entry.id },
      update: {},
      create: entry,
    });
  }
  console.log(`✅ ${calendarEntries.length} ContentCalendar entries seeded`);

  // ─── ProviderComparison entries ───

  const providerComparisons = [
    {
      id: 'comp-seedance-animal-realism',
      provider: 'seedance-2.0',
      category: 'animal_realism',
      rating: 4,
      notes: 'Strong fur/feather detail. Anatomy mostly correct. Occasional extra limb on fast motion. Best for close-ups.',
    },
    {
      id: 'comp-kling-animal-realism',
      provider: 'kling',
      category: 'animal_realism',
      rating: 3,
      notes: 'Decent animal shapes but less detail on fur. Can blur on fast movement. Better for wide shots than close-ups.',
    },
    {
      id: 'comp-runway-animal-realism',
      provider: 'runway',
      category: 'animal_realism',
      rating: 2,
      notes: 'Animals tend to morph. Identity drift is common. Not recommended for wildlife content.',
    },
    {
      id: 'comp-seedance-water',
      provider: 'seedance-2.0',
      category: 'water',
      rating: 3,
      notes: 'Water splash looks okay from distance. Close-up water drops not realistic. River scenes acceptable at 720p.',
    },
    {
      id: 'comp-kling-water',
      provider: 'kling',
      category: 'water',
      rating: 4,
      notes: 'Best water rendering among the three. Realistic ripples and flow. Good for river/ocean scenes.',
    },
    {
      id: 'comp-seedance-storm',
      provider: 'seedance-2.0',
      category: 'storm',
      rating: 3,
      notes: 'Rain is visible but not perfectly realistic. Lightning effects are decent. Wind on fur/vegetation is okay.',
    },
    {
      id: 'comp-kling-storm',
      provider: 'kling',
      category: 'storm',
      rating: 4,
      notes: 'Good rain and cloud rendering. Wind effects more natural. Lightning timing is better.',
    },
    {
      id: 'comp-seedance-rescue',
      provider: 'seedance-2.0',
      category: 'rescue',
      rating: 4,
      notes: 'Best for rescue scenes — animal interaction is more natural. Mother-baby dynamics look convincing. Emotional beats land well.',
    },
  ];

  for (const comp of providerComparisons) {
    await prisma.providerComparison.upsert({
      where: { id: comp.id },
      update: {},
      create: comp,
    });
  }
  console.log(`✅ ${providerComparisons.length} ProviderComparison entries seeded`);

  console.log('\n🎉 Production Workflow seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`WSTVPresets: ${presets.length}`);
  console.log(`ContentCalendar: ${calendarEntries.length}`);
  console.log(`ProviderComparisons: ${providerComparisons.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
