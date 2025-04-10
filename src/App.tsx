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
    const {
        isDetecting, 
        setIsDetecting,
        stats:exerciseStats
    } = usePoseDetection(videoRef, canvasRef)

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
                            "absolute top-0 border w-full aspect-video"
                        )}
                    ></canvas>
                    {isDetecting && (
                        <div className="absolute top-0 p-0 rounded text-white w-full h-full">
                            <div className="relative w-full h-full border-red-500 border">
                                <div className="absolute top-4 left-4 space-y-2">
                                    <div className=" rounded border bg-white font-semibold p-2 text-center text-black">
                                        <p>Count</p>
                                        {exerciseStats.repCount}
                                    </div>
                                    <div className=" rounded border bg-white font-semibold p-2 text-center text-black">
                                        <p>Elbow</p>
                                        {exerciseStats.elbowAngle.toFixed(1)}°
                                    </div>
                                    <div className=" rounded border bg-white font-semibold p-2 text-center text-black">
                                        <p>Upper</p>
                                        {exerciseStats.upperBodyAngle.toFixed(
                                            1
                                        )}
                                        °
                                    </div>
                                    <div className=" rounded border bg-white font-semibold p-2 text-center text-black">
                                        <p>Lower</p>
                                        {exerciseStats.lowerBodyAngle.toFixed(
                                            1
                                        )}
                                        °
                                    </div>
                                </div>

                                <div className="absolute w-lg bottom-4 left-1/2 -translate-x-1/2 rounded border bg-white font-semibold p-2 text-center text-black">
                                    <p>Feedback</p>
                                    {exerciseStats.feedback}
                                </div>

                                <div className="flex absolute top-4 right-4 gap-2">
                                    <div className="rounded border bg-white font-semibold p-2 text-center text-black">
                                        <p>Form</p>
                                        {exerciseStats.formQuality}
                                    </div>
                                    <div className="rounded border bg-white font-semibold p-2 text-center text-black">
                                        <p>Position</p>
                                        {exerciseStats.currentState}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
