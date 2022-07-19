// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();

contract FundMe {
  using PriceConverter for uint256;

  uint256 public constant MINIMUM_USD = 50 * 10**18;
  address private immutable i_owner;
  AggregatorV3Interface private s_priceFeed;
  address[] private s_founders;
  mapping(address => uint256) private s_addressToAmountFunded;

  modifier onlyOwner() {
    // require(msg.sender == owner);
    if (msg.sender != i_owner) revert FundMe__NotOwner();
    _;
  }

  constructor(address priceFeed) {
    i_owner = msg.sender;
    s_priceFeed = AggregatorV3Interface(priceFeed);
  }

  // receive() external payable {
  //   fund();
  // }

  // fallback() external payable {
  //   fund();
  // }

  /**
   * @notice this function funds this contact
   * @dev this implements price feeds as our library
   */
  function fund() public payable {
    require(
      msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
      "You need to spend more ETH!"
    );
    // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
    s_addressToAmountFunded[msg.sender] += msg.value;
    s_founders.push(msg.sender);
  }

  function withdraw() public payable onlyOwner {
    for (
      uint256 funderIndex = 0;
      funderIndex < s_founders.length;
      funderIndex++
    ) {
      address funder = s_founders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    s_founders = new address[](0);
    // // transfer
    // payable(msg.sender).transfer(address(this).balance);
    // // send
    // bool sendSuccess = payable(msg.sender).send(address(this).balance);
    // require(sendSuccess, "Send failed");
    // call
    (bool callSuccess, ) = payable(msg.sender).call{
      value: address(this).balance
    }("");
    require(callSuccess, "Call failed");
  }

  function cheaperWithdraw() public payable onlyOwner {
    address[] memory founders = s_founders;
    for (
      uint256 funderIndex = 0;
      funderIndex < founders.length;
      funderIndex++
    ) {
      address founder = founders[funderIndex];
      s_addressToAmountFunded[founder] = 0;
    }
    s_founders = new address[](0);

    (bool callSuccess, ) = payable(msg.sender).call{
      value: address(this).balance
    }("");
    require(callSuccess, "Call failed");
  }

  function getOwner() public view returns (address) {
    return i_owner;
  }

  function getFounder(uint256 index) public view returns (address) {
    return s_founders[index];
  }

  function getAddressToAmountFunded(address index)
    public
    view
    returns (uint256)
  {
    return s_addressToAmountFunded[index];
  }

  function getPriceFeed() public view returns (AggregatorV3Interface) {
    return s_priceFeed;
  }
}