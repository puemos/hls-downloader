import React, { Component } from "react";
import { connect } from "react-redux";
import { Col } from "react-styled-flexboxgrid";
import styled from "styled-components";
import RequestRow from "../../components/RequestRow";
import Table from "../../components/Table";
import { requestsByActiveTabSelector } from "../../modules/requests/selectors";

const Body = styled(Col)`
  max-height: 400px;
  height: 300px;
  width: 100%;
`;

class RequestListView extends Component {
  render() {
    const { requests } = this.props;

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
}

const mapStateToProps = state => {
  return {
    requests: requestsByActiveTabSelector(state)
  };
};

export default connect(mapStateToProps)(RequestListView);
