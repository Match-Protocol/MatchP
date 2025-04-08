import type { ScriptQueryResponse } from "../types";

/**
 * Check if a string is a valid UUID
 * @param str The string to check
 * @returns true if the string is a valid UUID
 */
export function isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * Check if an address is a Flow address
 * @param address Address to check
 */
export function isFlowAddress(address: string) {
    const regExp = /^0x[a-fA-F0-9]{16}$/gi;
    return regExp.test(address);
}

/**
 * Check if an address is an EVM address
 * @param address Address to check
 */
export function isEVMAddress(address: string) {
    const regExp = /^0x[a-fA-F0-9]{40}$/gi;
    return regExp.test(address);
}

/**
 * Check if a string is a Cadence identifier
 * @param str String to check
 */
export function isCadenceIdentifier(str: string) {
    const cadenceIdentifier = /^A\.[0-9a-fA-F]{16}\.[0-9a-zA-Z_]+/;
    return cadenceIdentifier.test(str);
}

/**
 * Check if a string is a Cadence address
 * @param res
 */
export function isScriptQueryResponse(res: unknown): res is ScriptQueryResponse {
    return res && typeof res === "object" && "ok" in res && typeof res.ok === "boolean";
}
