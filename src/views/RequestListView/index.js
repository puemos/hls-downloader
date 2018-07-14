import React, { Component } from "react";
import { connect } from "react-redux";
import RequestTable from "../../components/RequestTable";
import { requestsByActiveTabSelector } from "../../modules/requests/selectors";

class RequestListView extends Component {
  render() {
    const { requests } = this.props;

    return <RequestTable requests={requests} />;
  }
}

const mapStateToProps = state => {
  return {
    requests: requestsByActiveTabSelector(state)
  };
};

export default connect(mapStateToProps)(RequestListView);
