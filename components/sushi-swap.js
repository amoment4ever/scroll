const rp = require('request-promise');
const ABI = require('../data/abi-sushi-swap.json');
const { SUSHI_SWAP_ROUTER } = require('../constants/constants');

class SushiSwap {
  constructor(web3, proxy) {
    this.web3 = web3;

    this.contractAddress = SUSHI_SWAP_ROUTER;
    this.contract = new this.web3.eth.Contract(ABI, SUSHI_SWAP_ROUTER);
    this.request = rp.defaults({
      json: true,
      gzip: true,
      proxy,
    });
  }

  async getData({
    tokenIn,
    tokenOut,
    amount,
    maxPriceImpact = 0.005,
    gasPrice,
    to,
  }) {
    const chaindId = await this.web3.eth.getChainId();
    const url = `https://api.sushi.com/swap/v4/${chaindId.toString()}`;

    const params = {
      tokenIn,
      tokenOut,
      amount,
      maxPriceImpact,
      gasPrice,
      to,
      preferSushi: true,
    };

    return await this.request({
      url,
      qs: params,
    });
  }

  async swap(fromTokenAddress, toTokenAddress, amount, slippage, senderAddress, gasPrice) {
    const data = await this.getData({
      tokenIn: fromTokenAddress,
      tokenOut: toTokenAddress,
      amount,
      maxPriceImpact: slippage,
      to: senderAddress,
      gasPrice,
    });

    const {
      tokenIn, amountIn, tokenOut, amountOutMin, to, routeCode, value,
    } = data.routeProcessorArgs;

    const method = this.contract.methods.processRoute(
      tokenIn,
      amountIn,
      tokenOut,
      amountOutMin,
      to,
      routeCode,
    );

    return {
      method,
      value,
    };
  }
}

module.exports = {
  SushiSwap,
};
