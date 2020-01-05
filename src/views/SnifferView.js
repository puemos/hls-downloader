import React from "react";
import { useSelector } from "react-redux";
import RequestRow from "../components/RequestRow";
import Table from "../components/Table";
import { requestsByActiveTabSelector } from "../modules/requests/selectors";
import { Body } from "./Body";

function RequestListView() {
  const requests = useSelector(requestsByActiveTabSelector);

  return (
    <Body>
      <Table
        items={requests}
        emptyMsg="Sorry, i wasn't able to find any HTTP Live Streams"
        renderRow={(requestItem, idx) => (
          <RequestRow key={requestItem.id || idx} request={requestItem} />
        )}
      />
    </Body>
  );
}

export default RequestListView;
