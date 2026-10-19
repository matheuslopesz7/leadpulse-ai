import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Lead, Status } from "./leads";

interface Ctx {
  leads: Lead[];
  connected: boolean;
  addLead: (l: Omit<Lead, "id" | "created_at" | "status">) => Promise<void>;
  updateStatus: (id: string, s: Status) => void;
  removeLead: (id: string) => void;
}
const LeadsContext = createContext<Ctx | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    supabase.from("leads").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error || !data) return;
      setConnected(true);
      setLeads(data as Lead[]);
    });
    const ch = supabase
      .channel("leads-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (p) => {
        const l = p.new as Lead;
        setLeads((prev) => (prev.some((x) => x.id === l.id) ? prev : [l, ...prev]));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const addLead = useCallback(async (l: Omit<Lead, "id" | "created_at" | "status">) => {
    const { data, error } = await supabase.from("leads").insert(l).select().single();
    if (error || !data) throw new Error("Não foi possível salvar o lead.");
    setLeads((p) => (p.some((x) => x.id === data.id) ? p : [data as Lead, ...p]));
  }, []);

  const updateStatus = useCallback((id: string, status: Status) => {
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, status } : l)));
    supabase.from("leads").update({ status }).eq("id", id).then(() => {});
  }, []);

  const removeLead = useCallback((id: string) => {
    setLeads((p) => p.filter((l) => l.id !== id));
    supabase.from("leads").delete().eq("id", id).then(() => {});
  }, []);

  return <LeadsContext.Provider value={{ leads, connected, addLead, updateStatus, removeLead }}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const c = useContext(LeadsContext);
  if (!c) throw new Error("useLeads must be inside LeadsProvider");
  return c;
}
