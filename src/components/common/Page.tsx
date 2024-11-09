import classNames from "classnames";

const Page = ({
  children,
  noBreakInside = false,
}: React.PropsWithChildren<{
  noBreakInside?: boolean;
}>) => {
  return (
    <>
      <div
        className={classNames("page", {
          "no-break-inside": noBreakInside,
        })}
      >
        {children}
      </div>
      <div className="break-before">
        <hr className="page-break-line" />
      </div>
    </>
  );
};

export default Page;
