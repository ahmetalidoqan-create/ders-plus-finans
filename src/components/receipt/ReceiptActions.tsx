import { useRef, useState } from "react";
import { FileDown, MessageCircle, Share2 } from "lucide-react";
import {
  downloadReceiptPdf,
  receiptWhatsAppUrl,
  shareReceiptPdf,
  type ReceiptData,
} from "@/lib/receipt";
import { ReceiptSheet } from "@/components/receipt/ReceiptSheet";

type Props = {
  data: ReceiptData;
};

export function ReceiptActions({ data }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);
  const [error, setError] = useState("");
  const whatsappUrl = receiptWhatsAppUrl(data);
  const displayPhone = data.parentPhone.trim() || data.phone.trim();

  async function run(kind: "pdf" | "share") {
    if (!sheetRef.current) return;
    setBusy(kind);
    setError("");
    try {
      if (kind === "pdf") await downloadReceiptPdf(sheetRef.current, data);
      else await shareReceiptPdf(sheetRef.current, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Makbuz hazırlanırken bir sorun oluştu. Tekrar deneyin.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="pointer-events-none absolute -left-[9999px] top-0" aria-hidden>
        <div ref={sheetRef}>
          <ReceiptSheet data={data} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <div className="origin-top-left scale-[0.72] sm:scale-[0.78]" style={{ width: 420, height: 620 }}>
          <ReceiptSheet data={data} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" disabled={busy !== null} onClick={() => run("pdf")}>
          <FileDown size={16} /> {busy === "pdf" ? "Hazırlanıyor…" : "PDF indir"}
        </button>
        {whatsappUrl ? (
          <a className="btn-primary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={16} /> WhatsApp’tan bu numaraya ilet
          </a>
        ) : (
          <button type="button" className="btn-primary" disabled>
            <MessageCircle size={16} /> WhatsApp’tan bu numaraya ilet
          </button>
        )}
        <button type="button" className="btn-secondary" disabled={busy !== null} onClick={() => run("share")}>
          <Share2 size={16} /> {busy === "share" ? "Açılıyor…" : "PDF paylaş"}
        </button>
      </div>
      {whatsappUrl ? (
        <p className="text-xs text-slate-500">
          WhatsApp, {displayPhone} numarasıyla sohbeti açar ve mesajı hazırlar. PDF için “PDF paylaş”ı kullanın.
        </p>
      ) : (
        <p className="text-xs text-amber-600">Öğrenciye 05xx formatında telefon ekleyin; WhatsApp numarayı otomatik açsın.</p>
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
