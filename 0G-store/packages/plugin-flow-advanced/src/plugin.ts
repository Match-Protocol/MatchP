import type { PluginOptions } from "@elizaos-plugins/plugin-di";
import { FlowWalletService } from "@elizaos-plugins/plugin-flow";
import {
    TransferAction,
    GetPriceAction,
    GetTokenInfoAction,
    EnsureUserAccountExistsAction,
    EnsureTokenRegisteredAction,
} from "./actions";
import { AccountsPoolService } from "./services/acctPool.service";
import { AccountProvider } from "./providers/account.provider";

/**
 * Advanced Flow Plugin configuration
 * Required for the plugin to be loaded, will be exported as default
 */
export const advancedFlowPlugin: PluginOptions = {
    name: "flow-advanced",
    description: "Flow Plugin for Eliza with accounts management features.",
    actions: [
        TransferAction,
        GetPriceAction,
        GetTokenInfoAction,
        EnsureUserAccountExistsAction,
        EnsureTokenRegisteredAction,
    ],
    providers: [AccountProvider],
    evaluators: [],
    services: [FlowWalletService, AccountsPoolService],
};
