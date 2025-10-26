const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying contracts to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy FET Token
  console.log("\n1️⃣ Deploying FET Token...");
  const FETToken = await hre.ethers.getContractFactory("FETToken");
  const fetToken = await FETToken.deploy();
  await fetToken.waitForDeployment();
  const fetTokenAddress = await fetToken.getAddress();
  console.log("✅ FET Token deployed to:", fetTokenAddress);

  // 2. Deploy SimpleSwap
  console.log("\n2️⃣ Deploying SimpleSwap contract...");
  const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy(fetTokenAddress);
  await simpleSwap.waitForDeployment();
  const swapAddress = await simpleSwap.getAddress();
  console.log("✅ SimpleSwap deployed to:", swapAddress);

  // 3. Transfer ownership
  console.log("\n3️⃣ Setting up ownership...");
  const ownerTx = await simpleSwap.transferOwnership(deployer.address);
  await ownerTx.wait();
  console.log("✅ Ownership set to deployer");

  // 4. Fund the swap contract with FET tokens
  console.log("\n4️⃣ Funding swap contract with FET tokens...");
  const fundingAmount = hre.ethers.parseEther("1000000"); // 1M FET tokens
  const fundTx = await fetToken.transfer(swapAddress, fundingAmount);
  await fundTx.wait();
  console.log("✅ Transferred 1,000,000 FET tokens to swap contract");

  // Display summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("FET Token Address:", fetTokenAddress);
  console.log("SimpleSwap Address:", swapAddress);
  console.log("Exchange Rate: 1 ETH = 1000 FET");
  console.log("Initial FET Supply in Contract: 1,000,000 FET");
  console.log("=".repeat(60));

  // Wait for blocks to be mined
  console.log("\n⏳ Waiting for block confirmations...");
  await hre.ethers.provider.waitForTransaction(fundTx.hash, 2);

  console.log("\n✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Update the contract address in your frontend");
  console.log("2. Test the swap functionality");
  console.log("3. View on Sepolia Etherscan:");
  console.log("   - FET Token:", `https://sepolia.etherscan.io/address/${fetTokenAddress}`);
  console.log("   - SimpleSwap:", `https://sepolia.etherscan.io/address/${swapAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
