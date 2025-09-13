const functions = require('@google-cloud/functions-framework');
const Firestore = require("@google-cloud/firestore");
const {
  abi: abiERC20,
} = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const { DynamicProvider, FallbackStrategy } = require("ethers-dynamic-provider");
const { parseEther, parseUnits, Interface, Wallet } = require("ethers")

const db = new Firestore({
  projectId: "effisend",
  keyFilename: "credential.json",
});

const Accounts = db.collection("AccountsKaia");

const rpcs = [
  "https://public-en.node.kaia.io",
  "https://kaia.blockpi.network/v1/rpc/public",
  "https://klaytn.api.onfinality.io/public",
  "https://go.getblock.io/d7094dbd80ab474ba7042603fe912332",
]

const provider = new DynamicProvider(rpcs, {
  strategy: new FallbackStrategy(),
});

const tokens = [
  {
    name: "Kaia Token",
    color: "#bff009",
    symbol: "KAIA",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    coingecko: "kaia",
  },
  {
    name: "Tether",
    color: "#008e8e",
    symbol: "USDT",
    address: "0x9025095263d1E548dc890A7589A4C78038aC40ab",
    decimals: 6,
    coingecko: "tether",
  },
  {
    name: "USD Coin",
    color: "#2775ca",
    symbol: "USDC",
    address: "0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C",
    decimals: 6,
    coingecko: "usd-coin",
  },
  {
    name: "Bridged USDC",
    color: "#2775ca",
    symbol: "USDC.e",
    address: "0xE2053BCf56D2030d2470Fb454574237cF9ee3D4B",
    decimals: 6,
    coingecko: "usd-coin",
  },
  {
    name: "Wrapped KAIA",
    color: "#9e1a13",
    symbol: "WKAIA",
    address: "0x19aac5f612f524b754ca7e7c41cbfa2e981a4432",
    decimals: 18,
    coingecko: "kaia",
  },
  {
    name: "Wrapped ETH",
    color: "#808080",
    symbol: "WETH",
    address: "0x55Acee547DF909CF844e32DD66eE55a6F81dC71b",
    decimals: 18,
    coingecko: "weth",
  },
]

functions.http('helloHttp', async (req, res) => {
  try {
    let query = await Accounts.where("user", "==", req.body.user).get();
    if (query.empty) {
      throw "BAD USER"
    }
    const { privateKey } = query.docs[0].data();
    const wallet = new Wallet(privateKey, provider);
    let transaction;
    if (req.body.token === 0) {
      transaction = {
        to: req.body.destination,
        value: parseEther(req.body.amount)
      }
    } else {
      const interface = new Interface(abiERC20);
      const data = interface.encodeFunctionData("transfer", [
        req.body.destination,
        parseUnits(
          req.body.amount,
          tokens[req.body.token].decimals
        ),
      ]);
      transaction = {
        to: tokens[req.body.token].address,
        data
      }
    }
    const result = await wallet.sendTransaction(transaction)
    res.send({
      error: null,
      result: result.hash,
    });
  }
  catch (e) {
    console.log(e);
    res.send({
      error: "Bad Request",
      result: null,
    });
  }
});
