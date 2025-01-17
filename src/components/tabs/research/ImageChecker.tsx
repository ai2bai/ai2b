"use client";
import React from 'react';
import { TabItemProps } from '@/types';
import { useEffect, useState, useRef } from "react";
import ImageUploader from "../../ImageUploader";







const ImageChecker: React.FC<TabItemProps> = () => {
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [text, setText] = useState("");
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const initializeAudio = () => {
    if (!audioElementRef.current || audioContextRef.current) return;

    const context = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const audioAnalyser = context.createAnalyser();
    audioAnalyser.fftSize = 2048;
    audioAnalyser.smoothingTimeConstant = 0.8;

    const mediaSource = context.createMediaElementSource(
      audioElementRef.current
    );
    mediaSource.connect(audioAnalyser);
    audioAnalyser.connect(context.destination);

    audioContextRef.current = context;
    analyserRef.current = audioAnalyser;
    mediaSourceRef.current = mediaSource;

    setAudioContext(context);
    setAnalyser(audioAnalyser);

    const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
    const updateData = () => {
      audioAnalyser.getByteFrequencyData(dataArray);
      setAudioData(new Uint8Array(dataArray));
      requestAnimationFrame(updateData);
    };
    updateData();
  };
  useEffect(() => {
    if (!text) return;
    
    setIsTyping(true);
    let currentIndex = 0;
    setDisplayedText(""); // Reset displayed text when new text arrives
  
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(prev => prev + text[currentIndex]);
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(intervalId);
      }
    }, 30); // Adjust speed by changing this value (milliseconds)
  
    return () => clearInterval(intervalId);
  }, [text]);
  const handleResponse = (response: string) => {
    setText(response);
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (mediaSourceRef.current) {
        mediaSourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
    };
  }, []);

  const speakText = async () => {
    if (!text) return;

    try {
      
      if (audioElementRef.current) {
        if (!audioContextRef.current) {
          initializeAudio();
        }
        try {
          await audioElementRef.current.play();
          console.log("Audio is playing!");
        } catch (err) {
          console.error("Error playing audio:", err);
        }
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };
  const handleComplete = () => {
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-bold text-[#B1B762]">Drag and drop your image to discover its underlying technology</h3>
      <div className="relative">
          <main className="main-wrapper">
            <section className="section_hero">
              <div className="background-style-1">
                <div className=" flex flex-col items-center">
                  <div className="relative h-300px">
                    <audio
                      ref={audioElementRef}
                      controls
                      style={{ display: "none" }}
                      onPlay={() => {
                        if (!audioContextRef.current) {
                          initializeAudio();
                        }
                      }}
                    />
                    <div className="absolute top-0 left-0 z-10 p-4 rounded-lg m-4 hidden">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-64 h-32 p-2 bg-gray-800 text-white rounded-lg"
                        placeholder="Enter your text..."
                      />
                      <button
                        onClick={speakText}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                      >
                        Convert to speech
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-full h-full">
                    <div className="relative w-[1200px] h-[0px]">
                      <div className="absolute inset-0 flex justify-center items-center">                       
                      </div>
                      
                    </div>
                    
                  </div>
                 
                  <p className='text-[#B1B762] relative'>
  {displayedText}
  {isTyping && (
    <span className="animate-pulse ml-1 absolute">|</span>
  )}
</p>
                  <div className="flex flex-row gap-0 w-full">
                    <ImageUploader
                      onResponse={handleResponse}
                      apiKey=""
                    />
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>

    </div>
  );
};

export default ImageChecker;
