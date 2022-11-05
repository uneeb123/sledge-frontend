import "./App.css";

import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";

import { ConnectButton } from "@rainbow-me/rainbowkit";

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

  const embeddedUrl =
    "https://sandbox.lithic.com/v1/embed/card?hmac=K18HdDSEwlIPUiJhQnP%2BVGCvni%2FnrMUA%2FEI1UHJsnm8%3D&embed_request=eyJ0b2tlbiI6IjlhNDczNjc2LWUzNzQtNGM4MC1hNjkzLTE1ZGNjYTgzMGY3NiIsImV4cGlyYXRpb24iOiIyMDIyLTExLTAxVDIzOjA2OjMxLjA4N1oifQ%3D%3D";

  const showCard = false;
  let card;
  if (showCard) {
    card = (
      <iframe
        id="card-iframe"
        allow="clipboard-write"
        width="600"
        height="300"
        src={embeddedUrl}
      ></iframe>
    );
  } else {
    card = null;
  }

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <div className="App">
          <div className="nav">
            <ConnectButton />
          </div>
          <div className="body">{card}</div>
        </div>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;
