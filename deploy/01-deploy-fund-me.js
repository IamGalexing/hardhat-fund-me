const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

/* Version 1: 
function deployFunc(hre) {
  console.log("Hi! I do deploy!");
}

module.exports.default = deployFunc;
*/

// Version 2:
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  //   const ethUsdPriceFeedAddress = networkConfig[chainId][ethUsdPriceFeed];
  let ethUsdPriceFeedAddress;

  if (chainId == 31337) {
    // or if (developmentChains.includes(network.name))
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  log("Deploying FundMe and waiting for confirmations...");

  //what network we use?
  // when going to localhost or hardhat we want to use a mock
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args, // address from relevant network here
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
  log("--------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
