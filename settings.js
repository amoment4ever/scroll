// sleep между действиями
const SLEEP_MIN_MS = 30000;
const SLEEP_MAX_MS = 70000;

// sleep между акками
const SLEEP_MIN_ACC_MS = 100_000;
const SLEEP_MAX_ACC_MS = 200_000;

const MIN_AMOUNT_ETH = 0.5;
const MAX_AMOUNT_ETH = 0.85;

const LEAVE_AMOUNT_ETH_MIN = 0.012;
const LEAVE_AMOUNT_ETH_MAX = 0.015;

const AMOUNT_BORROW_PERCENT = 0.5;

const MAX_SWAP_USDC = 800;
const MAX_SWAP_ETH = 0.3;

const MAX_GWEI_ETH = 40;

module.exports = {
  SLEEP_MIN_MS,
  SLEEP_MAX_MS,
  MIN_AMOUNT_ETH,
  MAX_AMOUNT_ETH,
  AMOUNT_BORROW_PERCENT,
  MAX_GWEI_ETH,
  LEAVE_AMOUNT_ETH_MIN,
  LEAVE_AMOUNT_ETH_MAX,
  MAX_SWAP_USDC,
  SLEEP_MIN_ACC_MS,
  SLEEP_MAX_ACC_MS,
  MAX_SWAP_ETH,
};
