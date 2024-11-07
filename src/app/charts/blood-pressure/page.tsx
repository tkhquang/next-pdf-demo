import dynamic from "next/dynamic";

const SegmentedAreaChart = dynamic(
  () => import("@/components/SegmentedAreaChart"),
  {
    ssr: false,
  }
);

const BloodPressurePage = () => {
  return <SegmentedAreaChart />;
};

export default BloodPressurePage;
