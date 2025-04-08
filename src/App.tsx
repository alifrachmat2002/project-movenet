import { useEffect, useRef } from 'react'
import './App.css'
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';
import useWebcam from './hooks/useWebcam';
import usePoseDetection from './hooks/usePoseDetection';

function App() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { videoRef, isStreaming, toggleWebcam, toggleAspectRatio } = useWebcam();
    const {isDetecting, setIsDetecting} = usePoseDetection(videoRef, canvasRef)

    useEffect(() => {
        if (isDetecting) {
            setIsDetecting(false);
        }
    },[isStreaming])

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
