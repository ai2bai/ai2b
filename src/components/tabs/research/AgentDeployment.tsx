import React, { useRef, useEffect, useState } from "react";
import { TabItemProps } from '@/types';
const AgentDeployment: React.FC<TabItemProps> = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.autoplay = true;
    video.muted = true;
    video.loop = true;

    video.addEventListener("loadedmetadata", () => {
      setDuration(video.duration);
    });

    video.addEventListener("timeupdate", () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    });

    video.play().catch((error) => {
      console.error("error", error);
    });

    return () => {
      video.removeEventListener("loadedmetadata", () => {});
      video.removeEventListener("timeupdate", () => {});
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (videoRef.current) {
      const newTime = (value / 100) * duration;
      videoRef.current.currentTime = newTime;
      setProgress(value);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full h-[445px] mx-auto bg-gray-900 rounded-md overflow-hidden border border-gray-200/20">
      <div className="relative group">
        <video ref={videoRef} className="w-full h-full object-cover">
          <source src="/video.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default AgentDeployment;
