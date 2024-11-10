import Link from "next/link";
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
      <Link href="/other-page" className="print:hidden" prefetch id="go-next">
        Next Page
      </Link>
      <CoverPage />
      <ChartPage id={id} />
    </main>
  );
}
