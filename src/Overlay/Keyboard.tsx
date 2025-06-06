import { useKeyboardControls } from "@react-three/drei";

export default function Keyboard() {
  const forward = useKeyboardControls((state) => state.forward);
  const right = useKeyboardControls((state) => state.right);
  const backward = useKeyboardControls((state) => state.backward);
  const left = useKeyboardControls((state) => state.left);
  const jump = useKeyboardControls((state) => state.jump);

  return (
    <div className="relative flex items-center gap-4">
      <div className="flex flex-col justify-center">
        <div className="flex justify-center">
          <div
            className={`m-1 aspect-square w-10 rounded-md border-2 border-white bg-violet-300 transition-opacity duration-100 ${forward ? "opacity-100" : "opacity-50"}`}
          />
        </div>
        <div className="flex justify-center">
          <div
            className={`m-1 aspect-square w-10 rounded-md border-2 border-white bg-violet-300 transition-opacity duration-100 ${left ? "opacity-100" : "opacity-50"}`}
          />
          <div
            className={`m-1 aspect-square w-10 rounded-md border-2 border-white bg-violet-300 transition-opacity duration-100 ${backward ? "opacity-100" : "opacity-50"}`}
          />
          <div
            className={`m-1 aspect-square w-10 rounded-md border-2 border-white bg-violet-300 transition-opacity duration-100 ${right ? "opacity-100" : "opacity-50"}`}
          />
        </div>
        <div className="flex justify-center">
          <div
            className={`m-1 h-10 w-34 rounded-md border-2 border-white bg-violet-300 transition-opacity duration-100 ${jump ? "opacity-100" : "opacity-50"}`}
          />
        </div>
      </div>
    </div>
  );
}
