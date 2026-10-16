import { Component } from "react";
import { animateLayout, captureLayout, stopLayoutMotion } from "../layout.mjs";

// React's snapshot lifecycle measures the old layout before DOM changes, then
// animates the current nodes after commit. No outgoing secret is cloned.
export class LayoutMotion extends Component {
  componentDidMount() {
    animateLayout(new Map());
  }
  getSnapshotBeforeUpdate(previousProps) {
    return previousProps.revision !== this.props.revision
      ? captureLayout()
      : null;
  }
  componentDidUpdate(previousProps, previousState, snapshot) {
    if (snapshot) animateLayout(snapshot);
  }
  componentWillUnmount() {
    stopLayoutMotion();
  }
  render() {
    return this.props.children;
  }
}
