import { ClientType } from "./blockscout";

export const MCP_TOOL_NAMES = {
  GET_ADDRESS_INFO: "get_address_info",
  GET_TRANSACTION_INFO: "get_transaction_info",
  GET_TRANSACTIONS: "get_transactions_by_address",
  GET_TOKEN_BALANCES: "get_token_balances",
} as const;

export type McpToolName = (typeof MCP_TOOL_NAMES)[keyof typeof MCP_TOOL_NAMES];

export type MCPToolArgs = {
  [MCP_TOOL_NAMES.GET_ADDRESS_INFO]: {
    client: ClientType;
    chainId: string;
    address: `0x${string}`;
  };
  [MCP_TOOL_NAMES.GET_TRANSACTION_INFO]: {
    client: ClientType;
    chainId: string;
    hash: string;
    includeRawInput?: boolean;
  };
};
