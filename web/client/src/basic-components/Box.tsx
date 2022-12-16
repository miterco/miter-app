import React from "react"
import './Box.less';

interface BoxProps {
	style?: React.CSSProperties;
	children?: any;
	direction?: any;
	className?: string;
}

interface VHBoxProps {
	style?: React.CSSProperties;
	children?: any;
	className?: string;
}

export const Box = (props: BoxProps) => {
	return (
  <div
    style={{
				flexDirection: props.direction || "row",
				...props.style
    }}
    className={`Box ${  props.className}`}
  >
    {props.children}
  </div>
	);
}

// TODO simplify this code
export const HBox = (props: VHBoxProps) => {
	return <Box className={props.className} direction="row" style={props.style} children={props.children} />
}

export const VBox = (props: VHBoxProps) => {
	return <Box className={props.className} direction="column" style={props.style} children={props.children} />
}