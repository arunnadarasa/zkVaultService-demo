"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { DepositAction } from "./components/DepositAction";
import { NoteModal } from "./components/NoteModal";
import { NotesCard } from "./components/NotesCard";
import { parseEncodedNote } from "@/lib/shielded/storage";

function HomeContent() {
  const searchParams = useSearchParams();
  const noteParam = searchParams.get("note");

  const note = useMemo(() => {
    if (!noteParam) return null;
    try {
      return parseEncodedNote(noteParam);
    } catch {
      return null;
    }
  }, [noteParam]);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (note) {
      setShowModal(true);
    }
  }, [note]);

  const handleCloseModal = () => {
    setShowModal(false);
    window.history.replaceState({}, "", "/");
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-animated bg-gradient-radial bg-grid-pattern bg-noise">
        <Hero />

        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2">
            <DepositAction />
            <NotesCard />
          </div>
        </section>
      </main>

      {showModal && note && (
        <NoteModal note={note} onClose={handleCloseModal} />
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
