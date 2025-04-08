import { elizaLogger, type IAgentRuntime } from "@elizaos/core";
import NodeCache from "node-cache";
import * as fcl from "@onflow/fcl";
import type { CompositeSignature, Account } from "@onflow/typedefs";
import type { FlowConnector } from "./flow.connector";
import PureSigner from "./pure.signer";
import type { IFlowScriptExecutor, IFlowSigner } from "../../types";
import Exception from "../../types/exception";

/**
 * Flow wallet Provider
 */
export class FlowWallet implements IFlowSigner, IFlowScriptExecutor {
    runtime: IAgentRuntime;
    private readonly privateKeyHex?: string;
    public readonly address: string;
    // Runtime data
    private account: Account | null = null;
    public maxKeyIndex = 0;

    constructor(
        runtime: IAgentRuntime,
        private readonly connector: FlowConnector,
        private readonly cache: NodeCache = new NodeCache({ stdTTL: 300 }), // Cache TTL set to 5 minutes
    ) {
        const signerAddr = runtime.getSetting("FLOW_ADDRESS");
        if (!signerAddr) {
            elizaLogger.error("No signer address");
            throw new Exception(50200, "No signer info");
        }
        this.address = signerAddr;
        this.runtime = runtime;

        const privateKey = runtime.getSetting("FLOW_PRIVATE_KEY");
        if (!privateKey) {
            elizaLogger.warn(`The default Flow wallet ${this.address} has no private key`);
        } else {
            this.privateKeyHex = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
        }
    }

    /**
     * Get the network type
     */
    get network() {
        return this.connector.network;
    }

    /**
     * Send a transaction
     * @param code Cadence code
     * @param args Cadence arguments
     */
    async sendTransaction(code: string, args: fcl.ArgumentFunction, authz?: fcl.FclAuthorization) {
        return await this.connector.sendTransaction(code, args, authz ?? this.buildAuthorization());
    }

    /**
     * Execute a script
     * @param code Cadence code
     * @param args Cadence arguments
     */
    async executeScript<T>(code: string, args: fcl.ArgumentFunction, defaultValue: T): Promise<T> {
        return await this.connector.executeScript(code, args, defaultValue);
    }

    /**
     * Build authorization
     */
    buildAuthorization(accountIndex = 0, privateKey = this.privateKeyHex) {
        if (this.account) {
            if (accountIndex > this.maxKeyIndex) {
                throw new Exception(50200, "Invalid account index");
            }
        }
        const address = this.address;
        if (!privateKey) {
            throw new Exception(50200, "No private key provided");
        }
        return (account: Account): fcl.AuthZ => {
            return {
                ...account,
                addr: fcl.sansPrefix(address),
                keyId: Number(accountIndex),
                signingFunction: (signable: fcl.SigningData): Promise<CompositeSignature> => {
                    return Promise.resolve({
                        f_type: "CompositeSignature",
                        f_vsn: "1.0.0",
                        addr: fcl.withPrefix(address),
                        keyId: Number(accountIndex),
                        signature: this.signMessage(signable.message, privateKey),
                    });
                },
            };
        };
    }

    /**
     * Sign a message
     * @param message Message to sign
     */
    signMessage(message: string, privateKey = this.privateKeyHex) {
        return PureSigner.signWithKey(privateKey, message);
    }

    // -----  methods -----

    /**
     * Sync account info
     */
    async syncAccountInfo() {
        this.account = await this.connector.getAccount(this.address);
        this.maxKeyIndex = this.account.keys.length - 1;
        this.cache.set("balance", this.account.balance / 1e8);
        elizaLogger.debug("Flow account info synced", {
            address: this.address,
            balance: this.account.balance,
            maxKeyIndex: this.maxKeyIndex,
            keyAmount: this.account.keys.length,
        });
    }

    /**
     * Get the wallet balance
     * @returns Wallet balance
     */
    async getWalletBalance(forceRefresh = false): Promise<number> {
        const cachedBalance = await this.cache.get<number>("balance");
        if (!forceRefresh && cachedBalance) {
            return cachedBalance;
        }
        await this.syncAccountInfo();
        return this.account ? this.account.balance / 1e8 : 0;
    }
}
