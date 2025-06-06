export type PlayerAction = "forward" | "backward" | "jump" | "none";

export interface PlayerObservation {
  player_x: number;
  player_y: number;
  vel_x: number;
  vel_y: number;
  vel_z: number;
  distance_to_end: number;
}

interface Rewards {
  goal: number;
  fall: number;
  obstacleHit: number;
  wallHit: number;
  perTick: number;
}

// Discretization constants (adjust based on your game's scale)
const MAX_LEVEL_LENGTH_FOR_BINNING = 4 * 10 + 2; // Assuming max blocksCount is around 10
const Z_BINS = 20; // More bins for Z to capture progress better
const Y_BINS = 5; // Bins for player's height (e.g., in air, on ground, fallen)
const X_BINS = 5; // Bins for player's X position (left/right on path)
const VEL_Z_BINS = 5; // Bins for forward velocity

const discretize = (
  value: number,
  min: number,
  max: number,
  numBins: number,
): number => {
  if (numBins <= 0) return 0; // Avoid division by zero
  if (value < min) return 0;
  if (value > max) return numBins - 1;
  return Math.floor(((value - min) / (max - min)) * numBins);
};

export type AgentStateKey = string; // For simplicity, we use a string representation of the state

class RLAgent {
  qTable: Map<AgentStateKey, number[]>;
  learningRate: number;
  discountFactor: number;
  epsilon: number;
  epsilonDecay: number;
  minEpsilon: number;
  rewards: Rewards; // Store reward values

  actions: PlayerAction[];

  constructor() {
    this.qTable = new Map();
    this.learningRate = 0.1;
    this.discountFactor = 0.95;
    this.epsilon = 1.0;
    this.epsilonDecay = 0.0001;
    this.minEpsilon = 0.01;
    this.rewards = {
      // Default values, will be overwritten by useRLSettings
      goal: 100,
      fall: -50,
      obstacleHit: -10,
      wallHit: -5,
      perTick: -0.01,
    };

    this.actions = ["forward", "backward", "jump", "none"];
  }

  // Convert an observation into a discrete state string
  getDiscreteState(observation: PlayerObservation): string {
    const zState = discretize(
      observation.distance_to_end,
      0,
      MAX_LEVEL_LENGTH_FOR_BINNING,
      Z_BINS,
    );
    const yState = discretize(observation.player_y, -5, 5, Y_BINS); // Assuming player Y range
    const xState = discretize(observation.player_x, -2, 2, X_BINS); // Assuming player X range
    const velZState = discretize(observation.vel_z, -1, 1, VEL_Z_BINS); // Assuming velocity range

    return `${zState}_${yState}_${xState}_${velZState}`; // State string
  }

  public getAgentStateKey(rawDiscreteState: string): AgentStateKey {
    // In a more complex scenario, you might hash the string here,
    // or validate it. For now, it's a simple pass-through.
    return rawDiscreteState;
  }

  getQValues(state: string): number[] {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, new Array(this.actions.length).fill(0));
    }
    return this.qTable.get(state)!;
  }

  chooseAction(observation: PlayerObservation): PlayerAction {
    const state = this.getDiscreteState(observation);
    const qValues = this.getQValues(state);

    if (Math.random() < this.epsilon) {
      const randomIndex = Math.floor(Math.random() * this.actions.length);
      return this.actions[randomIndex];
    } else {
      const maxQ = Math.max(...qValues);
      // const bestActionIndex = qValues.indexOf(maxQ);
      // Handle ties randomly to encourage exploring equivalent best actions
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
  ) {
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
      newQ = reward + this.discountFactor * maxNextQ;
    }

    qValues[actionIndex] = oldQ + this.learningRate * (newQ - oldQ);
    this.qTable.set(state, qValues);

    // Decay epsilon after each learning step
    this.epsilon = Math.max(this.minEpsilon, this.epsilon - this.epsilonDecay);
  }

  reset() {
    // Reset agent's internal state for a new episode
    // Typically, epsilon might not reset here, but continue decaying across episodes
    // If you want epsilon to reset for each new *training run*, manage that in Experience.tsx
  }

  public getEpsilon(): number {
    return this.epsilon;
  }

  public getQTableSize(): number {
    return this.qTable.size;
  }

  public getQValuesForState(stateKey: string): number[] | undefined {
    return this.qTable.get(stateKey);
  }

  public getQTableSnapshot(
    maxEntries: number = 10,
  ): Array<{ state: string; qValues: number[] }> {
    const snapshot: Array<{ state: string; qValues: number[] }> = [];
    let count = 0;
    for (const [stateKey, qValues] of this.qTable.entries()) {
      if (count >= maxEntries) break;
      snapshot.push({ state: stateKey, qValues: [...qValues] }); // Spread to return a copy
      count++;
    }
    return snapshot;
  }

  public getCurrentDiscreteStateKey(
    rawObservation: PlayerObservation,
  ): AgentStateKey {
    const discreteState = this.getDiscreteState(rawObservation);
    return this.getAgentStateKey(discreteState);
  }
}

export default RLAgent;
