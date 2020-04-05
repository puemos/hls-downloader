import { storiesOf } from "@storybook/react";
import React from "react";
import Shell from "../components/App/Shell";
import DownloadRow from "../components/DownloadRow";
import Table from "../components/Table";
import { Body } from "./Body";

storiesOf("DownloadView", module).add("DownloadRow", () => (
  <Shell>
    <Body>
      <Table
        items={[
          {
            title:
              "https://media.video-cdn.espn.com/motion/2019/1226/dm_191226_MLB_KURKJIAN_ON_MLB_FOR_DIGITAL/dm_191226_MLB_KURKJIAN_ON_MLB_FOR_DIGITAL.m3u8",
            finished: 22,
            total: 100,
            created: new Date(2018, 3, 12, 12, 34, 47),
            tab: {
              title: "HTML5 Video Player | JW Player"
            }
          },
          {
            title:
              "https://media.video-cdn.espn.com/motion/2020/0115/dm_200115_MLB_GW_on_Red_Sox/dm_200115_MLB_GW_on_Red_Sox.m3u8",
            finished: 4,
            total: 100,
            created: new Date(2018, 3, 12, 11, 3, 7),
            tab: {
              title: "HTML5 Video Player | JW Player"
            }
          },
          {
            title:
              "https://media.video-cdn.espn.com/motion/2020/0115/ss_20200115_065052043_1444684/ss_20200115_065052043_1444684.m3u8",
            finished: 45,
            total: 100,
            created: new Date(2018, 3, 11, 2, 42, 1),
            tab: {
              title: "HTML5 Video Player | JW Player"
            }
          },
          {
            title:
              "https://media.video-cdn.espn.com/motion/fastclipper/2020/0115/evc_NCB_20200115_sdsu__fres_26e3d514_6f0b_428c_97aa_aac7979a9590_461/evc_NCB_20200115_sdsu__fres_26e3d514_6f0b_428c_97aa_aac7979a9590_461.m3u8",
            finished: 100,
            total: 100,
            created: new Date(2018, 2, 1, 1, 4, 7),
            tab: {
              title: "HTML5 Video Player | JW Player"
            }
          }
        ]}
        renderRow={downloadItem => <DownloadRow download={downloadItem} />}
      />
    </Body>
  </Shell>
));
