// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Test, console} from "forge-std/Test.sol";
import {Vault} from "../src/Vault.sol";
import {MockStrategy} from "./MockStrategy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

/**
 * @dev Simple Mock ERC20 for testing
 */

/**
 * @dev End-to-End Test: User Deposit -> Owner Deploy -> Strategy Hold
 */
contract VaultSimpleE2ETest is Test {
    Vault public vault;
    ERC20Mock public asset;
    MockStrategy public mockStrategy;

    address public owner;
    address public aiAgent;
    address public user;

    function setUp() public {
        owner = makeAddr("OWNER");
        aiAgent = makeAddr("AIAGENTS");
        user = makeAddr("USER");

        // Deploy token (mints to this contract)
        asset = new ERC20Mock();

        // Deploy vault with max 100k deployed
        vm.prank(owner);
        vault = new Vault(IERC20(address(asset)), "Vault Token", "vTOKEN", 100000 * 10 ** 18);

        // Deploy mock strategy
        vm.prank(owner);
        mockStrategy = new MockStrategy(address(asset), address(vault));

        // Approve vault to spend tokens from this contract
        // asset.approve(address(vault), type(uint256).max);

        // Transfer tokens from test contract to user
        asset.mint(user, 10000e18);

        // mock strategy should have the extra money to give it back to the vault
        asset.mint(address(mockStrategy), 10000e18);
    }

    /**
     * @dev Test 1: User deposits and receives shares
     */
    function test_userDepositsAndReceivesShares() public {
        // User deposits 1000 tokens
        vm.startPrank(user);
        asset.approve(address(vault), 1000 * 10 ** 18);
        uint256 shares = vault.deposit(1000 * 10 ** 18, user);
        vm.stopPrank();

        // Verify user got shares
        assertEq(shares, 1000 * 10 ** 18, "User should get 1000 shares");
        assertEq(vault.balanceOf(user), 1000 * 10 ** 18, "User share balance check");
        assertEq(vault.totalSupply(), 1000 * 10 ** 18, "Total supply check");

        // Verify vault has assets
        assertEq(vault.totalAssets(), 1000 * 10 ** 18, "Vault total assets check");
    }

    /**
     * @dev Test 2: Owner adds strategy and sets allocation
     */
    function test_ownerAddsStrategyAndSetsAllocation() public {
        // Owner adds strategy
        vm.prank(owner);
        vault.addStrategy(address(mockStrategy));

        // Verify strategy is active
        (uint256 deployed, uint256 allocation, bool active) = vault.getStrategyInfo(address(mockStrategy));
        assertTrue(active, "Strategy should be active");
        assertEq(deployed, 0, "Should have 0 deployed initially");
        assertEq(allocation, 0, "Should have 0 allocation initially");

        // Owner sets 100% allocation
        vm.prank(owner);
        vault.setStrategyAllocation(address(mockStrategy), 10000); // 100%

        // Verify allocation set
        (, uint256 newAllocation,) = vault.getStrategyInfo(address(mockStrategy));
        assertEq(newAllocation, 10000, "Allocation should be 100%");
    }

    /**
     * @dev Test 3: Owner sets AI agent
     */
    function test_ownerSetsAiAgent() public {
        vm.prank(owner);
        vault.setAiAgent(aiAgent);

        assertEq(vault.aiAgent(), aiAgent, "AI agent should be set");
        assertTrue(vault.aiAgentEnabled(), "AI agent should be enabled");
    }

    /**
     * @dev Test 4: Full E2E - User deposits, Owner deploys to strategy
     */
    function test_e2eFullFlow() public {
        // Step 1: Owner setup
        vm.prank(owner);
        vault.addStrategy(address(mockStrategy));

        vm.prank(owner);
        vault.setStrategyAllocation(address(mockStrategy), 10000); // 100%

        vm.prank(owner);
        vault.setAiAgent(aiAgent);

        // Step 2: User deposits 1000 tokens
        vm.startPrank(user);
        asset.approve(address(vault), 1000e18);
        uint256 shares = vault.deposit(1000e18, user);
        vm.stopPrank();

        assertEq(shares, 1000 * 10 ** 18, "User receives 1000 shares");
        assertEq(vault.balanceOf(user), 1000 * 10 ** 18, "User share balance");

        // Step 3: AI deploys to strategy
        vm.prank(aiAgent);
        vault.deployToStrategy(address(mockStrategy), 1000 * 10 ** 18);

        // Verify deployment
        (uint256 deployed,,) = vault.getStrategyInfo(address(mockStrategy));
        assertEq(deployed, 1000 * 10 ** 18, "Strategy should have 1000 deployed");
        assertEq(vault.totalDeployedAssets(), 1000 * 10 ** 18, "Total deployed check");

        // Verify mock strategy holds tokens
        assertEq(mockStrategy.totalDeployed(), 1000 * 10 ** 18, "Mock strategy balance");

        // Step 4: Verify user still owns shares (backed by strategy now)
        assertEq(vault.balanceOf(user), 1000 * 10 ** 18, "User still has 1000 shares");
        assertEq(vault.totalAssets(), 1000 * 10 ** 18, "Total assets still 1000");
    }

    /**
     * @dev Test 5: AI harvests from strategy
     */
    function test_aiHarvestsFromStrategy() public {
        // Setup: Owner adds strategy
        vm.prank(owner);
        vault.addStrategy(address(mockStrategy));

        vm.prank(owner);
        vault.setStrategyAllocation(address(mockStrategy), 10000);

        vm.prank(owner);
        vault.setAiAgent(aiAgent);

        // User deposits
        vm.startPrank(user);
        asset.approve(address(vault), 1000 * 10 ** 18);
        vault.deposit(1000 * 10 ** 18, user);
        vm.stopPrank();
        // AI deploys
        vm.prank(aiAgent);
        vault.deployToStrategy(address(mockStrategy), 1000 * 10 ** 18);

        // AI harvests (should get 10% yield = 100 tokens)
        vm.prank(aiAgent);
        uint256 harvested = vault.harvestAndRebalance();

        assertEq(harvested, 100 * 10 ** 18, "Should harvest 100 tokens (10% yield)");

        // Verify vault has more assets now
        uint256 totalAssets = vault.totalAssets();
        assertEq(totalAssets, 1100 * 10 ** 18, "Total assets should be 1100 (1000 + 100 yield)");
    }

    /**
     * @dev Test 6: User redeems and gets share of yield
     */
    function test_userRedeemesAndGetsYield() public {
        // Setup everything
        vm.prank(owner);
        vault.addStrategy(address(mockStrategy));

        vm.prank(owner);
        vault.setStrategyAllocation(address(mockStrategy), 10000);

        vm.prank(owner);
        vault.setAiAgent(aiAgent);

        // User deposits 1000
        vm.startPrank(user);
        asset.approve(address(vault), 1000e18);
        vault.deposit(1000e18, user);
        vm.stopPrank();
        // AI deploys
        vm.prank(aiAgent);
        vault.deployToStrategy(address(mockStrategy), 1000e18);

        // AI harvests yield
        vm.prank(aiAgent);
        vault.harvestAndRebalance();
        console.log("Vault Balance: ");
        console.log(IERC20(address(asset)).balanceOf(address(vault)));

        // Now vault has 1100 total, user has 1000 shares
        // When user redeems 1000 shares, should get 1100 tokens (their share of yield)
        vm.prank(user);
        uint256 assetsReceived = vault.redeem(1000e18, user, user);

        assertGt(assetsReceived, 1000e8, "User should get more than deposited (yield)");
        assertApproxEqAbs(assetsReceived, 1100e18, 10, "User gets ~1100");
    }
}
