// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStrategy} from "./interfaces/IStrategy.sol";

contract Vault is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    // Strategy Management
    IStrategy[] public strategies;
    mapping(address => bool) public isActiveStrategy;
    mapping(address => uint256) public strategyDeployedAssets;
    mapping(address => uint256) public strategyAllocation; // Percentage allocation (e.g., 3000 = 30%)

    uint256 public totalDeployedAssets;
    uint256 public maxTotalDeployed; // Max total assets that can be deployed

    // AI Agent Management
    address public aiAgent;
    bool public aiAgentEnabled;

    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    event StrategyAdded(address indexed strategy);
    event StrategyRemoved(address indexed strategy);
    event StrategyDeployed(address indexed strategy, uint256 indexed amount);
    event StrategyWithdrawn(address indexed strategy, uint256 indexed amount);
    event StrategyHarvested(address indexed strategy, uint256 indexed amount);
    event Rebalanced(uint256 timestamp);
    event AllocationUpdated(address indexed strategy, uint256 allocation);
    event AIAgentSet(address indexed agent);
    event MaxTotalDeployedUpdated(uint256 newMax);

    /*//////////////////////////////////////////////////////////////
                            ERRORS
    //////////////////////////////////////////////////////////////*/

    error NoStrategies();
    error InsufficientAssets();
    error StrategyAlreadyActive();
    error StrategyNotActive();
    error InvalidAllocation();
    error MaxDeployedExceeded();
    error OnlyAIAgent();
    error InvalidTotalAllocation();

    /*//////////////////////////////////////////////////////////////
                            INTERNAL FUNCTION
    //////////////////////////////////////////////////////////////*/

    function _checkOnlyAiAgent() internal view {
        if (msg.sender != aiAgent && msg.sender != owner()) revert OnlyAIAgent();
    }

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyAiAgent() {
        _checkOnlyAiAgent();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            Constructor
    //////////////////////////////////////////////////////////////*/

    constructor(IERC20 _asset, string memory _name, string memory _symbol, uint256 _maxTotalDeployed)
        ERC4626(_asset)
        ERC20(_name, _symbol)
        Ownable(msg.sender)
    {
        maxTotalDeployed = _maxTotalDeployed;
        aiAgentEnabled = false;
    }

    /*//////////////////////////////////////////////////////////////
                    STRATEGY MANAGEMENT (Owner/AI)
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Add a new strategy to the vault
     * @param _strategy Address of the strategy contract
     */
    function addStrategy(address _strategy) external onlyOwner {
        if (_strategy == address(0)) revert InvalidAllocation();
        if (isActiveStrategy[_strategy]) revert StrategyAlreadyActive();

        strategies.push(IStrategy(_strategy));
        isActiveStrategy[_strategy] = true;
        strategyAllocation[_strategy] = 0; // Owner sets allocation later

        emit StrategyAdded(_strategy);
    }

    /**
     * @dev Remove a strategy from the vault
     * @param _strategy Address of the strategy to remove
     */
    function removeStrategy(address _strategy) external onlyOwner {
        if (!isActiveStrategy[_strategy]) revert StrategyNotActive();

        // Withdraw all assets from this strategy first
        if (strategyDeployedAssets[_strategy] > 0) {
            IStrategy(_strategy).withdraw(strategyDeployedAssets[_strategy]);
            totalDeployedAssets -= strategyDeployedAssets[_strategy];
            strategyDeployedAssets[_strategy] = 0;
        }

        // Remove from active strategies
        isActiveStrategy[_strategy] = false;
        strategyAllocation[_strategy] = 0;

        // Remove from array
        for (uint256 i = 0; i < strategies.length; i++) {
            if (address(strategies[i]) == _strategy) {
                strategies[i] = strategies[strategies.length - 1];
                strategies.pop();
                break;
            }
        }

        emit StrategyRemoved(_strategy);
    }

    /**
     * @dev Set allocation percentage for a strategy
     * @param _strategy Address of the strategy
     * @param _allocation Allocation percentage (e.g., 3000 = 30%)
     */
    function setStrategyAllocation(address _strategy, uint256 _allocation) external onlyOwner {
        if (!isActiveStrategy[_strategy]) revert StrategyNotActive();
        if (_allocation > 10000) revert InvalidAllocation(); // Max 100%

        strategyAllocation[_strategy] = _allocation;

        // Verify total allocation doesn't exceed 100%
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < strategies.length; i++) {
            totalAllocation += strategyAllocation[address(strategies[i])];
        }
        if (totalAllocation > 10000) revert InvalidTotalAllocation();

        emit AllocationUpdated(_strategy, _allocation);
    }

    /**
     * @dev Deploy assets to specific strategy
     * @param _strategy Address of the strategy
     * @param amount Amount to deploy
     */
    function deployToStrategy(address _strategy, uint256 amount) external onlyAiAgent returns (uint256) {
        if (!isActiveStrategy[_strategy]) revert StrategyNotActive();
        if (amount > IERC20(asset()).balanceOf(address(this))) revert InsufficientAssets();
        if (totalDeployedAssets + amount > maxTotalDeployed) revert MaxDeployedExceeded();

        // Approve strategy to spend assets
        IERC20(asset()).safeIncreaseAllowance(address(_strategy), amount);

        // Deploy to strategy
        IStrategy(_strategy).deploy(amount);
        strategyDeployedAssets[_strategy] += amount;
        totalDeployedAssets += amount;

        emit StrategyDeployed(_strategy, amount);
        return amount;
    }

    /**
     * @dev Withdraw assets from specific strategy
     * @param _strategy Address of the strategy
     * @param amount Amount to withdraw
     */
    function withdrawFromStrategy(address _strategy, uint256 amount) external onlyOwner returns (uint256) {
        if (!isActiveStrategy[_strategy]) revert StrategyNotActive();
        if (amount > strategyDeployedAssets[_strategy]) revert InsufficientAssets();

        // Withdraw from strategy
        IStrategy(_strategy).withdraw(amount);
        strategyDeployedAssets[_strategy] -= amount;
        totalDeployedAssets -= amount;

        emit StrategyWithdrawn(_strategy, amount);
        return amount;
    }

    /**
     * @dev Harvest rewards from all strategies and rebalance
     */
    function harvestAndRebalance() external onlyAiAgent returns (uint256 totalHarvested) {
        if (strategies.length == 0) revert NoStrategies();

        // Harvest from all strategies
        for (uint256 i = 0; i < strategies.length; i++) {
            address strategyAddr = address(strategies[i]);
            if (strategyDeployedAssets[strategyAddr] > 0) {
                uint256 harvested = strategies[i].harvest();
                totalHarvested += harvested;
                emit StrategyHarvested(strategyAddr, harvested);
            }
        }

        // Auto-rebalance after harvest
        // _rebalanceAllStrategies();

        emit Rebalanced(block.timestamp);
        return totalHarvested;
    }

    /**
     * @dev Manually trigger rebalancing
     */
    function rebalance() external onlyAiAgent {
        if (strategies.length == 0) revert NoStrategies();
        _rebalanceAllStrategies();
        emit Rebalanced(block.timestamp);
    }

    /**
     * @dev Internal rebalancing logic
     * Redistributes deployed assets according to allocations
     */
    function _rebalanceAllStrategies() internal {
        uint256 totalAsset = IERC20(asset()).balanceOf(address(this)) + totalDeployedAssets;
        uint256 targetDeployed = 0;

        // Calculate total allocation percentage
        for (uint256 i = 0; i < strategies.length; i++) {
            address strategyAddr = address(strategies[i]);
            uint256 allocation = strategyAllocation[strategyAddr];
            uint256 targetAmount = (totalAsset * allocation) / 10000;

            if (targetAmount > maxTotalDeployed) {
                targetAmount = maxTotalDeployed;
            }
            targetDeployed += targetAmount;
        }

        // Rebalance each strategy
        for (uint256 i = 0; i < strategies.length; i++) {
            address strategyAddr = address(strategies[i]);
            uint256 allocation = strategyAllocation[strategyAddr];
            uint256 targetAmount = (totalAsset * allocation) / 10000;

            uint256 currentDeployed = strategyDeployedAssets[strategyAddr];

            if (targetAmount > currentDeployed) {
                // Deploy more
                uint256 deployAmount = targetAmount - currentDeployed;
                if (IERC20(asset()).balanceOf(address(this)) >= deployAmount) {
                    IERC20(asset()).safeIncreaseAllowance(address(strategies[i]), deployAmount);
                    strategies[i].deploy(deployAmount);
                    strategyDeployedAssets[strategyAddr] += deployAmount;
                    totalDeployedAssets += deployAmount;
                }
            } else if (targetAmount < currentDeployed) {
                // Withdraw some
                uint256 withdrawAmount = currentDeployed - targetAmount;
                strategies[i].withdraw(withdrawAmount);
                strategyDeployedAssets[strategyAddr] -= withdrawAmount;
                totalDeployedAssets -= withdrawAmount;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                        AI AGENT MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Set AI agent address
     * @param _aiAgent Address of the AI agent
     */
    function setAiAgent(address _aiAgent) external onlyOwner {
        if (_aiAgent == address(0)) revert InvalidAllocation();
        aiAgent = _aiAgent;
        aiAgentEnabled = true;
        emit AIAgentSet(_aiAgent);
    }

    /**
     * @dev Disable/Enable AI agent
     */
    function toggleAiAgent(bool _enabled) external onlyOwner {
        aiAgentEnabled = _enabled;
    }

    /*//////////////////////////////////////////////////////////////
                        CONFIGURATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Set max total deployed assets
     * @param _maxDeployed Maximum total amount that can be deployed
     */
    function setMaxTotalDeployed(uint256 _maxDeployed) external onlyOwner {
        maxTotalDeployed = _maxDeployed;
        emit MaxTotalDeployedUpdated(_maxDeployed);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Get all active strategies
     */
    function getStrategies() external view returns (IStrategy[] memory) {
        return strategies;
    }

    /**
     * @dev Get strategy details
     */
    function getStrategyInfo(address _strategy)
        external
        view
        returns (uint256 deployed, uint256 allocation, bool active)
    {
        return (strategyDeployedAssets[_strategy], strategyAllocation[_strategy], isActiveStrategy[_strategy]);
    }

    /**
     * @dev Get total vault assets (in vault + deployed)
     */
    function getTotalAssets() external view returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + totalDeployedAssets;
    }

    /*//////////////////////////////////////////////////////////////
                        ERC4626 OVERRIDES
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Calculate total assets (deployed + in vault)
     */
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + totalDeployedAssets;
    }

    /**
     * @dev Override _withdraw to automatically pull from strategies if needed
     * This handles both withdraw() and redeem() calls
     */
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
    {
        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        // Burn shares first
        _burn(owner, shares);

        // Check vault balance
        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));

        // If we need more assets than available in vault, withdraw from strategies
        if (assets > vaultBalance) {
            uint256 needed = assets - vaultBalance;
            _withdrawFromStrategies(needed);
        }

        // Transfer assets to receiver
        SafeERC20.safeTransfer(IERC20(asset()), receiver, assets);

        emit Withdraw(caller, receiver, owner, assets, shares);
    }

    /**
     * @dev Internal function to withdraw assets from strategies
     * Withdraws from strategies until we have enough assets
     */
    function _withdrawFromStrategies(uint256 amount) internal {
        uint256 remaining = amount;

        // Iterate through strategies and withdraw
        for (uint256 i = 0; i < strategies.length && remaining > 0; i++) {
            address strategyAddr = address(strategies[i]);
            uint256 deployed = strategyDeployedAssets[strategyAddr];

            if (deployed > 0) {
                uint256 toWithdraw = deployed > remaining ? remaining : deployed;
                strategies[i].withdraw(toWithdraw);
                strategyDeployedAssets[strategyAddr] -= toWithdraw;
                totalDeployedAssets -= toWithdraw;
                remaining -= toWithdraw;
            }
        }
    }
}
