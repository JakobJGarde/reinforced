import useRLStats from "../stores/useRLStats";
import { rlDataExporter } from "../utils/rlDataExporter";

export default function EventLogger() {
  const { episodeCount, totalReward, eventLog } = useRLStats();

  const handleDownloadJSON = () => {
    rlDataExporter.exportToJSON();
  };

  const handleDownloadCSV = () => {
    rlDataExporter.exportToCSV();
  };

  return (
    <div className="flex h-fit flex-col divide-y-2 divide-gray-200/30 overflow-hidden rounded-lg border-2 border-gray-200/30 bg-gray-700/30 backdrop-blur-md">
      <div className="grid w-full grid-cols-2 gap-2 divide-x-2 divide-gray-200/30 bg-gray-600/30 px-2 text-lg font-bold [&>*]:py-1">
        <div>Episode #{episodeCount}</div>
        <div>
          Reward:
          <div className="float-right ml-1 min-w-14">
            {totalReward.toFixed(2)}
          </div>
        </div>
      </div>

      {/* --- Event Log Display --- */}
      <div className="flex justify-between bg-gray-600/30 px-2 py-1 text-sm font-bold">
        <div>Past Events</div>
        <div className="flex gap-2">
          Snapshot:{" "}
          <button className="pointer-events-auto" onClick={handleDownloadJSON}>
            JSON
          </button>
          <button className="pointer-events-auto" onClick={handleDownloadCSV}>
            CSV
          </button>
        </div>
      </div>

      {/* Fixed scrollable container */}
      <div className="h-22 overflow-y-auto">
        {eventLog.length > 0 ? (
          <ul className="pointer-events-auto list-none">
            {eventLog.map((logEntry, idx) => (
              <li
                key={idx}
                className="border-b border-gray-200/30 px-2 py-1 text-sm"
              >
                {logEntry}
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-2 py-4 text-sm italic">
            No events yet. Start training to see episode results!
          </div>
        )}
      </div>
    </div>
  );
}
