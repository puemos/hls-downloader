import { Col, Row } from "react-styled-flexboxgrid";
import styled, { css } from "styled-components";

export const CopyButton = styled.button`
  background-color: ${props => props.theme.colors.gray200};
  border: 0;
  color: ${props => props.theme.colors.gray500};
  line-height: 0;
  border-radius: 4px;
  font-size: 0.7rem;
  outline: none;
  cursor: pointer;
  &:hover {
    background-color: ${props => props.theme.colors.gray300};
  }
  &:active {
    background-color: ${props => props.theme.colors.gray400};
  }
`;
export const RemoveButton = styled.button`
  position: absolute;
  visibility: hidden;
  opacity: 0;
  top: 5px;
  right: 5px;
  background-color: transparent;
  border: 0;
  color: #ffaeb0;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  outline: none;
  cursor: pointer;
  &:hover {
    color: #ff5a5f;
  }
`;
export const MoreButton = styled.button`
  background-color: transparent;
  border: 0;
  color: ${props => props.theme.colors.gray300};
  outline: none;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
`;

export const StyledRow = styled(Row)`
  ${props =>
    !props.disable &&
    css`
      cursor: pointer;
    `}
  position: relative;
  height: 80px;
  margin: 10px 10px;
  padding: 0px 5px 0px 10px;
  border-bottom: 1px solid ${props => props.theme.colors.gray100};
  color: ${props => props.theme.colors.gray700};
  transition: background-color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  background-color: ${props => props.theme.colors.white};
  border-radius: 6px;
  box-shadow: #d8d3d3 0 0 12px 0px;

  &:hover {
    background-color: ${props => props.theme.colors.gray100};
    ${RemoveButton} {
      visibility: visible;
      opacity: 1;
    }
    ${MoreButton} {
      transform: translateX(5px);
    }
  }
`;

export const StyledTitle = styled.span`
  color: ${props => props.theme.colors.gray500};
  font-size: 0.7rem;
  text-overflow: ellipsis;
  font-weight: 800;
  overflow: hidden;
  text-align: left;
  margin-right: 5px;
  user-select: none;
`;

export const StyledSubTitle = styled.span`
  font-size: 0.8rem;
  text-overflow: ellipsis;
  overflow: hidden;
  text-align: left;
  margin-top: 2px;
  margin-right: 5px;
  user-select: none;
  max-width: 300px;

`;

export const StyledDate = styled(Col)`
  margin-top: 6px;
  font-size: 0.7rem;
  color: ${props => props.theme.colors.gray400};
`;

export const DetailsRow = styled(Col)`
  max-width: 350px;

`;
