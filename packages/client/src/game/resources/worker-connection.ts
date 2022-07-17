import { EcsResource } from "@qendil/client-common/ecs";
import type { PostMessageCallback } from "../init-worker";

export default class WorkerConnection extends EcsResource {
  public postMessage: PostMessageCallback;
  public disposeCallback: () => void;

  public constructor(
    postMessage: PostMessageCallback,
    disposeCallback: () => void
  ) {
    super();

    this.postMessage = postMessage;
    this.disposeCallback = disposeCallback;
  }

  public dispose(): void {
    this.disposeCallback();
  }
}
