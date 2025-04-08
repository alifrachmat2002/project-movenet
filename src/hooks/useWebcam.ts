import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function useWebcam() {
    const [isStreaming, setIsStreaming] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const aspectRatio = useRef(16 / 9);

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

        if (!isStreaming || !videoRef.current || !streamRef.current) {
            throw new Error(
                "Please start the camera to enable aspect ratio toggle."
            );
        }
        const previousAspectRatio = aspectRatio.current;
        const newAspectRatio =
            aspectRatio.current === 16 / 9 ? 4 / 3 : 16 / 9;
        console.log(`changing aspect ratio to ${newAspectRatio}`);
        aspectRatio.current = newAspectRatio;

        try {
            
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
            aspectRatio.current = previousAspectRatio;
            console.log('hey its the error trigger from the webcam')
            const err = error as unknown as Error;
            toast("Error!", {
                description: err.message,
            });
        }
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    },[])

    return { toggleWebcam, toggleAspectRatio, videoRef, isStreaming };
}