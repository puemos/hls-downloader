import React from "react";
import AboutView from "./AboutView";
import useAboutController from "./AboutController";

const AboutModule = () => {
  const { version, name, description } = useAboutController();

  return (
    <AboutView
      version={version}
      name={name}
      description={description}
    ></AboutView>
  );
};

export default AboutModule;
