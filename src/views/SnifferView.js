import React from "react";
import { useSelector } from "react-redux";
import { Col } from "react-styled-flexboxgrid";
import styled from "styled-components";
import RequestRow from "../components/RequestRow";
import Table from "../components/Table";
import { requestsByActiveTabSelector } from "../modules/requests/selectors";

const Body = styled(Col)`
  max-height: 400px;
  height: 300px;
  width: 100%;
`;

function RequestListView() {
  const requests = useSelector(requestsByActiveTabSelector);

  return (
    <Body>
      <Table
        items={requests}
        renderRow={(requestItem, idx) => (
          <RequestRow key={requestItem.id || idx} request={requestItem} />
        )}
      />
    </Body>
  );
}

export default RequestListView;
