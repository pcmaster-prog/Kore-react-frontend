import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { MealScheduleItem, Period } from "./nomina.types";
import { fmt, fmtUnits, formatTime12, getWeekNumber, weekLabel } from "./nomina.utils";

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

export function getPeriodPdfFilename(period: Period): string {
  const wkNum = String(getWeekNumber(period.week_start)).padStart(2, "0");
  return `Nomina_Semana_${wkNum}_${period.week_start}_a_${period.week_end}.pdf`;
}

export function buildPeriodPdfBytes(
  period: Period,
  mealSchedules: MealScheduleItem[]
): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  }) as JsPdfWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const excludedIds = period.excluded_employee_ids ?? [];
  const visibleEntries = (period.entries ?? []).filter(
    (e) => !excludedIds.includes(e.empleado_id)
  );
  const wkNum = getWeekNumber(period.week_start);

  // Título principal + badge de semana
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 17, 17);
  const titleText = "Nómina Semanal";
  doc.text(titleText, margin, 20);

  const titleW = doc.getTextWidth(titleText);
  const badgeText = `Semana ${wkNum}`;
  doc.setFontSize(9.5);
  const badgeW = doc.getTextWidth(badgeText) + 6;
  const badgeX = margin + titleW + 3;
  doc.setFillColor(17, 17, 17);
  doc.roundedRect(badgeX, 14.5, badgeW, 6.8, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, badgeX + 3, 19.1);

  // Meta información
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  const statusStr = period.status === "approved" ? "Aprobada" : "Borrador";
  const metaText = `${weekLabel(period.week_start, period.week_end)}   ·   Estado: ${statusStr}   ·   Empleados: ${visibleEntries.length}`;
  doc.text(metaText, margin, 27);

  // Tabla de entradas
  const body = visibleEntries.map((e) => {
    const ms = mealSchedules.find((m) => m.employee_id === e.empleado_id);
    const msStr = ms
      ? `${formatTime12(ms.meal_start_time)} (${ms.duration_minutes}m)`
      : "—";
    const unitsStr = `${fmtUnits(e.payment_type, e.units)}${
      e.rest_days_paid > 0 ? ` +${e.rest_days_paid}d` : ""
    }`;
    const bonosTotal =
      (e.attendance_bonus_amount ?? 0) +
      (e.punctuality_bonus_amount ?? 0) +
      (e.bonus_amount ?? 0);
    const adjNote = e.adjustment_note ? ` (${e.adjustment_note})` : "";
    const adjStr = `${
      e.adjustment_amount !== 0 ? fmt(e.adjustment_amount) : "—"
    }${adjNote}`;

    return [
      e.empleado_name ?? "—",
      msStr,
      unitsStr,
      fmt(e.rate),
      fmt(e.subtotal),
      bonosTotal !== 0 ? fmt(bonosTotal) : "—",
      adjStr,
      fmt(e.total),
    ];
  });

  autoTable(doc, {
    startY: 32,
    margin: { left: margin, right: margin },
    head: [
      [
        "EMPLEADO",
        "COMIDA",
        "HORAS/DÍAS",
        "TARIFA",
        "SUBTOTAL",
        "BONOS",
        "AJUSTE",
        "TOTAL",
      ],
    ],
    body,
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 2.5, right: 2.5, bottom: 2.5, left: 2.5 },
      textColor: [17, 17, 17],
      lineColor: [238, 238, 238],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [60, 60, 60],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 42 },
      7: { fontStyle: "bold" },
    },
  });

  let cursorY = (doc.lastAutoTable?.finalY ?? 45) + 8;

  // Cajas de resumen
  const summaryBoxHeight = 18;
  if (cursorY + summaryBoxHeight > pageHeight - margin) {
    doc.addPage();
    cursorY = margin;
  }

  const summaryItems = [
    { label: "Total Nómina", val: fmt(period.total_amount) },
    { label: "Bonos", val: fmt(period.total_bonuses) },
    { label: "Ajustes", val: fmt(period.total_adjustments) },
    { label: "Empleados", val: String(visibleEntries.length) },
  ];

  const gap = 4;
  const usableWidth = pageWidth - margin * 2;
  const boxWidth = (usableWidth - gap * (summaryItems.length - 1)) / summaryItems.length;

  summaryItems.forEach((item, idx) => {
    const bx = margin + idx * (boxWidth + gap);
    doc.setFillColor(249, 249, 249);
    doc.roundedRect(bx, cursorY, boxWidth, summaryBoxHeight, 2, 2, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(136, 136, 136);
    doc.text(item.label, bx + 4, cursorY + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text(item.val, bx + 4, cursorY + 13.5);
  });

  cursorY += summaryBoxHeight + 6;

  // Notas del periodo (si existen)
  if (period.notes && period.notes.trim().length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const wrappedNotes = doc.splitTextToSize(period.notes.trim(), usableWidth - 8);
    const lineHeight = 4.2;
    const notesBoxHeight = 10 + wrappedNotes.length * lineHeight;

    if (cursorY + notesBoxHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }

    doc.setFillColor(254, 252, 232); // #fefce8
    doc.setDrawColor(253, 230, 138); // #fde68a
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, cursorY, usableWidth, notesBoxHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14); // #92400e
    doc.text("NOTAS", margin + 4, cursorY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(69, 26, 3); // #451a03
    doc.text(wrappedNotes, margin + 4, cursorY + 10.5);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

// ─── Generador de archivo ZIP estándar (PKZIP STORE + UTF-8 + CRC32) ─────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date = new Date()): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

export function createZipBlob(
  files: { name: string; data: Uint8Array }[]
): Blob {
  const encoder = new TextEncoder();
  const { dosTime, dosDate } = getDosDateTime();

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.byteLength;

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true); // General purpose bit flag (UTF-8 filename)
    lv.setUint16(8, 0, true); // Compression method (0 = store)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // Compressed size
    lv.setUint32(22, size, true); // Uncompressed size
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    // Central directory file header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed to extract
    cv.setUint16(8, 0x0800, true); // UTF-8 filename flag
    cv.setUint16(10, 0, true); // Compression method (0 = store)
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // Extra field length
    cv.setUint16(32, 0, true); // File comment length
    cv.setUint16(34, 0, true); // Disk number start
    cv.setUint16(36, 0, true); // Internal file attributes
    cv.setUint32(38, 0, true); // External file attributes
    cv.setUint32(42, offset, true); // Relative offset of local header
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, file.data);
    centralParts.push(centralHeader);
    offset += localHeader.byteLength + size;
  }

  const centralSize = centralParts.reduce((acc, p) => acc + p.byteLength, 0);

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // EOCD signature
  ev.setUint16(4, 0, true); // Number of this disk
  ev.setUint16(6, 0, true); // Disk where central directory starts
  ev.setUint16(8, files.length, true); // Total entries on this disk
  ev.setUint16(10, files.length, true); // Total entries in central directory
  ev.setUint32(12, centralSize, true); // Size of central directory
  ev.setUint32(16, offset, true); // Offset of start of central directory
  ev.setUint16(20, 0, true); // Comment length

  const allParts = [...localParts, ...centralParts, eocd];
  const totalLength = allParts.reduce((acc, part) => acc + part.byteLength, 0);
  const zipBuffer = new ArrayBuffer(totalLength);
  const zipBytes = new Uint8Array(zipBuffer);
  let writePos = 0;
  for (const part of allParts) {
    zipBytes.set(part, writePos);
    writePos += part.byteLength;
  }

  return new Blob([zipBuffer], {
    type: "application/zip",
  });
}
