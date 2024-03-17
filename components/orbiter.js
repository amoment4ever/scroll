const rp = require('request-promise');

class Orbiter {
  constructor(web3, proxy) {
    this.web3 = web3;
    this.proxy = proxy;
    this.request = rp.defaults({
      json: true,
      gzip: true,
      proxy,
    });
  }

  async getBridgeAmount(fromChain, toChain, amount) {
    const url = 'https://openapi.orbiter.finance/explore/v3/yj6toqvwh1177e1sexfy0u1pxx5j8o47';

    const CHAIN_IDS = {
      ETH: '1',
      ARBITRUM: '42161',
      OPTIMISM: '10',
      ZKSYNC: '324',
      NOVA: '42170',
      ZKEVM: '1101',
      SCROLL: '534352',
      BASE: '8453',
      LINEA: '59144',
      ZORA: '7777777',
    };

    const body = {
      id: 1,
      jsonrpc: '2.0',
      method: 'orbiter_calculatedAmount',
      params: [`${CHAIN_IDS[fromChain]}-${CHAIN_IDS[toChain]}:ETH-ETH`, parseFloat(amount)],
    };

    const data = await this.request({
      url,
      body,
      method: 'post',
    });

    const {
      _receiveValue, _sendValue, receiveValue, actualSend,
    } = data.result;

    const CONTRACTS = {
      SCROLL: '0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8',
      LINEA: '0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8',
    };

    return {
      _receiveValue,
      _sendValue,
      receiveValue,
      actualSend,
      to: CONTRACTS[fromChain],
    };
  }
}

module.exports = {
  Orbiter,
};
