import { useWallet } from "@solana/wallet-adapter-react";
import { WalletModalButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

const WalletButton = () => {
  const { connected, disconnect } = useWallet();

  if (connected) {
    return (
      <button
        onClick={disconnect}
        className="bg-[#B1B762] text-[#B1B762] bg-opacity-100 text-black px-6 py-3 rounded-md hover:bg-opacity-80 transition-all duration-200 font-bebas-neue text-xl flex items-center gap-2 uppercase"
      >
        <span>Disconnect Wallet</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8a1 1 0 110 2H6a1 1 0 110-2zm0 4h8a1 1 0 110 2H6a1 1 0 110-2z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    );
  }

  return (
    <WalletModalButton className="bg-black text-black border-2 border-[#B1B762] px-6 py-3 rounded-md hover:bg-[#B1B762] hover:text-white transition-all duration-200 font-bebas-neue text-xl flex items-center gap-2 uppercase text-black">
      <span>Connect Phantom</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8a1 1 0 110 2H6a1 1 0 110-2zm0 4h8a1 1 0 110 2H6a1 1 0 110-2z"
          clipRule="evenodd"
        />
      </svg>
    </WalletModalButton>
  );
};

export default WalletButton;
