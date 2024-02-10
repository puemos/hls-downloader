import React, { createContext } from "react";
import useRouterController from "./RouterController";
import { Tab, TabOptions } from "./types";

interface RouterContextType {
  tab: Tab;
  setTab: (tab: string) => void;
}

export const RouterContext = createContext<RouterContextType>({
  tab: TabOptions.SNIFTER,
  setTab: () => {},
});

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { tab, setTab } = useRouterController();
  return (
    <RouterContext.Provider value={{ tab, setTab }}>
      {children}
    </RouterContext.Provider>
  );
};
