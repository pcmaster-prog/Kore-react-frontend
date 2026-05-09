import { useState, useEffect, useCallback } from "react";
import type {
  ReciboNominaListItem,
  ReciboNomina,
  ReciboGratificacionListItem,
  ReciboGratificacion,
  FirmaPayload,
} from "./recibos.types";
import {
  listarRecibosNomina,
  obtenerReciboNomina,
  firmarReciboNomina,
  listarRecibosGratificacion,
  obtenerReciboGratificacion,
  firmarReciboGratificacion,
} from "./api";

type Tab = "nomina" | "gratificaciones";

export function useRecibos() {
  const [tab, setTab] = useState<Tab>("nomina");

  // Nómina
  const [nominaList, setNominaList] = useState<ReciboNominaListItem[]>([]);
  const [nominaLoading, setNominaLoading] = useState(false);
  const [nominaError, setNominaError] = useState<string | null>(null);
  const [nominaSummary, setNominaSummary] = useState({ pending_count: 0, signed_count: 0 });
  const [selectedNominaId, setSelectedNominaId] = useState<number | null>(null);
  const [selectedNomina, setSelectedNomina] = useState<ReciboNomina | null>(null);
  const [nominaDetailLoading, setNominaDetailLoading] = useState(false);

  // Gratificaciones
  const [gratList, setGratList] = useState<ReciboGratificacionListItem[]>([]);
  const [gratLoading, setGratLoading] = useState(false);
  const [gratError, setGratError] = useState<string | null>(null);
  const [selectedGratId, setSelectedGratId] = useState<number | null>(null);
  const [selectedGrat, setSelectedGrat] = useState<ReciboGratificacion | null>(null);
  const [gratDetailLoading, setGratDetailLoading] = useState(false);

  // Firma
  const [signingId, setSigningId] = useState<number | null>(null);
  const [signingType, setSigningType] = useState<"nomina" | "gratificacion" | null>(null);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signSuccess, setSignSuccess] = useState<string | null>(null);

  const loadNomina = useCallback(async () => {
    setNominaLoading(true);
    setNominaError(null);
    try {
      const res = await listarRecibosNomina();
      setNominaList(res.data);
      setNominaSummary({ pending_count: res.pending_count, signed_count: res.signed_count });
    } catch (e: any) {
      setNominaError(e?.response?.data?.message ?? "Error cargando recibos de nómina");
    } finally {
      setNominaLoading(false);
    }
  }, []);

  const loadGratificaciones = useCallback(async () => {
    setGratLoading(true);
    setGratError(null);
    try {
      const res = await listarRecibosGratificacion();
      setGratList(res.data);
    } catch (e: any) {
      setGratError(e?.response?.data?.message ?? "Error cargando recibos de gratificación");
    } finally {
      setGratLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNomina();
    loadGratificaciones();
  }, [loadNomina, loadGratificaciones]);

  const openNomina = useCallback(async (id: number) => {
    setSelectedNominaId(id);
    setSelectedGratId(null);
    setNominaDetailLoading(true);
    try {
      const data = await obtenerReciboNomina(id);
      setSelectedNomina(data);
    } catch (e: any) {
      setNominaError(e?.response?.data?.message ?? "Error cargando recibo");
    } finally {
      setNominaDetailLoading(false);
    }
  }, []);

  const openGratificacion = useCallback(async (id: number) => {
    setSelectedGratId(id);
    setSelectedNominaId(null);
    setGratDetailLoading(true);
    try {
      const data = await obtenerReciboGratificacion(id);
      setSelectedGrat(data);
    } catch (e: any) {
      setGratError(e?.response?.data?.message ?? "Error cargando recibo");
    } finally {
      setGratDetailLoading(false);
    }
  }, []);

  const backToList = useCallback(() => {
    setSelectedNominaId(null);
    setSelectedGratId(null);
    setSelectedNomina(null);
    setSelectedGrat(null);
  }, []);

  const openSignModal = useCallback(
    (id: number, type: "nomina" | "gratificacion") => {
      setSigningId(id);
      setSigningType(type);
      setSignModalOpen(true);
    },
    []
  );

  const closeSignModal = useCallback(() => {
    setSignModalOpen(false);
    setSigningId(null);
    setSigningType(null);
  }, []);

  const handleSign = useCallback(
    async (payload: FirmaPayload) => {
      if (!signingId || !signingType) return;
      if (signingType === "nomina") {
        await firmarReciboNomina(signingId, payload);
        // Refresh
        await loadNomina();
        if (selectedNominaId === signingId) {
          const data = await obtenerReciboNomina(signingId);
          setSelectedNomina(data);
        }
      } else {
        await firmarReciboGratificacion(signingId, payload);
        await loadGratificaciones();
        if (selectedGratId === signingId) {
          const data = await obtenerReciboGratificacion(signingId);
          setSelectedGrat(data);
        }
      }
      setSignSuccess("Recibo firmado correctamente");
      setTimeout(() => setSignSuccess(null), 3500);
    },
    [signingId, signingType, selectedNominaId, selectedGratId, loadNomina, loadGratificaciones]
  );

  return {
    tab,
    setTab,
    // Nomina
    nominaList,
    nominaLoading,
    nominaError,
    nominaSummary,
    selectedNominaId,
    selectedNomina,
    nominaDetailLoading,
    // Gratificaciones
    gratList,
    gratLoading,
    gratError,
    selectedGratId,
    selectedGrat,
    gratDetailLoading,
    // Navigation
    openNomina,
    openGratificacion,
    backToList,
    // Firma
    signModalOpen,
    signingType,
    openSignModal,
    closeSignModal,
    handleSign,
    signSuccess,
  };
}
