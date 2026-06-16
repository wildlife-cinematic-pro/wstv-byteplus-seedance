import type { Resolution } from "./types";

export const CONFIRM_TOKEN = "SUBMIT_ONE_PAID_TASK";
export const TOKEN_PACK_CONFIRM = "ADD_TOKEN_PACK";
export const MANUAL_USAGE_CONFIRM = "ADD_CONSOLE_USAGE";

export const PROMPT_LIMIT = 3500;
export const MAX_REFERENCE_IMAGES = 9;
export const WSTV_HOST = "images.wildstoriestv.com";

export const RESOLUTIONS: Resolution[] = ["720p", "1080p"];

export const PROMPT_PRESETS: { value: string; label: string; text: string }[] = [
  {
    value: "rescue",
    label: "Rescue scene",
    text: "A cinematic WSTV wildlife rescue scene with a vulnerable animal in danger, careful human rescue action, emotional pacing, vertical 9:16 framing, realistic natural light, no gore, hopeful ending.",
  },
  {
    value: "predator",
    label: "Predator-prey near miss",
    text: "A tense but non-graphic predator-prey near miss in wild habitat, fast cinematic camera movement, the prey escapes safely, dramatic natural sound, vertical 9:16 wildlife documentary style.",
  },
  {
    value: "baby",
    label: "Baby animal",
    text: "A baby animal explores its habitat, stumbles gently, receives protection from its parent, warm emotional tone, realistic wildlife behavior, vertical 9:16 cinematic close-ups.",
  },
  {
    value: "herd",
    label: "Herd protection",
    text: "A protective herd surrounds a vulnerable young animal during a tense wildlife moment, dust, movement, dramatic but safe action, vertical 9:16 cinematic documentary realism.",
  },
  {
    value: "helicopter",
    label: "Helicopter rescue",
    text: "A careful helicopter wildlife rescue operation in rugged terrain, professional responders, animal safety prioritized, wind and dust, vertical 9:16 cinematic realism, hopeful ending.",
  },
];

export function isWstvHost(hostname: string): boolean {
  return (
    hostname === WSTV_HOST ||
    hostname === "wildstoriestv.com" ||
    hostname.endsWith(".wildstoriestv.com")
  );
}
