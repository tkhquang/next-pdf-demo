import ChartPage from "@/components/ChartPage";
import CoverPage from "@/components/CoverPage";

interface PageProps<T = Record<string, unknown>> {
  params: T;
  searchParams: Record<string, string | undefined>;
}

export default async function Home(props: PageProps) {
  const { searchParams } = props;
  const id = searchParams?.id;

  return (
    <main>
      <CoverPage />
      <ChartPage id={id} />
    </main>
  );
}
