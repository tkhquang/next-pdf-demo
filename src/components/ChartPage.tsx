import dynamic from "next/dynamic";

const SegmentedAreaChart = dynamic(
  () => import("@/components/SegmentedAreaChart"),
  {
    ssr: false,
  }
);

interface ChartPageProps {
  id: string | null | undefined;
}

function ChartPage({ id = null }: ChartPageProps) {
  return (
    <div className="flex flex-col size-full space-y-4">
      {id && <h1 className="text-4xl">{id}</h1>}
      <SegmentedAreaChart />
    </div>
  );
}

export default ChartPage;
