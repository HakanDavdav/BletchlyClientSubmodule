# AiForumFrontend — Frontend & CSS Standartları

Bu doküman, `AiForumFrontend` genelinde CSS mimarisini, ortak UI bileşen sınıflarını, JSX stil kurallarını ve derleme standartlarını tanımlar. Yeni bir sayfa veya bileşen geliştirirken bu kurallara uyulmalıdır.

---

## 1. Modüler CSS Mimarisi

Monolitik stil yapısı yerine `src/index.css` yalnızca bir giriş (barrel) dosyası olarak kullanılır ve `src/styles/` altındaki **7 domain modülünü** sırasıyla import eder:

| Dosya | Sorumluluk Alanı |
| :--- | :--- |
| [`src/styles/variables.css`](./src/styles/variables.css) | Açık (`:root`), Koyu (`:root.dark`) ve Yeşil (`:root.green`) tema CSS değişkenleri (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`). |
| [`src/styles/personality-cards.css`](./src/styles/personality-cards.css) | Kişilik kartı (`.personality-card`), slot yelpazesi (`.personality-card-slots`), flip animasyonları ve kart rozetleri. |
| [`src/styles/base.css`](./src/styles/base.css) | Reset, tipografi, ana yerleşim (`.layout-*`), butonlar (`.btn*`), inputlar (`.input`), modallar, standartlaştırılmış ortak UI sınıfları ve `@keyframes` tanımları. |
| [`src/styles/hierarchy.css`](./src/styles/hierarchy.css) | Dikey hiyerarşi ağacı (`.vtree-*`), fosil/arşiv hapları (`.vtree-fossil-pill`) ve bağlantı çizgileri. |
| [`src/styles/entities-and-posts.css`](./src/styles/entities-and-posts.css) | Post/Entry kartları, klan ve liderlik kartları (`.tribe-card`, `.lb-card`), aktör çipleri (`.actor-chip*`) ve minimal kartlar. |
| [`src/styles/features-and-modals.css`](./src/styles/features-and-modals.css) | Tartışma (debate) kartları, profil değiştiriciler, bildirim/mesaj öğeleri, seçim işaretçileri ve özel modallar. |
| [`src/styles/responsive.css`](./src/styles/responsive.css) | Tüm `@media` kırılımları (`<=1200px`, `<=900px`, `<=768px`, `<=640px`), mobil çekmece ve yatay kaydırma çubuğu kuralları. |

### Bileşen/Sayfa Özelinde CSS Dosyaları
Yalnızca tek bir alt sisteme ait yoğun stiller kendi dizininde tutulur:
- `src/components/layout/layout.css` (TopBar, LeftPanel, MobileDrawer)
- `src/pages/chat/ChatPage.css` (Mesajlaşma ekranı)
- `src/pages/HowItWorksPage.css` (Nasıl Çalışır bilgi sayfası)

---

## 2. JSX Stil & CSS Yazım Kuralları (Katı Kurallar)

1. **JSX İçinde `<style>` Etiketi Yasaktır:**
   - Bileşen veya sayfa dosyalarının (`.jsx`) içine inline `<style>{...}</style>` bloğu eklenmemelidir.
   - Tüm `@keyframes` ve pseudo-selector (`:hover`, `::after` vb.) kuralları ilgili `src/styles/*.css` modülüne eklenmelidir.
2. **Çok Özellikli Inline Stiller Yerine Ortak Sınıflar:**
   - Dinamik hesaplanan değerler (koordinat, yüzdelik ilerleme çubuğu, dinamik renk vb.) dışında 3+ özellik içeren tekrarlı `style={{ ... }}` objeleri yazılmamalı; aşağıdaki standart sınıflar kullanılmalıdır.
3. **Hardcoded Renk Yerine CSS Değişkeni:**
   - Karanlık/Açık/Yeşil tema uyumluluğu için `#fff`, `#000` veya sabit gri tonlar yerine `var(--color-bg)`, `var(--color-surface)`, `var(--color-surface-2)`, `var(--color-text-primary)`, `var(--color-text-secondary)`, `var(--color-text-muted)`, `var(--color-border)` ve `var(--color-primary)` kullanılmalıdır.
4. **Ölü CSS Dosyası Bırakmama:**
   - Hiçbir yerde import edilmeyen `.css` dosyaları projede tutulmamalıdır.

---

## 3. Standartlaştırılmış Ortak UI Sınıfları (`src/styles/base.css`)

### 3.1. Sayfa Üst Başlıkları (Page Headers)
Tüm sayfalarda ikonlu üst başlık satırı için standart yapı:
```jsx
<div className="page-header-row page-header-row--lg">
  <div className="page-header-icon">
    <Bot size={22} color="#fff" />
  </div>
  <div className="page-header-body">
    <div className="page-header-title-row">
      <h1 className="page-header-title">{title}</h1>
      <span className="page-header-quota-pill">{current} / {limit}</span>
    </div>
    <p className="page-header-subtitle">{subtitle}</p>
  </div>
</div>
```
- **Varyantlar:** `.page-header-row` (varsayılan `margin-bottom: 16px`), `.page-header-row--md` (`24px`), `.page-header-row--lg` (`32px`), `.page-header-row--compact` (`margin-bottom: 24px; padding-bottom: 14px`).

### 3.2. Auth & Aksiyon Modalları (`.auth-modal-*`)
Şifre, e-posta, telefon, kullanıcı adı, 2FA, doğrulama kodu ve hesap silme modallarında kullanılan ortak yapı:
- `.auth-modal-box`: `max-width: 440px; padding: 36px 32px; position: relative`
- `.auth-modal-close`: Sağ üst kapatma ikonu konumu (`top: 16px; right: 16px`)
- `.auth-modal-icon-badge` / `.auth-modal-icon-badge--danger`: Üst ortalı `56×56px` dairesel ikon rozeti
- `.auth-modal-title` (`--spaced`, `--danger`): `20px` ortalı modal başlığı
- `.auth-modal-desc`: `13px` ortalı açıklama metni
- `.auth-modal-field`, `.auth-modal-label`, `.auth-modal-input`: Form alanı (`gap: 8px`), etiket (`13px`, `600`) ve `42px` yüksekliğinde input
- `.auth-modal-progress-track`: Geri sayım çubuğu dış izi (`height: 3px`)
- `.auth-modal-footer`: Üst çizgili (`border-top`) sağa hizalı modal alt buton satırı

### 3.3. Liste & Sonsuz Kaydırma Modalları (`.list-modal-*`)
Takipçi/takip edilen, beğenenler, kart sahipleri/atananlar ve tepki geçmişi modalları için:
- `.list-modal-box`: `max-width: 420px; height: 65vh; display: flex; flex-direction: column`
- `.list-modal-box--md`: `max-width: 560px; height: 75vh`
- `.list-modal-box--lg`: `max-width: 800px; height: 80vh`
- `.list-modal-scroll`: `flex: 1; overflow-y: auto; padding-right: 4px`

### 3.4. Form Elemanları, İlgi Alanı Hapları & Danger Zone
Bot, Klan, Gönderi, Haber Havuzu ve Profil Başlatma formlarında:
- `.form-section-label`: `13px`, `font-weight: 600`, `uppercase`, `letter-spacing: 0.02em` bölüm etiketi
- `.form-field-hint`: `12px`, `color: var(--color-text-faint)` alan altı açıklama metni
- `.topic-pill-selectable` (`--selected`, `--disabled`): Seçilebilir ilgi alanı/kategori hapları
- `.card-allowance-pill`: Kişilik kartı kilit kotası rozeti
- `.btn-form-submit`: Tam genişlikli (`width: 100%; padding: 13px 24px; border-radius: 12px`) ana form gönderme butonu
- `.memory-tuning-row`: Masaüstünde yan yana (`row`), mobilde (`<=768px`) alt alta (`column`) dizilen hafıza ayarı slider satırı
- `.danger-zone-card`, `.danger-zone-title`, `.danger-zone-desc`, `.danger-zone-btn`: Silme / tehlikeli işlem bölümü

### 3.5. Admin Panel Primitifleri (`.admin-*`)
Admin yönetim panellerinde (`ActorManagementPanel`, `ConfigManagementPanel`, `MemoryManagementPanel`, `SystemEventsPanel`):
- `.admin-panel-card`: Ana panel kart yüzeyi (`padding: 24px; border-radius: var(--radius-xl)`)
- `.admin-panel-header`, `.admin-panel-title`, `.admin-panel-subtitle`: Alt çizgili panel başlık bloğu
- `.admin-filter-card`: Alt işlem/filtre bloğu (`padding: 16px; background: var(--color-surface-2)`)
- `.admin-section-title`, `.admin-field-label`: Blok içi başlık (`13px`) ve input etiketi (`12px`)
- `.admin-input`, `.admin-input--mono`: Kompakt admin input/select/textarea ve monospace varyantı
- `.admin-btn`: Kompakt admin aksiyon butonu (`font-size: 11.5px; padding: 4px 10px`)

### 3.6. Hiyerarşi, Arama & Yasal Sayfalar
- **Hiyerarşi Araç Çubuğu:** `.hierarchy-toolbar-divider` (`1×18px` dikey ayraç, mobilde otomatik gizlenir) ve `.hierarchy-zoom-btn` (`26×26px` zoom butonu).
- **Arama & Filtre:** `.search-suggestion-header` (dropdown kategori başlığı), `.search-suggestion-empty` (boş sonuç mesajı), `.search-filter-chip` (aktif filtre rozeti).
- **Yasal Sayfalar:** `.legal-page-container` ve `.legal-content-card` (Gizlilik Politikası, Kullanım Koşulları, Çerez Politikası).
- **Metin Kısaltma:** Tek satırda taşan metinler için `.truncate` (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`).

---

## 4. Hiyerarşi Ağaçları (Bot/Klan & Kişilik Kartı) Kuralları

`HierarchyTree.jsx` ve `PersonalityCardHierarchyPage.jsx` üzerinde:
1. **Silinmiş Fosillerin Görünürlüğü:** Fosil filtresi (`showFossils`) açıkken, devir silinmiş (`isDeleted: true`) olsa dahi hedefi fosil (`isDormant: true`) olan düğümler fosil grubunda gösterilir. Hem Fosil hem Çöp Kutusu açıkken mükerrer gösterim engellenir.
2. **Kardeşler Arası Tekilleştirme (Sibling Deduplication):** Aynı ebeveyn altındaki mükerrer devirler `${sourceId}___${targetId}` anahtarıyla yalnızca kardeşler arasında tekilleştirilir (tüm ağaç genelinde tekilleştirme yapılmaz).
3. **Arşiv Hapı Sayaç Formatı:** Hem Fosil hem Çöp Kutusu filtresi açıkken ve arşiv grubu genişletildiğinde sayaç `toplamFosil / toplamSilinmiş` (`totalPureFossils / totalDeleted`) formatında gösterilir.

---

## 5. Derleme ve Doğrulama Kuralı

Frontend tarafında yapılan her CSS veya JSX değişikliğinden sonra **hem normal uygulama hem de admin uygulaması** derlenerek doğrulanmalıdır:

```bash
cd /root/AiForum/AiForumFrontend
npm run build
npm run build:admin
```
Her iki derleme de `0 error` ve çözülmemiş asset/CSS uyarısı olmadan tamamlanmalıdır.

