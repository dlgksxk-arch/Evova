import React, { useEffect, useMemo, useState } from 'react';
import type { LanguageCode } from '../constants/languages';
import { FACE_SAMPLES, type FaceCategory } from '../data/faceSamples';

const FACE_CATEGORY_LABELS: Record<LanguageCode, Record<FaceCategory, string>> = {
  ko: { female: '여성', male: '남성', dog: '강아지', cat: '고양이' },
  en: { female: 'Women', male: 'Men', dog: 'Dog', cat: 'Cat' },
  es: { female: 'Mujer', male: 'Hombre', dog: 'Perro', cat: 'Gato' },
  zh: { female: '女性', male: '男性', dog: '狗', cat: '猫' },
  ja: { female: '女性', male: '男性', dog: '犬', cat: '猫' },
  hi: { female: 'महिला', male: 'पुरुष', dog: 'कुत्ता', cat: 'बिल्ली' },
  fr: { female: 'Femme', male: 'Homme', dog: 'Chien', cat: 'Chat' },
  ar: { female: 'نساء', male: 'رجال', dog: 'كلب', cat: 'قط' },
  bn: { female: 'নারী', male: 'পুরুষ', dog: 'কুকুর', cat: 'বিড়াল' },
  ru: { female: 'Женщина', male: 'Мужчина', dog: 'Собака', cat: 'Кошка' },
  pt: { female: 'Mulher', male: 'Homem', dog: 'Cão', cat: 'Gato' },
  ur: { female: 'خاتون', male: 'مرد', dog: 'کتا', cat: 'بلی' },
  id: { female: 'Wanita', male: 'Pria', dog: 'Anjing', cat: 'Kucing' },
  de: { female: 'Frau', male: 'Mann', dog: 'Hund', cat: 'Katze' },
  mr: { female: 'महिला', male: 'पुरुष', dog: 'कुत्रा', cat: 'मांजर' },
  te: { female: 'మహిళ', male: 'పురుషుడు', dog: 'కుక్క', cat: 'పిల్లి' },
  tr: { female: 'Kadın', male: 'Erkek', dog: 'Köpek', cat: 'Kedi' },
  ta: { female: 'பெண்', male: 'ஆண்', dog: 'நாய்', cat: 'பூனை' },
  vi: { female: 'Nữ', male: 'Nam', dog: 'Chó', cat: 'Mèo' },
  it: { female: 'Donna', male: 'Uomo', dog: 'Cane', cat: 'Gatto' },
};

const MODAL_COPY: Record<LanguageCode, { title: string; subtitle: string; error: string; disclaimer: string }> = {
  ko: { title: '샘플 선택', subtitle: '미리보기에 사용할 샘플 이미지를 선택하세요.', error: '이미지 오류', disclaimer: '모든 이미지는 AI로 생성되었습니다.' },
  en: { title: 'Choose Sample', subtitle: 'Select a sample image for the preview.', error: 'Image error', disclaimer: 'All images were generated with AI.' },
  es: { title: 'Elegir muestra', subtitle: 'Selecciona una imagen de muestra para la vista previa.', error: 'Error de imagen', disclaimer: 'Todas las imágenes fueron generadas con IA.' },
  zh: { title: '选择示例', subtitle: '请选择用于预览的示例图片。', error: '图片错误', disclaimer: '所有图片均由 AI 生成。' },
  ja: { title: 'サンプルを選択', subtitle: 'プレビューに使うサンプル画像を選んでください。', error: '画像エラー', disclaimer: 'すべての画像は AI により生成されています。' },
  hi: { title: 'नमूना चुनें', subtitle: 'प्रीव्यू के लिए नमूना छवि चुनें।', error: 'छवि त्रुटि', disclaimer: 'सभी चित्र AI द्वारा बनाए गए हैं।' },
  fr: { title: 'Choisir un exemple', subtitle: 'Sélectionnez une image exemple pour l’aperçu.', error: 'Erreur d’image', disclaimer: 'Toutes les images ont été générées par IA.' },
  ar: { title: 'اختر نموذجًا', subtitle: 'اختر صورة نموذجية للمعاينة.', error: 'خطأ في الصورة', disclaimer: 'تم إنشاء جميع الصور بواسطة الذكاء الاصطناعي.' },
  bn: { title: 'স্যাম্পল নির্বাচন করুন', subtitle: 'প্রিভিউর জন্য একটি স্যাম্পল ছবি বেছে নিন।', error: 'ছবির ত্রুটি', disclaimer: 'সব ছবি AI দিয়ে তৈরি হয়েছে।' },
  ru: { title: 'Выбрать образец', subtitle: 'Выберите изображение-образец для предпросмотра.', error: 'Ошибка изображения', disclaimer: 'Все изображения созданы ИИ.' },
  pt: { title: 'Escolher amostra', subtitle: 'Selecione uma imagem de amostra para a prévia.', error: 'Erro de imagem', disclaimer: 'Todas as imagens foram geradas por IA.' },
  ur: { title: 'نمونہ منتخب کریں', subtitle: 'پیش نظارہ کے لیے نمونہ تصویر منتخب کریں۔', error: 'تصویری خرابی', disclaimer: 'تمام تصاویر AI سے تیار کی گئی ہیں۔' },
  id: { title: 'Pilih sampel', subtitle: 'Pilih gambar sampel untuk pratinjau.', error: 'Kesalahan gambar', disclaimer: 'Semua gambar dibuat dengan AI.' },
  de: { title: 'Beispiel wählen', subtitle: 'Wähle ein Beispielbild für die Vorschau.', error: 'Bildfehler', disclaimer: 'Alle Bilder wurden mit KI erzeugt.' },
  mr: { title: 'नमुना निवडा', subtitle: 'पूर्वदृश्यासाठी नमुना प्रतिमा निवडा.', error: 'प्रतिमा त्रुटी', disclaimer: 'सर्व प्रतिमा AI ने तयार केल्या आहेत.' },
  te: { title: 'సాంపిల్ ఎంచుకోండి', subtitle: 'ప్రీవ్యూ కోసం సాంపిల్ చిత్రాన్ని ఎంచుకోండి.', error: 'చిత్ర లోపం', disclaimer: 'అన్ని చిత్రాలు AI ద్వారా రూపొందించబడ్డాయి.' },
  tr: { title: 'Örnek seç', subtitle: 'Önizleme için bir örnek görsel seçin.', error: 'Görsel hatası', disclaimer: 'Tüm görseller yapay zekâ ile üretildi.' },
  ta: { title: 'மாதிரியைத் தேர்வுசெய்க', subtitle: 'முன்னோட்டத்திற்கான மாதிரி படத்தைத் தேர்வுசெய்க.', error: 'படப் பிழை', disclaimer: 'எல்லா படங்களும் AI மூலம் உருவாக்கப்பட்டவை.' },
  vi: { title: 'Chọn mẫu', subtitle: 'Chọn hình mẫu để xem trước.', error: 'Lỗi hình ảnh', disclaimer: 'Tất cả hình ảnh đều được tạo bằng AI.' },
  it: { title: 'Scegli campione', subtitle: 'Seleziona un’immagine campione per l’anteprima.', error: 'Errore immagine', disclaimer: 'Tutte le immagini sono state generate con IA.' },
};

const FACE_CATEGORIES: FaceCategory[] = ['female', 'male', 'dog', 'cat'];

const findCategoryByUrl = (url: string | null): FaceCategory => {
  if (!url) {
    return 'female';
  }

  return FACE_CATEGORIES.find((category) => FACE_SAMPLES[category].includes(url)) ?? 'female';
};

interface SampleModalProps {
  currentUrl: string | null;
  lang: LanguageCode;
  onClose: () => void;
  onSelect: (url: string, category: FaceCategory) => void;
}

const SampleModal: React.FC<SampleModalProps> = ({ currentUrl, lang, onClose, onSelect }) => {
  const [category, setCategory] = useState<FaceCategory>(() => findCategoryByUrl(currentUrl));
  const [loadedUrls, setLoadedUrls] = useState<Record<string, boolean>>({});
  const [erroredUrls, setErroredUrls] = useState<Record<string, boolean>>({});

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

  const samples = useMemo(() => FACE_SAMPLES[category], [category]);
  const labels = FACE_CATEGORY_LABELS[lang];
  const copy = MODAL_COPY[lang];

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

        <div className="sample-category-tabs">
          {FACE_CATEGORIES.map((tab) => (
            <button
              key={tab}
              className={category === tab ? 'active' : ''}
              onClick={() => setCategory(tab)}
              type="button"
            >
              {labels[tab]}
            </button>
          ))}
        </div>

        <div className="sample-grid">
          {samples.map((url, index) => (
            <button
              key={url}
              className={`sample-card ${currentUrl === url ? 'selected' : ''}`}
              onClick={() => {
                onSelect(url, category);
                onClose();
              }}
              type="button"
            >
              {!loadedUrls[url] && !erroredUrls[url] && (
                <div className="sample-card-overlay">
                  <span className="spinner sample-spinner"></span>
                </div>
              )}
              <img
                src={url}
                alt={`${labels[category]} sample ${index + 1}`}
                className={loadedUrls[url] ? 'is-visible' : ''}
                loading="lazy"
                onError={() => setErroredUrls((prev) => ({ ...prev, [url]: true }))}
                onLoad={() => setLoadedUrls((prev) => ({ ...prev, [url]: true }))}
              />
              <div className="error-placeholder">{copy.error}</div>
            </button>
          ))}
        </div>
        <p className="modal-disclaimer">{copy.disclaimer}</p>
      </div>
    </div>
  );
};

export default SampleModal;
