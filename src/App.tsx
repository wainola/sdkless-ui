import { Accessor, Component, createContext, createEffect, createSignal, Setter } from "solid-js";
import logo from "./logo.svg";
import styles from "./App.module.css";
import { handleConnection } from "./handleConnect";
import { formatBalance, getProvider, getSigner } from "./accountData";
import { Bridge, ContractList } from "./components";
import { Route, Router, Routes } from "@solidjs/router";
import { Domain } from "./types";

export const DomainsContext = createContext({
  domains: [] as Accessor<{ domains: Domain[] }| []> | [],
  setDomains: null as null | Setter<Domain[] | []>,
});

const App: Component = () => {
  const [account, setAccount] = createSignal<string | null>(null);
  const [chainId, setChainId] = createSignal<number | null>(null);
  const [balance, setBalance] = createSignal<string | null>(null);
  const [domains, setDomains] = createSignal<{ domains: Domain[] } | []>([]);

  createEffect(() => {
    if ((window as any).ethereum) {
      (window as any).ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0]);
      });

      (window as any).ethereum.on("chainChanged", (chainId: string) => {
        setChainId(Number(chainId));
      });
    }
  });

  const computeSigner = async () => {
    if (account() !== null) {
      const provider = getProvider((window as any).ethereum);
      const signer = await getSigner(provider, account() as string);

      const balance = await provider.getBalance(await signer.getAddress());
      const balanceFormated = formatBalance(balance);
      setBalance(balanceFormated);
    }
  };

  createEffect(() => {
    console.warn("account changed", account());
    computeSigner();
  }, account());

  createEffect(() => {
    console.warn("chainId changed", chainId());
    computeSigner();
  }, chainId());

  return (
    <DomainsContext.Provider value={{ domains, setDomains }}>
      <Router>
        <div class={styles.App}>
          <h1>Metamask connector</h1>
          <button onClick={handleConnection(setAccount, setChainId)}>
            Connect!
          </button>
          <div>
            <h3>Account connected: {account() || "No account connected"}</h3>
            <h4>Chain Id: {chainId() || "No chainId"}</h4>
            <h4>Balance of account: {balance() || "No Balance yet"}</h4>
          </div>
          <Routes>
            <Route path="/" element={<ContractList />} />
            <Route path={`/bridge/:bridgeId`} element={<Bridge />} />
          </Routes>
        </div>
      </Router>
    </DomainsContext.Provider>
  );
};

export default App;
