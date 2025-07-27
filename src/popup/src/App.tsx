import React from "react";
import RouterModule from "./modules/Navbar/RouterModule";
import { useTheme } from "@hls-downloader/design-system";

function App() {
  useTheme();
  return (
    <div
      id="hls-downloader-ext"
      className="w-[500px] h-[600px] transition-all p-4 font-sans antialiased rounded-xl shadow-lg bg-background"
    >
      <RouterModule></RouterModule>
    </div>
  );
}
export default App;
