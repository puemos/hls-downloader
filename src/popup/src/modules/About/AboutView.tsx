import { ArrowUpRight, Bug, Code2, Lock, Scroll } from "lucide-react";
import React from "react";

interface Props {
  version: string;
  name: string;
  description: string;
}

const AboutView = ({ version, name }: Props) => {
  const open = (url: string) => {
    const browserTabs = (globalThis as any)?.browser?.tabs;
    const chromeTabs = (globalThis as any)?.chrome?.tabs;
    if (browserTabs?.create) {
      browserTabs.create({ url });
      return;
    }
    if (chromeTabs?.create) {
      chromeTabs.create({ url });
      return;
    }
    window?.open?.(url, "_blank");
  };
  return (
    <div className="app-scrollbar flex h-full flex-col overflow-y-auto px-4 pb-4 pt-4">
      <div className="mb-3 px-1">
        <h2 className="text-[18px] font-extrabold leading-tight tracking-[-0.035em]">
          About
        </h2>
      </div>

      <div className="flex items-center gap-3 px-1 py-2">
        <img
          src="/assets/icons/128.png"
          alt=""
          className="h-12 w-12 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-[16px] font-bold tracking-[-0.015em]">
              {name}
            </p>
            <span className="shrink-0 text-[9px] font-medium text-muted-foreground">
              v{version}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <AboutLink
          icon={Code2}
          label="Source code"
          detail="View on GitHub"
          onClick={() => open("https://github.com/puemos/hls-downloader")}
        />
        <AboutLink
          icon={Bug}
          label="Report an issue"
          detail="Help us improve"
          onClick={() =>
            open("https://github.com/puemos/hls-downloader/issues")
          }
        />
        <AboutLink
          icon={Lock}
          label="Privacy policy"
          detail="How data is handled"
          onClick={() =>
            open(
              "https://github.com/puemos/hls-downloader/blob/master/PRIVACY.md",
            )
          }
        />
        <AboutLink
          icon={Scroll}
          label="MIT license"
          detail="Free and open"
          onClick={() =>
            open("https://github.com/puemos/hls-downloader/blob/master/LICENSE")
          }
        />
      </div>

      <p className="mt-auto px-2 pb-1 pt-6 text-center text-[10px] font-medium text-muted-foreground">
        Made with ❤️ by Shy Alter and open-source contributors
      </p>
    </div>
  );
};

export default AboutView;

const AboutLink = ({
  icon: Icon,
  label,
  detail,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex min-h-[72px] items-center gap-2.5 rounded-[11px] border border-border bg-card px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-150 ease-snappy hover:border-foreground/20 hover:bg-muted/50 active:scale-[0.98]"
  >
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-secondary text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
      <Icon className="h-3.5 w-3.5" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-[11px] font-bold">{label}</div>
      <div className="mt-1 truncate text-[9px] font-medium text-muted-foreground">
        {detail}
      </div>
    </div>
    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-[color,transform] duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
  </button>
);
