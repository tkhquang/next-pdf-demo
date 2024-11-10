import Link from "next/link";
import Image from "next/image";
import Page from "@/components/common/Page";

interface PageProps<T = Record<string, unknown>> {
  params: T;
  searchParams: Record<string, string | undefined>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function OtherPage(props: PageProps) {
  return (
    <main>
      <Link href="/" className="print:hidden">
        First Page
      </Link>
      <Page>
        <div className="flex-1 relative flex flex-col size-full border-2">
          <div className="absolute inset-0">
            <Image
              src="/images/background.jpg"
              fill
              alt=""
              objectFit="cover"
              objectPosition="bottom"
            />
          </div>
          <div className="relative m-4 flex flex-col flex-1">
            <h1 className="text-4xl">Cover of Other Page</h1>
            <span className="text-3xl mt-auto text-center mb-4">
              Test PDF From Other Page
            </span>
          </div>
        </div>
      </Page>
    </main>
  );
}
