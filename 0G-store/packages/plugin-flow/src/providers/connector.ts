import { injectable, inject } from "inversify";
import {
    elizaLogger,
    type IAgentRuntime,
    type Memory,
    type Provider,
    type State,
} from "@elizaos/core";
import { globalContainer, type InjectableProvider } from "@elizaos-plugins/plugin-di";
import { CONSTANTS } from "../symbols";
import FlowConnector, { type NetworkType } from "./utils/flow.connector";

// Here is the configuration file for fixes.
import flowJSON from "../../flow.json" assert { type: "json" };

/**
 * Create a new instance of the Flow connector
 * @param runtime
 * @param flowJSON
 */
async function _createFlowConnector(
    runtime: IAgentRuntime,
    flowJSON: object,
): Promise<FlowConnector> {
    const rpcEndpoint = runtime.getSetting("FLOW_ENDPOINT_URL");
    const network = runtime.getSetting("FLOW_NETWORK") as NetworkType;
    const instance = new FlowConnector(flowJSON, network, rpcEndpoint);
    await instance.onModuleInit();
    return instance;
}

/**
 * Get the singleton instance of the Flow connector
 * @param runtime
 */
async function getFlowConnectorInstance(
    runtime: IAgentRuntime,
    inputedFlowJSON: { [key: string]: unknown } = undefined,
): Promise<FlowConnector> {
    let connector: FlowConnector;
    if (
        inputedFlowJSON &&
        typeof inputedFlowJSON === "object" &&
        typeof inputedFlowJSON?.networks === "object" &&
        typeof inputedFlowJSON?.dependencies === "object"
    ) {
        connector = await _createFlowConnector(runtime, inputedFlowJSON);
    } else {
        connector = await _createFlowConnector(runtime, flowJSON);
    }
    return connector;
}

/**
 * Connector provider
 */
@injectable()
export class ConnectorProvider implements Provider, InjectableProvider<FlowConnector> {
    private _connector: FlowConnector;

    /**
     * Initialize the Flow connector provider
     * @param flowJSON The Flow JSON object
     */
    constructor(
        @inject(CONSTANTS.FlowJSON)
        private readonly flowJSON: Record<string, unknown>,
    ) {}

    /**
     * Get the Flow connector instance
     * @param runtime The runtime object from Eliza framework
     */
    async getInstance(runtime: IAgentRuntime): Promise<FlowConnector> {
        if (!this._connector) {
            this._connector = await getFlowConnectorInstance(runtime, this.flowJSON);
        }
        return this._connector;
    }

    /**
     * Get the connector status
     * @param runtime The runtime object from Eliza framework
     */
    async getConnectorStatus(runtime: IAgentRuntime): Promise<string> {
        const instance = await this.getInstance(runtime);
        let output = `Now user<${runtime.character.name}> connected to\n`;
        output += `Flow network: ${instance.network}\n`;
        output += `Flow Endpoint: ${instance.rpcEndpoint}\n`;
        return output;
    }

    /**
     * Eliza provider `get` method
     * @returns The message to be injected into the context
     */
    async get(runtime: IAgentRuntime, _message: Memory, state?: State): Promise<string | null> {
        // For one session, only inject the wallet info once
        if (state) {
            const CONNECTOR_PROVIDER_SESSION_FLAG = "connector-provider-session";
            if (state[CONNECTOR_PROVIDER_SESSION_FLAG]) {
                return null;
            }
            state[CONNECTOR_PROVIDER_SESSION_FLAG] = true;
        }

        try {
            return await this.getConnectorStatus(runtime);
        } catch (error) {
            elizaLogger.error("Error in Flow connector provider:", error.message);
            return null;
        }
    }
}

// Connector provider is bound to singleton scope
globalContainer.bind<ConnectorProvider>(ConnectorProvider).toSelf().inSingletonScope();

// Export an extra the provider instance without using inversify
export const flowConnectorProvider = new ConnectorProvider(flowJSON);
