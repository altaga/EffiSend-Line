const functions = require('@google-cloud/functions-framework');
const Firestore = require("@google-cloud/firestore");
const { parseUnits } = require("ethers");
const {
    abi: ERC20abi,
} = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const { Wallet, JsonRpcProvider, Interface } = require("ethers");
const { convertQuoteToRoute, getQuote, createConfig } = require("@lifi/sdk");

createConfig({
    integrator: 'EffiSend',
    apiKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
})

const providerKaia = new JsonRpcProvider(
    "https://xxxxxxxxxxxxx.kaia-mainnet.quiknode.pro/xxxxxxxxxxxxxxxxxxxx"
);

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

const chainId = 8217;

const quoteRequest = {
    fromChain: chainId, // Kaia
    toChain: chainId, // Kaia
};

const contractInterface = new Interface(ERC20abi);

const db = new Firestore({
    projectId: "effisend",
    keyFilename: "credential.json",
});

const Accounts = db.collection("AccountsKaia");

functions.http('helloHttp', async (req, res) => {
    try {
        const start = Date.now();
        const user = req.body.user
        let query = await Accounts.where("user", "==", user).get();
        if (!query.empty) {
            // Inputs
            const { amount, fromToken, toToken } = req.body;
            const { address: addressUser, privateKey: privateKeyUser } = query.docs[0].data();
            // Walllet
            const fromWallet = new Wallet(
                privateKeyUser,
                providerKaia
            );
            // Quote and Tokens
            const tokenFrom = tokens.find((token) => token.symbol === fromToken);
            const tokenTo = tokens.find((token) => token.symbol === toToken);
            const quote = await getQuote(
                {
                    ...quoteRequest,
                    fromAmount: parseUnits(amount, tokenFrom.decimals),
                    fromAddress: addressUser,
                    fromToken: tokenFrom.address,
                    toToken: tokenTo.address,
                    toAddress: addressUser
                },
                {
                    order: "CHEAPEST",
                }
            );
            const route = convertQuoteToRoute(quote);
            // Bridge Tx
            const bridgeTx = route.steps[0].transactionRequest;
            let hash;
            if (tokenFrom.address === tokens[0].address) { // from Sei to Token
                console.log({
                    bridgeTx,
                });
                const tx = await fromWallet.sendTransaction(bridgeTx);
                await waitWithDelay(tx, providerKaia);
                console.log(`https://www.kaiascan.io/tx/${tx.hash}`);
                hash = tx.hash;
                console.log(`Operation took ${((Date.now() - start) / 1000).toFixed(2)} seconds`);
            }
            else { // From Token to Any - Approve and Bridge
                const approveTxData = await contractInterface.encodeFunctionData("approve", [
                    bridgeTx.to,
                    parseUnits(amount, tokenFrom.decimals),
                ]);
                const approveTx = {
                    to: tokenFrom.address,
                    data: approveTxData,
                    from: addressUser,
                };
                console.log({
                    approveTx,
                    bridgeTx,
                });
                const tx = await fromWallet.sendTransaction(approveTx);
                await waitWithDelay(tx, providerKaia);
                console.log(`https://www.kaiascan.io/tx/${tx.hash}`);
                const tx2 = await fromWallet.sendTransaction(bridgeTx);
                await waitWithDelay(tx2, providerKaia);
                console.log(`https://www.kaiascan.io/tx/${tx2.hash}`);
                hash = tx2.hash;
                console.log(`Operation took ${((Date.now() - start) / 1000).toFixed(2)} seconds`);
            }
            res.send({
                error: null,
                result: {
                    hash
                }
            });
        } else {
            console.log(e)
            res.send({
                error: "BAD USER",
                result: null
            });
        }
    }
    catch (e) {
        console.log(e)
        res.send({
            error: "BAD ERROR",
            result: null
        });
    }
});

async function waitWithDelay(tx, provider, delayMs = 1000) {
    const txHash = tx.hash;
    while (true) {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.blockNumber) {
            return receipt;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
}
