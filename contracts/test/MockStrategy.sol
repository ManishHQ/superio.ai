// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {IStrategy} from "../src/interfaces/IStrategy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @dev Simple Mock Strategy for testing
 * Just holds tokens and generates 10% yield on harvest
 */
contract MockStrategy is IStrategy {
    using SafeERC20 for IERC20;

    IERC20 public asset;
    address public vault;
    uint256 public totalDeployedAmount;

    constructor(address _asset, address _vault) {
        asset = IERC20(_asset);
        vault = _vault;
    }

    /**
     * @dev Deploy assets - just receive and hold
     */
    function deploy(uint256 amount) external returns (uint256) {
        require(msg.sender == vault, "Only vault");
        asset.safeTransferFrom(vault, address(this), amount);
        totalDeployedAmount += amount;
        return amount;
    }

    /**
     * @dev Withdraw assets
     */
    function withdraw(uint256 amount) external returns (uint256) {
        require(msg.sender == vault, "Only vault");
        require(amount <= totalDeployedAmount, "Insufficient deployed");
        asset.safeTransfer(vault, amount);
        totalDeployedAmount -= amount;
        return amount;
    }

    /**
     * @dev Harvest - generate 10% yield
     */
    function harvest() external returns (uint256 harvested) {
        require(msg.sender == vault, "Only vault");
        // Generate 10% yield
        harvested = (totalDeployedAmount * 10) / 100;
        if (harvested > 0) {
            asset.safeTransfer(vault, harvested);
        }
        return harvested;
    }

    /**
     * @dev Get total deployed
     */
    function totalDeployed() external view returns (uint256) {
        return totalDeployedAmount;
    }

    /**
     * @dev Get unrealized gains (mock)
     */
    function getUnrealizedGains() external view returns (int256) {
        return int256((totalDeployedAmount * 10) / 100);
    }

    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw() external {
        require(msg.sender == vault, "Only vault");
        uint256 balance = asset.balanceOf(address(this));
        if (balance > 0) {
            asset.safeTransfer(vault, balance);
        }
        totalDeployedAmount = 0;
    }
}
