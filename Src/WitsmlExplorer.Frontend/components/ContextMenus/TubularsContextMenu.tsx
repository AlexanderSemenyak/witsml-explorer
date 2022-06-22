import React from "react";
import ContextMenu from "./ContextMenu";
import { MenuItem } from "@material-ui/core";
import Icon from "../../styles/Icons";
import { colors } from "../../styles/Colors";
import { DisplayModalAction, HideContextMenuAction, HideModalAction } from "../../contexts/operationStateReducer";
import { Server } from "../../models/server";
import { Typography } from "@equinor/eds-core-react";
import styled from "styled-components";
import Wellbore from "../../models/wellbore";
import { onClickPaste, useClipboardTubularsReference } from "./TubularContextMenuUtils";

export interface TubularsContextMenuProps {
  dispatchOperation: (action: HideModalAction | HideContextMenuAction | DisplayModalAction) => void;
  wellbore: Wellbore;
  servers?: Server[];
}

const TubularsContextMenu = (props: TubularsContextMenuProps): React.ReactElement => {
  const { dispatchOperation, wellbore, servers } = props;
  const [tubularsReference] = useClipboardTubularsReference();

  return (
    <ContextMenu
      menuItems={[
        <MenuItem key={"paste"} onClick={() => onClickPaste(servers, dispatchOperation, wellbore, tubularsReference)} disabled={tubularsReference === null}>
          <StyledIcon name="paste" color={colors.interactive.primaryResting} />
          <Typography color={"primary"}>Paste tubular{tubularsReference?.tubularUids.length > 1 && "s"}</Typography>
        </MenuItem>
      ]}
    />
  );
};

const StyledIcon = styled(Icon)`
  && {
    margin-right: 5px;
  }
`;

export default TubularsContextMenu;
