import type * as fcl from "@onflow/fcl";
import type { arg } from "@onflow/fcl";
import type * as ftypes from "@onflow/types";
import type { TransactionStatus, Account } from "@onflow/typedefs";

export interface IFlowScriptExecutor {
    /**
     * Execute a script
     * @param code Cadence code
     * @param args Cadence arguments
     */
    executeScript<T>(
        code: string,
        args: fcl.ArgumentFunction,
        defaultValue: T
    ): Promise<T>;
}

/**
 * Signer interface
 */
export interface IFlowSigner {
    /**
     * Send a transaction
     */
    sendTransaction(
        code: string,
        args: fcl.ArgumentFunction,
        authz?: fcl.FclAuthorization
    ): Promise<string>;

    /**
     * Build authorization
     */
    buildAuthorization(
        accountIndex?: number,
        privateKey?: string
    ): (acct: Account) => Promise<fcl.AuthZ> | fcl.AuthZ;
}

// ----------- General Definitions -----------

export interface TransactionResponse {
    signer: {
        address: string;
        keyIndex: number;
    };
    txid: string;
}

export interface FlowAccountBalanceInfo {
    address: string;
    balance: number;
    coaAddress?: string;
    coaBalance?: number;
}

export interface ScriptQueryResponse {
    ok: boolean;
    data?: unknown;
    error?: string | Record<string, unknown>;
    errorMessage?: string;
}

export type ArgumentFunction = (
    argFunc: typeof arg,
    t: typeof ftypes,
) => Array<{
    value: unknown;
    xform: unknown;
}>;

export type TransactionStatusCallback = (
    txId: string,
    status: TransactionStatus,
    errorMsg?: string,
) => Promise<void>;

export type TransactionCallbacks = {
    onStatusUpdated?: TransactionStatusCallback;
    onFinalized?: TransactionStatusCallback;
    onSealed?: TransactionStatusCallback;
};

export type TransactionTrackingPayload = {
    txId: string;
    unsubscribe: () => void;
};

export type TransactionSentResponse = {
    txId: string;
    index: number;
};
