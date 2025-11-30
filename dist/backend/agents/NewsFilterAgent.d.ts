import { BaseAgentSimple } from './BaseAgentSimple';
export declare class NewsFilterAgent extends BaseAgentSimple {
    private pool;
    constructor();
    runFilterCycle(): Promise<void>;
    private fetchPendingItems;
    private processBatch;
    private buildPrompt;
    private executeAndParse;
    private updateDatabase;
    close(): Promise<void>;
}
//# sourceMappingURL=NewsFilterAgent.d.ts.map