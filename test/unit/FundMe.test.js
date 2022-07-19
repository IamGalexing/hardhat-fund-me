const { ethers, getNamedAccounts, deployments } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe, deployer, mockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1"); //1 ETH or 1000000000000000000 wei

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        /* OR to get deployer
      const accounts = await ethers.getSigners();
      const accountZero = accounts[0];
      */
        await deployments.fixture("all");
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", async function () {
        it("set the aggregator addresses correctly", async function () {
          const responce = await fundMe.getPriceFeed();
          assert.equal(responce, mockV3Aggregator.address);
        });
      });

      describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
          expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("updated the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const responce = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(responce.toString(), sendValue.toString());
        });

        it("Adds funder to array of getFounder", async function () {
          await fundMe.fund({ value: sendValue });
          const responce = await fundMe.getFounder(0);
          assert.equal(responce, deployer);
        });
      });

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single funder", async function () {
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponce = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponce.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          assert(endingFundMeBalance, 0);
          assert(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("allows us to withdraw with multiple getFounder", async function () {
          const accounts = await ethers.getSigners();

          for (let i = 1; i < 6; i++) {
            const fundMeConnectedAccount = await fundMe.connect(accounts[i]);
            await fundMeConnectedAccount.fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponce = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponce.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          assert(endingFundMeBalance, 0);
          assert(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const fundMeConnectedCotract = await fundMe.connect(accounts[1]);
          await expect(fundMeConnectedCotract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          );
        });
      });
    });
