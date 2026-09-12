import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Download, Upload } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { LOGO_ICON_KEYS, getLogoIcon } from "@/lib/logoIcons";
import type { AppData } from "@/types";

function isValidAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.students) &&
    Array.isArray(v.payments) &&
    Array.isArray(v.expenses) &&
    typeof v.settings === "object" &&
    v.settings !== null
  );
}

export function SettingsPage() {
  const { data, updateSettings, resetDemo, clearAllData, importData } = useAppData();
  const [academyName, setAcademyName] = useState(data.settings.academyName);
  const [city, setCity] = useState(data.settings.city);
  const [logoIcon, setLogoIcon] = useState(data.settings.logoIcon);
  const [contactPhone, setContactPhone] = useState(data.settings.contactPhone);
  const [contactEmail, setContactEmail] = useState(data.settings.contactEmail);
  const [address, setAddress] = useState(data.settings.address);
  const [saved, setSaved] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    updateSettings({ ...data.settings, academyName, city, logoIcon, contactPhone, contactEmail, address });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `ders-plus-finans-yedek-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!isValidAppData(parsed)) {
          setImportMessage({ type: "error", text: "Geçersiz dosya biçimi. Lütfen geçerli bir yedek dosyası seçin." });
          return;
        }
        const confirmed = window.confirm(
          "Mevcut tüm veriler içe aktarılan dosyayla değiştirilecek. Devam etmek istiyor musunuz?",
        );
        if (!confirmed) return;
        importData(parsed);
        setImportMessage({ type: "success", text: "Veriler başarıyla içe aktarıldı." });
      } catch {
        setImportMessage({ type: "error", text: "Dosya okunamadı. Geçerli bir JSON dosyası olduğundan emin olun." });
      }
    };
    reader.readAsText(file);
  }

  function handleReset() {
    if (window.confirm("Tüm veriler demo başlangıç durumuna sıfırlanacak. Emin misiniz?")) {
      resetDemo();
      setImportMessage(null);
    }
  }

  function handleClearAll() {
    if (
      window.confirm(
        "Tüm öğrenci, ödeme ve gider kayıtları silinecek ve tarayıcı hafızasından kaldırılacak. Sayfa yenilense bile demo veriler geri gelmez. Devam edilsin mi?",
      )
    ) {
      clearAllData();
      setDemoMessage("Kayıtlar silindi. Sayfa yenilense bile demo veriler geri gelmez.");
    }
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <form onSubmit={submit} className="card space-y-5 p-6">
        <div>
          <h2 className="font-semibold">Kurum bilgileri</h2>
          <p className="text-sm text-slate-500">Panelde ve giriş ekranında görünen kurum kimliği.</p>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">Logo / İkon</span>
          <div className="flex flex-wrap gap-2">
            {LOGO_ICON_KEYS.map((key) => {
              const Icon = getLogoIcon(key);
              const active = logoIcon === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLogoIcon(key)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                  aria-label={key}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Kurum adı</label>
            <input className="input" value={academyName} onChange={(e) => setAcademyName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Şehir</label>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">İletişim telefonu</label>
            <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">İletişim e-postası</label>
            <input
              className="input"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Adres</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" className="btn-primary">
            Kaydet
          </button>
          {saved ? <p className="text-sm font-medium text-emerald-600">Ayarlar kaydedildi.</p> : null}
        </div>
      </form>

      <div className="card space-y-4 p-6">
        <div>
          <h2 className="font-semibold">Veri yönetimi</h2>
          <p className="text-sm text-slate-500">
            Tüm kayıtlar tarayıcı LocalStorage içinde tutulur. Verilerinizi JSON olarak yedekleyebilir veya geri
            yükleyebilirsiniz.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={handleExport}>
            <Download size={16} /> Dışa aktar (yedekle)
          </button>
          <button type="button" className="btn-secondary" onClick={handleImportClick}>
            <Upload size={16} /> İçe aktar (geri yükle)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        {importMessage ? (
          <p
            className={`text-sm font-medium ${
              importMessage.type === "success" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {importMessage.text}
          </p>
        ) : null}
      </div>

      <div className="card space-y-3 p-6">
        <h2 className="font-semibold">Demo veri</h2>
        <p className="text-sm text-slate-500">
          Örnek kayıtları siler ve localStorage içindeki finans verilerini kaldırır. Boş hafızada demo veriler
          otomatik yüklenmez; sayfa yenilense bile ekran boş kalır.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={handleClearAll}>
            Demo verileri temizle
          </button>
          <button type="button" className="btn-secondary" onClick={handleReset}>
            Demo veriyi sıfırla
          </button>
        </div>
        {demoMessage ? <p className="text-sm font-medium text-emerald-600">{demoMessage}</p> : null}
      </div>
    </div>
  );
}
