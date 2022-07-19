const { inputToConfig } = require("@ethereum-waffle/compiler");
const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert } = require("chai");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe, deployer;
      const sendValue = ethers.utils.parseEther("0.05");

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      it("allows people fund and withdraw", async function () {
        await fundMe.fund({ value: sendValue });
        await fundMe.cheaperWithdraw();
        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );

        assert.equal(endingFundMeBalance.toString(), "0");
      });
    });
