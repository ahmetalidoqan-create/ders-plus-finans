import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { paymentMethodLabel } from "@/lib/constants";
import { formatMoney, todayISO, uid } from "@/lib/format";
import type { Payment, PaymentMethod, Student } from "@/types";
import { getStudentFinance, getStudentPayments } from "@/lib/finance";

export const RECEIPT_COMPANY = {
  legalName: "ARTI DERS EĞİTİM YAYINCILIK TİCARET LİMİTED ŞİRKETİ",
  brandName: "Ders Plus",
  address: "Yeşilbayır Mah. 17555 Sk. No:2/14 Mamak / Ankara",
  taxOffice: "Dikimevi V.D. 08881343088",
};

export type ReceiptData = {
  receiptNo: string;
  date: string;
  studentName: string;
  classroom: string;
  phone: string;
  parentPhone: string;
  description: string;
  methodLabel: string;
  agreementTotal: number;
  paidThis: number;
  paidTotal: number;
  remaining: number;
  remainingInstallments: number;
};

export function receiptContactPhone(student: Student) {
  return student.parentPhone.trim() || student.phone.trim();
}

export function normalizeWhatsAppPhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0090")) digits = digits.slice(2);
  if (digits.startsWith("90") && digits.length >= 12) return digits.slice(0, 12);
  if (digits.startsWith("0") && digits.length >= 11) return `90${digits.slice(1, 11)}`;
  if (digits.length === 10 && digits.startsWith("5")) return `90${digits}`;
  return "";
}

export function receiptWhatsAppUrl(data: ReceiptData) {
  const phone = normalizeWhatsAppPhone(data.parentPhone || data.phone);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(receiptWhatsAppText(data))}`;
}

export function buildReceiptData(input: {
  student: Student;
  payments: Payment[];
  paidThis: number;
  date?: string;
  method?: PaymentMethod | null;
  description: string;
  remainingInstallments: number;
}): ReceiptData {
  const finance = getStudentFinance(input.student, input.payments);
  return {
    receiptNo: `DP-${todayISO().replaceAll("-", "")}-${uid("mk").slice(-4).toUpperCase()}`,
    date: input.date ?? todayISO(),
    studentName: input.student.fullName,
    classroom: input.student.classroom,
    phone: input.student.phone,
    parentPhone: input.student.parentPhone,
    description: input.description,
    methodLabel: paymentMethodLabel(input.method ?? null),
    agreementTotal: finance.total,
    paidThis: input.paidThis,
    paidTotal: finance.paid,
    remaining: finance.remaining,
    remainingInstallments: input.remainingInstallments,
  };
}

export function countRemainingInstallments(payments: Payment[], studentId: string) {
  return getStudentPayments(payments, studentId).filter(
    (p) => p.kind === "installment" && p.status !== "paid",
  ).length;
}

export function receiptWhatsAppText(data: ReceiptData) {
  return [
    "Sayın velimiz,",
    "",
    "Ödemeniz sisteme başarılı bir şekilde kaydedilmiştir. Teşekkür ederiz.",
    "",
    `Öğrenci: ${data.studentName}`,
    `Tutar: ${formatMoney(data.paidThis)}`,
    "",
    "Ders Plus",
  ].join("\n");
}

async function receiptToPdf(element: HTMLElement) {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const width = canvas.width * ratio;
  const height = canvas.height * ratio;
  const x = (pageWidth - width) / 2;
  const y = 6;
  pdf.addImage(img, "PNG", x, y, width, Math.min(height, pageHeight - 12));
  return pdf;
}

export async function downloadReceiptPdf(element: HTMLElement, data: ReceiptData) {
  const pdf = await receiptToPdf(element);
  pdf.save(`ders-plus-makbuz-${data.receiptNo}.pdf`);
}

export async function shareReceiptPdf(element: HTMLElement, data: ReceiptData) {
  const pdf = await receiptToPdf(element);
  const file = new File([pdf.output("blob")], `ders-plus-makbuz-${data.receiptNo}.pdf`, {
    type: "application/pdf",
  });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Ders Plus Makbuz",
      text: receiptWhatsAppText(data),
    });
    return;
  }
  pdf.save(`ders-plus-makbuz-${data.receiptNo}.pdf`);
}

