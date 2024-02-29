const RPCS = [
  {
    chain: 'ETH', rpc: 'https://rpc.ankr.com/eth', scan: 'https://etherscan.io', token: 'ETH',
  },
  {
    chain: 'ZKSYNC', rpc: 'https://rpc.ankr.com/zksync_era', scan: 'https://www.oklink.com/zksync', token: 'ETH',
  },
  {
    chain: 'ARBITRUM', rpc: 'https://arb1.arbitrum.io/rpc', scan: 'https://arbiscan.io', token: 'ETH',
  },
  {
    chain: 'NOVA', rpc: 'https://rpc.ankr.com/arbitrumnova', scan: 'https://nova.arbiscan.io', token: 'ETH',
  },
  {
    chain: 'OPTIMISM', rpc: 'https://rpc.ankr.com/optimism', scan: 'https://optimistic.etherscan.io', token: 'ETH',
  },
  {
    chain: 'SCROLL', rpc: 'https://rpc.ankr.com/scroll', scan: 'https://scrollscan.com', token: 'ETH',
  },
  {
    chain: 'BASE', rpc: 'https://1rpc.io/base', scan: 'https://basescan.org', token: 'ETH',
  },
  {
    chain: 'LINEA', rpc: 'https://1rpc.io/linea', scan: 'https://lineascan.build', token: 'ETH',
  },
  {
    chain: 'MANTA', rpc: 'https://1rpc.io/manta', scan: 'https://pacific-explorer.manta.network/', token: 'ETH',
  },
  {
    chain: 'ZORA', rpc: 'https://rpc.zora.energy', scan: 'https://explorer.zora.energy/', token: 'ETH',
  },
  {
    chain: 'ZKF', rpc: 'https://rpc.zkfair.io', scan: 'https://scan.zkfair.io', token: 'USDC',
  },
  {
    chain: 'BSC', rpc: 'https://rpc.ankr.com/bsc', scan: 'https://bscscan.com', token: 'BNB',
  },
  {
    chain: 'POLYGON', rpc: 'https://rpc.ankr.com/polygon', scan: 'https://polygonscan.com', token: 'MATIC',
  },
  {
    chain: 'AVAXC', rpc: 'https://avalanche.public-rpc.com', scan: 'https://snowtrace.io', token: 'AVAX',
  },
  {
    chain: 'FTM', rpc: 'https://rpc.ankr.com/fantom', scan: 'https://ftmscan.com', token: 'FTM',
  },
  {
    chain: 'CORE', rpc: 'https://rpc.coredao.org', scan: 'https://scan.coredao.org', token: 'CORE',
  },
  {
    chain: 'METIS', rpc: 'https://andromeda.metis.io/?owner=1088', scan: 'https://andromeda-explorer.metis.io', token: 'METIS',
  },
  {
    chain: 'GNOSIS', rpc: 'https://rpc.ankr.com/gnosis', scan: 'https://gnosisscan.io', token: 'XDAI',
  },
  {
    chain: 'CELO', rpc: 'https://rpc.ankr.com/celo', scan: 'https://celoscan.io', token: 'CELO',
  },
  {
    chain: 'HARMONY', rpc: 'https://rpc.ankr.com/harmony', scan: 'https://explorer.harmony.one', token: 'ONE',
  },
];

const LAYERBANK_CONTRACT = '0xec53c830f4444a8a56455c6836b5d2aa794289aa';
const LAYERBANK_WETH_CONTRACT = '0x274C3795dadfEbf562932992bF241ae087e0a98C';
const LAYERBANK_USDC = '0x0D8F8e271DD3f2fC58e5716d3Ff7041dBe3F0688';

const AAVE_CONTRACT = '0xff75a4b698e3ec95e608ac0f22a03b8368e05f5d';
const AAVE_WETH_CONTRACT = '0xf301805be1df81102c957f6d4ce29d2b8c056b2a';
const AAVE_POOL_V3 = '0x11fCfe756c05AD438e312a7fd934381537D3cFfe';

const COG_FINANCE_CONTRACT = '0x4ac126e5dd1cd496203a7e703495caa8112a20ca';

const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const INFINITY_APPROVE = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

const WETH_TOKEN_CONTRACT = '0x5300000000000000000000000000000000000004';
const USDC_TOKEN_ADDRESS = '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4';
const USDT_TOKEN_ADDRESS = '0xf55bec9cafdbe8730f096aa55dad6d22d44099df';

const SYNCSWAP_ROUTER_CONTRACT = '0x80e38291e06339d10aab483c65695d004dbd5c69';
const SYNCSWAP_POOL_CONTRACT = '0x37BAc764494c8db4e54BDE72f6965beA9fa0AC2d';
const SYNCSWAP_STABLE_POOL_FACTORY = '0xe4cf807e351b56720b17a59094179e7ed9dd3727';

module.exports = {
  RPCS,
  NATIVE_TOKEN,
  LAYERBANK_WETH_CONTRACT,
  LAYERBANK_CONTRACT,
  AAVE_CONTRACT,
  AAVE_WETH_CONTRACT,
  AAVE_POOL_V3,
  INFINITY_APPROVE,
  COG_FINANCE_CONTRACT,
  WETH_TOKEN_CONTRACT,
  SYNCSWAP_POOL_CONTRACT,
  SYNCSWAP_ROUTER_CONTRACT,
  ZERO_ADDRESS,
  USDC_TOKEN_ADDRESS,
  LAYERBANK_USDC,
  USDT_TOKEN_ADDRESS,
  SYNCSWAP_STABLE_POOL_FACTORY,
};
