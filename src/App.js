import React, { useState } from "react";

import "./App.css";

import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  chain,
  configureChains,
  createClient,
  WagmiConfig,
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
} from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { ethers, utils } from "ethers";
import { useDebounce } from "use-debounce";

import { ConnectButton } from "@rainbow-me/rainbowkit";

// const BASE_URL = "https://sledge-olive.vercel.app";
// const BASE_URL = "http://localhost:5050";
const BASE_URL = "https://sledge-olive-dev.vercel.app";

// const GET_ALL_URL = BASE_URL + "/api/all";
const CREATE_CARD_URL = BASE_URL + "/api/create";
const SIGNED_URL = BASE_URL + "/api/signed_url";
// const AUTH_URL = BASE_URL + "/api/auth";
const SIMULATE_URL = BASE_URL + "/api/simulate";
const DESTINATION_ADDRESS = "0xe1EBc6DB1cfE34b4cAed238dD5f59956335E2998";
const ALL_TRANSACTIONS_URL = BASE_URL + "/api/transactions";

function sayHello() {
  alert("You clicked me!");
}

function WagmiMagic({ handleSuccess }) {
  const [amount, setAmount] = useState("0.001");
  const [debouncedAmount] = useDebounce(amount, 500);

  const handleChange = (e) => {
    setAmount(e.target.value);
  };

  const { config } = usePrepareSendTransaction({
    request: {
      to: DESTINATION_ADDRESS,
      value: debouncedAmount
        ? ethers.utils.parseEther(debouncedAmount)
        : undefined,
    },
  });
  const { data, sendTransaction } = useSendTransaction(config);

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess(data) {
      handleSuccess(data);
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    sendTransaction?.();
  }

  return (
    <form className="amountForm" onSubmit={handleSubmit}>
      <div className="amountFormLabel">Amount</div>
      <input type="text" value={amount} onChange={handleChange} />
      <br />
      <button disabled={isLoading || !sendTransaction || !amount}>
        {isLoading ? "Converting..." : "Convert"}
      </button>
      {isSuccess && (
        <div>
          <a href={`https://goerli.etherscan.io/tx/${data?.hash}`}>
            Etherscan link
          </a>
        </div>
      )}
    </form>
  );
}

function App() {
  const { chains, provider } = configureChains(
    [chain.goerli],
    [alchemyProvider({ apiKey: "SrDO2MifdoOqynE5FKmWWy_oxNWFR0Jo" })]
  );

  const { connectors } = getDefaultWallets({
    appName: "My RainbowKit App",
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
  });

  const infoHeaderText = "Instant Liquidity on ETH balance";
  const infoText1 = `Step 1. Select the amount of ETH (Goerli Testnet) that you'd like to convert`;
  const infoText2 = `Step 2. Card will be issued once successful`;
  const infoText3 = `Step 3. Spend (simulated for demo purposes)`;

  const [showCard, setShowCard] = useState(false);
  const [cardToken, setCardToken] = useState("");
  const [cardPan, setCardPan] = useState("");
  const [embeddedUrl, setEmbeddedUrl] = useState("");
  const [txAmount, setTxAmount] = useState("1");
  const [txStore, setTxStore] = useState("COFFEE");
  const [allTxs, setAllTxs] = useState([]);

  let card;
  if (showCard) {
    card = (
      <iframe
        id="card-iframe"
        title={cardToken}
        allow="clipboard-write"
        width="600"
        height="300"
        src={embeddedUrl}
      ></iframe>
    );
  } else {
    card = (
      <div className="dummyCard">
        <div className="dummyCardText">No card available</div>
      </div>
    );
  }

  const getCardDetails = async (cardToken) => {
    const rawResponse = await fetch(SIGNED_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: cardToken }),
    });
    const content = await rawResponse.json();
    // console.log(content);
    setEmbeddedUrl(content.data);
    setShowCard(true);
  };

  const handleSuccess = async (data) => {
    const rawResponse = await fetch(CREATE_CARD_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hash: data.transactionHash }),
    });
    const content = await rawResponse.json();
    // console.log(content);
    setCardToken(content.data.token);
    setCardPan(content.data.pan);

    await getCardDetails(content.data.token);
  };

  async function submitTransaction() {
    await fetch(SIMULATE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: parseFloat(txAmount),
        descriptor: txStore,
        pan: cardPan,
      }),
    });

    const rawResponse = await fetch(ALL_TRANSACTIONS_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: cardToken,
      }),
    });
    const content = await rawResponse.json();
    let list = [];
    console.log(content.data.data);
    content.data.data.map((t) => {
      list.push({ token: t.token, result: t.result, amount: t.amount });
    });
    setAllTxs(list);
    // console.log(list);
  }

  const handleTxSubmit = (e) => {
    e.preventDefault();
    submitTransaction();
  };
  const handleTxAmountChange = (e) => {
    setTxAmount(e.target.value);
  };
  const handleTxStoreChange = (e) => {
    setTxStore(e.target.value);
  };

  const txList = allTxs.map((tx) => (
    <li key={tx.token}>
      Amount: {tx.amount}, Status: {tx.result}
    </li>
  ));

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <div className="App">
          <div className="nav">
            <ConnectButton />
          </div>
          <div className="infoHeader">{infoHeaderText}</div>
          <hr />
          <div className="info">{infoText1}</div>
          <WagmiMagic handleSuccess={handleSuccess} />
          <hr />
          <div className="info">{infoText2}</div>
          <div className="body">{card}</div>
          <hr />
          <div className="info">{infoText3}</div>
          <form className="transactionForm" onSubmit={handleTxSubmit}>
            <span className="transactionFormLabel">Amount (dollar)</span>
            <input
              type="text"
              value={txAmount}
              onChange={handleTxAmountChange}
            />
            <span className="transactionFormLabel">Description</span>
            <input type="text" value={txStore} onChange={handleTxStoreChange} />
            <button>{"Submit"}</button>
          </form>
          <ul>{txList}</ul>
          <hr />
          <div className="info">How it works</div>
          <div class="finalNote">
            <p>
              When the transfer is successfully made to the destination address
              (currently EOA but in future smart contract), it triggers an
              event. The request is then sent to the server to create a new
              virtual debit card that has the spending limit of the dollar
              amount of the ETH transferred (we calculate exchange rates on the
              backend). As the card makes the transactions, our backend is able
              to authorize the transaction. We have the ability to decline and
              approve any transaction (current logic approves all of them). The
              card issuance and processed is powered by Lithic. This setup is
              running in testnet but it can be easily be replicated on mainnet.
              It is quite easy to more tokens instead of just offering ETH by
              leverage 0x swap API capabilities. Additionally, we can also
              incorporate Polygon ID for additional security.
            </p>
            <p>
              Note: Transactions in sandbox environment are not settled and
              thus, it is possible to keep creating more and more transfers.
              "Approved" in this context simply means that the transaction was
              approved on our end. In live environment, there would be the case
              as transfer would decline if they exceed the limit.
            </p>
          </div>
        </div>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;
