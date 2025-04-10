import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs-core"; // Core tensor operations
import "@tensorflow/tfjs-backend-webgl"; // WebGL acceleration
import * as poseDetection from "@tensorflow-models/pose-detection";
import { toast } from "sonner";
import { clearCanvas, drawResult } from "@/utils/drawer.utils";
import { usePushupDetection } from "./usePushupDetection";

export default function usePoseDetection(
    videoRef: React.RefObject<HTMLVideoElement | null>,
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
    const [isDetecting, setIsDetecting] = useState<boolean>(false);
    const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(
        null
    );
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { detectPushup, resetCounter, stats } = usePushupDetection();

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

    const detectPose = async () => {
        try {
            if (!detector || !videoRef.current) {
                throw new Error(
                    "Please make sure that the model is loaded successfully and camera is enabled"
                );
            }

            const poses = await detector.estimatePoses(videoRef.current);
            detectPushup(poses);
            drawResult(poses,canvasRef, videoRef);
            // console.log(poses);

            return poses;
        } catch (error) {
            const err = error as unknown as Error;
            console.log("hey it's the error trigger from PoseDetection");
            toast("Error!", {
                description: err.message,
            });
        }
    };

    useEffect(() => {
        loadmodel();
    }, []);

    useEffect(() => {
        console.log("the isDetecting useEffect is running");

        if (isDetecting) {
            toast("Started", {
                description: "Pose Detection Started.",
            });
            intervalRef.current = setInterval(() => {
                detectPose();
            }, 30);
        } else {
            if (intervalRef.current) {
                console.log("stopping detection");
                clearInterval(intervalRef.current);
                clearCanvas(canvasRef);
                resetCounter();
                toast("Stopped", {
                    description: "Pose Detection Stopped.",
                });
            }
        }

        return () => {
            if (intervalRef.current) {
                console.log("intervalId is cleared by cleanup function");
                clearInterval(intervalRef.current);
                clearCanvas(canvasRef);
            }
        };
    }, [isDetecting]);

    return { isDetecting, setIsDetecting, stats };
};