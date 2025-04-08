import { injectable, inject } from "inversify";
import {
    elizaLogger,
    type IAgentRuntime,
    type Memory,
    type Provider,
    type State,
} from "@elizaos/core";
import { globalContainer, type InjectableProvider } from "@elizaos-plugins/plugin-di";
import { ConnectorProvider, flowConnectorProvider } from "./connector";
import { FlowWallet } from "./utils/flow.wallet";
import { queryAccountBalanceInfo } from "../queries";
import { formatWalletBalances } from "../helpers";

/**
 * Wallet provider
 */
@injectable()
export class WalletProvider implements Provider, InjectableProvider<FlowWallet> {
    private _wallet: FlowWallet;

    constructor(
        @inject(ConnectorProvider)
        private readonly connector: ConnectorProvider,
    ) {}

    /**
     * Get the Flow wallet instance
     * @param runtime The runtime object from Eliza framework
     */
    async getInstance(runtime: IAgentRuntime): Promise<FlowWallet> {
        if (!this._wallet) {
            const connectorIns = await this.connector.getInstance(runtime);
            this._wallet = new FlowWallet(runtime, connectorIns);
        }
        return this._wallet;
    }

    /**
     * Eliza provider `get` method
     * @returns The message to be injected into the context
     */
    async get(runtime: IAgentRuntime, _message: Memory, state?: State): Promise<string | null> {
        // For one session, only inject the wallet info once
        if (state) {
            const WALLET_PROVIDER_SESSION_FLAG = "wallet-provider-session";
            if (state[WALLET_PROVIDER_SESSION_FLAG]) {
                return null;
            }
            state[WALLET_PROVIDER_SESSION_FLAG] = true;
        }

        // Check if the user has an Flow wallet
        if (!runtime.getSetting("FLOW_ADDRESS") || !runtime.getSetting("FLOW_PRIVATE_KEY")) {
            elizaLogger.error(
                "FLOW_ADDRESS or FLOW_PRIVATE_KEY not configured, skipping wallet injection",
            );
            return null;
        }

        try {
            const walletProvider = await this.getInstance(runtime);
            const info = await queryAccountBalanceInfo(walletProvider, walletProvider.address);
            if (!info || info?.address !== walletProvider.address) {
                elizaLogger.error("Invalid account info");
                return null;
            }
            let output = `Here is user<${runtime.character.name}>'s wallet status:\n`;
            output += formatWalletBalances(info);
            return output;
        } catch (error) {
            elizaLogger.error("Error in Flow wallet provider:", error.message);
            return null;
        }
    }
}

// Wallet provider is bound to request scope
globalContainer.bind<WalletProvider>(WalletProvider).toSelf().inRequestScope();

// Export an extra the provider instance without using inversify
export const flowWalletProvider = new WalletProvider(flowConnectorProvider);
