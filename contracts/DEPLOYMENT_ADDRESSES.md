# Contract Deployment Addresses

## Local Hardhat Network

- **FET Token**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **SimpleSwap**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **Exchange Rate**: 1 ETH = 1,000 FET
- **Initial FET Supply**: 1,000,000 FET

## Sepolia Testnet

*To be deployed*

## Usage

To use these contracts in your frontend:

```typescript
// For local development
export const FET_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const SIMPLE_SWAP_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
```

## Swap Function

The `SimpleSwap` contract has a main function:
- `swapETHforFET()` - Swap ETH for FET tokens at a rate of 1:1000
