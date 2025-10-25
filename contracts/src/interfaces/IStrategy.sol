// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0 <0.9.0;

/**
 * @dev Interface for strategy contracts
 * All strategies must implement this interface for standardized vault integration
 */
interface IStrategy {
    /**
     * @dev Deploy assets into the strategy
     * @param amount Amount of assets to deploy
     */
    function deploy(uint256 amount) external returns (uint256);

    /**
     * @dev Withdraw assets from the strategy
     * @param amount Amount of assets to withdraw
     */
    function withdraw(uint256 amount) external returns (uint256);

    /**
     * @dev Harvest rewards/fees from the strategy
     */
    function harvest() external returns (uint256 harvested);

    /**
     * @dev Get total assets currently deployed in strategy
     */
    function totalDeployed() external view returns (uint256);

    /**
     * @dev Get unrealized gains/losses
     */
    function getUnrealizedGains() external view returns (int256);

    /**
     * @dev Emergency withdrawal (for emergency scenarios)
     */
    function emergencyWithdraw() external;
}
