import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { MCP_TOOL_NAMES, MCPToolArgs, McpToolName } from "./types";

const baseUrl = new URL(process.env.BLOCKSCOUT_MCP_URL!);
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
  chainId,
  address,
}: MCPToolArgs[typeof MCP_TOOL_NAMES.GET_ADDRESS_INFO]) {
  const transport = new StreamableHTTPClientTransport(baseUrl);
  const client = new Client({
    name: "Blockscout-client",
    version: "1.0.0",
  });

  await client.connect(transport);
  console.log("✅ Connected!");

  // See what tools we have
  const tools = await client.listTools();

  // Try to query balance
  try {
    const result = await client.callTool({
      name: "get_address_info",
      arguments: {
        chain_id: chainId, // Ethereum Mainnet
        address,
      },
    });
    if (
      !result.content ||
      !Array.isArray(result.content) ||
      !result.content[0]
    ) {
      throw new Error(`Invalid response format from ${toolName}`);
    }
    console.log("💰 Balance result:", result.content);
  } catch (error) {
    console.log("❌ Balance query failed:", error);
  }

  await client.close();
}
checkAndQueryBalance({
  chainId: "1",
  address: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
}).catch(console.error);
