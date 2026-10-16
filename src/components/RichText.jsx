import { Fragment } from "react";

// The translations use only line breaks and emphasis. Render those as React
// elements; participant names are always rendered as escaped text by React.
export function RichText({ children }) {
  return children.split(/(<br>|<em>.*?<\/em>)/g).map((part, index) => {
    if (part === "<br>") return <br key={index} />;
    if (part.startsWith("<em>"))
      return <em key={index}>{part.slice(4, -5)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}
