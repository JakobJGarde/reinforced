export type PlayerAction = "forward" | "backward" | "jump" | "none";

export interface PlayerObservation {
  player_x: number;
  player_y: number;
  vel_x: number;
  vel_y: number;
  vel_z: number;
  distance_to_end: number;
}

// Simplified discretization - but with more granular distance tracking
const MAX_DISTANCE = 50; // Adjust based on your level length
const DISTANCE_BINS = 20; // More bins to track gradual progress
const Y_BINS = 3; // Add Y position back - important for learning jumps

const discretize = (
  value: number,
  min: number,
  max: number,
  numBins: number,
): number => {
  if (numBins <= 0) return 0;
  if (value < min) return 0;
  if (value > max) return numBins - 1;
  return Math.floor(((value - min) / (max - min)) * numBins);
};

export type AgentStateKey = string;

// Interface for the RLAgent to ensure proper typing - exported for use in other files
export interface RLAgentInterface {
  getQTableSize(): number;
  getQTableSnapshot(
    maxEntries: number,
  ): Array<{ state: string; qValues: number[]; actionNames: string[] }>;
}

class RLAgent implements RLAgentInterface {
  qTable: Map<AgentStateKey, number[]>;
  actions: PlayerAction[];

  // Hard-coded parameters (not exposed to user)
  private readonly epsilonDecay = 0.99; // Faster decay: 0.99 instead of 0.995
  private readonly minEpsilon = 0.05; // Higher minimum for continued exploration

  constructor() {
    this.qTable = new Map();
    this.actions = ["forward", "backward", "jump", "none"];
  }

  // Include Y position to help with learning when to jump
  getDiscreteState(observation: PlayerObservation): string {
    const distanceState = discretize(
      observation.distance_to_end,
      0,
      MAX_DISTANCE,
      DISTANCE_BINS,
    );

    const yState = discretize(
      observation.player_y,
      -2, // Lower bound for Y
      4, // Upper bound for Y (in air)
      Y_BINS,
    );

    return `${distanceState}_${yState}`;
  }

  getQValues(state: string): number[] {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, new Array(this.actions.length).fill(0));
    }
    return this.qTable.get(state)!;
  }

  chooseAction(observation: PlayerObservation, epsilon: number): PlayerAction {
    const state = this.getDiscreteState(observation);
    const qValues = this.getQValues(state);

    if (Math.random() < epsilon) {
      // Explore: random action
      const randomIndex = Math.floor(Math.random() * this.actions.length);
      return this.actions[randomIndex];
    } else {
      // Exploit: best known action
      const maxQ = Math.max(...qValues);
      const bestActions = qValues
        .map((q, i) => (q === maxQ ? i : -1))
        .filter((i) => i !== -1);
      const chosenIndex =
        bestActions[Math.floor(Math.random() * bestActions.length)];
      return this.actions[chosenIndex];
    }
  }

  learn(
    observation: PlayerObservation,
    action: PlayerAction,
    reward: number,
    nextObservation: PlayerObservation,
    done: boolean,
    learningRate: number,
    discountFactor: number,
  ): void {
    const state = this.getDiscreteState(observation);
    const actionIndex = this.actions.indexOf(action);

    const qValues = this.getQValues(state);
    const oldQ = qValues[actionIndex];

    let newQ = 0;
    if (done) {
      newQ = reward;
    } else {
      const nextState = this.getDiscreteState(nextObservation);
      const nextQValues = this.getQValues(nextState);
      const maxNextQ = Math.max(...nextQValues);
      newQ = reward + discountFactor * maxNextQ;
    }

    // Q-learning update
    qValues[actionIndex] = oldQ + learningRate * (newQ - oldQ);
    this.qTable.set(state, qValues);
  }

  // Utility method to decay epsilon
  decayEpsilon(currentEpsilon: number): number {
    return Math.max(this.minEpsilon, currentEpsilon * this.epsilonDecay);
  }

  public getQTableSize(): number {
    return this.qTable.size;
  }

  public getQValuesForState(stateKey: string): number[] | undefined {
    return this.qTable.get(stateKey);
  }

  public getCurrentDiscreteStateKey(
    rawObservation: PlayerObservation,
  ): AgentStateKey {
    return this.getDiscreteState(rawObservation);
  }

  public getQTableSnapshot(
    maxEntries: number = 10,
  ): Array<{ state: string; qValues: number[]; actionNames: string[] }> {
    const snapshot: Array<{
      state: string;
      qValues: number[];
      actionNames: string[];
    }> = [];
    let count = 0;
    for (const [stateKey, qValues] of this.qTable.entries()) {
      if (count >= maxEntries) break;
      snapshot.push({
        state: stateKey,
        qValues: [...qValues],
        actionNames: [...this.actions],
      });
      count++;
    }
    return snapshot;
  }

  // Reset Q-table for new training session
  public resetQTable(): void {
    this.qTable.clear();
  }
}

export default RLAgent;
