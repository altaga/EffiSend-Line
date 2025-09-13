const functions = require('@google-cloud/functions-framework');
const Firestore = require("@google-cloud/firestore");
const { parseUnits } = require("ethers");
const {
    abi: ERC20abi,
} = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const { Wallet, JsonRpcProvider, Interface } = require("ethers");
const { convertQuoteToRoute, getQuote, createConfig } = require("@lifi/sdk");
const { Contract } = require("ethers");

createConfig({
    integrator: 'EffiSend',
    apiKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
})

const providerKaia = new JsonRpcProvider(
    "https://xxxxxxxxxxxxxxxxxxxxxx.kaia-mainnet.quiknode.pro/xxxxxxxxxxxxxxxxxxxx/"
);
const providerArbitrum = new JsonRpcProvider(
    "https://arb-mainnet.g.alchemy.com/v2/xxxxxxxxxxxxxxxxxxxxxxx"
);

const quoteRequest = {
    fromChain: 8217, // Kaia
    toChain: 42161, // Arbitrum
    fromToken: "0x9025095263d1E548dc890A7589A4C78038aC40ab", // USDT on Kaia
    toToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT on Arbitrum
};

const contractInterface = new Interface(ERC20abi);
const USDTarb = new Contract(
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    ERC20abi,
    providerArbitrum
);

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
            const { amount, to: toAddress } = req.body;
            const { address: addressUser, privateKey: privateKeyUser } = query.docs[0].data();
            const quote = await getQuote(
                {
                    ...quoteRequest,
                    fromAmount: parseUnits(amount, 6),
                    fromAddress: addressUser,
                    toAddress,
                    allowBridges: ["stargateV2"],
                    denyBridges: ["stargateV2Bus"]
                }
            );
            console.log(quote)
            const route = convertQuoteToRoute(quote);
            console.log(route)
            // Bridge Tx
            const bridgeTx = route.steps[0].transactionRequest;
            // Approve Tx
            const approveTxData = await contractInterface.encodeFunctionData("approve", [
                bridgeTx.to,
                parseUnits(amount, 6),
            ]);
            const approveTx = {
                to: quoteRequest.fromToken,
                data: approveTxData,
                from: addressUser,
            };
            console.log({
                approveTx,
                bridgeTx,
            });

            const fromWallet = new Wallet(
                privateKeyUser,
                providerKaia
            );
            const tx = await fromWallet.sendTransaction(approveTx);
            await waitWithDelay(tx, providerKaia);
            console.log(`https://www.kaiascan.io/tx/${tx.hash}`);
            const startBalance = await USDTarb.balanceOf(toAddress);
            const tx2 = await fromWallet.sendTransaction(bridgeTx);
            await waitWithDelay(tx2, providerKaia);
            console.log(`https://www.kaiascan.io/tx/${tx2.hash}`);
            console.log("Waiting for balance to change");
            while (true) {
                const currectBalance = await USDTarb.balanceOf(toAddress);
                if (currectBalance > startBalance) {
                    console.log(`.`);
                    console.log(`Balance changed from ${startBalance} to ${currectBalance}`);
                    break;
                }
                process.stdout.write(".");
                if (Date.now() - start > 120000) {
                    throw new Error(
                        "Balance has not changed in 2 minutes, something went wrong"
                    );
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            console.log(`Operation took ${((Date.now() - start) / 1000).toFixed(2)} seconds`);
            res.send({
                error: null,
                result: {
                    hash: tx.hash
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