import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { toast } from 'sonner';
import * as tf from "@tensorflow/tfjs-core"; // Core tensor operations
import "@tensorflow/tfjs-backend-webgl"; // WebGL acceleration
import * as poseDetection from "@tensorflow-models/pose-detection";
import { cn } from './lib/utils';

function App() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(
        null
    );
    const [isDetecting, setIsDetecting] = useState<boolean>(false);
    const aspectRatio = useRef(16 / 9);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const THRESHOLD = 0.5;

    
    const toggleWebcam = async () => {
        if (isStreaming) {
            // Stop the webcam
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            setIsStreaming(false);
            if (isDetecting) {
              setIsDetecting(false);
            }
        } else {
            try {
                // Start the webcam
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        aspectRatio: aspectRatio.current,
                    },
                    audio: false,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                streamRef.current = stream;
                setIsStreaming(true);
            } catch (error) {
                console.error("Error accessing webcam:", error);
                toast("Error!", {
                    description:
                        "Could not access webcam. Please check permissions.",
                });
            }
        }
    };

    const toggleAspectRatio = async () => {
        try {
            if (!isStreaming || !videoRef.current || !streamRef.current) {
                throw new Error(
                    "Please start the camera to enable aspect ratio toggle."
                );
            }
            const newAspectRatio =
                aspectRatio.current === 16 / 9 ? 4 / 3 : 16 / 9;
            console.log(`changing aspect ratio to ${newAspectRatio}`);
            aspectRatio.current = newAspectRatio;

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    aspectRatio: aspectRatio.current,
                },
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            streamRef.current = stream;
        } catch (error) {
            const err = error as unknown as Error;
            toast("Error!", {
                description: err.message,
            });
        }
    };

    const loadmodel = async () => {
        await tf.setBackend("webgl");
        await tf.ready();

        const detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            }
        );

        setDetector(detector);
        console.log(detector);
        toast("Success!", {
            description: "Model Loaded Successfully!",
        });
    };

    const drawKeypoints = (ctx: CanvasRenderingContext2D, pose: poseDetection.Pose) => {
            pose.keypoints.forEach((keypoint) => {
                if (keypoint.score && keypoint.score > THRESHOLD) {
                    ctx.beginPath();
                    ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                    ctx.fill();
                }
            })
    }

    const drawSkeleton = (ctx: CanvasRenderingContext2D, pose : poseDetection.Pose) => {
        const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);

        adjacentPairs.forEach(([indexA, indexB]) => {
            const pointA = pose.keypoints[indexA];
            const pointB = pose.keypoints[indexB];

            const score1 = pointA.score != null ? pointA.score : 1;
            const score2 = pointB.score != null ? pointB.score : 1;

            if (pointA && pointB && score1 >= THRESHOLD && score2 >= THRESHOLD) {
                ctx.beginPath();
                ctx.moveTo(pointA.x, pointA.y);
                ctx.lineTo(pointB.x, pointB.y);
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
                ctx.stroke();
            }   
        })


    }

    const drawResult = (poses : poseDetection.Pose[]) => {
        if (!canvasRef.current || !videoRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        // set canvas width and height to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "red"; // keypoint color

        poses.forEach((pose) => {
            drawKeypoints(ctx, pose);
            drawSkeleton(ctx, pose);
        })
    }

    const clearCanvas = () => {
        if (!canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    const detectPose = async () => {
        try {
            if (
                !detector ||
                !videoRef.current ||
                !streamRef.current ||
                !canvasRef.current
            ) {
                throw new Error(
                    "Please make sure that the model is loaded successfully and camera is enabled"
                );
            }

            const poses = await detector.estimatePoses(videoRef.current);
            drawResult(poses);
            console.log(poses);
            
            return poses;
        } catch (error) {
            const err = error as unknown as Error;
            toast("Error!", {
                description: err.message,
            });
        }
    };

    // Clean up on unmount
    useEffect(() => {
        // load model
        loadmodel();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    useEffect(() => {
      console.log("the isDetecting useEffect is running");
      
      if (isDetecting) {
        toast("Started",{
            description:"Pose Detection Started."
        })
          intervalRef.current = setInterval(() => {
              detectPose();
          }, 30);
      }
      else {
        if (intervalRef.current) {
            console.log("stopping detection");
            clearInterval(intervalRef.current);
            clearCanvas();
            toast("Stopped", {
                description: "Pose Detection Stopped.",
            });
        }
      }; 

      return () => {
        if (intervalRef.current) {
            console.log("intervalId is cleared by cleanup function");
            clearInterval(intervalRef.current);
            clearCanvas();
        }
      }
    },[isDetecting])

    return (
        <div className="flex flex-col items-center min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-6">Webcam Interface</h1>

            <Card className="w-full max-w-2xl mb-6 p-0 ">
                <CardContent className="relative h-full p-0 overflow-hidden rounded-lg">
                    {/* Video element for the webcam feed */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className=" w-full aspect-video bg-muted"
                    />
                    <canvas
                        ref={canvasRef}
                        className={cn(
                            "absolute top-0 border w-full aspect-video",
                        )}
                    ></canvas>
                </CardContent>
            </Card>

            <div className="flex w-full justify-center gap-2">
                <Button onClick={toggleWebcam} className="">
                    {isStreaming ? "Stop Camera" : "Start Camera"}
                </Button>
                <Button onClick={toggleAspectRatio} disabled={!isStreaming}>
                    Toggle Aspect Ratio
                </Button>
                <Button
                    onClick={() => setIsDetecting(!isDetecting)}
                    disabled={!isStreaming}
                >
                    {isDetecting ? "Stop Detecting" : "Start Detecting"}
                </Button>
            </div>
        </div>
    );
}

export default App
