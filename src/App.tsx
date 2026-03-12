import React, { useState, useRef, useEffect } from 'react';
import './App.css';

interface UploadCardProps {
  title: string;
  icon: string;
  description: string;
  image: string | null;
  onUpload: (file: File) => void;
}

const UploadCard: React.FC<UploadCardProps> = ({ title, icon, description, image, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">{icon}</div>
        <h2>{title}</h2>
      </div>
      <div 
        className={`upload-area ${image ? 'has-image' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          hidden 
          accept="image/*"
        />
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <div className="upload-placeholder">
            <i>📸</i>
            <p>{description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [clothImage, setClothImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  const handleImageUpload = (file: File, type: 'face' | 'cloth') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        if (type === 'face') setFaceImage(e.target.result as string);
        else setClothImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!faceImage || !clothImage) {
      alert("얼굴 사진과 옷 사진을 모두 업로드해주세요!");
      return;
    }
    
    setIsGenerating(true);
    setResultImage(null);
    
    try {
      const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;
      
      if (!apiKey) {
        alert("Nano Banana API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.");
        setIsGenerating(false);
        return;
      }

      // 실제 나노바나나 API 호출 (합성 요청)
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro:generateTryOn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          person_image: faceImage.split(',')[1],
          garment_image: clothImage.split(',')[1],
          parameters: {
            output_format: "image",
            prompt: "Composite the face onto the garment realistically"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // 다양한 API 응답 포맷 대응 (image_base64, generated_image, 혹은 candidates 기반)
      let base64Result = null;
      if (data.image_base64) base64Result = data.image_base64;
      else if (data.generated_image) base64Result = data.generated_image;
      else if (data.candidates && data.candidates[0]?.content) base64Result = data.candidates[0].content;
      
      if (!base64Result) {
        console.error("Unknown API response format:", data);
        throw new Error("결과 이미지를 응답에서 찾을 수 없습니다.");
      }

      setResultImage(`data:image/jpeg;base64,${base64Result}`);
      setShowResults(true);
      
      // 결과 영역으로 스크롤 이동
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error("Error generating:", error);
      alert("Nano Banana 피팅 이미지 생성에 실패했습니다. 연결을 다시 확인해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <div className="header-top">
          <h1>IBOVA Fitting</h1>
          <button 
            className="theme-toggle" 
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? '☀️ 밝은 모드' : '🌙 다크 모드'}
          </button>
        </div>
        <p>나에게 찰떡인 스타일을 찾아보세요!!<br/>AI 기반 가상 피팅 서비스</p>
      </header>

      <main className="service-cards">
        <UploadCard 
          title="1. 얼굴 사진 등록" 
          icon="👤"
          description="정면 얼굴이 잘 나온 사진을 올려주세요"
          image={faceImage} 
          onUpload={(file) => handleImageUpload(file, 'face')} 
        />
        <UploadCard 
          title="2. 옷 사진 등록" 
          icon="👕"
          description="입어보고 싶은 옷 사진을 올려주세요"
          image={clothImage} 
          onUpload={(file) => handleImageUpload(file, 'cloth')} 
        />
        
        <div className="action-section">
          <button 
            className="generate-btn" 
            onClick={handleGenerate}
            disabled={isGenerating || !faceImage || !clothImage}
          >
            {isGenerating ? "Nano Banana AI 분석 중..." : "AI 피팅 결과 확인하기"}
          </button>
        </div>

        {showResults && resultImage && (
          <div className="result-section">
            <h3>AI 피팅 결과</h3>
            <div className="composite-result" style={{ aspectRatio: 'auto' }}>
              <img src={resultImage} alt="Fitting Result" style={{ width: '100%', height: 'auto', borderRadius: '12px', display: 'block' }} />
              <div className="composite-watermark">Nano Banana AI</div>
            </div>
          </div>
        )}
      </main>

      <footer className="info-footer">
        <p>가상 피팅은 딥러닝 모델을 사용하여 생성됩니다.</p>
        <p><a href="#">이용약관</a> | <a href="#">개인정보처리방침</a></p>
      </footer>
    </div>
  );
};

export default App;
