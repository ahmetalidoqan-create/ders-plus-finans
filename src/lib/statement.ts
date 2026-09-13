import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { paymentMethodLabel } from "@/lib/constants";
import { getStudentFinance, getStudentPayments } from "@/lib/finance";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import { normalizeWhatsAppPhone, RECEIPT_COMPANY } from "@/lib/receipt";
import type { Payment, Student } from "@/types";

export type StatementRow = {
  id: string;
  label: string;
  dueDate: string;
  paidAt: string | null;
  methodLabel: string;
  amount: number;
  status: Payment["status"];
};

export type StatementData = {
  student: Student;
  academyName: string;
  issuedAt: string;
  total: number;
  paid: number;
  remaining: number;
  overdueCount: number;
  rows: StatementRow[];
};

export function statementItemLabel(payment: Payment) {
  if (payment.kind === "down_payment") return "Peşinat";
  if (payment.kind === "installment") return `${payment.installmentNo}. Taksit`;
  return payment.note.trim() || "Ödeme";
}

export function buildStatementData(student: Student, payments: Payment[], academyName: string): StatementData {
  const finance = getStudentFinance(student, payments);
  const rows = getStudentPayments(payments, student.id).map((payment) => ({
    id: payment.id,
    label: statementItemLabel(payment),
    dueDate: payment.dueDate,
    paidAt: payment.paidAt,
    methodLabel: paymentMethodLabel(payment.method),
    amount: payment.amount,
    status: payment.status,
  }));
  return {
    student,
    academyName: academyName.trim() || RECEIPT_COMPANY.brandName,
    issuedAt: todayISO(),
    total: finance.total,
    paid: finance.paid,
    remaining: finance.remaining,
    overdueCount: finance.overdueCount,
    rows,
  };
}

export function statementStatusLabel(status: Payment["status"]) {
  if (status === "paid") return "Ödendi";
  if (status === "overdue") return "Gecikti";
  return "Bekliyor";
}

export function statementWhatsAppText(data: StatementData) {
  const upcoming = data.rows.filter((row) => row.status !== "paid").slice(0, 4);
  const upcomingLines = upcoming.length
    ? upcoming.map((row) => `• ${row.label} — ${formatDate(row.dueDate)} — ${formatMoney(row.amount)}`)
    : ["• Yaklaşan taksit bulunmuyor."];
  const brand = /akademi/i.test(data.academyName) ? data.academyName : `${data.academyName} Akademi`;
  return [
    "Sayın velimiz,",
    "",
    `${data.student.fullName} adlı öğrencimizin güncel hesap özeti:`,
    "",
    `Toplam tutar: ${formatMoney(data.total)}`,
    `Ödenen tutar: ${formatMoney(data.paid)}`,
    `Kalan bakiye: ${formatMoney(data.remaining)}`,
    ...(data.overdueCount > 0 ? [`Geciken taksit: ${data.overdueCount}`] : []),
    "",
    "Sonraki / açık ödemeler:",
    ...upcomingLines,
    "",
    brand,
  ].join("\n");
}

export function statementWhatsAppUrl(data: StatementData) {
  const phone = normalizeWhatsAppPhone(data.student.parentPhone || data.student.phone);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(statementWhatsAppText(data))}`;
}

export async function downloadStatementPdf(element: HTMLElement, studentName: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const img = canvas.toDataURL("image/png");
  let heightLeft = imgHeight;
  let position = margin;
  pdf.addImage(img, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(img, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }
  const slug = studentName
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
  pdf.save(`ders-plus-ekstre-${slug || "ogrenci"}.pdf`);
}
