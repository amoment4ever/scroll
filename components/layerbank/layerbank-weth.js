const { LAYERBANK_WETH_CONTRACT } = require('../../constants/constants');
const { ERC20Contract } = require('../erc20');

class LayerbankWeth extends ERC20Contract {
  constructor(web3) {
    super(web3, LAYERBANK_WETH_CONTRACT);
  }
}

module.exports = {
  LayerbankWeth,
};
