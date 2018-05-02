import { routerMiddleware } from 'react-router-redux';
import { memoryHistory } from "./history";

export const middleware = routerMiddleware(memoryHistory);
