// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleSwap is ReentrancyGuard {
    // FET Token contract
    ERC20 public FETToken;
    
    // Exchange rate: 1 ETH = 1000 FET
    uint256 public constant EXCHANGE_RATE = 1000;
    uint256 public constant DECIMALS = 18;
    
    // Events
    event SwapExecuted(
        address indexed user,
        uint256 ethAmount,
        uint256 fetAmount,
        uint256 timestamp
    );
    
    event TokensReceived(
        address indexed from,
        uint256 amount
    );
    
    constructor(address _fetToken) ReentrancyGuard() {
        FETToken = ERC20(_fetToken);
        owner = msg.sender;
    }
    
    /**
     * @notice Swap ETH for FET tokens
     * @dev User sends ETH and receives FET tokens at a fixed rate
     */
    function swapETHforFET() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        require(address(FETToken) != address(0), "FET token not set");
        
        // Calculate FET amount based on exchange rate
        uint256 fetAmount = (msg.value * EXCHANGE_RATE * 10**DECIMALS) / 10**DECIMALS;
        
        // Check if contract has enough tokens
        require(
            FETToken.balanceOf(address(this)) >= fetAmount,
            "Insufficient FET tokens in contract"
        );
        
        // Transfer FET tokens to user
        FETToken.transfer(msg.sender, fetAmount);
        
        emit SwapExecuted(msg.sender, msg.value, fetAmount, block.timestamp);
    }
    
    /**
     * @notice Get the amount of FET tokens for a given ETH amount
     * @param ethAmount Amount of ETH to swap
     * @return Amount of FET tokens received
     */
    function getFETAmount(uint256 ethAmount) external pure returns (uint256) {
        return (ethAmount * EXCHANGE_RATE * 10**DECIMALS) / 10**DECIMALS;
    }
    
    /**
     * @notice Get contract balance of FET tokens
     * @return Balance of FET tokens
     */
    function getFETBalance() external view returns (uint256) {
        return FETToken.balanceOf(address(this));
    }
    
    /**
     * @notice Get contract ETH balance
     * @return Balance of ETH
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Allow owner to withdraw ETH (for demonstration purposes)
     */
    function withdrawETH() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    /**
     * @notice Allow contract to receive FET tokens
     */
    receive() external payable {
        emit TokensReceived(msg.sender, msg.value);
    }
    
    // Owner functionality
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
}
