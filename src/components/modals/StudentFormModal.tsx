import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, X } from "lucide-react";
import type { Student, StudentDraft } from "@/types";
import { todayISO } from "@/lib/format";
import { CLASSROOM_OPTIONS } from "@/lib/constants";
import { ModalShell } from "@/components/modals/ModalShell";
import { FormField } from "@/components/modals/FormField";
import { Avatar } from "@/components/Avatar";

type Props = {
  initial?: Student;
  onClose: () => void;
  onSubmit: (draft: StudentDraft, id?: string) => void;
};

export function StudentFormModal({ initial, onClose, onSubmit }: Props) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [parentName, setParentName] = useState(initial?.parentName ?? "");
  const [parentPhone, setParentPhone] = useState(initial?.parentPhone ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [classroom, setClassroom] = useState(initial?.classroom ?? CLASSROOM_OPTIONS[2]);
  const [agreementTotal, setAgreementTotal] = useState(String(initial?.agreementTotal ?? 0));
  const [joinedAt, setJoinedAt] = useState(initial?.joinedAt ?? todayISO());
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photoUrl ?? null);
  const [photoUrlInput, setPhotoUrlInput] = useState(initial?.photoUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      setPhotoUrl(result);
      setPhotoUrlInput(result);
    };
    reader.readAsDataURL(file);
  }

  function applyUrlInput(value: string) {
    setPhotoUrlInput(value);
    setPhotoUrl(value.trim() ? value.trim() : null);
  }

  function removePhoto() {
    setPhotoUrl(null);
    setPhotoUrlInput("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const draft: StudentDraft = {
      fullName,
      email: initial?.email ?? "",
      phone: phone.trim(),
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      classroom,
      course: initial?.course ?? "",
      agreementTotal: Number(agreementTotal),
      monthlyFee: initial?.monthlyFee ?? 0,
      downPayment: initial?.downPayment ?? 0,
      installmentCount: initial?.installmentCount ?? 0,
      firstInstallmentDate: initial?.firstInstallmentDate ?? null,
      status: initial?.status ?? "active",
      joinedAt: joinedAt || todayISO(),
      photoUrl,
    };
    onSubmit(draft, initial?.id);
    onClose();
  }

  return (
    <ModalShell widthClass="max-w-xl">
      <form onSubmit={submit} className="space-y-3">
        <h2 className="text-lg font-bold">{initial ? "Öğrenciyi düzenle" : "Yeni öğrenci"}</h2>

        <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
          <Avatar name={fullName || "?"} photoUrl={photoUrl} size={56} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-secondary py-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={14} /> Fotoğraf yükle
              </button>
              {photoUrl ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                  onClick={removePhoto}
                >
                  <X size={13} /> Kaldır
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <input
              className="input py-1.5 text-xs"
              placeholder="veya fotoğraf URL'si yapıştır"
              value={photoUrlInput}
              onChange={(e) => applyUrlInput(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Ad soyad">
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </FormField>
          <FormField label="Veli adı">
            <input
              className="input"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="İsteğe bağlı"
            />
          </FormField>
          <FormField label="Sınıf">
            <select className="input" value={classroom} onChange={(e) => setClassroom(e.target.value)}>
              {CLASSROOM_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Anne telefonu">
            <input
              className="input"
              type="tel"
              inputMode="tel"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="İsteğe bağlı"
            />
          </FormField>
          <FormField label="Baba telefonu">
            <input
              className="input"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="İsteğe bağlı"
            />
          </FormField>
          <FormField label="Kayıt tarihi">
            <input
              className="input"
              type="date"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Toplam anlaşma tutarı (TL)">
            <input
              className="input"
              type="number"
              min={0}
              value={agreementTotal}
              onChange={(e) => setAgreementTotal(e.target.value)}
              required
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn-primary">
            Kaydet
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
