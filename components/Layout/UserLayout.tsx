import React from "react";
import Topbar from "./Topbar";

function UserLayout(props: any) {
  return (
    <div>
      <div>{props.children}</div>
    </div>
  );
}

export default UserLayout;
