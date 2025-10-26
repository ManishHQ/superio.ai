// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FETToken is ERC20, Ownable {
    constructor() ERC20("Fetch.ai", "FET") {
        // Mint 10 million FET tokens
        _mint(msg.sender, 10_000_000 * 10**decimals());
    }
    
    /**
     * @notice Mint new tokens (for contract liquidity)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
