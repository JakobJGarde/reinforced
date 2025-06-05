import { Physics } from "@react-three/rapier";

import Lights from "./Lights";
import Level, { BlockAxe, BlockLimbo, BlockSpinner } from "./Level";
import Player from "./Player";
import useGame from "./stores/useGame";

export default function Experience() {
  const blocksCount = useGame((state) => state.blocksCount);
  console.log(blocksCount);

  return (
    <>
      <color args={["#bdedfc"]} attach="background" />
      <Physics debug={false}>
        <Lights />
        <Level
          count={blocksCount}
          obstacles={[BlockSpinner, BlockLimbo, BlockAxe]}
        />
        <Player />
      </Physics>
    </>
  );
}
