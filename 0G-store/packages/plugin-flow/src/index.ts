// Export all definitions from the Flow plugin
export * from "./environment";
export * from "./types";
export * from "./helpers";
export * from "./di";
export * as symbols from "./symbols";
export * as queries from "./queries";
export * from "./assets/script.defs";
export * from "./assets/transaction.defs";
export * as actions from "./actions";
export * from "./providers";
export * from "./services";

// Export the plugin
import type { Plugin } from "@elizaos/core";
import { flowWalletProvider, flowConnectorProvider } from "./providers";

export const flowPlugin: Plugin = {
    name: "flow",
    description: "Flow Plugin for Eliza",
    providers: [flowWalletProvider, flowConnectorProvider],
    actions: [],
    evaluators: [],
    services: [],
};

export default flowPlugin;
