import { SimpleEventDispatcher } from "ste-simple-events";
import { UpdateServerAction } from "../contexts/modificationActions";
import ModificationType from "../contexts/modificationType";
import { ErrorDetails } from "../models/errorDetails";
import { Server } from "../models/server";
import { ApiClient, throwError } from "./apiClient";
import { AuthorizationClient } from "./authorizationClient";

export interface BasicServerCredentials {
  server: Server;
  username?: string;
  password?: string;
}

export enum AuthorizationStatus {
  Unauthorized,
  Authorized,
  Cancel
}

export interface AuthorizationState {
  server: Server;
  status: AuthorizationStatus;
}

class AuthorizationService {
  private static _instance: AuthorizationService;
  private _onAuthorizationChange = new SimpleEventDispatcher<AuthorizationState>();
  private server?: Server;
  private _sourceServer?: Server;
  private serversAwaitingAuthorization: Server[] = [];

  public awaitServerAuthorization(server: Server) {
    this.serversAwaitingAuthorization.push(server);
  }

  public finishServerAuthorization(server: Server) {
    const index = this.serversAwaitingAuthorization.findIndex((waitingServer) => waitingServer.id == server.id);
    if (index != -1) {
      this.serversAwaitingAuthorization.splice(index, 1);
    }
  }

  public serverIsAwaitingAuthorization(server: Server) {
    return this.serversAwaitingAuthorization.find((waitingServer) => waitingServer.id == server.id) != undefined;
  }

  public setSelectedServer(server: Server) {
    this.server = server;
  }

  public get selectedServer(): Server {
    return { ...this.server };
  }

  public setSourceServer(server: Server) {
    this._sourceServer = server;
  }

  public get sourceServer(): Server {
    return { ...this._sourceServer };
  }

  public resetSourceServer() {
    this._sourceServer = null;
  }

  public onServerStateChange(server: Server) {
    if (this.selectedServer?.id == server.id) {
      this.setSelectedServer(server);
    }
    if (this.sourceServer?.id == server.id) {
      this.setSourceServer(server);
    }
  }

  public onAuthorized(server: Server, username: string, dispatchNavigation: (action: UpdateServerAction) => void) {
    server.currentUsername = username;
    if (server.usernames == null) {
      server.usernames = [];
    }
    if (!server.usernames.includes(username)) {
      server.usernames.push(username);
    }
    dispatchNavigation({ type: ModificationType.UpdateServer, payload: { server } });
    this._onAuthorizationChange.dispatch({ server, status: AuthorizationStatus.Authorized });
  }

  public getKeepLoggedInToServer(serverUrl: string): boolean {
    try {
      return localStorage.getItem(serverUrl) == "keep";
    } catch {
      // ignore unavailable local storage
    }
    return false;
  }

  // Verify basic credentials for the first time
  // Basic credentials for this call will be set in header: WitsmlAuth
  public async verifyCredentials(credentials: BasicServerCredentials, keep: boolean, abortSignal?: AbortSignal): Promise<any> {
    try {
      if (keep) {
        localStorage.setItem(credentials.server.url, "keep");
      } else {
        localStorage.removeItem(credentials.server.url);
      }
    } catch {
      // ignore unavailable local storage
    }
    const response = await AuthorizationClient.get(`/api/credentials/authorize?keep=` + keep, abortSignal, credentials);
    if (!response.ok) {
      const { message }: ErrorDetails = await response.json();
      throwError(response.status, message);
    }
  }

  public async deauthorize(abortSignal?: AbortSignal): Promise<any> {
    const response = await ApiClient.get(`/api/credentials/deauthorize`, abortSignal);
    if (!response.ok) {
      const { message }: ErrorDetails = await response.json();
      throwError(response.status, message);
    }
  }

  public onAuthorizationChangeDispatch(authorizationState: AuthorizationState) {
    return this._onAuthorizationChange.dispatch(authorizationState);
  }

  public get onAuthorizationChangeEvent() {
    return this._onAuthorizationChange.asEvent();
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
}

export default AuthorizationService.Instance;
