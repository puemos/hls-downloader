import React, { ReactNode } from "react";

interface Props {
  title: string;
  action?: ReactNode;
}

const ScreenHeader = ({ title, action }: Props) => (
  <div className="flex min-h-8 shrink-0 items-start justify-between gap-3 px-1">
    <div className="min-w-0">
      <h2 className="text-[18px] font-extrabold leading-tight tracking-[-0.035em]">
        {title}
      </h2>
    </div>
    {action}
  </div>
);

export default ScreenHeader;
