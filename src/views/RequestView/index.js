import React, { Component } from "react";
import { connect } from "react-redux";
import { Col } from "react-styled-flexboxgrid";
import styled from "styled-components";
import RequestRow from "../../components/RequestRow";
import Table from "../../components/Table";
import { requestsByActiveTabSelector } from "../../modules/requests/selectors";
import colors from "../../theme/colors";

const Body = styled(Col)`
  background-color: ${props => props.theme.colors.white};
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
          renderRow={requestItem => (
            <RequestRow key={requestItem.id} request={requestItem} />
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
