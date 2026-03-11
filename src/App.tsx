import React, { useState, useRef } from 'react';
import './App.css';

interface UploadBoxProps {
  label: string;
  image: string | null;
  onUpload: (file: File) => void;
}

const UploadBox: React.FC<UploadBoxProps> = ({ label, image, onUpload }) => {
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
    <div 
      className={`upload-box ${image ? 'has-image' : ''}`}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <span className="label">{label}</span>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        hidden 
        accept="image/*"
      />
      {image ? (
        <img src={image} alt={label} />
      ) : (
        <div className="upload-placeholder">
          <i>📸</i>
          <p>Drop {label} here<br/>or click to upload</p>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [clothImage, setClothImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
      alert("Please upload both Face and Clothes photos!");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // 나노바나나(Nano Banana) API 연동 로직
      const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;
      
      if (!apiKey) {
        console.warn("API Key is missing. Simulating API response...");
        // API 키가 없을 경우 시뮬레이션 대기 (1.5초)
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert("Nano Banana API is not fully configured (API Key missing). Showing mock results.");
      } else {
        // 실제 API 호출 로직 (가상의 Nano Banana Try-On 엔드포인트 예시)
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro:generateTryOn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            person_image: faceImage.split(',')[1], // Base64 데이터만 추출
            garment_image: clothImage.split(',')[1],
            parameters: {
              output_format: "video", // 비디오 결과물 요청
              angles: ["front", "side", "back", "turn"]
            }
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Nano Banana API Response:", data);
        alert("Nano Banana AI Fitting completed successfully!");
        
        // 실제 응답이 오면 state를 업데이트하여 비디오를 교체하는 로직이 여기에 들어갑니다.
      }
    } catch (error) {
      console.error("Error calling Nano Banana API:", error);
      alert("Failed to generate fitting video. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const videos = [
    { title: "Front View", src: "video_front.mp4" },
    { title: "Side View", src: "video_side.mp4" },
    { title: "Back View", src: "video_back.mp4" },
    { title: "Full Turn", src: "video_turn.mp4" }
  ];

  return (
    <div className="app-container">
      <header>
        <h1>IBOVA</h1>
        <p>Experience your style with AI-powered virtual fitting</p>
      </header>

      <main>
        <div className="upload-section">
          <UploadBox 
            label="Face Photo" 
            image={faceImage} 
            onUpload={(file) => handleImageUpload(file, 'face')} 
          />
          <UploadBox 
            label="Clothes Photo" 
            image={clothImage} 
            onUpload={(file) => handleImageUpload(file, 'cloth')} 
          />
        </div>

        <button 
          className="generate-btn" 
          onClick={handleGenerate}
          disabled={isGenerating || !faceImage || !clothImage}
        >
          {isGenerating ? "Processing..." : "Try Style Now"}
        </button>

        <div className="video-grid">
          {videos.map((v, i) => (
            <div className="video-card" key={i}>
              <video controls autoPlay loop muted>
                <source src={v.src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="video-info">
                {v.title}
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="ad-container">
        --- SPONSORED CONTENT ---
      </div>
    </div>
  );
};

export default App;
