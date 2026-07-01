import { MarkerType, type XYPosition } from "@xyflow/react";
import type {
  DataType,
  HistoryEntry,
  NodeKind,
  Preset,
  PromptState,
  WstvNode,
  WstvEdge,
} from "./types";

export const DATA_COLOR: Record<DataType, string> = {
  prompt: "#7c5cff",
  image: "#22d3ee",
  panels: "#f5b13d",
  video: "#ff5c8a",
  frame: "#34d399",
  video4k: "#60a5fa",
};

interface CatalogEntry {
  title: string;
  type: string;
  color: string;
  icon: string;
  settings: string;
  preview: WstvNode["data"]["preview"];
  previewLabel: string;
  summary: string;
  inputs: { id: string; label: string; dataType: DataType }[];
  outputs: { id: string; label: string; dataType: DataType }[];
}

export const NODE_CATALOG: Record<NodeKind, CatalogEntry> = {
  masterPrompt: {
    title: "Master Prompt",
    type: "Prompt",
    color: "#7c5cff",
    icon: "✎",
    settings: "cinematic · lioness · documentary tone",
    preview: "master",
    previewLabel: "Prompt",
    summary:
      "Defines the master wildlife prompt, scene intent, and safety constraints. Feeds every downstream stage.",
    inputs: [],
    outputs: [{ id: "prompt", label: "Prompt", dataType: "prompt" }],
  },
  masterImage: {
    title: "GPT Image 2 Master Image",
    type: "Image Gen",
    color: "#22d3ee",
    icon: "⊷",
    settings: "16:9 · photoreal · seed locked · 1 hero frame",
    preview: "image",
    previewLabel: "Hero Frame",
    summary:
      "Generates the hero frame / master image that anchors the scene (mock render only).",
    inputs: [{ id: "prompt", label: "Prompt", dataType: "prompt" }],
    outputs: [{ id: "image", label: "Master Image", dataType: "image" }],
  },
  storyboard: {
    title: "9-Panel Storyboard",
    type: "Storyboard",
    color: "#f5b13d",
    icon: "▦",
    settings: "9 beats · motion arcs · camera continuity",
    preview: "story",
    previewLabel: "9 Panels",
    summary:
      "Splits the master image into a 9-beat storyboard with motion arcs and shot continuity.",
    inputs: [{ id: "image", label: "Master Image", dataType: "image" }],
    outputs: [{ id: "panels", label: "9 Panels", dataType: "panels" }],
  },
  seedanceVideo: {
    title: "Seedance Video Placeholder",
    type: "Video Gen",
    color: "#ff5c8a",
    icon: "▶",
    settings: "5s clip · 24fps · motion 0.6 · loop off",
    preview: "video",
    previewLabel: "Clip 01",
    summary:
      "Placeholder video generator. In demo mode it returns a synthetic clip — no real model is called.",
    inputs: [
      { id: "panels", label: "9 Panels", dataType: "panels" },
      { id: "master", label: "Master Image", dataType: "image" },
    ],
    outputs: [{ id: "video", label: "Video Clip", dataType: "video" }],
  },
  extractFrame: {
    title: "Extract Frame",
    type: "Utility",
    color: "#34d399",
    icon: "◈",
    settings: "tail frame · for continuation",
    preview: "frame",
    previewLabel: "Tail Frame",
    summary:
      "Pulls the final frame of a clip so the next shot can continue motion seamlessly.",
    inputs: [{ id: "video", label: "Video Clip", dataType: "video" }],
    outputs: [{ id: "frame", label: "Tail Frame", dataType: "frame" }],
  },
  continueVideo: {
    title: "Continue Video",
    type: "Video Gen",
    color: "#fb923c",
    icon: "↦",
    settings: "5s extension · match palette · keep motion",
    preview: "continue",
    previewLabel: "Clip 02",
    summary:
      "Extends the sequence from the tail frame with matched palette and motion.",
    inputs: [{ id: "frame", label: "Tail Frame", dataType: "frame" }],
    outputs: [{ id: "video", label: "Video Clip", dataType: "video" }],
  },
  upscale: {
    title: "Upscale",
    type: "Enhance",
    color: "#60a5fa",
    icon: "⤢",
    settings: "target 4K · temporal stabilise · denoise",
    preview: "upscale",
    previewLabel: "4K Master",
    summary:
      "Upscales the assembled sequence to 4K with temporal stabilisation and denoise.",
    inputs: [{ id: "video", label: "Video Clip", dataType: "video" }],
    outputs: [{ id: "video4k", label: "4K Video", dataType: "video4k" }],
  },
  export: {
    title: "Export / History",
    type: "Output",
    color: "#94a3b8",
    icon: "⚙",
    settings: "MP4 H.264 · ProRes archive · versioned",
    preview: "export",
    previewLabel: "Archive",
    summary:
      "Finalises the deliverable and logs a versioned entry to history (local demo log only).",
    inputs: [{ id: "video", label: "4K Video", dataType: "video4k" }],
    outputs: [],
  },
};

export const KIND_ORDER: NodeKind[] = [
  "masterPrompt",
  "masterImage",
  "storyboard",
  "seedanceVideo",
  "extractFrame",
  "continueVideo",
  "upscale",
  "export",
];

const INITIAL_POSITIONS: Record<NodeKind, XYPosition> = {
  masterPrompt: { x: 0, y: 0 },
  masterImage: { x: 290, y: 0 },
  storyboard: { x: 580, y: 0 },
  seedanceVideo: { x: 870, y: 0 },
  extractFrame: { x: 0, y: 270 },
  continueVideo: { x: 290, y: 270 },
  upscale: { x: 580, y: 270 },
  export: { x: 870, y: 270 },
};

const NODE_ID: Record<NodeKind, string> = {
  masterPrompt: "master-prompt",
  masterImage: "master-image",
  storyboard: "storyboard",
  seedanceVideo: "seedance-video",
  extractFrame: "extract-frame",
  continueVideo: "continue-video",
  upscale: "upscale",
  export: "export",
};

function withColors(ports: { id: string; label: string; dataType: DataType }[]) {
  return ports.map((p) => ({ ...p, color: DATA_COLOR[p.dataType] }));
}

export function createNode(kind: NodeKind, id: string, position: XYPosition): WstvNode {
  const c = NODE_CATALOG[kind];
  return {
    id,
    type: "wstvNode",
    position,
    data: {
      kind,
      title: c.title,
      type: c.type,
      color: c.color,
      icon: c.icon,
      settings: c.settings,
      preview: c.preview,
      previewLabel: c.previewLabel,
      summary: c.summary,
      inputs: withColors(c.inputs),
      outputs: withColors(c.outputs),
      status: "ready",
    },
  };
}

export const INITIAL_NODES: WstvNode[] = KIND_ORDER.map((kind) =>
  createNode(kind, NODE_ID[kind], INITIAL_POSITIONS[kind])
);

interface RawEdge {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  dataType: DataType;
}

const RAW_EDGES: RawEdge[] = [
  { source: "master-prompt", sourceHandle: "prompt", target: "master-image", targetHandle: "prompt", dataType: "prompt" },
  { source: "master-image", sourceHandle: "image", target: "storyboard", targetHandle: "image", dataType: "image" },
  { source: "master-image", sourceHandle: "image", target: "seedance-video", targetHandle: "master", dataType: "image" },
  { source: "storyboard", sourceHandle: "panels", target: "seedance-video", targetHandle: "panels", dataType: "panels" },
  { source: "seedance-video", sourceHandle: "video", target: "extract-frame", targetHandle: "video", dataType: "video" },
  { source: "extract-frame", sourceHandle: "frame", target: "continue-video", targetHandle: "frame", dataType: "frame" },
  { source: "continue-video", sourceHandle: "video", target: "upscale", targetHandle: "video", dataType: "video" },
  { source: "upscale", sourceHandle: "video4k", target: "export", targetHandle: "video", dataType: "video4k" },
];

export const INITIAL_EDGES: WstvEdge[] = RAW_EDGES.map((e, i) => ({
  id: `e-${i}-${e.source}-${e.sourceHandle}-${e.target}-${e.targetHandle}`,
  source: e.source,
  sourceHandle: e.sourceHandle,
  target: e.target,
  targetHandle: e.targetHandle,
  type: "wstvEdge",
  data: { color: DATA_COLOR[e.dataType] },
  markerEnd: { type: MarkerType.ArrowClosed, color: DATA_COLOR[e.dataType] },
}));

export const DEFAULT_PROMPT: PromptState = {
  subject: "lioness resting on a rock at golden hour",
  environment: "savannah, soft golden grass, shallow depth of field",
  camera: "slow dolly-in, locked-off hero",
  lighting: "warm golden backlight",
  realism: "photoreal BBC documentary",
  safety: "realistic animals, full-body readable, grounded contact",
};

export const PRESETS: Preset[] = [
  {
    id: "cinematic-doc",
    name: "Cinematic wildlife documentary",
    icon: "🦁",
    prompt: {
      subject: "lioness resting on a rock at golden hour",
      environment: "savannah, soft golden grass, shallow depth of field",
      camera: "slow dolly-in, locked-off hero",
      lighting: "warm golden backlight",
      realism: "photoreal BBC documentary",
      safety: "realistic animals, full-body readable, grounded contact",
    },
  },
  {
    id: "predator-no-gore",
    name: "Predator encounter without gore",
    icon: "🐆",
    prompt: {
      subject: "leopard stalking through tall grass",
      environment: "dry bushland, dust in the air",
      camera: "low tracking shot",
      lighting: "harsh midday sun",
      realism: "tense but non-graphic",
      safety: "no blood, no gore, no visible wounds, predator aware not attacking",
    },
  },
  {
    id: "rescue",
    name: "Animal rescue style",
    icon: "🦌",
    prompt: {
      subject: "rescued deer standing in a soft morning field",
      environment: "misty meadow, dew",
      camera: "gentle handheld",
      lighting: "soft diffused dawn",
      realism: "hopeful emotional realism",
      safety: "full-body readable, grounded contact, calm posture",
    },
  },
  {
    id: "savannah-chase",
    name: "Savannah chase scene",
    icon: "🐎",
    prompt: {
      subject: "wild horses galloping across the plain",
      environment: "wide savannah, dust kicked up",
      camera: "fast parallel tracking",
      lighting: "low sun, long shadows",
      realism: "dynamic cinematic",
      safety: "no contact injuries, readable motion, no blood",
    },
  },
  {
    id: "jungle-macro",
    name: "Jungle macro shot",
    icon: "🐸",
    prompt: {
      subject: "tree frog on a wet leaf",
      environment: "dense jungle, droplets, bokeh",
      camera: "extreme macro, locked",
      lighting: "dappled green light",
      realism: "hyper-detailed macro",
      safety: "no text inside video preview, no watermark",
    },
  },
];

export const SAFETY_CHIPS = [
  "realistic animals",
  "full-body readable",
  "grounded contact",
  "no blood",
  "no gore",
  "no visible wounds",
  "no watermark",
  "no text inside video preview",
];

export function historyLabelFor(kind: NodeKind): string {
  switch (kind) {
    case "masterPrompt": return "Master prompt compiled (mock)";
    case "masterImage": return "Hero frame render (mock)";
    case "storyboard": return "9-panel storyboard (mock)";
    case "seedanceVideo": return "Clip 01 — 5s video (mock)";
    case "extractFrame": return "Tail frame extract (mock)";
    case "continueVideo": return "Clip 02 — 5s extension (mock)";
    case "upscale": return "4K upscaled master (mock)";
    case "export": return "Final 4K MP4 export (mock)";
  }
}

export function makeHistoryEntry(node: WstvNode): HistoryEntry {
  const stamp = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(stamp.getHours())}:${pad(stamp.getMinutes())}:${pad(stamp.getSeconds())}`;
  return {
    id: `${node.id}-${stamp.getTime()}`,
    nodeId: node.id,
    nodeTitle: node.data.title,
    label: historyLabelFor(node.data.kind),
    time,
  };
}
