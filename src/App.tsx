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
    
    try {
      // 나노바나나(Nano Banana) API 연동 로직
      const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;
      
      if (!apiKey) {
        console.warn("API Key is missing. Simulating API response...");
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        // 실제 API 호출 로직은 여기에 구현
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      setShowResults(true);
      
      // 결과 영역으로 스크롤 이동
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error("Error generating:", error);
      alert("피팅 영상 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 플레이스홀더 영상을 위해 샘플 비디오 URL 적용 (실제 서비스에서는 API 응답 URL 사용)
  const videos = [
    { title: "정면", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { title: "측면", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { title: "후면", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { title: "턴", src: "https://www.w3schools.com/html/mov_bbb.mp4" }
  ];

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
            {isGenerating ? "AI 분석 중..." : "AI 피팅 결과 확인하기"}
          </button>
        </div>

        {showResults && (
          <div className="result-section">
            <h3>피팅 결과</h3>
            <div className="video-grid">
              {videos.map((v, i) => (
                <div className="video-card" key={i}>
                  <video controls autoPlay loop muted playsInline>
                    <source src={v.src} type="video/mp4" />
                  </video>
                  <div className="video-info">{v.title}</div>
                </div>
              ))}
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
