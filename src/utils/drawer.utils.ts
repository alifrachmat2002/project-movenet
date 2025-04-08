import * as poseDetection from "@tensorflow-models/pose-detection";

const THRESHOLD = 0.3;

export const drawKeypoints = (
    ctx: CanvasRenderingContext2D,
    pose: poseDetection.Pose,
) => {

    
    pose.keypoints.forEach((keypoint) => {
        if (keypoint.score && keypoint.score > THRESHOLD) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
};

export const drawSkeleton = (
    ctx: CanvasRenderingContext2D,
    pose: poseDetection.Pose
) => {
    const adjacentPairs = poseDetection.util.getAdjacentPairs(
        poseDetection.SupportedModels.MoveNet
    );

    adjacentPairs.forEach(([indexA, indexB]) => {
        const pointA = pose.keypoints[indexA];
        const pointB = pose.keypoints[indexB];

        const score1 = pointA.score != null ? pointA.score : 1;
        const score2 = pointB.score != null ? pointB.score : 1;

        if (pointA && pointB && score1 >= THRESHOLD && score2 >= THRESHOLD) {
            ctx.beginPath();
            ctx.moveTo(pointA.x, pointA.y );
            ctx.lineTo(pointB.x, pointB.y );
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
};

export const drawResult = (poses: poseDetection.Pose[], canvasRef: React.RefObject<HTMLCanvasElement | null>, videoRef:React.RefObject<HTMLVideoElement | null>) => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // set canvas width and height to match video if it doesn't match current video width
    if (
        canvasRef.current.width != videoRef.current.videoWidth ||
        canvasRef.current.height != videoRef.current.videoHeight
    ) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
    }

    // Clear Canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "red";  

    // Draw 
    poses.forEach((pose) => {
        drawKeypoints(ctx, pose);
        drawSkeleton(ctx, pose);
    });

};

export const clearCanvas = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};
