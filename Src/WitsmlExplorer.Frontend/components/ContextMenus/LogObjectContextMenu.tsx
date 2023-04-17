import { Typography } from "@equinor/eds-core-react";
import { Divider, ListItemIcon, makeStyles, MenuItem } from "@material-ui/core";
import { ImportExport } from "@material-ui/icons";
import React from "react";
import { UpdateWellboreLogAction, UpdateWellboreLogsAction } from "../../contexts/modificationActions";
import ModificationType from "../../contexts/modificationType";
import { DisplayModalAction, HideContextMenuAction, HideModalAction } from "../../contexts/operationStateReducer";
import OperationType from "../../contexts/operationType";
import { ComponentType } from "../../models/componentType";
import { CopyRangeClipboard } from "../../models/jobs/componentReferences";
import { CopyComponentsJob } from "../../models/jobs/copyJobs";
import ObjectReference from "../../models/jobs/objectReference";
import LogObject from "../../models/logObject";
import { toObjectReference } from "../../models/objectOnWellbore";
import { ObjectType } from "../../models/objectType";
import { Server } from "../../models/server";
import JobService, { JobType } from "../../services/jobService";
import ObjectService from "../../services/objectService";
import { colors } from "../../styles/Colors";
import Icon from "../../styles/Icons";
import LogComparisonModal, { LogComparisonModalProps } from "../Modals/LogComparisonModal";
import LogDataImportModal, { LogDataImportModalProps } from "../Modals/LogDataImportModal";
import LogPropertiesModal from "../Modals/LogPropertiesModal";
import { PropertiesModalMode } from "../Modals/ModalParts";
import TrimLogObjectModal, { TrimLogObjectModalProps } from "../Modals/TrimLogObject/TrimLogObjectModal";
import ContextMenu from "./ContextMenu";
import { menuItemText, onClickDeleteObjects, onClickShowObjectOnServer } from "./ContextMenuUtils";
import { onClickCopyLogToServer } from "./CopyLogToServer";
import { copyObjectOnWellbore, onClickPaste } from "./CopyUtils";
import NestedMenuItem from "./NestedMenuItem";
import { useClipboardComponentReferencesOfType } from "./UseClipboardComponentReferences";

export interface LogObjectContextMenuProps {
  checkedLogObjects: LogObject[];
  dispatchOperation: (action: DisplayModalAction | HideContextMenuAction | HideModalAction) => void;
  dispatchNavigation: (action: UpdateWellboreLogAction | UpdateWellboreLogsAction) => void;
  servers: Server[];
  selectedServer: Server;
}

const useContextMenuIconStyle = makeStyles({ iconStyle: { width: 16, height: 16, color: "#007079" } });

const LogObjectContextMenu = (props: LogObjectContextMenuProps): React.ReactElement => {
  const { checkedLogObjects, dispatchOperation, dispatchNavigation, selectedServer, servers } = props;
  const logCurvesReference: CopyRangeClipboard = useClipboardComponentReferencesOfType(ComponentType.Mnemonic);
  const classes = useContextMenuIconStyle();

  const onClickProperties = () => {
    const logObject = checkedLogObjects[0];
    const logPropertiesModalProps = { mode: PropertiesModalMode.Edit, logObject, dispatchOperation };
    dispatchOperation({ type: OperationType.DisplayModal, payload: <LogPropertiesModal {...logPropertiesModalProps} /> });
    dispatchOperation({ type: OperationType.HideContextMenu });
  };

  const onClickTrimLogObject = () => {
    const logObject = checkedLogObjects[0];
    const trimLogObjectProps: TrimLogObjectModalProps = { dispatchNavigation, dispatchOperation, logObject };
    dispatchOperation({ type: OperationType.DisplayModal, payload: <TrimLogObjectModal {...trimLogObjectProps} /> });
  };

  const onClickImport = async () => {
    const logDataImportModalProps: LogDataImportModalProps = { targetLog: checkedLogObjects[0], dispatchOperation };
    dispatchOperation({ type: OperationType.DisplayModal, payload: <LogDataImportModal {...logDataImportModalProps} /> });
  };

  const onClickRefresh = async () => {
    const log = await ObjectService.getObject(checkedLogObjects[0].wellUid, checkedLogObjects[0].wellboreUid, checkedLogObjects[0].uid, ObjectType.Log);
    dispatchNavigation({
      type: ModificationType.UpdateLogObject,
      payload: { log: log }
    });
    dispatchOperation({ type: OperationType.HideContextMenu });
  };

  const orderCopyJob = () => {
    const targetReference: ObjectReference = toObjectReference(checkedLogObjects[0]);
    const copyJob: CopyComponentsJob = {
      source: logCurvesReference,
      target: targetReference,
      startIndex: logCurvesReference.startIndex,
      endIndex: logCurvesReference.endIndex
    };
    JobService.orderJob(JobType.CopyLogData, copyJob);
    dispatchOperation({ type: OperationType.HideContextMenu });
  };

  const onClickCompareLogToServer = async (targetServer: Server) => {
    dispatchOperation({ type: OperationType.HideContextMenu });
    const props: LogComparisonModalProps = { sourceLog: checkedLogObjects[0], sourceServer: selectedServer, targetServer, dispatchOperation };
    dispatchOperation({
      type: OperationType.DisplayModal,
      payload: <LogComparisonModal {...props} />
    });
  };

  return (
    <ContextMenu
      menuItems={[
        <MenuItem key={"refreshlog"} onClick={onClickRefresh} disabled={checkedLogObjects.length !== 1}>
          <ListItemIcon>
            <Icon name="refresh" color={colors.interactive.primaryResting} />
          </ListItemIcon>
          <Typography color={"primary"}>Refresh log</Typography>
        </MenuItem>,
        <MenuItem
          key={"copylog"}
          onClick={() => copyObjectOnWellbore(selectedServer, checkedLogObjects, dispatchOperation, ObjectType.Log)}
          disabled={checkedLogObjects.length === 0}
        >
          <ListItemIcon>
            <Icon name="copy" color={colors.interactive.primaryResting} />
          </ListItemIcon>
          <Typography color={"primary"}>{menuItemText("copy", "log", checkedLogObjects)}</Typography>
        </MenuItem>,
        <NestedMenuItem key={"copyToServer"} label={`${menuItemText("copy", "log", checkedLogObjects)} to server`} disabled={checkedLogObjects.length < 1}>
          {servers.map(
            (server: Server) =>
              server.id !== selectedServer.id && (
                <MenuItem
                  key={server.name}
                  onClick={() => onClickCopyLogToServer(server, selectedServer, checkedLogObjects, dispatchOperation)}
                  disabled={checkedLogObjects.length < 1}
                >
                  <Typography color={"primary"}>{server.name}</Typography>
                </MenuItem>
              )
          )}
        </NestedMenuItem>,
        <MenuItem
          key={"pastelogcurves"}
          onClick={() => onClickPaste(servers, logCurvesReference.serverUrl, orderCopyJob)}
          disabled={logCurvesReference === null || checkedLogObjects.length !== 1}
        >
          <ListItemIcon>
            <Icon name="paste" color={colors.interactive.primaryResting} />
          </ListItemIcon>
          <Typography color={"primary"}>{menuItemText("paste", "log curve", logCurvesReference?.componentUids)}</Typography>
        </MenuItem>,
        <NestedMenuItem key={"compareToServer"} label={`${menuItemText("Compare", "log", [])} to server`} disabled={checkedLogObjects.length != 1} icon="compare">
          {servers.map(
            (server: Server) =>
              server.id !== selectedServer.id && (
                <MenuItem key={server.name} onClick={() => onClickCompareLogToServer(server)} disabled={checkedLogObjects.length != 1}>
                  <Typography color={"primary"}>{server.name}</Typography>
                </MenuItem>
              )
          )}
        </NestedMenuItem>,
        <MenuItem key={"trimlogobject"} onClick={onClickTrimLogObject} disabled={checkedLogObjects.length !== 1}>
          <ListItemIcon>
            <Icon name="formatLine" color={colors.interactive.primaryResting} />
          </ListItemIcon>
          <Typography color={"primary"}>Adjust range</Typography>
        </MenuItem>,
        <MenuItem key={"deletelogobject"} onClick={() => onClickDeleteObjects(dispatchOperation, checkedLogObjects, ObjectType.Log)} disabled={checkedLogObjects.length === 0}>
          <ListItemIcon>
            <Icon name="deleteToTrash" color={colors.interactive.primaryResting} />
          </ListItemIcon>
          <Typography color={"primary"}>{menuItemText("delete", "log", checkedLogObjects)}</Typography>
        </MenuItem>,
        <MenuItem key={"importlogdata"} onClick={onClickImport} disabled={checkedLogObjects.length === 0}>
          <ListItemIcon>
            <ImportExport className={classes.iconStyle} />
          </ListItemIcon>
          <Typography color={"primary"}>Import log data from .csv</Typography>
        </MenuItem>,
        <NestedMenuItem key={"showOnServer"} label={"Show on server"} disabled={checkedLogObjects.length !== 1}>
          {servers.map((server: Server) => (
            <MenuItem
              key={server.name}
              onClick={() => onClickShowObjectOnServer(dispatchOperation, server, checkedLogObjects[0], ObjectType.Log)}
              disabled={checkedLogObjects.length !== 1}
            >
              <Typography color={"primary"}>{server.name}</Typography>
            </MenuItem>
          ))}
        </NestedMenuItem>,
        <Divider key={"divider"} />,
        <MenuItem key={"properties"} onClick={onClickProperties} disabled={checkedLogObjects.length !== 1}>
          <ListItemIcon>
            <Icon name="settings" color={colors.interactive.primaryResting} />
          </ListItemIcon>
          <Typography color={"primary"}>Properties</Typography>
        </MenuItem>
      ]}
    />
  );
};

export default LogObjectContextMenu;
