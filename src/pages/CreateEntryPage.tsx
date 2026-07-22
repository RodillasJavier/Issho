/**
 * src/pages/CreateEntryPage.tsx
 *
 * Page for creating a new entry.
 */
import { CreateEntry } from "../components/CreateEntry";

export const CreateEntryPage = () => {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="mb-8 border-b border-zinc-800 pb-6">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-rose-400">
          New entry
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Share an entry
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Pick a season or a whole series, mark where you are, and add your
          thoughts.
        </p>
      </section>

      <CreateEntry />
    </div>
  );
};
