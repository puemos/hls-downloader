import React from "react";
import RouterModule from "./modules/Navbar/RouterModule";
import { useTheme } from "@hls-downloader/design-system";

function App() {
  useTheme();
  return (
    <div
      id="hls-downloader-ext"
      className="relative isolate h-[600px] w-[500px] overflow-hidden bg-background font-sans antialiased"
    >
      <RouterModule></RouterModule>
    </div>
  );
}
export default App;
