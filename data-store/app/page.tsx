"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import styles from "./page.module.css";
import gsap from "gsap";

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

  // Refs for animations
  const pageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const leadRef = useRef<HTMLParagraphElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const entryRefs = useRef<(HTMLLIElement | null)[]>([]);

  const isValid = useMemo(() => name.trim().length > 0 && email.trim().length > 0, [name, email]);

  // Initial page load animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.from(titleRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });

      // Lead text animation
      gsap.from(leadRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: "power3.out"
      });

      // Form animation
      gsap.from(formRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: "power3.out"
      });

      // Form fields staggered animation
      gsap.from(`.${styles.field}`, {
        x: -15,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.4,
        ease: "power2.out"
      });

      // Submit button animation
      gsap.from(`.${styles.submit}`, {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        delay: 0.7,
        ease: "back.out(1.7)"
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // Load entries and animate them
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

  // Animate entries after they're loaded
  useEffect(() => {
    if (entries.length > 0) {
      const validRefs = entryRefs.current.filter(ref => ref !== null);
      if (validRefs.length > 0) {
        gsap.from(validRefs, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          delay: 0.2
        });
      }
    }
  }, [entries]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    
    if (!isValid) {
      if (formRef.current) {
        gsap.to(formRef.current, {
          x: -8,
          duration: 0.1,
          repeat: 3,
          yoyo: true,
          ease: "power2.inOut",
          onComplete: () => {
            if (formRef.current) {
              gsap.set(formRef.current, { x: 0 });
            }
          }
        });
      }
      setStatus("Name and email are required.");
      return;
    }

    setSubmitting(true);

    gsap.to(`.${styles.submit}`, {
      scale: 0.95,
      duration: 0.2,
      yoyo: true,
      repeat: 1
    });

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
      const newEntry = {
        _id: created.id,
        name,
        email,
        message,
        createdAt: created.createdAt,
      };
      
      setEntries((current) => [newEntry, ...current]);

      if (formRef.current) {
        gsap.to(formRef.current, {
          y: -5,
          duration: 0.2,
          opacity: 0.8,
          onComplete: () => {
            setName("");
            setEmail("");
            setMessage("");
            if (formRef.current) {
              gsap.to(formRef.current, {
                y: 0,
                opacity: 1,
                duration: 0.2
              });
            }
          }
        });
      }

      setStatus("Saved successfully!");
      
      gsap.from(`.${styles.status}`, {
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        ease: "back.out(2)"
      });
    } catch (error) {
      console.error(error);
      setStatus((error as Error).message);
      
      gsap.to(`.${styles.status}`, {
        color: "#ff4444",
        x: 6,
        duration: 0.1,
        repeat: 2,
        yoyo: true,
        onComplete: () => {
          gsap.set(`.${styles.status}`, { x: 0, color: "" });
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const setEntryRef = (index: number) => (el: HTMLLIElement | null) => {
    entryRefs.current[index] = el;
  };

  return (
    <div ref={pageRef} className={styles.page}>
      <main className={styles.main}>
        <h1 ref={titleRef} className={styles.title}>Simple Data Entry (MongoDB)</h1>
        <p ref={leadRef} className={styles.lead}>
          Enter a name and email to save a record in MongoDB. This demo stores entries in a collection called <code>entries</code>.
        </p>

        <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Message (optional)</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Add an optional message"
              rows={3}
            />
          </label>

          <button 
            className={styles.submit} 
            type="submit" 
            disabled={!isValid || submitting}
            onMouseEnter={() => {
              if (!(!isValid || submitting)) {
                gsap.to(`.${styles.submit}`, {
                  scale: 1.02,
                  duration: 0.2,
                  ease: "power2.out"
                });
              }
            }}
            onMouseLeave={() => {
              gsap.to(`.${styles.submit}`, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out"
              });
            }}
          >
            {submitting ? "Saving..." : "Save entry"}
          </button>

          {status && <p className={styles.status}>{status}</p>}
        </form>

        <section ref={listRef} className={styles.list}>
          <h2 className={styles.listTitle}>Recent entries</h2>
          {entries.length === 0 ? (
            <p className={styles.emptyMessage}>No entries yet. Be the first to add one!</p>
          ) : (
            <ul className={styles.entryList}>
              {entries.map((entry, index) => (
                <li 
                  key={entry._id} 
                  ref={setEntryRef(index)}
                  className={styles.entry}
                  onMouseEnter={() => {
                    const element = entryRefs.current[index];
                    if (element) {
                      gsap.to(element, {
                        y: -3,
                        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
                        duration: 0.2,
                        ease: "power2.out"
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    const element = entryRefs.current[index];
                    if (element) {
                      gsap.to(element, {
                        y: 0,
                        boxShadow: "none",
                        duration: 0.2,
                        ease: "power2.out"
                      });
                    }
                  }}
                >
                  <div className={styles.meta}>
                    <strong>{entry.name}</strong>
                    <span>{entry.email}</span>
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  {entry.message && <p className={styles.message}>{entry.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
  