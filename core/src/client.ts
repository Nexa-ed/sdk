import { resolveConfig } from "./config";
import { DocumentsModule } from "./modules/documents";
import { FilesModule } from "./modules/files";
import { PaymentsModule } from "./modules/payments";
import { ServicesModule } from "./modules/services";
import { WebhooksModule } from "./modules/webhooks";
import type { NexaConfig, ResolvedNexaConfig } from "./config";

export class NexaClient {
  /** @internal */
  readonly _config: ResolvedNexaConfig;

  /** File submission and real-time progress streaming */
  readonly files: FilesModule;

  /** Payment initialization, verification, and history */
  readonly payments: PaymentsModule;

  /** Student records, analysis jobs, and LLM refinement */
  readonly documents: DocumentsModule;

  /** Incoming webhook verification */
  readonly webhooks: WebhooksModule;

  /** Tenant service catalog and usage */
  readonly services: ServicesModule;

  constructor(config: NexaConfig) {
    this._config = resolveConfig(config);
    this.files = new FilesModule(this._config);
    this.payments = new PaymentsModule(this._config);
    this.documents = new DocumentsModule(this._config);
    this.webhooks = new WebhooksModule(this._config);
    this.services = new ServicesModule(this._config);
  }
}
