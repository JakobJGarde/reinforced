import useGame from "../stores/useGame";
import ControlSettings from "./ControlSettings";
import EventLogger from "./EventLogger";
import Timer from "./Timer";

export default function Overlay() {
  const restart = useGame((state) => state.restart);
  const phase = useGame((state) => state.phase);

  return (
    <div className="pointer-events-none fixed top-0 left-0 h-screen w-full">
      <div className="pointer-events-none absolute top-1/12 left-0 flex w-full justify-center gap-4 text-white/90">
        <Timer />
        <EventLogger />
        <ControlSettings />
      </div>
      {/* Restart */}
      {phase === "ended" && (
        <div
          className="pointer-events-auto absolute top-2/5 left-0 flex w-full cursor-pointer justify-center bg-black/50 py-4 text-6xl text-white"
          onClick={restart}
        >
          Restart
        </div>
      )}
    </div>
  );
}
