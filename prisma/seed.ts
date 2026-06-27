import { db } from '@/lib/db'

const TEMPLATES = [
  {
    name: 'Savanna Dawn Hunt',
    category: 'predator',
    promptFull: 'A cinematic 15-second wildlife documentary sequence in 9:16 vertical format. Golden hour light washes across the African savanna, tall amber grass swaying in the warm breeze. A lioness emerges from the tall grass, her muscular frame low to the ground, every step calculated and silent. The camera tracks alongside in fluid slow motion, capturing the ripple of powerful shoulders, the intensity of amber eyes locked on unseen prey. Dust particles float in the golden light like suspended diamonds. A rack focus shifts from the lioness\'s focused gaze to the sweeping savanna behind her — acacia trees silhouetted against a burning orange sky. The sequence closes with a slow dolly back as she pauses at the crest of a small rise, the entire golden landscape sprawling behind her, a queen surveying her domain. Naturalistic documentary style, volumetric atmosphere, 4K clarity, ambient savanna soundscape.',
    promptMini: 'Cinematic 15-second vertical wildlife clip: lioness stalking through golden savanna grass at dawn. Slow motion tracking shot captures her powerful stride and intense amber eyes. Golden hour light creates dramatic rim lighting on her fur. Camera slowly pulls back to reveal the vast African landscape behind her. Documentary style, natural atmosphere, clean composition.',
    hookText: 'A lioness materializes from golden grass in slow motion — raw power and precision in every step, demanding attention from the first frame.',
    animalType: 'Lion',
    biome: 'savanna',
  },
  {
    name: 'Arctic Seal Dive',
    category: 'marine',
    promptFull: 'A breathtaking 15-second underwater-to-above-water wildlife sequence in 9:16 vertical format. The scene opens at the icy surface of the Arctic Ocean, jagged ice formations framing the shot. A harbor seal breaks through a thin sheet of ice, water cascading off its sleek fur in crystal droplets caught in slow motion. The camera follows the seal as it dives beneath the surface — a seamless transition from bright arctic light to the deep turquoise glow below. Underwater, the seal twists and glides with effortless grace, bubbles trailing from its fur like silver pearls. Sunbeams penetrate the water in god-ray shafts, illuminating suspended ice crystals. The camera captures the seal from below, its silhouette framed against the bright surface above, before it banks and returns upward, breaking through the ice once more. Documentary style, ambient underwater acoustics, 4K clarity, volumetric light.',
    promptMini: 'Cinematic 15-second vertical wildlife clip: seal diving through Arctic ice. Opens above water as seal breaks through thin ice in slow motion. Camera follows underwater as seal glides gracefully through turquoise depths with trailing bubbles. Sunbeams pierce the water creating dramatic light shafts. Seal returns to surface. Documentary style, underwater atmosphere.',
    hookText: 'Crystal water explodes as a seal punches through Arctic ice — an electrifying split-second captured in slow motion.',
    animalType: 'Seal',
    biome: 'arctic',
  },
  {
    name: 'Eagle Mountain Glide',
    category: 'aerial',
    promptFull: 'An epic 15-second aerial wildlife sequence in 9:16 vertical format. The camera begins at the jagged peak of a snow-capped mountain range, clouds streaming past in accelerated motion. A golden eagle launches from its rocky perch, massive wings unfolding in majestic slow motion — each primary feather catching the alpine light like burnished gold. The camera tracks the eagle as it rides thermal currents, sweeping along the mountain face with breathtaking speed. A perspective shift places the viewer on the eagle\'s back, the world falling away below as mist-shrouded valleys and glacial rivers stretch to the horizon. The eagle banks hard, wings cupping the air, talons extending momentarily as it spots movement below. The sequence concludes with a dramatic upward tilt as the eagle soars directly overhead, backlit by the sun, filling the vertical frame with its magnificent wingspan. Documentary style, immersive aerial perspective, 4K clarity, wind ambience.',
    promptMini: 'Cinematic 15-second vertical wildlife clip: golden eagle soaring over mountain peaks. Opens on eagle launching from rocky perch in slow motion. Camera tracks as it rides thermals along dramatic mountain faces. Brief POV shot looking down at misty valleys. Eagle banks and soars overhead, wings spread wide against the sky. Documentary style, aerial perspective.',
    hookText: 'A golden eagle launches from a mountain peak in stunning slow motion — wings spanning the entire frame, an instant of pure wild freedom.',
    animalType: 'Eagle',
    biome: 'mountain',
  },
  {
    name: 'Elephant River Crossing',
    category: 'migration',
    promptFull: 'A sweeping 15-second wildlife documentary sequence in 9:16 vertical format. Dawn mist rises from a wide African river as a herd of elephants begins its ancient crossing. The matriarch leads, wading into the murky water up to her chest, her massive form creating gentle waves. The camera captures the scene from water level — a baby elephant clinging to its mother\'s side, tiny trunk reaching above the waterline. Slow motion reveals each enormous footstep displacing water in dramatic cascades, droplets catching the soft pink dawn light. The herd moves in unison, a river of grey bodies flowing across the river, their rumbles and trumpets echoing through the mist. A low-angle shot from underwater shows the elephants\' legs moving in powerful rhythm. The sequence ends with the herd emerging on the far bank, water streaming off their bodies, the baby shaking its ears with delight as morning sun breaks through the mist. Documentary style, immersive natural sound, 4K clarity.',
    promptMini: 'Cinematic 15-second vertical wildlife clip: elephant herd crossing a misty river at dawn. Matriarch leads the way through deep water. Camera at water level captures baby elephant staying close to mother. Slow motion shows powerful footsteps creating dramatic water sprays. Herd emerges on far bank in morning sunlight. Documentary style, natural atmosphere.',
    hookText: 'A baby elephant holds its tiny trunk above the water as the herd crosses a misty river — vulnerable yet protected, a moment of pure tenderness in the wild.',
    animalType: 'Elephant',
    biome: 'wetland',
  },
  {
    name: 'Penguin Chick First Steps',
    category: 'parenting',
    promptFull: 'An intimate 15-second wildlife documentary sequence in 9:16 vertical format. Amidst a vast emperor penguin colony on the Antarctic ice shelf, a fluffy grey chick stands beneath its parent\'s warm brood pouch. The chick takes its first wobbly steps, tiny flippers outstretched for balance, each footstep a small adventure on the ice. The camera zooms to an extreme close-up of the chick\'s face — bright curious eyes, soft downy feathers ruffled by the polar wind, beak opening in a high-pitched call. The parent lowers its head, gently nudging the chick forward with its beak. Slow motion captures the chick\'s delighted response — flippers flapping with excitement, little body bouncing. The camera slowly widens to reveal dozens of other parent-chick pairs across the colony, a tapestry of new life against the endless white ice. Aurora australis flickers faintly in the sky above. Documentary style, ambient wind and penguin calls, 4K clarity, warm color grading against the cold.',
    promptMini: 'Cinematic 15-second vertical wildlife clip: emperor penguin chick taking first steps on Antarctic ice. Close-up of fluffy chick wobbling forward with outstretched flippers. Parent gently nudges the chick with its beak. Chick responds with excited flapping. Camera widens to show the vast colony against white ice. Documentary style, intimate perspective.',
    hookText: 'A fluffy penguin chick takes its first wobbly steps on Antarctic ice — tiny flippers spread wide, an irresistibly adorable moment of new life.',
    animalType: 'Penguin',
    biome: 'arctic',
  },
  {
    name: 'Deer Forest Alert',
    category: 'prey',
    promptFull: 'A tense 15-second wildlife documentary sequence in 9:16 vertical format. Deep in an ancient misty forest, dappled light filtering through towering canopy, a white-tailed deer stands perfectly still, ears rotating like satellite dishes, every sense heightened. The camera slowly orbits the deer in a smooth tracking shot, capturing the alert posture — muscles coiled beneath a tawny coat, nostrils flaring to catch scents, dark eyes scanning the shadowed undergrowth. A sudden rustle off-screen and the deer\'s head snaps toward the sound, captured in a sharp rack-focus that blurs the forest behind. Slow motion reveals the micro-expressions: ear twitching, a nostril flare, the slight tensing of legs ready to spring. The deer takes a single cautious step backward, then another, before melting silently into the mist between the trees — a ghost of the forest vanishing into its own legend. Documentary style, tension-building ambient sound, 4K clarity, misty atmosphere.',
    promptMini: 'Cinematic 15-second vertical wildlife clip: alert deer in misty forest. Deer stands motionless, ears rotating, scanning for danger. Camera slowly orbits showing tense posture and flared nostrils. Sharp rack-focus on reaction to off-screen sound. Deer backs away and vanishes into the mist. Documentary style, tense atmosphere.',
    hookText: 'A deer freezes mid-step, ears locked toward an unseen threat — a heartbeat of pure tension in the misty forest.',
    animalType: 'Deer',
    biome: 'forest',
  },
  {
    name: 'Whale Deep Song',
    category: 'marine',
    promptFull: 'A majestic 15-second underwater wildlife sequence in 9:16 vertical format. The deep ocean reveals itself in layers of luminous blue — a humpback whale hangs suspended in the water column, its enormous body filling the vertical frame. The camera approaches slowly from below, capturing the whale\'s barnacled underbelly backlit by faint light from above, creating a cathedral-like glow. The whale begins its song — the camera vibrates subtly with the deep resonance, and sound wave visualizations ripple through the water. Slow motion captures the whale\'s massive pectoral fin sweeping upward in an elegant arc, trailing vortex rings of disturbed water. A perspective shift looks directly upward as the whale surfaces above, silhouetted against the bright ceiling of the ocean, blowhole releasing a column of spray that catches the light. The whale rolls gracefully, one eye briefly meeting the camera before it descends into the blue depths. Documentary style, immersive whale song acoustics, 4K clarity, deep ocean color grading.',
    promptMini: 'Cinematic 15-second vertical wildlife clip: humpback whale singing in deep ocean. Whale suspended in blue water, camera approaches from below showing glowing silhouette. Whale sings — pectoral fin sweeps upward in elegant slow motion. Camera looks up as whale surfaces and sprays. Whale rolls and descends into blue depths. Documentary style, deep ocean atmosphere.',
    hookText: 'A humpback whale hangs in the deep blue, filling the frame — then begins to sing, a primordial sound vibrating through the ocean itself.',
    animalType: 'Whale',
    biome: 'ocean',
  },
  {
    name: 'Cheetah Sprint Chase',
    category: 'predator',
    promptFull: 'An explosive 15-second wildlife documentary sequence in 9:16 vertical format. The African savanna blurs past as a cheetah accelerates to full sprint — 0 to 70 mph captured in breathtaking slow motion. The camera tracks parallel at ground level, capturing the cheetah\'s spine flexing like a coiled spring with each stride, claws gripping the earth in four-point contact, dirt and grass exploding beneath each paw strike. Extreme close-up reveals the biomechanics: muscles rippling beneath spotted fur, tail counterbalancing each sharp turn, eyes locked forward with predatory focus. The background becomes a smear of gold and green at peak speed. A sudden direction change — the cheetah banks hard, inside paws digging in, body nearly horizontal. The sequence concludes with the cheetah pulling up, chest heaving, tongue lolling, spots still in the tall grass — the chase is over, but the raw speed lives forever in this frame. Documentary style, dynamic camera, 4K clarity, high-frame-rate capture feel.',
    promptMini: 'Cinematic 15-second vertical wildlife clip: cheetah at full sprint across savanna. Ground-level tracking shot captures explosive acceleration in slow motion. Spine flexes, claws grip dirt, grass explodes under paw strikes. Close-up of focused eyes and rippling muscles. Cheetah banks hard in a sharp turn. Pulls up, breathing hard. Documentary style, high-speed action.',
    hookText: 'A cheetah explodes from zero to full sprint in a single heartbeat — the fastest land animal on Earth, caught in jaw-dropping slow motion.',
    animalType: 'Cheetah',
    biome: 'savanna',
  },
]

async function seed() {
  console.log('Seeding prompt templates...')

  // Check if templates already exist
  const existing = await db.promptTemplate.count()
  if (existing > 0) {
    console.log(`Templates already exist (${existing} found). Skipping seed.`)
    return
  }

  for (const template of TEMPLATES) {
    await db.promptTemplate.create({ data: template })
    console.log(`  Created: ${template.name}`)
  }

  // Create default budget
  const budgetExists = await db.budgetSetting.count()
  if (budgetExists === 0) {
    await db.budgetSetting.create({
      data: {
        monthlyLimit: 100,
        spentThisMonth: 0,
        currency: 'USD',
        alertThreshold: 0.8,
      },
    })
    console.log('  Created default budget setting')
  }

  console.log('Seeding complete!')
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
