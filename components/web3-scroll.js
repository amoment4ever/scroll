const { HttpsProxyAgent } = require('https-proxy-agent');
const { Web3 } = require('web3');
const { RPCS } = require('../constants/constants');
const { proxies } = require('../proxies');
const { LinkedList } = require('../utils/linked-list');

const web3ScrollList = new LinkedList([]);

const RPC_SCROLL = RPCS.find((item) => item.chain === 'SCROLL');

proxies.array.forEach((proxy) => {
  let agent;

  if (proxy.proxy) {
    agent = new HttpsProxyAgent(proxy.proxy);
  }

  const web3Scroll = new Web3(new Web3.providers.HttpProvider(RPC_SCROLL.rpc, {
    providerOptions: { agent },
  }));

  // console.log(web3.provider.httpProviderOptions.providerOptions);
  // web3.provider.httpProviderOptions.agent = agent;

  web3ScrollList.push({ web3Scroll, scan: RPC_SCROLL.scan, proxy });
});

module.exports = {
  web3ScrollList,
};
