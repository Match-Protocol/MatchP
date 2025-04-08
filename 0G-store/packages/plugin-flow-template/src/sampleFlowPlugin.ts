import type { PluginOptions } from '@elizaos-plugins/plugin-di';
import { FlowWalletService } from '@elizaos-plugins/plugin-flow';

import { CreateResourceAction } from "./actions/sampleAction";
import { SampleFlowAction } from './actions/sampleFlowAction';
import { SampleProvider } from "./providers/sampleProvider";
import { SampleService } from './services/sampleService';

export const sampleFlowPlugin: PluginOptions = {
    name: "sample",
    description: "Enables creation and management of generic resources",
    actions: [CreateResourceAction, SampleFlowAction],
    providers: [SampleProvider],
    services: [SampleService, FlowWalletService],
    evaluators: [],
    clients: [],
};

export default sampleFlowPlugin;
