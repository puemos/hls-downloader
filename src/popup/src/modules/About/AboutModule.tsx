import React from "react";
import AboutView from "./AboutView";
import useAboutController from "./AboutController";

const AboutModule = () => {
  const { version } = useAboutController();

  return <AboutView version={version}></AboutView>;
};

export default AboutModule;
