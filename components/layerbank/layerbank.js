const ABI_LAYERBANK = require('../../data/abi-layerbank.json');
const ABI_LP = require('../../data/abi-layerbank-lp.json');
const { LAYERBANK_CONTRACT, LAYERBANK_WETH_CONTRACT } = require('../../constants/constants');
const { LayerbankWeth } = require('./layerbank-weth');

class LayerBank {
  constructor(web3) {
    this.web3 = web3;
    this.contractAddress = LAYERBANK_CONTRACT;
    this.contract = new this.web3.eth.Contract(ABI_LAYERBANK, this.contractAddress);
    this.layerBankWeth = new LayerbankWeth(this.web3);
    this.layerBankWethContract = new web3.eth.Contract(ABI_LP, LAYERBANK_WETH_CONTRACT);
  }

  async getAmountDeposit(address) {
    const amount = await this.layerBankWethContract.methods.underlyingBalanceOf(address).call();

    return amount;
  }

  deposit(amountWei) {
    return this.contract.methods.supply(LAYERBANK_WETH_CONTRACT, amountWei);
  }

  async getBorrowAmount(lpAddress, address) {
    const contractLp = new this.web3.eth.Contract(ABI_LP, lpAddress);

    return await contractLp.methods.borrowBalanceOf(address).call();
  }

  withdraw(amountWei) {
    return this.contract.methods.redeemUnderlying(LAYERBANK_WETH_CONTRACT, amountWei);
  }

  borrow(lToken, amount) {
    return this.contract.methods.borrow(lToken, amount);
  }

  enterMarket() {
    return this.contract.methods.enterMarkets([LAYERBANK_WETH_CONTRACT]);
  }

  repay(lToken, amount) {
    return this.contract.methods.repayBorrow(lToken, amount);
  }
}

module.exports = {
  LayerBank,
};
