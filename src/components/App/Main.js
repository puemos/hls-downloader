import { Grid } from "react-styled-flexboxgrid";
import styled from "styled-components";
export const Main = styled(Grid)`
  min-width: 450px;
  background-color: ${props => props.theme.colors.background};
`;
