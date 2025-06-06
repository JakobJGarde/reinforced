import useRLSettings from "../stores/useRLSettings";
import useRLStats from "../stores/useRLStats"; // <--- Import the new RL Stats store
import { type PlayerAction } from "../Experience/RLAgent"; // Import PlayerAction for display

export default function RLDebugger() {
  const { isRLEnabled } = useRLSettings();
  const {
    episodeCount,
    totalReward,
    epsilon,
    qTableSize,
    currentDiscreteStateKey,
    currentQValues,
    eventLog, // <--- Get eventLog from store
  } = useRLStats();

  const actions: PlayerAction[] = ["forward", "backward", "jump", "none"];

  if (!isRLEnabled) {
    return null;
  }

  const formatQValue = (q: number) => q.toFixed(3);

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontFamily: "monospace",
        fontSize: "12px",
        zIndex: 1000,
        maxWidth: "300px",
        overflow: "auto",
        pointerEvents: "auto",
      }}
    >
      <h3>RL Debug Info</h3>
      <p>
        <strong>Episode:</strong> {episodeCount}
      </p>
      <p>
        <strong>Total Reward:</strong> {totalReward.toFixed(2)}
      </p>{" "}
      {/* This should update now */}
      <p>
        <strong>Epsilon (Exploration):</strong> {epsilon.toFixed(4)}
      </p>
      <p>
        <strong>Q-Table Size (States):</strong> {qTableSize}
      </p>
      {currentDiscreteStateKey && (
        <div>
          <h4>Current State Q-Values:</h4>
          <p>State Key: {currentDiscreteStateKey}</p>
          {currentQValues ? (
            <ul>
              {actions.map((action, index) => (
                <li key={action}>
                  {action}: {formatQValue(currentQValues[index])}
                </li>
              ))}
            </ul>
          ) : (
            <p>Not yet in Q-table</p>
          )}
        </div>
      )}
      {/* --- NEW: Event Log Display --- */}
      {eventLog.length > 0 && (
        <div>
          <h4>Recent Events:</h4>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {eventLog.map((logEntry, idx) => (
              <li
                key={idx}
                style={{
                  borderBottom: "1px solid #333",
                  paddingBottom: "3px",
                  marginBottom: "3px",
                }}
              >
                {logEntry}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
