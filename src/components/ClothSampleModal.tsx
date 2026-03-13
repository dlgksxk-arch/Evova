import React, { useEffect, useMemo, useState } from 'react';
import type { LanguageCode } from '../constants/languages';
import { clothSampleOptions, type ClothSampleCategory } from '../data/clothSamples';

const MODAL_COPY: Record<LanguageCode, { title: string; subtitle: string; error: string; disclaimer: string }> = {
  ko: { title: '샘플 의상 선택', subtitle: '미리보기에 사용할 샘플 의상을 선택하세요.', error: '이미지 오류', disclaimer: '모든 이미지는 AI로 생성되었습니다.' },
  en: { title: 'Choose Clothing Sample', subtitle: 'Select a sample outfit for the preview.', error: 'Image error', disclaimer: 'All images were generated with AI.' },
  es: { title: 'Elegir prenda de muestra', subtitle: 'Selecciona una prenda de muestra para la vista previa.', error: 'Error de imagen', disclaimer: 'Todas las imágenes fueron generadas con IA.' },
  zh: { title: '选择示例服装', subtitle: '请选择用于预览的示例服装。', error: '图片错误', disclaimer: '所有图片均由 AI 生成。' },
  ja: { title: '服のサンプルを選択', subtitle: 'プレビュー用のサンプル衣装を選んでください。', error: '画像エラー', disclaimer: 'すべての画像は AI により生成されています。' },
  hi: { title: 'नमूना कपड़ा चुनें', subtitle: 'प्रीव्यू के लिए नमूना पोशाक चुनें।', error: 'छवि त्रुटि', disclaimer: 'सभी चित्र AI द्वारा बनाए गए हैं।' },
  fr: { title: 'Choisir un vêtement exemple', subtitle: 'Sélectionnez un vêtement exemple pour l’aperçu.', error: 'Erreur d’image', disclaimer: 'Toutes les images ont été générées par IA.' },
  ar: { title: 'اختر عينة ملابس', subtitle: 'اختر قطعة نموذجية للمعاينة.', error: 'خطأ في الصورة', disclaimer: 'تم إنشاء جميع الصور بواسطة الذكاء الاصطناعي.' },
  bn: { title: 'স্যাম্পল পোশাক নির্বাচন করুন', subtitle: 'প্রিভিউর জন্য স্যাম্পল পোশাক বেছে নিন।', error: 'ছবির ত্রুটি', disclaimer: 'সব ছবি AI দিয়ে তৈরি হয়েছে।' },
  ru: { title: 'Выбрать образец одежды', subtitle: 'Выберите образец одежды для предпросмотра.', error: 'Ошибка изображения', disclaimer: 'Все изображения созданы ИИ.' },
  pt: { title: 'Escolher roupa de amostra', subtitle: 'Selecione uma roupa de amostra para a prévia.', error: 'Erro de imagem', disclaimer: 'Todas as imagens foram geradas por IA.' },
  ur: { title: 'نمونہ لباس منتخب کریں', subtitle: 'پیش نظارہ کے لیے نمونہ لباس منتخب کریں۔', error: 'تصویری خرابی', disclaimer: 'تمام تصاویر AI سے تیار کی گئی ہیں۔' },
  id: { title: 'Pilih sampel pakaian', subtitle: 'Pilih pakaian sampel untuk pratinjau.', error: 'Kesalahan gambar', disclaimer: 'Semua gambar dibuat dengan AI.' },
  de: { title: 'Kleidungsbeispiel wählen', subtitle: 'Wähle ein Kleidungsbeispiel für die Vorschau.', error: 'Bildfehler', disclaimer: 'Alle Bilder wurden mit KI erzeugt.' },
  mr: { title: 'नमुना कपडा निवडा', subtitle: 'पूर्वदृश्यासाठी नमुना पोशाख निवडा.', error: 'प्रतिमा त्रुटी', disclaimer: 'सर्व प्रतिमा AI ने तयार केल्या आहेत.' },
  te: { title: 'సాంపిల్ దుస్తులు ఎంచుకోండి', subtitle: 'ప్రీవ్యూ కోసం సాంపిల్ దుస్తులను ఎంచుకోండి.', error: 'చిత్ర లోపం', disclaimer: 'అన్ని చిత్రాలు AI ద్వారా రూపొందించబడ్డాయి.' },
  tr: { title: 'Örnek kıyafet seç', subtitle: 'Önizleme için bir örnek kıyafet seçin.', error: 'Görsel hatası', disclaimer: 'Tüm görseller yapay zekâ ile üretildi.' },
  ta: { title: 'மாதிரி உடையைத் தேர்வுசெய்க', subtitle: 'முன்னோட்டத்திற்கான மாதிரி உடையைத் தேர்வுசெய்க.', error: 'படப் பிழை', disclaimer: 'எல்லா படங்களும் AI மூலம் உருவாக்கப்பட்டவை.' },
  vi: { title: 'Chọn trang phục mẫu', subtitle: 'Chọn trang phục mẫu để xem trước.', error: 'Lỗi hình ảnh', disclaimer: 'Tất cả hình ảnh đều được tạo bằng AI.' },
  it: { title: 'Scegli capo campione', subtitle: 'Seleziona un capo campione per l’anteprima.', error: 'Errore immagine', disclaimer: 'Tutte le immagini sono state generate con IA.' },
};

interface ClothSampleModalProps {
  currentUrl: string | null;
  lang: LanguageCode;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const CLOTH_SAMPLE_CATEGORIES: ClothSampleCategory[] = ['female', 'male', 'animal', 'future', 'classic'];

const CLOTH_CATEGORY_LABELS: Record<'ko' | 'default', Record<ClothSampleCategory, string>> = {
  ko: {
    female: '여성',
    male: '남성',
    animal: '동물',
    future: '미래',
    classic: '클래식',
  },
  default: {
    female: 'Women',
    male: 'Men',
    animal: 'Animal',
    future: 'Future',
    classic: 'Classic',
  },
};

const findCategoryByUrl = (url: string | null): ClothSampleCategory => {
  if (!url) {
    return 'female';
  }

  return clothSampleOptions.find((sample) => sample.image === url)?.category ?? 'female';
};

const ClothSampleModal: React.FC<ClothSampleModalProps> = ({ currentUrl, lang, onClose, onSelect }) => {
  const [loadedUrls, setLoadedUrls] = useState<Record<string, boolean>>({});
  const [erroredUrls, setErroredUrls] = useState<Record<string, boolean>>({});
  const [category, setCategory] = useState<ClothSampleCategory>(() => findCategoryByUrl(currentUrl));
  const copy = MODAL_COPY[lang];
  const categoryLabels = lang === 'ko' ? CLOTH_CATEGORY_LABELS.ko : CLOTH_CATEGORY_LABELS.default;
  const categorySamples = useMemo(
    () => clothSampleOptions.filter((sample) => sample.category === category),
    [category],
  );
  const groupedSamples = categorySamples.reduce<Record<string, typeof categorySamples>>((acc, sample) => {
    if (!acc[sample.country]) {
      acc[sample.country] = [];
    }
    acc[sample.country].push(sample);
    return acc;
  }, {});

  useEffect(() => {
    setCategory(findCategoryByUrl(currentUrl));
  }, [currentUrl]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content sample-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{copy.title}</h3>
            <p className="modal-subtitle">{copy.subtitle}</p>
          </div>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="sample-modal-body">
          <div className="sample-category-tabs">
            {CLOTH_SAMPLE_CATEGORIES.map((tab) => (
              <button
                key={tab}
                className={category === tab ? 'active' : ''}
                onClick={() => setCategory(tab)}
                type="button"
              >
                {categoryLabels[tab]}
              </button>
            ))}
          </div>

          {Object.values(groupedSamples).map((samples) => (
            <div key={samples[0].country} className="cloth-country-group">
              <div className="cloth-country-title">
                {lang === 'ko' ? samples[0].countryLabelKo : samples[0].countryLabelEn}
              </div>
              <div className="sample-grid">
                {samples.map((sample) => (
                  <button
                    key={sample.id}
                    className={`sample-card ${currentUrl === sample.image ? 'selected' : ''} ${erroredUrls[sample.image] ? 'error' : ''}`}
                    onClick={() => {
                      onSelect(sample.image);
                      onClose();
                    }}
                    type="button"
                  >
                    {!loadedUrls[sample.image] && !erroredUrls[sample.image] && (
                      <div className="sample-card-overlay">
                        <span className="spinner sample-spinner"></span>
                      </div>
                    )}
                    <img
                      src={sample.image}
                      alt={sample.label}
                      className={loadedUrls[sample.image] ? 'is-visible' : ''}
                      loading="eager"
                      onError={() => {
                        console.error('[HAMDEVA] cloth sample thumbnail failed', sample.image);
                        setErroredUrls((prev) => ({ ...prev, [sample.image]: true }));
                      }}
                      onLoad={() => setLoadedUrls((prev) => ({ ...prev, [sample.image]: true }))}
                    />
                    <div className="error-placeholder">{copy.error}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="modal-disclaimer">{copy.disclaimer}</p>
      </div>
    </div>
  );
};

export default ClothSampleModal;
