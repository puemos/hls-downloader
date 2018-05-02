import React from "react";

export const Expand = ({ width = 10, height = 16 }) => (
  <svg width={width} height={height} viewBox="0 0 10 16">
    <g>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M10 8L4 3v3H0v4h4v3l6-5z"
      />
    </g>
  </svg>
);
