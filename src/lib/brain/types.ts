export type NodeStatus = "available" | "claimed" | "active" | "memory" | "featured";

// Public, API-shaped view of a claimable brain cell. `id` matches Cell.claimId
// from generate.ts (1..128).
export interface BrainNode {
  id: number;
  status: NodeStatus;
  label?: string;
  ownerName?: string;
  lastActiveAt?: number; // ms; drives how brightly a cell still glows
  skin?: string | null; // cosmetic style chosen by the owner (see lib/skins.ts)
}

export interface PulseEvent {
  nodeId: number;
  // output: a voice was answered · thought: the mind thought about something · claim: a cell was taken
  type: "output" | "thought" | "claim";
  // cells whose words the pulse travels to (thought sources); picked automatically when omitted
  links?: number[];
}
