import dynamic from "next/dynamic";

const SegmentedAreaChart = dynamic(
  () => import("@/components/SegmentedAreaChart"),
  {
    ssr: false,
  }
);

interface PageProps<T = Record<string, unknown>> {
  params: T;
  searchParams: Record<string, string | undefined>;
}

const BloodPressurePage = (params: PageProps) => {
  const { searchParams } = params;
  const id = searchParams?.id;

  return <SegmentedAreaChart id={id} />;
};

export default BloodPressurePage;
