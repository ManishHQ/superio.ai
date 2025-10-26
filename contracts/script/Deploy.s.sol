// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {Vault} from "../src/Vault.sol";
import {MockStrategy} from "../test/MockStrategy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract DeployVault is Script {
    // Deployment addresses
    Vault public vault;
    MockStrategy public mockStrategy;
    ERC20Mock public mockToken;

    // Configuration
    uint256 public constant MAX_TOTAL_DEPLOYED = 100000e18; // 100k tokens
    string public constant VAULT_NAME = "Superio Vault";
    string public constant VAULT_SYMBOL = "svETH";

    function setUp() public {}

    function run() public {
        console.log("================================");
        console.log("Deployment Script Started");
        console.log("================================");
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast();

        // Step 1: Deploy Mock Token (only for testing, skip in production)
        console.log("\n--- Deploying Mock Token ---");
        mockToken = new ERC20Mock();
        console.log("Mock Token deployed at:", address(mockToken));

        // Step 2: Deploy Vault
        console.log("\n--- Deploying Vault ---");
        vault = new Vault(IERC20(address(mockToken)), VAULT_NAME, VAULT_SYMBOL, MAX_TOTAL_DEPLOYED);
        console.log("Vault deployed at:", address(vault));
        console.log("Vault Name:", VAULT_NAME);
        console.log("Vault Symbol:", VAULT_SYMBOL);
        console.log("Max Total Deployed:", MAX_TOTAL_DEPLOYED);

        // Step 3: Deploy Mock Strategy
        console.log("\n--- Deploying Mock Strategy ---");
        mockStrategy = new MockStrategy(address(mockToken), address(vault));
        console.log("Mock Strategy deployed at:", address(mockStrategy));

        // Step 4: Setup Vault (Owner adds strategy and AI agent)
        console.log("\n--- Setting up Vault ---");

        // Add strategy
        vault.addStrategy(address(mockStrategy));
        console.log("Strategy added to vault");

        // Set strategy allocation to 100%
        vault.setStrategyAllocation(address(mockStrategy), 10000);
        console.log("Strategy allocation set to 100%");

        // Set AI agent (msg.sender for now)
        vault.setAiAgent(msg.sender);
        console.log("AI Agent set to:", msg.sender);

        vm.stopBroadcast();

        // Print Summary
        console.log("\n================================");
        console.log("Deployment Summary");
        console.log("================================");
        console.log("Mock Token:", address(mockToken));
        console.log("Vault:", address(vault));
        console.log("Mock Strategy:", address(mockStrategy));
        console.log("msg.sender/Owner:", msg.sender);
        console.log("AI Agent:", msg.sender);
        console.log("\nDeployment completed successfully!");
        console.log("================================\n");
    }
}
