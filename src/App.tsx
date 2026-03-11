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

  const handleGenerate = () => {
    if (!faceImage || !clothImage) {
      alert("Please upload both Face and Clothes photos!");
      return;
    }
    setIsGenerating(true);
    // Simulate AI Process
    setTimeout(() => {
      alert("AI Fitting process started! (API connection required)");
      setIsGenerating(false);
    }, 1500);
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
