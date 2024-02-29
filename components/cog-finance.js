const ABI_WETH_TOKEN = require('../data/abi-weth-.json');
const ABI_COG_FINANCE = require('../data/abi-cog-finance.json');
const { COG_FINANCE_CONTRACT, WETH_TOKEN_CONTRACT } = require('../constants/constants');

class CogFinance {
  constructor(web3) {
    this.web3 = web3;

    this.contractAddress = COG_FINANCE_CONTRACT;
    this.contract = new this.web3.eth.Contract(ABI_COG_FINANCE, this.contractAddress);
    this.wethToken = new this.web3.eth.Contract(ABI_WETH_TOKEN, WETH_TOKEN_CONTRACT);
  }

  async getAmountDeposit(address) {
    const amount = await this.contract.methods.user_collateral_share(address).call();

    return amount;
  }

  deposit(address, amountInWei) {
    return this.contract.methods.add_collateral(address, amountInWei);
  }

  withdraw(address, amount) {
    return this.contract.methods.remove_collateral(address, amount);
  }
}

module.exports = {
  CogFinance,
};
