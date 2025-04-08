import type { PluginOptions } from '@elizaos-plugins/plugin-di';
import { CreateResourceAction } from "./actions/sampleAction";
import { SampleProvider } from "./providers/sampleProvider";
import { SampleService } from './services/sampleService';

export const samplePlugin: PluginOptions = {
    name: "sample",
    description: "Enables creation and management of generic resources",
    actions: [CreateResourceAction],
    providers: [SampleProvider],
    services: [SampleService],
    evaluators: [],
    clients: [],
};

export default samplePlugin;
