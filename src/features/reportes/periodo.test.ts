import { describe, it, expect } from "vitest";
import { weekChunks, totalesPeriodo, semanaPromedio, minutosAHHmm } from "./periodo";
import type { ReporteAsistenciaResponse, SemanaDia } from "./api";

function dia(fecha: string, entrada?: string, salida?: string, estado: SemanaDia["estado"] = "presente"): SemanaDia {
  return {
    dia: "lunes",
    fecha,
    entrada: entrada ? `${fecha}T${entrada}:00-06:00` : null,
    salida: salida ? `${fecha}T${salida}:00-06:00` : null,
    estado,
  };
}

function semana(
  n: number,
  desde: string,
  hasta: string,
  dias: Partial<ReporteAsistenciaResponse["filas"][0]["dias"]>,
  total_horas = 0,
  total_retardos = 0
): ReporteAsistenciaResponse {
  return {
    semana: n,
    anio: 2026,
    rango: { desde, hasta },
    filas: [
      {
        empleado: { id: "1", nombre: "Juan Pérez" },
        dias: dias as ReporteAsistenciaResponse["filas"][0]["dias"],
        total_horas,
        total_retardos,
      },
    ],
  };
}

describe("weekChunks", () => {
  it("parte un mes completo en semanas domingo–sábado recortadas al rango", () => {
    // mayo 2026: el 1 cae en viernes, el 31 en domingo
    expect(weekChunks("2026-05-01", "2026-05-31")).toEqual([
      { from: "2026-05-01", to: "2026-05-02" },
      { from: "2026-05-03", to: "2026-05-09" },
      { from: "2026-05-10", to: "2026-05-16" },
      { from: "2026-05-17", to: "2026-05-23" },
      { from: "2026-05-24", to: "2026-05-30" },
      { from: "2026-05-31", to: "2026-05-31" },
    ]);
  });

  it("deja una sola semana cuando el rango ya es domingo–sábado", () => {
    expect(weekChunks("2026-05-10", "2026-05-16")).toEqual([{ from: "2026-05-10", to: "2026-05-16" }]);
  });

  it("devuelve un solo día cuando from === to", () => {
    expect(weekChunks("2026-05-13", "2026-05-13")).toEqual([{ from: "2026-05-13", to: "2026-05-13" }]);
  });

  it("devuelve vacío si el rango está invertido o incompleto", () => {
    expect(weekChunks("2026-05-31", "2026-05-01")).toEqual([]);
    expect(weekChunks("", "2026-05-01")).toEqual([]);
  });
});

describe("totalesPeriodo", () => {
  it("suma horas, retardos, días trabajados y faltas de todas las semanas", () => {
    const totales = totalesPeriodo([
      semana(20, "2026-05-10", "2026-05-16", { lunes: dia("2026-05-11", "08:00", "17:00"), martes: dia("2026-05-12", undefined, undefined, "falta") }, 480, 1),
      semana(21, "2026-05-17", "2026-05-23", { lunes: dia("2026-05-18", "08:30", "17:00"), martes: dia("2026-05-19", "08:00", "17:00") }, 960, 2),
    ]);

    expect(totales).toHaveLength(1);
    expect(totales[0]).toMatchObject({
      minutos: 1440,
      retardos: 3,
      dias_trabajados: 3,
      faltas: 1,
    });
  });

  it("no cuenta descansos ni festivos como faltas", () => {
    const totales = totalesPeriodo([
      semana(20, "2026-05-10", "2026-05-16", {
        domingo: dia("2026-05-10", undefined, undefined, "descanso"),
        lunes: dia("2026-05-11", undefined, undefined, "festivo"),
      }),
    ]);
    expect(totales[0].faltas).toBe(0);
    expect(totales[0].dias_trabajados).toBe(0);
  });
});

describe("semanaPromedio", () => {
  it("promedia la hora de entrada solo con los días que tienen registro", () => {
    const [fila] = semanaPromedio([
      semana(20, "2026-05-10", "2026-05-16", { lunes: dia("2026-05-11", "08:00", "17:00") }, 480),
      semana(21, "2026-05-17", "2026-05-23", { lunes: dia("2026-05-18", "09:00", "18:00") }, 540),
      // semana de vacaciones: no debe arrastrar el promedio de la hora
      semana(22, "2026-05-24", "2026-05-30", { lunes: dia("2026-05-25", undefined, undefined, "vacaciones") }, 0),
    ]);

    expect(minutosAHHmm(fila.dias.lunes.entrada!)).toBe("08:30");
    expect(minutosAHHmm(fila.dias.lunes.salida!)).toBe("17:30");
    expect(fila.dias.lunes.muestras).toBe(2);
  });

  it("divide las horas entre las semanas con actividad, no entre las del calendario", () => {
    const [fila] = semanaPromedio([
      semana(20, "2026-05-10", "2026-05-16", { lunes: dia("2026-05-11", "08:00", "17:00") }, 480),
      semana(21, "2026-05-17", "2026-05-23", { lunes: dia("2026-05-18", "08:00", "17:00") }, 480),
      semana(22, "2026-05-24", "2026-05-30", { lunes: dia("2026-05-25", undefined, undefined, "incapacidad") }, 0),
    ]);

    expect(fila.semanas_contadas).toBe(2);
    expect(fila.minutos_promedio).toBe(480);
  });

  it("muestra el estado dominante cuando ningún día de ese día de la semana tuvo horas", () => {
    const [fila] = semanaPromedio([
      semana(20, "2026-05-10", "2026-05-16", { domingo: dia("2026-05-10", undefined, undefined, "descanso") }),
      semana(21, "2026-05-17", "2026-05-23", { domingo: dia("2026-05-17", undefined, undefined, "descanso") }),
      semana(22, "2026-05-24", "2026-05-30", { domingo: dia("2026-05-24", undefined, undefined, "falta") }),
    ]);

    expect(fila.dias.domingo.estado).toBe("descanso");
    expect(fila.dias.domingo.muestras).toBe(0);
  });
});
