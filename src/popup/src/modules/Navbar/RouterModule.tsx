import React from "react";
import RouterView from "./RouterView";
import { RouterProvider } from "./RouterContext";

const RouterModule = () => {
  return (
    <RouterProvider>
      <RouterView></RouterView>
    </RouterProvider>
  );
};

export default RouterModule;
