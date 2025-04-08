import { z } from "zod";
import { injectable } from "inversify";
import {
    elizaLogger,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { type ActionOptions, globalContainer, property } from "@elizaos-plugins/plugin-di";
import { BaseFlowInjectableAction, type ScriptQueryResponse, scripts as defaultFlowScripts } from "@elizaos-plugins/plugin-flow";

/**
 * The generated content for the transfer action
 */
export class ActionContentDef {
    @property({
        description: "This field should be Cadence or EVM",
        examples: [
            "If use mentioned Flow native token or smart contract, the field should be Cadence",
            "Otherwise, the field should be EVM",
        ],
        schema: z.string(),
    })
    vm: string;
}

/**
 * The transfer action options
 */
const actionOpts: ActionOptions<ActionContentDef> = {
    name: "CREATE_RESOURCE_FOR_FLOW",
    similes: [],
    description:
        "Create a new resource with the specified details",
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a new resource on Flow Cadence with the following details",
                    action: "CREATE_RESOURCE_FOR_FLOW",
                },
            },
        ],
    ],
    contentClass: ActionContentDef,
    suppressInitialMessage: false,
};

/**
 * Get price action
 *
 * @category Actions
 * @description Get the current price of FLOW token or stFLOW token
 */
@injectable()
export class SampleFlowAction extends BaseFlowInjectableAction<ActionContentDef> {
    constructor() {
        super(actionOpts);
    }

    /**
     * Validate if the action can be executed
     */
    async validate(_runtime: IAgentRuntime, message: Memory, _state?: State): Promise<boolean> {
        const keywords: string[] = ["resource", "资源"];
        // Check if the message contains the keywords
        return keywords.some((keyword) =>
            message.content.text.toLowerCase().includes(keyword.toLowerCase()),
        );
    }

    /**
     * Execute the action
     *
     * @param content the content from processMessages
     * @param callback the callback function to pass the result to Eliza runtime
     * @returns the transaction response
     */
    async execute(
        content: ActionContentDef | null,
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State,
        callback?: HandlerCallback,
    ): Promise<ScriptQueryResponse | null> {
        if (!content) {
            elizaLogger.warn("No content generated");
            return;
        }

        elizaLogger.log(`Starting ${this.name} handler...`);

        const resp: ScriptQueryResponse = {
            ok: false,
        };

        const agentWalletAddress = runtime.getSetting('FLOW_ADDRESS');
        let data: string;
        try {
            data = await this.walletSerivce.executeScript(
                defaultFlowScripts.mainGetAccountInfo,
                (arg, t) => [arg(agentWalletAddress, t.Address)],
                "",
            );
        } catch (err) {
            resp.error = err.message;
        }
        if (data) {
            resp.ok = true;
            resp.data = JSON.stringify(data);
        } else {
            resp.error = resp.error ?? "Unknown error";
        }

        // Check if the response is not ok
        if (!resp.ok) {
            elizaLogger.error("Error:", resp.error);
            callback?.({
                text: `Unable to load balance of wallet ${agentWalletAddress}`,
                content: {
                    error: resp.error ?? "Unknown error",
                },
                source: "FlowBlockchain",
            });
        }

        // Some logic to handle creating the resource in the specific VM
        // This is just a placeholder
        // ..................

        // Send the response to the Eliza runtime
        callback?.({
            text: `Resource created successfully at VM: ${content.vm}`,
            source: "FlowBlockchain",
        });

        elizaLogger.log(`Finished ${this.name} handler.`);
    }
}

// Register the transfer action
globalContainer.bind(SampleFlowAction).toSelf().inRequestScope();
