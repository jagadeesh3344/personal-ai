import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Camera, CameraOff, Sparkles, Volume2, Award, AlertCircle, RefreshCw, Check, ArrowLeft, Play, Pause } from 'lucide-react';
import { Workout as WorkoutType, Exercise, WorkoutSet } from '../../types';

interface WorkoutCameraProps {
  currentWorkout: WorkoutType;
  onLogCompletedReps: (exerciseId: string, reps: number) => void;
  onClose: () => void;
}

export const WorkoutCamera: React.FC<WorkoutCameraProps> = ({
  currentWorkout,
  onLogCompletedReps,
  onClose
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(currentWorkout.exercises[0] || null);
  const [useRealWebcam, setUseRealWebcam] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [formFeedback, setFormFeedback] = useState('CALIBRATING CAMERA LENS...');
  const [formFeedbackLevel, setFormFeedbackLevel] = useState<'info' | 'success' | 'warning'>('info');
  const [fridayVoiceCue, setFridayVoiceCue] = useState('Trainer ready. Place your device so your full body is visible in the frame.');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Core skeleton parameters for dynamic vector rendering
  const jointsRef = useRef({
    leftShoulder: { x: 120, y: 160 },
    rightShoulder: { x: 200, y: 160 },
    leftElbow: { x: 100, y: 220 },
    rightElbow: { x: 220, y: 220 },
    leftWrist: { x: 90, y: 270 },
    rightWrist: { x: 230, y: 270 },
    leftHip: { x: 130, y: 280 },
    rightHip: { x: 190, y: 280 },
    leftKnee: { x: 125, y: 360 },
    rightKnee: { x: 195, y: 360 },
    leftAnkle: { x: 120, y: 440 },
    rightAnkle: { x: 200, y: 440 },
  });

  // Handle active exercise selection
  useEffect(() => {
    if (selectedExercise) {
      setRepCount(0);
      setFormFeedback('WAITING FOR MOVEMENT...');
      setFormFeedbackLevel('info');
      setFridayVoiceCue(`Target exercise switched to ${selectedExercise.name}. Keep your repetition speed controlled.`);
    }
  }, [selectedExercise]);

  // Request/release webcam stream
  useEffect(() => {
    async function startWebcam() {
      if (useRealWebcam) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: 'user' } 
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(err => console.log('Video play interrupted', err));
          }
          setFridayVoiceCue("Camera connected. Scanning skeletal points. Form evaluation is active.");
        } catch (error) {
          console.error("Webcam access failed", error);
          setUseRealWebcam(false);
          setFridayVoiceCue("Camera setup failed. Defaulting to trainer simulator overlay.");
        }
      } else {
        stopWebcam();
      }
    }
    startWebcam();
    return () => stopWebcam();
  }, [useRealWebcam]);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Holographic Canvas Render Loop
  useEffect(() => {
    let frame = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. If using real webcam, draw video frame as backing
      if (useRealWebcam && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Render a high-tech radar grid backing
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
        ctx.lineWidth = 1;
        // Verticals
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        // Horizontals
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Radar circles
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.03)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 120, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 200, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. Animate and oscillate skeleton points to simulate breathing/repping
      const cycle = Math.sin(frame * 0.05);
      const squatFactor = Math.abs(Math.sin(frame * 0.02)); // Squat simulator cycles
      
      const isSquatEx = selectedExercise?.name.toLowerCase().includes('squat') || 
                        selectedExercise?.name.toLowerCase().includes('lunge');
      
      const isPressEx = selectedExercise?.name.toLowerCase().includes('press') || 
                        selectedExercise?.name.toLowerCase().includes('push');

      const isRaiseEx = selectedExercise?.name.toLowerCase().includes('raise') || 
                        selectedExercise?.name.toLowerCase().includes('fly');

      // Base skeletal coordinates
      const joints = jointsRef.current;
      const baseShoulderY = 160 + (isSquatEx ? squatFactor * 40 : cycle * 2);
      const baseHipY = 280 + (isSquatEx ? squatFactor * 60 : cycle * 1.5);
      const baseKneeY = 360 + (isSquatEx ? squatFactor * 30 : 0);
      
      // Update elbow/wrist heights depending on press vs raise simulations
      let leftElbowY = 220;
      let rightElbowY = 220;
      let leftWristY = 270;
      let rightWristY = 270;

      if (isPressEx) {
        const pressAmt = Math.sin(frame * 0.06);
        leftElbowY = 210 + pressAmt * 30;
        rightElbowY = 210 + pressAmt * 30;
        leftWristY = 150 + pressAmt * 50;
        rightWristY = 150 + pressAmt * 50;
      } else if (isRaiseEx) {
        const raiseAmt = Math.sin(frame * 0.05);
        leftElbowY = 160 + raiseAmt * 50;
        rightElbowY = 160 + raiseAmt * 50;
        leftWristY = 150 + raiseAmt * 60;
        rightWristY = 150 + raiseAmt * 60;
      }

      // Populate current coordinates
      const currentJoints = {
        leftShoulder: { x: 120, y: baseShoulderY },
        rightShoulder: { x: 200, y: baseShoulderY },
        leftElbow: { x: 80, y: leftElbowY },
        rightElbow: { x: 240, y: rightElbowY },
        leftWrist: { x: 70, y: leftWristY },
        rightWrist: { x: 250, y: rightWristY },
        leftHip: { x: 130, y: baseHipY },
        rightHip: { x: 190, y: baseHipY },
        leftKnee: { x: 125, y: baseKneeY },
        rightKnee: { x: 195, y: baseKneeY },
        leftAnkle: { x: 120, y: 440 },
        rightAnkle: { x: 200, y: 440 },
      };

      // 3. Draw bones (skeletal line segments)
      const colorScheme = formFeedbackLevel === 'warning' ? '#f43f5e' : 
                          formFeedbackLevel === 'success' ? '#10b981' : '#06b6d4';

      ctx.strokeStyle = colorScheme;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 12;
      ctx.shadowColor = colorScheme;

      const drawBone = (j1: { x: number; y: number }, j2: { x: number; y: number }) => {
        ctx.beginPath();
        ctx.moveTo(j1.x, j1.y);
        ctx.lineTo(j2.x, j2.y);
        ctx.stroke();
      };

      // Torso
      drawBone(currentJoints.leftShoulder, currentJoints.rightShoulder);
      drawBone(currentJoints.leftShoulder, currentJoints.leftHip);
      drawBone(currentJoints.rightShoulder, currentJoints.rightHip);
      drawBone(currentJoints.leftHip, currentJoints.rightHip);

      // Left Arm
      drawBone(currentJoints.leftShoulder, currentJoints.leftElbow);
      drawBone(currentJoints.leftElbow, currentJoints.leftWrist);

      // Right Arm
      drawBone(currentJoints.rightShoulder, currentJoints.rightElbow);
      drawBone(currentJoints.rightElbow, currentJoints.rightWrist);

      // Left Leg
      drawBone(currentJoints.leftHip, currentJoints.leftKnee);
      drawBone(currentJoints.leftKnee, currentJoints.leftAnkle);

      // Right Leg
      drawBone(currentJoints.rightHip, currentJoints.rightKnee);
      drawBone(currentJoints.rightKnee, currentJoints.rightAnkle);

      // 4. Draw Joint Nodes
      ctx.shadowBlur = 0; // Reset shadow for nodes
      Object.entries(currentJoints).forEach(([name, pos]) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = colorScheme;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 5. Draw active tracking calibration target guidelines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
      ctx.setLineDash([]); // Reset dash

      // Face scanning ring
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(160, 100, 22, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(160, 70); ctx.lineTo(160, 130);
      ctx.moveTo(130, 100); ctx.lineTo(190, 100);
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [useRealWebcam, selectedExercise, formFeedbackLevel]);

  // Simulate a fully calibrated biomechanical repetition
  const handleSimulateRep = () => {
    setRepCount(prev => {
      const next = prev + 1;
      setFormFeedbackLevel('success');
      setFormFeedback(`REPETITION ${next} VALIDATED ✓`);
      
      // Dynamic FRIDAY coaching cues depending on rep count milestones
      if (next === 1) {
        setFridayVoiceCue("First repetition locked. Spot-on form. Maintain this contraction tempo.");
      } else if (next === 3) {
        setFridayVoiceCue("Three repetitions in. Joint vectors are perfectly stable. Good depth.");
      } else if (next === 5) {
        setFridayVoiceCue("Five repetitions down. Muscle fiber recruitment peaking. Push through!");
      } else if (next === 8) {
        setFridayVoiceCue("Eight reps. Fantastic consistency. Finalize set whenever you're ready.");
      } else {
        setFridayVoiceCue(`Repetition ${next} registered. Keep the pacing smooth.`);
      }

      // Reset feedback back to tracking after a brief delay
      setTimeout(() => {
        setFormFeedbackLevel('info');
        setFormFeedback('MOVEMENT DETECTED: TRACKING FORM');
      }, 1400);

      return next;
    });
  };

  // Simulate a postural form alert
  const handleSimulateFormAlert = () => {
    setFormFeedbackLevel('warning');
    const alerts = [
      {
        text: 'COACH TIP: KEEP ELBOWS TUCKED TO 45 DEGREES',
        audio: 'Keep your elbows tucked to forty-five degrees to protect your shoulders and focus tension.'
      },
      {
        text: 'COACH TIP: PUSH FOR A DEEPER RANGE OF MOTION',
        audio: 'Go slightly lower in your lowering phase to maximize muscle fiber activation.'
      },
      {
        text: 'COACH TIP: SLOW DOWN REPETITION SPEEDS',
        audio: 'Keep your concentric and eccentric phases controlled. Slower speed builds more strength.'
      }
    ];

    const chosen = alerts[Math.floor(Math.random() * alerts.length)];
    setFormFeedback(chosen.text);
    setFridayVoiceCue(chosen.audio);

    // Reset feedback back to tracking after 3 seconds
    setTimeout(() => {
      setFormFeedbackLevel('info');
      setFormFeedback('CAMERA RECALIBRATING • RESUMING WORKOUT TRACKING');
    }, 4500);
  };

  // Log completed reps directly to state and exit
  const handleLogAndComplete = () => {
    if (selectedExercise && repCount > 0) {
      onLogCompletedReps(selectedExercise.id, repCount);
    }
    onClose();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Immersive HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950/60 border border-zinc-900 p-5 rounded-xl">
        <div>
          <button 
            onClick={onClose} 
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel Scan
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span>FRIDAY Trainer Camera</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Tracking Movement: <span className="text-cyan-400 font-bold">{selectedExercise?.name}</span> • AI Rep-Counter and Pose Analysis Active
          </p>
        </div>

        <div className="flex gap-2.5 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setUseRealWebcam(!useRealWebcam)} 
            className="text-xs font-bold uppercase tracking-wider h-10 w-full md:w-auto"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" />
              {useRealWebcam ? "Disable Webcam" : "Enable Live Webcam"}
            </span>
          </Button>

          <Button 
            variant="primary" 
            onClick={handleLogAndComplete} 
            className="text-xs font-bold uppercase tracking-wider h-10 w-full md:w-auto shrink-0"
            disabled={repCount === 0}
          >
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Log Set & Exit
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Dynamic Lens HUD Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-850 shadow-2xl bg-black">
            
            {/* Real Video Element Hidden/Rendered as Backing */}
            <video 
              ref={videoRef} 
              className="hidden" 
              playsInline 
              muted 
              width="640" 
              height="480"
            />

            {/* Interactive Drawing Canvas */}
            <canvas 
              ref={canvasRef} 
              width="640" 
              height="480" 
              className="w-full h-full object-cover"
            />

            {/* Simulated HUD Diagnostics Overlay Panels */}
            {/* Top Left: Diagnostics Info */}
            <div className="absolute top-4 left-4 bg-zinc-950/85 border border-zinc-800/80 p-3 rounded-lg font-mono text-[9px] text-zinc-400 space-y-1 select-none pointer-events-none">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>CAMERA FEED</span>
              </div>
              <div>RESOLUTION: 640x480px</div>
              <div>ENGINE: POSE DETECT v1</div>
              <div>LATENCY: 14.5ms</div>
              <div>TRACKING NODES: 33/33</div>
            </div>

            {/* Top Right: Goal Target metrics */}
            <div className="absolute top-4 right-4 bg-zinc-950/85 border border-zinc-800/80 p-3 rounded-lg font-mono text-[9px] text-zinc-400 space-y-1 select-none pointer-events-none text-right">
              <div className="text-zinc-500 font-bold uppercase">TARGET GOAL</div>
              <div className="text-sm text-white font-bold uppercase tracking-tight">{selectedExercise?.targetReps}</div>
              <div className="text-cyan-400 font-bold">STATUS: COMPLIANT</div>
            </div>

            {/* Bottom Form Feedback Banner overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/90 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  formFeedbackLevel === 'warning' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  formFeedbackLevel === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[8px] font-bold text-zinc-500 block uppercase tracking-widest">REAL-TIME FORM FEEDBACK</span>
                  <p className={`text-xs font-black uppercase tracking-wide ${
                    formFeedbackLevel === 'warning' ? 'text-red-400 animate-pulse' :
                    formFeedbackLevel === 'success' ? 'text-emerald-400' : 'text-cyan-400'
                  }`}>{formFeedback}</p>
                </div>
              </div>

              {/* Big HUD Rep Circle */}
              <div className="flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 w-16 h-16 rounded-xl shrink-0">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">REPS</span>
                <span className="text-2xl font-black text-white leading-none mt-1">{repCount}</span>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Controls Bar */}
          <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Interactive Trainer Controls</div>
              <p className="text-[9px] text-zinc-400 mt-0.5">Click to simulate repetitions and form feedback alerts.</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSimulateRep}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Simulate 1 Rep</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateFormAlert}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-red-400 hover:text-red-300 text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Trigger Form Warning</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Active Workout Session Control Center */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* FRIDAY Vocal Assistance Monitor */}
          <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex flex-col" hoverEffect={false}>
            <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-900/60 mb-4 shrink-0">
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">FRIDAY Voice Companion</h3>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-850/60 p-4 rounded-xl flex-1 relative overflow-hidden min-h-[140px]">
              <div className="absolute top-2 right-2 flex gap-1 items-center font-mono text-[7px] text-zinc-550 border border-zinc-850 bg-zinc-950 px-1.5 py-0.5 rounded uppercase">
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                <span>Audio Transmitting</span>
              </div>

              <div className="text-[10px] text-cyan-400 font-mono mb-1.5 font-bold uppercase">FRIDAY AUDIO STREAM:</div>
              <p className="text-xs text-zinc-200 leading-relaxed font-semibold italic">
                "{fridayVoiceCue}"
              </p>
            </div>
          </Card>

          {/* Exercise Targets & Selector Card */}
          <Card className="p-5 bg-zinc-950/40 border-zinc-850 flex flex-col gap-4" hoverEffect={false}>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">TARGET MOVEMENTS QUEUE</span>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {currentWorkout.exercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExercise(ex)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-bold uppercase transition-all flex items-center justify-between cursor-pointer ${
                      selectedExercise?.id === ex.id 
                        ? 'bg-cyan-500/5 text-cyan-400 border-cyan-500/30 shadow-inner' 
                        : 'bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-400 border-zinc-850 hover:border-zinc-850'
                    }`}
                  >
                    <span>{ex.name}</span>
                    <span className="text-[9px] font-mono text-zinc-500 lowercase font-normal">{ex.targetReps}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-4 text-[10px] text-zinc-500 leading-normal flex items-start gap-2.5">
              <Award className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Selecting an exercise changes the AI joint tracking metrics instantly. Perform simulated reps to finalize and update your workout logs.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
