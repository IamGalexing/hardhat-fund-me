const { ethers, getNamedAccounts } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  const fundMe = await ethers.getContract("FundMe", deployer);

  console.log("Funding contract...");
  const transactionResponce = await fundMe.fund({
    value: ethers.utils.parseEther("0.5"),
  });
  transactionResponce.wait(1);
  console.log("Funded");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
