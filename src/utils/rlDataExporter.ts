export interface EpisodeData {
  episodeNumber: number;
  totalReward: number;
  steps: number;
  outcome: "goal" | "fall" | "timeout";
  finalDistance: number;
  epsilon: number;
  timestamp: number;
}

export interface StepData {
  episodeNumber: number;
  stepNumber: number;
  state: string;
  action: string;
  reward: number;
  observation: {
    player_x: number;
    player_y: number;
    vel_x: number;
    vel_y: number;
    vel_z: number;
    distance_to_end: number;
  };
  qValues: number[];
  epsilon: number;
  timestamp: number;
}

export interface QTableSnapshot {
  state: string;
  qValues: number[];
  actionNames: string[];
  visits: number; // How many times this state was visited
}

export interface TrainingSession {
  sessionId: string;
  startTime: number;
  endTime: number;
  parameters: {
    learningRate: number;
    discountFactor: number;
    initialEpsilon: number;
    rewardGoal: number;
    penaltyFall: number;
    penaltyWallHit: number;
    rewardPerTick: number;
  };
  episodes: EpisodeData[];
  steps: StepData[];
  finalQTable: QTableSnapshot[];
  summary: {
    totalEpisodes: number;
    successfulEpisodes: number;
    averageReward: number;
    averageStepsToGoal: number;
    finalEpsilon: number;
    statesExplored: number;
  };
}

// Define the RLAgent interface for proper typing
export interface RLAgentInterface {
  getQTableSize(): number;
  getQTableSnapshot(
    maxEntries: number,
  ): Array<{ state: string; qValues: number[]; actionNames: string[] }>;
}

class RLDataExporter {
  private currentSession: TrainingSession | null = null;
  private isRecording = false;

  startRecording(parameters: TrainingSession["parameters"]): void {
    // Don't start a new session if already recording
    if (this.isRecording) return;

    this.currentSession = {
      sessionId: `rl_session_${Date.now()}`,
      startTime: Date.now(),
      endTime: 0,
      parameters,
      episodes: [],
      steps: [],
      finalQTable: [],
      summary: {
        totalEpisodes: 0,
        successfulEpisodes: 0,
        averageReward: 0,
        averageStepsToGoal: 0,
        finalEpsilon: 0,
        statesExplored: 0,
      },
    };
    this.isRecording = true;
    console.log(
      "📊 Auto-started recording RL training session:",
      this.currentSession.sessionId,
    );
  }

  recordEpisode(episode: EpisodeData): void {
    if (!this.isRecording || !this.currentSession) return;
    this.currentSession.episodes.push(episode);
  }

  recordStep(step: StepData): void {
    if (!this.isRecording || !this.currentSession) return;
    this.currentSession.steps.push(step);
  }

  finishRecording(finalQTable: QTableSnapshot[], finalEpsilon: number): void {
    if (!this.currentSession || !this.isRecording) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.finalQTable = finalQTable;
    this.currentSession.summary.finalEpsilon = finalEpsilon;

    // Calculate summary statistics
    const episodes = this.currentSession.episodes;
    this.currentSession.summary.totalEpisodes = episodes.length;
    this.currentSession.summary.successfulEpisodes = episodes.filter(
      (e) => e.outcome === "goal",
    ).length;
    this.currentSession.summary.averageReward =
      episodes.length > 0
        ? episodes.reduce((sum, e) => sum + e.totalReward, 0) / episodes.length
        : 0;

    const successfulEpisodes = episodes.filter((e) => e.outcome === "goal");
    this.currentSession.summary.averageStepsToGoal =
      successfulEpisodes.length > 0
        ? successfulEpisodes.reduce((sum, e) => sum + e.steps, 0) /
          successfulEpisodes.length
        : 0;

    this.currentSession.summary.statesExplored =
      this.currentSession.finalQTable.length;

    this.isRecording = false;
    console.log("📊 Auto-stopped recording RL training session");
    console.log("📈 Session summary:", this.currentSession.summary);
  }

  exportToJSON(): void {
    if (!this.currentSession) {
      console.warn("No training session to export");
      return;
    }

    // Create a copy for export WITHOUT stopping recording
    const exportSession = {
      ...this.currentSession,
      endTime: Date.now(), // Snapshot current time
      summary: {
        ...this.currentSession.summary,
        totalEpisodes: this.currentSession.episodes.length,
        successfulEpisodes: this.currentSession.episodes.filter(
          (e) => e.outcome === "goal",
        ).length,
        averageReward:
          this.currentSession.episodes.length > 0
            ? this.currentSession.episodes.reduce(
                (sum, e) => sum + e.totalReward,
                0,
              ) / this.currentSession.episodes.length
            : 0,
      },
    };

    const dataStr = JSON.stringify(exportSession, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${this.currentSession.sessionId}_snapshot.json`;
    link.click();

    console.log(
      "📁 Exported training data snapshot as JSON (recording continues)",
    );
  }

  exportToCSV(): void {
    if (!this.currentSession) {
      console.warn("No training session to export");
      return;
    }

    // Create episode data for CSV export
    const episodeHeaders = [
      "Episode",
      "TotalReward",
      "Steps",
      "Outcome",
      "FinalDistance",
      "Epsilon",
      "Timestamp",
    ];

    const episodeRows = this.currentSession.episodes.map((ep) => [
      ep.episodeNumber,
      ep.totalReward.toFixed(2),
      ep.steps,
      ep.outcome,
      ep.finalDistance.toFixed(2),
      ep.epsilon.toFixed(4),
      new Date(ep.timestamp).toISOString(),
    ]);

    const episodeCsv = [
      episodeHeaders.join(","),
      ...episodeRows.map((row) => row.join(",")),
    ].join("\n");

    // For CSV, create a simplified export
    const combinedData = `# RL Training Session: ${this.currentSession.sessionId}
# Parameters: ${JSON.stringify(this.currentSession.parameters)}
# Snapshot taken at: ${new Date().toISOString()}
# Episodes recorded: ${this.currentSession.episodes.length}

=== EPISODES ===
${episodeCsv}

=== NOTE ===
This is a snapshot export. Training continues after download.
Q-table data available in JSON export.`;

    const dataBlob = new Blob([combinedData], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${this.currentSession.sessionId}_snapshot.csv`;
    link.click();

    console.log(
      "📁 Exported training data snapshot as CSV (recording continues)",
    );
  }

  // Export current Q-table without stopping recording
  exportCurrentQTable(
    agent: RLAgentInterface,
    stateVisitCounts: Map<string, number> = new Map(),
  ): void {
    if (!this.currentSession) {
      console.warn("No active training session");
      return;
    }

    const qTableSnapshot: QTableSnapshot[] = [];
    const qTableSize = agent.getQTableSize();

    if (qTableSize === 0) {
      console.warn("Q-table is empty - no learning data to export");
      return;
    }

    // Get current Q-table snapshot
    const snapshot = agent.getQTableSnapshot(1000);
    snapshot.forEach(
      (entry: { state: string; qValues: number[]; actionNames: string[] }) => {
        qTableSnapshot.push({
          ...entry,
          visits: stateVisitCounts.get(entry.state) || 0,
        });
      },
    );

    // Create Q-table CSV
    const qTableHeaders = [
      "State",
      "Action_Forward",
      "Action_Backward",
      "Action_Jump",
      "Action_None",
      "Visits",
    ];
    const qTableRows = qTableSnapshot.map((entry: QTableSnapshot) => [
      entry.state,
      ...entry.qValues.map((q: number) => q.toFixed(4)),
      entry.visits,
    ]);

    const qTableCsv = [
      qTableHeaders.join(","),
      ...qTableRows.map((row) => row.join(",")),
    ].join("\n");

    const qTableData = `# Q-Table Snapshot: ${this.currentSession.sessionId}
# Exported at: ${new Date().toISOString()}
# Total states learned: ${qTableSnapshot.length}
# Episodes completed: ${this.currentSession.episodes.length}

${qTableCsv}`;

    const dataBlob = new Blob([qTableData], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${this.currentSession.sessionId}_qtable_snapshot.csv`;
    link.click();

    console.log("📁 Exported Q-table snapshot (training continues)");
  }

  getCurrentSession(): TrainingSession | null {
    return this.currentSession;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}

// Singleton instance
export const rlDataExporter = new RLDataExporter();

// Helper function to create Q-table snapshot with visit counts
export function createQTableSnapshot(
  agent: RLAgentInterface,
  stateVisitCounts: Map<string, number> = new Map(),
): QTableSnapshot[] {
  console.log("Creating Q-table snapshot...");
  console.log("Q-table size:", agent.getQTableSize());

  if (agent.getQTableSize() === 0) {
    console.warn("Q-table is empty! This suggests no learning occurred.");
    return [];
  }

  const snapshot = agent.getQTableSnapshot(1000); // Get all entries
  console.log("Raw Q-table snapshot:", snapshot.slice(0, 3)); // Log first few entries

  return snapshot.map(
    (entry: { state: string; qValues: number[]; actionNames: string[] }) => ({
      ...entry,
      visits: stateVisitCounts.get(entry.state) || 0,
    }),
  );
}
