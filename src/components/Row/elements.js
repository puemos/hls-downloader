import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";

export const CopyButton = styled.button`
  background-color: transparent;
  border: 0;
  color: ${props => props.theme.colors.gray400};
  line-height: 0;
  font-size: 0.6rem;
  outline: none;
  cursor: pointer;
`;
export const MoreButton = styled.button`
  background-color: transparent;
  border: 0;
  color: ${props => props.theme.colors.gray300};
  outline: none;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);

  &:hover {
    transform: translateX(5px);
  }
`;

export const StyledRow = styled(Row)`
  height: 70px;
  margin: 10px 10px;
  padding: 0px 5px 0px 10px;
  border-bottom: 1px solid ${props => props.theme.colors.gray100};
  color: ${props => props.theme.colors.gray700};
  transition: background-color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  background-color: ${props => props.theme.colors.white};
  border-radius: 6px;
  box-shadow: #d8d3d3 0 0 12px 0px;
`;

export const StyledTitle = styled.span`
  font-size: 0.8rem;
  text-overflow: ellipsis;
  overflow: hidden;
  text-align: left;
  margin-right: 5px;
  user-select: none;
`;

export const StyledDate = styled(Col)`
  margin-top: 6px;
  font-size: 0.7rem;
  color: ${props => props.theme.colors.gray400};
`;

export const DetailsRow = styled(Col)``;
