import { Dimensions, Image, PixelRatio, Platform } from "react-native";
// Blockchain
import KAIA from "../assets/logos/kaia.png";
import USDC from "../assets/logos/usdc.png";
import USDT from "../assets/logos/usdt.png";
import WETH from "../assets/logos/weth.png";

const normalizeFontSize = (size) => {
  let { width, height } = Dimensions.get("window");
  if (Platform.OS === "web" && height / width < 1) {
    width /= 2.3179;
    height *= 0.7668;
  }
  const scale = Math.min(width / 375, height / 667); // Based on a standard screen size
  return PixelRatio.roundToNearestPixel(size * scale);
};

const w = normalizeFontSize(50);
const h = normalizeFontSize(50);

export const refreshTime = 1000 * 60 * 0.25;

export const USDCicon = (
  <Image source={USDC} style={{ width: 30, height: 30, borderRadius: 10 }} />
);

export const iconsBlockchain = {
  usdc: (
    <Image source={USDC} style={{ width: w, height: h, borderRadius: 10 }} />
  ),
  usdt: (
    <Image source={USDT} style={{ width: w, height: h, borderRadius: 10 }} />
  ),
  weth: (
    <Image source={WETH} style={{ width: w, height: h, borderRadius: 10 }} />
  ),
  kaia: (
    <Image source={KAIA} style={{ width: w, height: h, borderRadius: 10 }} />
  ),
};

export const blockchain = {
  network: "Kaia Mainnet",
  token: "KAIA",
  chainId: 8217,
  blockExplorer: "https://www.kaiascan.io/",
  rpc: [
    "https://public-en.node.kaia.io",
    "https://kaia.blockpi.network/v1/rpc/public",
    "https://klaytn.api.onfinality.io/public",
    "https://go.getblock.io/d7094dbd80ab474ba7042603fe912332",
  ],
  iconSymbol: "kaia",
  decimals: 18,
  batchBalancesAddress: "0xba9b522EFb2E9dffA0aD7fdEB6A702A5B116dBd7",
  color: "#96bf00",
  tokens: [
    {
      name: "Kaia Token",
      color: "#96bf00",
      symbol: "KAIA",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      icon: iconsBlockchain.kaia,
      coingecko: "kaia",
    },
    {
      name: "Tether",
      color: "#008e8e",
      symbol: "USDT",
      address: "0x9025095263d1E548dc890A7589A4C78038aC40ab",
      decimals: 6,
      icon: iconsBlockchain.usdt,
      coingecko: "tether",
    },
    {
      name: "USD Coin",
      color: "#2775ca",
      symbol: "USDC",
      address: "0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C",
      decimals: 6,
      icon: iconsBlockchain.usdc,
      coingecko: "usd-coin",
    },
    {
      name: "Bridged USDC",
      color: "#2775ca",
      symbol: "USDC.e",
      address: "0xE2053BCf56D2030d2470Fb454574237cF9ee3D4B",
      decimals: 6,
      icon: iconsBlockchain.usdc,
      coingecko: "usd-coin",
    },
    {
      name: "Wrapped KAIA",
      color: "#9e1a13",
      symbol: "WKAIA",
      address: "0x19aac5f612f524b754ca7e7c41cbfa2e981a4432",
      decimals: 18,
      icon: iconsBlockchain.kaia,
      coingecko: "kaia",
    },
    {
      name: "Wrapped ETH",
      color: "#808080",
      symbol: "WETH",
      address: "0x55Acee547DF909CF844e32DD66eE55a6F81dC71b",
      decimals: 18,
      icon: iconsBlockchain.weth,
      coingecko: "weth",
    },
  ],
};
