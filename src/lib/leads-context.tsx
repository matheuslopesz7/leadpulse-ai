import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabase, makeMockLeads, type Lead, type Status } from "./leads";

interface Ctx {
  leads: Lead[];
  connected: boolean;
  addLead: (l: Omit<Lead, "id" | "created_at" | "status">) => Promise<void>;
  updateStatus: (id: string, s: Status) => void;
  removeLead: (id: string) => void;
}
const LeadsContext = createContext<Ctx | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(() => makeMockLeads());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.from("leads").select("*").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return;
        setConnected(true);
        if (data.length) setLeads(data as Lead[]);
      }, () => {});
  }, []);

  const addLead = useCallback(async (l: Omit<Lead, "id" | "created_at" | "status">) => {
    const lead: Lead = { ...l, id: crypto.randomUUID(), status: "Novo", created_at: new Date().toISOString() };
    setLeads((p) => [lead, ...p]);
    const sb = getSupabase();
    if (connected && sb) await sb.from("leads").insert(lead).then(() => {}, () => {});
  }, [connected]);

  const updateStatus = useCallback((id: string, status: Status) => {
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, status } : l)));
    const sb = getSupabase();
    if (connected && sb) sb.from("leads").update({ status }).eq("id", id).then(() => {}, () => {});
  }, [connected]);

  const removeLead = useCallback((id: string) => {
    setLeads((p) => p.filter((l) => l.id !== id));
    const sb = getSupabase();
    if (connected && sb) sb.from("leads").delete().eq("id", id).then(() => {}, () => {});
  }, [connected]);

  return <LeadsContext.Provider value={{ leads, connected, addLead, updateStatus, removeLead }}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const c = useContext(LeadsContext);
  if (!c) throw new Error("useLeads must be inside LeadsProvider");
  return c;
}
