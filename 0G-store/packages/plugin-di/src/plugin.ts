import type { Plugin } from "@elizaos/core";
import { normalizeCharacter } from "./factories";

/**
 * Dependency Injection Plugin configuration
 * Required for the plugin to be loaded, will be exported as default
 */
export const diPlugin: Plugin = {
    name: "dependency-injection",
    description: "Dependency Injection Plugin for Eliza.",
    // handle character loaded
    handlePostCharacterLoaded: normalizeCharacter,
};
