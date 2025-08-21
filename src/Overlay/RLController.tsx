export default function RLController() {
  return (
    <div className="bg-gray-300/30">
      <h2 className="px-2 py-1 text-lg font-bold">RL Controller</h2>
      {/* RL Parameters */}
      <div className="flex flex-row divide-y-2 divide-gray-300/30">
        {/* Learning Rate */}
        <div className="flex flex-col px-2 py-1"></div>
        {/* Discount Factor */}
        <div className="flex flex-col px-2 py-1"></div>
        {/* Epsilon */}
        <div className="flex flex-col px-2 py-1"></div>
      </div>

      {/* Reward Values */}
      <div>
        {/* Goal */}
        {/* Fall */}
        {/* Wall */}
        {/* Tick */}
      </div>
    </div>
  );
}
