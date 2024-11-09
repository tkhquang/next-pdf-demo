import Image from "next/image";
import Page from "@/components/common/Page";

const CoverPage = () => {
  return (
    <Page noBreakInside>
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
          <h1 className="text-4xl">Cover</h1>
          <span className="text-3xl mt-auto text-center mb-4"> Test PDF</span>
        </div>
      </div>
    </Page>
  );
};

export default CoverPage;
