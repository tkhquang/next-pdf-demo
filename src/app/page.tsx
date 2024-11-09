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
      <a
        className="print:hidden"
        href={`${process.env.NEXT_PUBLIC_BASE_URL}/api/report?id=Example`}
        download="document.pdf"
      >
        Download PDF
      </a>
      <CoverPage />
      <ChartPage id={id} />
    </main>
  );
}
