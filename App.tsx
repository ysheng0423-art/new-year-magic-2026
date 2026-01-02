import React, { useState, useEffect, useRef } from 'react';
import PinkParticleTreeScene from './components/PinkParticleTreeScene';
import { Hand, History, X, Heart, Send, Gift, Camera, Sparkles, Loader2, CheckCircle2, Feather, ChevronRight, Languages, Volume2, VolumeX } from 'lucide-react';

const ORACLES = [
  { cn: "马到成功，志在千里。2026年，你的每一份努力都将如骏马驰骋，势不可挡。", en: "Success comes with the speed of a horse. In 2026, your efforts will gallop forward, unstoppable." },
  { cn: "如果风雪注定要压你两三年，那我们就约好在第四年顶峰相见。2026会很精彩，请务必对自己有信心。", en: "If the storms are destined to weigh you down for two or three years, let us promise to meet at the summit in the fourth. 2026 will be magnificent." },
  { cn: "与其怀疑自己不够好，不如去惊叹：在无限的概率中，你是宇宙唯一且不可替代的发生。", en: "Instead of doubting your worth, marvel at this: in infinite probability, you are the universe's unique occurrence." },
  { cn: "你生命中那些暂时的‘裂痕’，并非失败，而是为了让积蓄已久的光，能以最温柔的方式溢出来。", en: "The cracks in your journey aren't failures; they are paths for your long-stored light to overflow gently." },
  { cn: "龙腾马跃，气象万千。2026年，你的灵魂将迎来最灿烂的绽放，去追逐那颗属于你的星。", en: "With the spirit of a galloping horse, 2026 will witness your soul's most brilliant bloom. Chase your star." },
  { cn: "别害怕走得慢，宇宙并不赶时间。马年虽求快，但稳步前行者终能抵达繁花似锦的远方。", en: "Don't fear moving slowly. Although the Year of the Horse values speed, steady steps will lead you to a blossom-filled horizon." }
];

const TRANSLATIONS = {
  zh: {
    welcome: "2026 丙午马年星愿奇迹",
    langSelect: "您将以何种语言与马年宇宙能量共鸣？",
    step1: "愿望发射器",
    step1Desc: "在马年星河中写下你的新年心愿，将其发射至遥远的宇宙星系。",
    step2: "汇聚魔法能量",
    step2Desc: "向新年星愿树张开手掌，让璀璨金光在指尖流转，唤醒骏马之魂。",
    step3: "接收马年回响",
    step3Desc: "保持 OK 手势 3 秒，宇宙将感应你的诚挚，回传专属你的马年启示。",
    start: "开启 2026 马年魔法连接",
    wishPlaceholder: "向星海倾诉你的马年祈愿...",
    historyTitle: "星河愿望簿",
    noHistory: "星河空灵，暂无回响",
    sensor: "能量感应",
    palmPrompt: "唤醒能量",
    okPrompt: "感应回响",
    successLine: "宇宙正在聆听你的愿望",
    palmGreetingYear: "2026",
    palmGreetingText: "马到成功",
    resonanceTitle: "马年魔法",
    resonanceSub: "2026 丙午马年",
    cosmosLabel: "宇宙对你马年愿望的响应",
    hongbaoPickTitle: "请在星海波动中，择取一份马年启示"
  },
  en: {
    welcome: "2026 Year of the Horse Magic",
    langSelect: "Which language will sync with the Horse's energy?",
    step1: "Wish Launchpad",
    step1Desc: "Write your intent and launch it into the galloping galaxies of 2026.",
    step2: "Gather Magic Energy",
    step2Desc: "Open your palm and let the golden light awaken the spirit of the horse.",
    step3: "Receive Cosmic Echo",
    step3Desc: "Hold an OK sign for 3s to receive your unique Horse Year revelation.",
    start: "Connect to 2026 Magic",
    wishPlaceholder: "Whisper your Horse Year intent...",
    historyTitle: "Galaxy of Wishes",
    noHistory: "The galaxy is quiet, no echoes yet",
    sensor: "SENSOR",
    palmPrompt: "Awaken Energy",
    okPrompt: "Sync Echo",
    successLine: "The Universe is Listening",
    palmGreetingYear: "2026",
    palmGreetingText: "HAPPY NEW YEAR",
    resonanceTitle: "HORSE MAGIC",
    resonanceSub: "2026 Year of the Horse",
    cosmosLabel: "The Universe's Response",
    hongbaoPickTitle: "Choose a Revelation from the Stars"
  }
};

const QuillText: React.FC<{ text: string; delay: number; className?: string }> = ({ text, delay, className }) => {
  const [displayText, setDisplayText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    const startWriting = () => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setIsDone(true);
        }
      }, 70); 
    };
    timeoutId = window.setTimeout(startWriting, delay);
    return () => clearTimeout(timeoutId);
  }, [text, delay]);

  return (
    <div className={`relative min-h-[1.5em] w-full ${className}`}>
      {displayText}
      {!isDone && displayText.length > 0 && <span className="quill-cursor">✒️</span>}
    </div>
  );
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<'zh' | 'en' | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0); 
  const [showEntranceModal, setShowEntranceModal] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const [wishes, setWishes] = useState<string[]>([]);
  const [showWishList, setShowWishList] = useState(false);
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [isMagicSparkling, setIsMagicSparkling] = useState(false);
  const [isOkGesture, setIsOkGesture] = useState(false);
  
  const [drawState, setDrawState] = useState<'IDLE' | 'SHAKING' | 'PICKING' | 'REVEALING'>('IDLE');
  const [shakeEnergy, setShakeEnergy] = useState(0); 
  const [currentOracle, setCurrentOracle] = useState({ cn: '', en: '' });
  
  const [wishText, setWishText] = useState('');
  const [wishTrigger, setWishTrigger] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cameraInstance = useRef<any>(null);
  const handsInstance = useRef<any>(null);
  const shakeTimer = useRef<number | null>(null);

  const t = language ? TRANSLATIONS[language] : TRANSLATIONS.zh;

  useEffect(() => {
    const savedWishes = localStorage.getItem('magic_wishes');
    if (savedWishes) setWishes(JSON.parse(savedWishes));

    // 初始化迪士尼风格魔法音乐
    const musicUrl = 'https://assets.mixkit.co/music/preview/mixkit-magical-dream-146.mp3';
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (isOkGesture) {
      if (drawState === 'IDLE') {
        setDrawState('SHAKING');
        shakeTimer.current = window.setInterval(() => {
          setShakeEnergy(prev => {
            if (prev >= 100) {
              clearInterval(shakeTimer.current!);
              setDrawState('PICKING');
              return 100;
            }
            return prev + 3.8; 
          });
        }, 50);
      }
    } else {
      if (drawState === 'SHAKING') {
        clearInterval(shakeTimer.current!);
        setShakeEnergy(0);
        setDrawState('IDLE');
      }
    }
  }, [isOkGesture, drawState]);

  const toggleMute = () => setIsMuted(!isMuted);

  const handlePickHongbao = () => {
    setCurrentOracle(ORACLES[Math.floor(Math.random() * ORACLES.length)]);
    setDrawState('REVEALING');
    setTimeout(() => { 
      setDrawState('IDLE'); 
      setShakeEnergy(0); 
    }, 12000);
  };

  const handleSendWish = () => {
    if (!wishText.trim()) return;
    const newWishes = [wishText, ...wishes];
    setWishes(newWishes);
    localStorage.setItem('magic_wishes', JSON.stringify(newWishes));
    setWishText('');
    setShowSuccessMessage(true);
    setWishTrigger(Date.now());
    setTimeout(() => setShowSuccessMessage(false), 6000);
  };

  const initializeMagic = async () => {
    setIsInitializing(true);
    
    // 触发音乐播放
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.warn("Audio interaction needed"));
    }
    
    try {
      const HandsConstructor = (window as any).Hands;
      const CameraConstructor = (window as any).Camera;
      handsInstance.current = new HandsConstructor({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      handsInstance.current.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
      handsInstance.current.onResults((results: any) => {
        if (results.multiHandLandmarks?.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          setIsMagicSparkling(landmarks[12].y < landmarks[0].y - 0.3);
          const dist = Math.sqrt(Math.pow(landmarks[4].x - landmarks[8].x, 2) + Math.pow(landmarks[4].y - landmarks[8].y, 2));
          setIsOkGesture(dist < 0.045);
        } else {
          setIsMagicSparkling(false);
          setIsOkGesture(false);
        }
      });
      if (!videoRef.current) return;
      cameraInstance.current = new CameraConstructor(videoRef.current, {
        onFrame: async () => { if (handsInstance.current) await handsInstance.current.send({ image: videoRef.current! }); },
        width: 640, height: 480
      });
      cameraInstance.current.start().then(() => {
        setIsInitializing(false);
        setIsGestureActive(true);
        setOnboardingStep(1); 
      });
    } catch (err) {
      setIsInitializing(false);
      setShowEntranceModal(false);
    }
  };

  const HongbaoCard: React.FC<{ onClick?: () => void; small?: boolean }> = ({ onClick, small = false }) => (
    <div onClick={onClick} className={`hongbao-traditional ${small ? 'hongbao-small' : ''}`}>
      <div className="hongbao-ornament orn-tl"></div>
      <div className="hongbao-ornament orn-tr"></div>
      <div className="hongbao-ornament orn-bl"></div>
      <div className="hongbao-ornament orn-br"></div>
      {/* Year of the Horse Seal */}
      <div className="hongbao-seal-horse" />
      <div className={`absolute bottom-3 text-yellow-500/40 text-[6px] md:text-[8px] tracking-[0.1em] font-black uppercase z-10 shoujin-font`}>
        {language === 'zh' ? '丙午马年大吉' : 'Year of the Horse'}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-[#050108] overflow-hidden">
      <PinkParticleTreeScene isMagicTriggered={isMagicSparkling} wishTrigger={wishTrigger} photos={[]} />
      
      {/* 音乐控制图标 - 优雅地放置在左下角 */}
      {!showEntranceModal && (
        <button 
          onClick={toggleMute} 
          className="fixed bottom-8 left-8 z-[150] p-4 bg-white/5 border border-white/10 rounded-full backdrop-blur-3xl hover:bg-white/10 transition-all active:scale-90 group shadow-2xl flex items-center justify-center"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white/40" /> : (
             <div className="flex items-center gap-1">
               <div className="w-0.5 h-3 bg-pink-400/80 animate-[bounce_0.6s_infinite]"></div>
               <div className="w-0.5 h-4 bg-pink-400/80 animate-[bounce_0.8s_infinite]"></div>
               <div className="w-0.5 h-2 bg-pink-400/80 animate-[bounce_0.5s_infinite]"></div>
               <Volume2 className="w-5 h-5 text-pink-400 ml-1" />
             </div>
          )}
        </button>
      )}

      {/* 2026 祝福显现 */}
      {isMagicSparkling && !showEntranceModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none px-4 animate-breath-fade">
           <div className="text-center space-y-4 message-backdrop">
              <h2 className="metallic-gold-script text-6xl md:text-[10rem] tracking-tighter medieval-font leading-none">
                {t.palmGreetingYear}
              </h2>
              <h3 className={`metallic-gold-script text-3xl md:text-7xl lg:text-8xl tracking-[0.2em] ${language === 'zh' ? 'shoujin-font' : 'script-font'}`}>
                {t.palmGreetingText}
              </h3>
           </div>
        </div>
      )}

      {/* 愿望发送成功 */}
      {showSuccessMessage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none px-4 animate-breath-fade">
           <div className="text-center message-backdrop">
              <p className={`metallic-gold-script text-3xl md:text-8xl tracking-tight leading-normal ${language === 'zh' ? 'shoujin-font' : 'script-font'}`}>
                {t.successLine}
              </p>
           </div>
        </div>
      )}

      {/* 初始引导 */}
      {showEntranceModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050108]/98 backdrop-blur-3xl p-4">
          {onboardingStep === 0 && (
            <div className="max-w-md w-full bg-[#0f0a15] border border-pink-500/20 rounded-[3.5rem] p-10 md:p-12 text-center space-y-8 animate-zoom-in shadow-2xl">
              <Camera className="w-14 h-14 text-pink-400 mx-auto" />
              <h2 className="text-2xl md:text-3xl font-bold title-gradient tracking-widest uppercase medieval-font">Gate to Galaxy</h2>
              <p className="text-pink-200/40 text-[12px] leading-relaxed font-light px-4 shoujin-font">
                正在开启感应器... 我们需要建立星海连接，以接收宇宙的新年脉冲。
              </p>
              <button onClick={initializeMagic} disabled={isInitializing} className="w-full py-4 bg-pink-500 text-white rounded-full font-bold tracking-[0.3em] uppercase shadow-xl hover:bg-pink-400 transition-all flex items-center justify-center gap-3 shoujin-font text-lg">
                {isInitializing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isInitializing ? 'INITIALIZING...' : '开启星海连接'}
              </button>
            </div>
          )}

          {onboardingStep >= 1 && (
            <div className="parchment-container animate-zoom-in flex justify-center">
              <div className="parchment">
                {onboardingStep === 1 && (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-fade-in">
                    <Feather className="w-14 h-14 text-[#8b5a2b] opacity-40" />
                    <h3 className={`text-xl md:text-3xl font-bold text-[#4a3728] text-center border-b-2 border-[#8b5a2b]/15 pb-4 px-10 ${language === 'zh' ? 'shoujin-font' : 'medieval-font'}`}>
                      {TRANSLATIONS.zh.langSelect}
                    </h3>
                    <div className="flex flex-col md:flex-row gap-4 w-full max-w-xs md:max-w-sm">
                      <button onClick={() => {setLanguage('zh'); setOnboardingStep(2)}} className="flex-1 py-3 bg-[#4a3728] text-[#f4e4bc] rounded-2xl font-bold hover:bg-[#5d4037] shadow-xl hover:-translate-y-1 transition-all shoujin-font text-xl">简体中文</button>
                      <button onClick={() => {setLanguage('en'); setOnboardingStep(2)}} className="flex-1 py-3 bg-[#4a3728] text-[#f4e4bc] rounded-2xl font-bold hover:bg-[#5d4037] shadow-xl hover:-translate-y-1 transition-all medieval-font">ENGLISH</button>
                    </div>
                  </div>
                )}

                {onboardingStep === 2 && language && (
                  <div className="flex-1 flex flex-col space-y-4 animate-fade-in">
                    <div className="text-center">
                      <h2 className={`text-xl md:text-3xl font-black text-[#4a3728] tracking-[0.1em] mb-1 ${language === 'zh' ? 'shoujin-font' : 'medieval-font'}`}>
                        {t.welcome}
                      </h2>
                      <div className="w-20 h-[1px] bg-[#8b5a2b]/30 mx-auto" />
                    </div>
                    <div className="flex-1 space-y-4 md:space-y-6 py-2 overflow-y-auto pr-2 custom-scrollbar">
                       {[t.step1, t.step2, t.step3].map((step, idx) => (
                         <div key={idx} className="space-y-1">
                            <h4 className={`text-[9px] font-black uppercase text-[#8b5a2b]/60 tracking-[0.3em] ${language === 'zh' ? 'shoujin-font' : ''}`}>{step}</h4>
                            <div className={`text-sm md:text-xl font-bold text-[#4a3728] italic ${language === 'zh' ? 'shoujin-font' : ''}`}>
                              <QuillText text={[t.step1Desc, t.step2Desc, t.step3Desc][idx]} delay={500 + idx * 3000} />
                            </div>
                         </div>
                       ))}
                    </div>
                    <button onClick={() => setShowEntranceModal(false)} className="w-full py-3 bg-[#4a3728] text-[#f4e4bc] rounded-2xl font-bold tracking-[0.3em] uppercase shadow-2xl hover:bg-[#5d4037] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] shoujin-font text-lg">
                      <Sparkles className="w-5 h-5" /> {t.start}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 摄像头预览区 */}
      <div className={`absolute top-24 right-6 w-28 h-20 md:w-36 md:h-28 rounded-3xl border border-pink-500/20 overflow-hidden shadow-2xl transition-all duration-1000 z-40 bg-black/40 backdrop-blur-xl ${isGestureActive ? 'opacity-90 scale-100' : 'opacity-0 scale-90'}`}>
        <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded-full border border-white/10">
           <div className={`w-1 h-1 rounded-full ${isOkGesture ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 animate-pulse'}`} />
           <span className="text-[5px] font-black text-white/80 uppercase tracking-tighter">{t.sensor}</span>
        </div>
      </div>

      {/* 动作状态栏 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30 opacity-60 w-full max-sm">
        <div className="px-6 py-2.5 mx-4 rounded-full border border-white/5 bg-black/40 backdrop-blur-3xl flex items-center justify-between shadow-2xl">
           <div className="flex items-center gap-2">
              <Hand className={`w-4 h-4 ${isMagicSparkling ? 'text-pink-400' : 'text-white/20'}`} />
              <span className={`text-[8px] font-bold tracking-widest text-white/90 uppercase ${language === 'zh' ? 'shoujin-font' : ''}`}>{t.palmPrompt}</span>
           </div>
           <div className="w-[1px] h-3 bg-white/10" />
           <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${isOkGesture ? 'text-yellow-400' : 'text-white/20'}`} />
              <span className={`text-[8px] font-bold tracking-widest text-white/90 uppercase ${language === 'zh' ? 'shoujin-font' : ''}`}>{t.okPrompt}</span>
           </div>
        </div>
      </div>

      {/* 摇晃特效 */}
      {drawState === 'SHAKING' && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none">
           <div className="animate-bounce">
              <HongbaoCard small />
           </div>
           <div className="w-48 md:w-64 h-1 bg-white/10 rounded-full mt-10 overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.7)]" style={{ width: `${shakeEnergy}%` }} />
           </div>
           <span className="text-[10px] font-black tracking-[0.5em] text-yellow-500/60 uppercase shoujin-font mt-6">与马年宇宙共振中...</span>
        </div>
      )}

      {/* 红包选择 */}
      {drawState === 'PICKING' && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center selection-overlay pointer-events-auto p-4 overflow-hidden">
           <h3 className={`text-white text-2xl md:text-5xl mb-12 md:mb-20 text-center tracking-[0.4em] drop-shadow-2xl ${language === 'zh' ? 'shoujin-font text-white/90' : 'medieval-font'}`}>
             {t.hongbaoPickTitle}
           </h3>
           
           <div className="hongbao-selection-container">
              {[0, 1, 2].map(i => (
                <HongbaoCard key={i} onClick={handlePickHongbao} />
              ))}
           </div>
           
           <div className="mt-12 text-yellow-500/20 text-[8px] md:text-[10px] tracking-[1em] font-black uppercase shoujin-font animate-pulse">
              星光感应，马到成功
           </div>
        </div>
      )}

      {/* 启示显现 */}
      {drawState === 'REVEALING' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-4">
           <div className="imperial-letter letter-reveal">
              <div className="letter-header-ornament" />
              <div className="flex justify-between items-center mb-8 md:mb-14 opacity-60">
                <span className={`text-[9px] md:text-xs font-black uppercase tracking-[1em] text-[#8b0000] ${language === 'zh' ? 'shoujin-font' : ''}`}>
                  {t.cosmosLabel}
                </span>
                <Sparkles className="w-5 h-5 text-[#8b0000]" />
              </div>
              
              <div className={`text-lg md:text-3xl lg:text-4xl font-bold text-[#4a0000] leading-relaxed md:leading-[1.9] text-center mb-10 md:mb-16 ${language === 'zh' ? 'shoujin-font' : 'script-font'}`}>
                <QuillText text={language === 'zh' ? currentOracle.cn : currentOracle.en} delay={1200} />
              </div>

              <div className="w-full h-[1.5px] bg-[#8b0000]/10 rounded-full overflow-hidden relative mt-8">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8b0000]/60 to-transparent animate-countdown-bar" />
              </div>
              <div className="mt-6 text-center opacity-10">
                 <Heart className="w-5 h-5 mx-auto text-[#8b0000]" />
              </div>
           </div>
        </div>
      )}

      {/* 底部愿望输入栏 */}
      <div className={`absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-30 transition-opacity duration-1000 ${drawState !== 'IDLE' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="relative group w-full">
          <input 
            type="text" value={wishText} onChange={(e) => setWishText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendWish()}
            placeholder={t.wishPlaceholder}
            className={`w-full bg-black/60 border border-pink-500/30 rounded-full py-4 px-8 text-pink-50 placeholder-pink-300/10 focus:outline-none focus:border-pink-500/60 backdrop-blur-3xl transition-all shadow-2xl focus:scale-[1.01] ${language === 'zh' ? 'shoujin-font text-xl' : ''}`}
          />
          <button onClick={handleSendWish} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-pink-500 text-white rounded-full hover:bg-pink-400 active:scale-90 transition-all shadow-xl">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 顶部标题 */}
      <div className="absolute top-0 left-0 w-full p-6 md:p-10 flex justify-between items-start z-20 pointer-events-none">
        <div>
          <h1 className="text-white text-3xl md:text-6xl font-bold tracking-[0.2em] title-gradient uppercase">{t.resonanceTitle}</h1>
          <p className="text-pink-300/40 text-[7px] md:text-[9px] mt-1.5 uppercase tracking-[0.8em] md:tracking-[1.2em]">{t.resonanceSub}</p>
        </div>
        <button onClick={() => setShowWishList(!showWishList)} className="pointer-events-auto p-3 bg-pink-500/5 hover:bg-pink-500/15 rounded-full border border-pink-500/20 backdrop-blur-3xl transition-all shadow-2xl active:scale-95">
          <History className="w-5 h-5 text-pink-300" />
        </button>
      </div>

      {/* 历史愿望列表 */}
      {showWishList && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-[40px] animate-fade-in">
          <div className="bg-[#0f0a15] border border-pink-500/20 rounded-[3rem] w-full max-w-2xl p-8 md:p-14 relative shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
             <button onClick={() => setShowWishList(false)} className="absolute top-6 right-6 md:top-10 md:right-10 text-pink-300/30 hover:text-white transition-colors p-2"><X className="w-6 h-6 md:w-8 h-8" /></button>
             <h2 className={`text-2xl md:text-4xl text-pink-100 mb-8 flex items-center gap-4 ${language === 'zh' ? 'shoujin-font' : 'font-serif italic'}`}>
               <Heart className="text-pink-500 w-8 h-8 md:w-10 h-10" />{t.historyTitle}
             </h2>
             <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {wishes.length === 0 ? (
                  <p className="text-pink-300/10 italic text-center py-20 uppercase tracking-[0.6em] text-xs shoujin-font">{t.noHistory}</p>
                ) : wishes.map((w, i) => (
                  <div key={i} className={`p-6 bg-white/[0.02] rounded-[2rem] border border-white/[0.03] text-pink-100/70 leading-relaxed italic hover:bg-white/[0.04] transition-colors ${language === 'zh' ? 'shoujin-font text-2xl md:text-3xl' : ''}`}>
                    “{w}”
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1.2s ease-out forwards; }
        @keyframes zoom-in { from { transform: scale(0.96) translateY(30px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        .animate-zoom-in { animation: zoom-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(236, 72, 153, 0.15); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;