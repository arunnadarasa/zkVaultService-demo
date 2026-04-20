export function Hero() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--emerald-subtle)] bg-[var(--emerald-subtle)]/30 text-[var(--emerald-light)] text-sm font-medium mb-6 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[var(--emerald-light)] animate-pulse"></span>
          Zero-Knowledge Powered
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
          ZkVaultService
        </h1>

        <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto animate-fade-in delay-100">
          Private and compliant transactions on Ethereum using EVVM.
          <br />
          <span className="text-[var(--emerald-light)]">
            Deposit, withdraw, and split notes
          </span>{" "}
          with zero-knowledge proofs.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto animate-fade-in delay-200">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="text-2xl font-bold text-[var(--emerald-light)]">
              0x...
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              Shielded Pool
            </div>
          </div>
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="text-2xl font-bold text-[var(--emerald-light)]">
              zk-SNARK
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              Proof Type
            </div>
          </div>
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="text-2xl font-bold text-[var(--emerald-light)]">
              Sepolia
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Network</div>
          </div>
        </div>
      </div>
    </section>
  );
}
