export type NodeStatus = "available" | "claimed" | "active" | "memory" | "featured";

// Public, API-shaped view of a claimable brain cell. `id` matches Cell.claimId
// from generate.ts (1..128).
export interface BrainNode {
  id: number;
  status: NodeStatus;
  label?: string;
  ownerName?: string;
}

export interface PulseEvent {
  nodeId: number;
  type: "output" | "thought";
}
