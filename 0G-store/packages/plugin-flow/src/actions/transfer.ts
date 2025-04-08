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
import { formatTransationSent } from "../helpers/formater";
import { BaseFlowInjectableAction } from "../helpers/baseAction";
import { isCadenceIdentifier, isEVMAddress, isFlowAddress } from "../helpers/checker";
import { transactions } from "../assets/transaction.defs";

/**
 * The generated content for the transfer action
 */
export class TransferContent {
    @property({
        description:
            "Cadence Resource Identifier or ERC20 contract address (if not native token). this field should be null if the token is native token: $FLOW or FLOW",
        examples: [
            "For Cadence resource identifier, the field should be 'A.1654653399040a61.ContractName'",
            "For ERC20 contract address, the field should be '0xe6ffc15a5bde7dd33c127670ba2b9fcb82db971a'",
        ],
        schema: z.string().nullable(),
    })
    token: string | null;

    @property({
        description: "Amount to transfer, it should be a number or a string",
        examples: ["'1000'", "1000"],
        schema: z.union([z.string(), z.number()]),
    })
    amount: string;

    @property({
        description:
            "Recipient identifier, can a wallet address like EVM address or Cadence address. It should be a string",
        examples: [
            "For Cadence address: '0x1654653399040a61'",
            "For EVM address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'",
        ],
        schema: z.string(),
    })
    to: string;
}

/**
 * The transfer action options
 */
const transferOption: ActionOptions<TransferContent> = {
    name: "SEND_COIN",
    similes: [
        "SEND_TOKEN",
        "SEND_TOKEN_ON_FLOW",
        "TRANSFER_TOKEN_ON_FLOW",
        "TRANSFER_TOKENS_ON_FLOW",
        "TRANSFER_FLOW",
        "SEND_FLOW",
        "PAY_BY_FLOW",
    ],
    description:
        "Call this action to transfer any fungible token/coin from the agent's Flow wallet to another address",
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 FLOW to 0xa2de93114bae3e73",
                    action: "SEND_COIN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 FLOW - A.1654653399040a61.FlowToken to 0xa2de93114bae3e73",
                    action: "SEND_COIN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1000 FROTH - 0xb73bf8e6a4477a952e0338e6cc00cc0ce5ad04ba to 0x000000000000000000000002e44fbfbd00395de5",
                    action: "SEND_COIN",
                },
            },
        ],
    ],
    contentClass: TransferContent,
    suppressInitialMessage: true,
};

/**
 * Transfer action
 *
 * @category Actions
 * @description Transfer funds from one account to another
 */
@injectable()
export class TransferAction extends BaseFlowInjectableAction<TransferContent> {
    constructor() {
        super(transferOption);
    }

    /**
     * Validate the transfer action
     * @param runtime the runtime instance
     * @param message the message content
     * @param state the state object
     */
    async validate(runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> {
        if (await super.validate(runtime, message, state)) {
            // TODO: Add custom validation logic here to ensure the transfer does not come from unauthorized sources
            return true;
        }
        return false;
    }

    /**
     * Execute the transfer action
     *
     * @param content the content from processMessages
     * @param callback the callback function to pass the result to Eliza runtime
     * @returns the transaction response
     */
    async execute(
        content: TransferContent | null,
        _runtime: IAgentRuntime,
        _message: Memory,
        _state?: State,
        callback?: HandlerCallback,
    ) {
        if (!content) {
            elizaLogger.warn("No content generated");
            return;
        }

        elizaLogger.log(`Starting ${this.name} handler...`);

        // Use main account of the agent
        const walletAddress = this.walletSerivce.address;
        const logPrefix = `Account[${walletAddress}/root]`;

        // Parsed fields
        const amount =
            typeof content.amount === "number" ? content.amount : Number.parseFloat(content.amount);
        const recipient = content.to;

        try {
            let txId: string;
            let keyIndex: number;

            // For different token types, we need to handle the token differently
            if (!content.token) {
                // Check if the wallet has enough balance to transfer
                const fromAccountInfo = await this.walletSerivce.getWalletAccountInfo();
                const totalBalance = fromAccountInfo.balance + (fromAccountInfo.coaBalance ?? 0);

                // Check if the amount is valid
                if (totalBalance < amount) {
                    throw new Error("Insufficient balance to transfer");
                }

                elizaLogger.log(`${logPrefix}\n Sending ${amount} FLOW to ${recipient}...`);
                // Transfer FLOW token
                const resp = await this.walletSerivce.sendTransaction(
                    transactions.mainFlowTokenDynamicTransfer,
                    (arg, t) => [
                        arg(recipient, t.String),
                        arg(amount.toFixed(8), t.UFix64),
                    ],
                )
                txId = resp.txId;
                keyIndex = resp.index;
            } else if (isCadenceIdentifier(content.token)) {
                if (!isFlowAddress(recipient)) {
                    throw new Error("Recipient address is not a valid Flow address");
                }

                // Transfer Fungible Token on Cadence side
                const [_, tokenAddr, tokenContractName] = content.token.split(".");
                elizaLogger.log(
                    `${logPrefix}\n Sending ${amount} A.${tokenAddr}.${tokenContractName} to ${recipient}...`,
                );
                const resp = await this.walletSerivce.sendTransaction(
                    transactions.mainFTGenericTransfer,
                    (arg, t) => [
                        arg(amount.toFixed(8), t.UFix64),
                        arg(recipient, t.Address),
                        arg(`0x${tokenAddr}`, t.Address),
                        arg(tokenContractName, t.String),
                    ],
                )
                txId = resp.txId;
                keyIndex = resp.index;
            } else if (isEVMAddress(content.token)) {
                if (!isEVMAddress(recipient)) {
                    throw new Error("Recipient address is not a valid EVM address");
                }

                elizaLogger.log(
                    `${logPrefix}\n Sending ${amount} ${content.token}(EVM) to ${recipient}...`,
                );

                // Transfer ERC20 token on EVM side
                const resp = await this.walletSerivce.sendTransaction(
                    transactions.mainEVMTransferERC20,
                    (arg, t) => [
                        arg(recipient, t.String),
                        arg(amount.toFixed(8), t.UFix64),
                        arg(content.token, t.String),
                    ],
                )
                txId = resp.txId;
                keyIndex = resp.index;
            }

            elizaLogger.log(`${logPrefix}\n Sent transaction: ${txId} by KeyIndex[${keyIndex}]`);

            // call the callback with the transaction response
            if (callback) {
                const tokenName = content.token || "FLOW";
                const extraMsg = `${logPrefix}\n Successfully transferred ${content.amount} ${tokenName} to ${content.to}`;
                callback?.({
                    text: formatTransationSent(txId, this.walletSerivce.wallet.network, extraMsg),
                    content: {
                        success: true,
                        txid: txId,
                        token: content.token,
                        to: content.to,
                        amount: content.amount,
                    },
                });
            }
        } catch (e) {
            elizaLogger.error("Error in sending transaction:", e.message);
            callback?.({
                text: `${logPrefix}\n Unable to process transfer request. Error: \n ${e.message}`,
                content: {
                    error: e.message,
                },
            });
        }

        elizaLogger.log(`Finished ${this.name} handler.`);
    }
}

// Register the transfer action
globalContainer.bind(TransferAction).toSelf();
