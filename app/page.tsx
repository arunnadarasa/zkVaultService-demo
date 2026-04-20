import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { DepositAction } from "./components/DepositAction";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-animated bg-gradient-radial bg-grid-pattern bg-noise">
        <Hero />
        
        <section className="px-6 pb-24">
          <div className="max-w-lg mx-auto">
            <DepositAction />
          </div>
        </section>
        
        <footer className="py-8 px-6">
          <div className="max-w-4xl mx-auto text-center text-sm text-[var(--text-secondary)]">
            <p>ZkVaultService — Zero-Knowledge Private Transactions on Sepolia</p>
          </div>
        </footer>
      </main>
    </>
  );
}