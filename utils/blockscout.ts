import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCP_TOOL_NAMES, MCPToolArgs, McpToolName } from "./types";

const baseUrl = new URL(process.env.BLOCKSCOUT_MCP_URL!);

async function getClient() {
  const transport = new StreamableHTTPClientTransport(baseUrl);
  const client = new Client({
    name: "Blockscout-client",
    version: "1.0.0",
  });

  await client.connect(transport);
  console.log("✅ Connected!");
  return client;
}
export type ClientType = Awaited<ReturnType<typeof getClient>>;

async function exploreTools() {
  const transport = new StreamableHTTPClientTransport(baseUrl);
  const client = new Client({
    name: "Blockscout-client",
    version: "1.0.0",
  });

  console.log("Connecting with transport...");
  await client.connect(transport);
  console.log("Connected with transport ✅");

  // List all available tools
  const tools = await client.listTools();
  console.log("\nALL AVAILABLE TOOLS:");

  tools.tools.forEach((tool, index) => {
    console.log(`\n${index + 1}. ${tool.name}`);
    console.log(`   Description: ${tool.description}`);
    console.log(
      `   Input Schema: ${JSON.stringify(tool.inputSchema, null, 2)}`
    );
  });

  await client.close();
}

async function checkAndQueryBalance({
  client,
  chainId,
  address,
}: MCPToolArgs[typeof MCP_TOOL_NAMES.GET_ADDRESS_INFO]) {
  try {
    const result = await client.callTool({
      name: MCP_TOOL_NAMES.GET_ADDRESS_INFO,
      arguments: {
        chain_id: chainId,
        address,
      },
    });
    if (
      !result.content ||
      !Array.isArray(result.content) ||
      !result.content[0]
    ) {
      throw new Error(`Invalid response format`);
    }
    const text = result.content[0].text;
    const parsed = JSON.parse(text);
    console.log("Parsed Text: ", parsed);
  } catch (error) {
    console.log("Balance query failed:", error);
  }
}

async function getTransactionInfo({
  client,
  chainId,
  hash,
  includeRawInput,
}: MCPToolArgs[typeof MCP_TOOL_NAMES.GET_TRANSACTION_INFO]) {
  const result = await client.callTool({
    name: MCP_TOOL_NAMES.GET_TRANSACTION_INFO,
    arguments: {
      chain_id: chainId,
      transaction_hash: hash,
      includeRawInput,
    },
  });
  if (!result.content || !Array.isArray(result.content) || !result.content[0]) {
    throw new Error(`Invalid response format`);
  }
  const text = result.content[0].text;
  const parsed = JSON.parse(text);
  console.log("Parsed Text: ", parsed);
}

async function main() {
  const client = await getClient();
  await getTransactionInfo({
    client,
    chainId: "1",
    hash: "0xe9bac95d9c0117eb00edcd2d1797bd627e21ce01bf0dc426017336aaadf56e0c",
    includeRawInput: true,
  });
  await client.close();
}

main().catch(console.error);
