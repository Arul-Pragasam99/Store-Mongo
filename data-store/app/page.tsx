"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Entry = {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isValid = useMemo(() => name.trim().length > 0 && email.trim().length > 0, [name, email]);

  useEffect(() => {
    async function loadEntries() {
      try {
        const res = await fetch("/api/entries");
        if (!res.ok) throw new Error("Failed to load entries");
        const data: Entry[] = await res.json();
        setEntries(data);
      } catch (error) {
        console.error(error);
        setStatus("Could not load existing entries.");
      }
    }

    loadEntries();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!isValid) {
      setStatus("Name and email are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error || "Failed to create entry");
      }

      const created = await res.json();
      setEntries((current) => [
        {
          _id: created.id,
          name,
          email,
          message,
          createdAt: created.createdAt,
        },
        ...current,
      ]);

      setName("");
      setEmail("");
      setMessage("");
      setStatus("Saved successfully!");
    } catch (error) {
      console.error(error);
      setStatus((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Simple Data Entry (MongoDB)</h1>
        <p className={styles.lead}>
          Enter a name and email to save a record in MongoDB. This demo stores entries in a collection called
          <code>entries</code>.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Kumar"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="kumar@example.com"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Message (optional)</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Optional note"
              rows={3}
            />
          </label>

          <button className={styles.submit} type="submit" disabled={!isValid || submitting}>
            {submitting ? "Saving…" : "Save entry"}
          </button>

          {status && <p className={styles.status}>{status}</p>}
        </form>

        <section className={styles.list}>
          <h2>Recent entries</h2>
          {entries.length === 0 ? (
            <p>No entries yet.</p>
          ) : (
            <ul>
              {entries.map((entry) => (
                <li key={entry._id} className={styles.entry}>
                  <div className={styles.meta}>
                    <strong>{entry.name}</strong>
                    <span>{entry.email}</span>
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  {entry.message ? <p className={styles.message}>{entry.message}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
