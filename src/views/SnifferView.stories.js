import { storiesOf } from "@storybook/react";
import React from "react";
import Shell from "../components/App/Shell";
import RequestRow from "../components/RequestRow";
import Table from "../components/Table";
import { Body } from "./Body";

storiesOf("SnifferView", module).add("RequestRow", () => (
  <Shell>
    <Body>
      <Table
        items={[
          {
            url:
              "https://media.video-cdn.espn.com/motion/2019/1226/dm_191226_MLB_KURKJIAN_ON_MLB_FOR_DIGITAL/dm_191226_MLB_KURKJIAN_ON_MLB_FOR_DIGITAL.m3u8",
            timeStamp: new Date(2018, 3, 12, 12, 34, 47)
          },
         
          {
            url:
              "https://media.video-cdn.espn.com/motion/2020/0115/dm_200115_MLB_GW_on_Red_Sox/dm_200115_MLB_GW_on_Red_Sox.m3u8",
            timeStamp: new Date(2018, 3, 12, 12, 34, 47)
          },
          {
            url:
              "https://media.video-cdn.espn.com/motion/2020/0115/ss_20200115_065052043_1444684/ss_20200115_065052043_1444684.m3u8",
            timeStamp: new Date(2018, 3, 12, 12, 34, 47)
          },
          {
            url:
              "https://media.video-cdn.espn.com/motion/fastclipper/2020/0115/evc_NCB_20200115_sdsu__fres_26e3d514_6f0b_428c_97aa_aac7979a9590_461/evc_NCB_20200115_sdsu__fres_26e3d514_6f0b_428c_97aa_aac7979a9590_461.m3u8",
            timeStamp: new Date(2018, 3, 12, 12, 34, 47)
          },
        ]}
        renderRow={(item, idx) => (
          <RequestRow
            tab={{
              title: "What baseball will look like during the 2020s"
            }}
            request={item}
            key={idx}
          />
        )}
      />
    </Body>
  </Shell>
));
