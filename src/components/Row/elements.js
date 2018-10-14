import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";

export const CopyButton = styled.button`
  background-color: transparent;
  border: 0;
  color: ${props => props.theme.colors.gray50};
  background-color: ${props => props.theme.colors.gray300};
  border-radius: 10px;
  line-height: 0;
  font-size: 0.6rem;
  transition: color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  outline: none;
  cursor: pointer;
  &:hover {
    background-color: ${props => props.theme.colors.gray400};
  }
`;

export const StyledRow = styled(Row)`
  height: 60px;
  padding: 0 10px;
  border-bottom: 1px solid ${props => props.theme.colors.gray100};
  color: ${props => props.theme.colors.gray700};
  transition: background-color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);

  &:hover {
    background-color: ${props => props.theme.colors.gray50};
  }
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
  font-size: 0.6rem;
  color: ${props => props.theme.colors.gray400};
`;

export const DetailsRow = styled(Col)`
  flex-grow: 1;
`;
