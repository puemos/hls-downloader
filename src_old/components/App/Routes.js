import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import AboutView from "../../views/AboutView";
import DownloadsView from "../../views/DownloadsView";
import PlaylistsView from "../../views/PlaylistsView";
import SnifferView from "../../views/SnifferView";

function Routes() {
  return (
    <Switch>
      <Redirect from="/index.html" to="/sniffer" />
      <Route exact path="/sniffer" component={SnifferView} />
      <Route exact path="/request/:id" component={PlaylistsView} />
      <Route exact path="/downloads" component={DownloadsView} />
      <Route exact path="/about" component={AboutView} />
    </Switch>
  );
}
export default Routes;
