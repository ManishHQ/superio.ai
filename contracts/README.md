# Superio Swap Contracts

Demo smart contracts for swapping ETH to FET tokens on Ethereum Sepolia testnet.

## Contracts

1. **FETToken.sol** - ERC-20 token representing Fetch.ai's FET token
2. **SimpleSwap.sol** - Simple swap contract that exchanges ETH for FET at a fixed rate

## Exchange Rate

- **1 ETH = 1,000 FET**
- Fixed rate for demonstration purposes

## Prerequisites

1. MetaMask or compatible wallet
2. Sepolia ETH for gas fees
3. Private key for deployment

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `../server/.env`:
```
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_etherscan_api_key (optional)
```

3. Compile contracts:
```bash
npm run compile
```

4. Deploy to Sepolia:
```bash
npm run deploy:sepolia
```

## Usage

Once deployed, you can swap ETH for FET by calling:

```solidity
simpleSwap.swapETHforFET{value: amountInWei}()
```

The contract will automatically:
1. Accept your ETH
2. Calculate FET amount based on exchange rate
3. Transfer FET tokens to your address

## Contract Addresses

After deployment, update these in your frontend:
- FET Token Address
- SimpleSwap Address

## Frontend Integration

To use in your frontend with wagmi:

```typescript
import { useContractWrite, usePrepareContractWrite } from 'wagmi'

const { config } = usePrepareContractWrite({
  address: '0x...', // SimpleSwap address
  abi: [...], // SimpleSwap ABI
  functionName: 'swapETHforFET',
  value: ethers.utils.parseEther('0.1'), // Amount in ETH
})

const { write } = useContractWrite(config)
```

## Security

⚠️ **For Demonstration Only** - This contract is for demo purposes and should not be used in production without proper auditing and security measures.
