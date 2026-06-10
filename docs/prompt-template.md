# WSTV Prompt Template Guide

WSTV prompt को goal हो: master image बाट clean, realistic, 15-second vertical wildlife documentary video बनाउनु।

## Prompt structure

Good prompt मा यी parts राख्नुहोस्:

- format: 15-second vertical 9:16
- style: photorealistic cinematic wildlife documentary
- audience: USA Facebook Reels
- subject: animal species, body, markings, face
- habitat: real environment with natural light
- motion: grounded, believable, one clear action per shot
- continuity: master image को animal identity preserve
- safety: no blood, no gore, no visible wounds/injury
- cleanup: no generated text, no watermark

## Positive prompt template

```text
Create a 15-second photorealistic cinematic wildlife documentary video for a USA Facebook Reels audience in vertical 9:16 format.

Use the approved master image as the identity reference. Preserve the same animal species, body shape, markings, face, realistic anatomy, habitat, and light direction.

Show full-body readable animals with grounded motion and natural contact with the environment. Keep movement realistic and documentary-style.

SHOT 1, 0:00-0:03 hook: {strong opening action}
SHOT 2, 0:03-0:07 build: {one clear grounded motion}
SHOT 3, 0:07-0:11 peak: {strongest realistic motion}
SHOT 4, 0:11-0:15 payoff: {clean loop-ready ending}

no blood, no gore, no visible wounds/injury, no generated text, no watermark, no humans unless explicitly needed.
```

## Negative prompt

```text
gore, blood, wounds, cuts, visible injury, dead animal, watermark, text, logo, subtitles, humans, person, hands, cartoon, animation, blurry, distorted anatomy, floating, levitating, extra limbs, multiple heads, low quality, dark, overexposed, underexposed
```

## Master image identity preserve गर्ने तरिका

Prompt मा सधैं यस्तो line राख्नुहोस्:

```text
Preserve the same animal identity, body shape, markings, face, habitat, light direction, realistic anatomy, and grounded contact from the approved master image.
```

Local image path use गर्दा API Explorer ले base64 support गर्छ कि file upload/file_id चाहिन्छ भनेर confirm गर्नुहोस्। यदि schema फरक छ भने `scripts/generate_video.py` को payload builder update गर्नुहोस्।
