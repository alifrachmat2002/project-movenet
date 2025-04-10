import poseConstants from "@/constants/pose.constants";
import { Keypoint } from "@tensorflow-models/pose-detection"

export const calculateAngle = (
    a: { x: number; y: number } | null | undefined,
    b: { x: number; y: number } | null | undefined,
    c: { x: number; y: number } | null | undefined
): number => {

    if (!a || !b || !c) {
        return 0;
    }
    // const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x);
    const vectorBA = {x: a.x - b.x, y: a.y - b.y};
    const vectorBC = {x: c.x - b.x, y: c.y - b.y};

    const dotProduct = (vectorBA.x * vectorBC.x) + (vectorBA.y * vectorBC.y);

    const maginuteBA = Math.sqrt(
        Math.pow(vectorBA.x, 2) + Math.pow(vectorBA.y, 2)
    );
    const maginuteBC = Math.sqrt(
        Math.pow(vectorBC.x, 2) + Math.pow(vectorBC.y, 2)
    );
    
    if (!maginuteBA || !maginuteBC) {
        return 0;
    }

    const cosine = dotProduct / (maginuteBA * maginuteBC);
    const clampedCosine = Math.max(-1, Math.min(1, cosine));
    const radians = Math.acos(clampedCosine);

    let angle = radians * (180 / Math.PI);
    // if (angle > 180) {
    //     angle = 360 - angle;
    // }

    return angle;
};

export const requiredKeypointsVisible = (keypoints: Keypoint[], threshold: number = poseConstants.CONFIDENCE_THRESHOLD) =>  {
    // const requiredKeypoints = [
    //     'left_shoulder',
    //     'left_elbow',
    //     'left_wrist',
    //     'left_hip',
    //     'left_knee',
    //     'left_ankle',
    //     'right_shoulder',
    //     'right_elbow',
    //     'right_wrist',
    //     'right_hip',
    //     'right_knee',
    //     'right_ankle',
    // ];
    // return requiredKeypoints.every((requiredKp) => {
    //     const keypoint = keypoints.find((kp) => kp.name === requiredKp);
    //     return keypoint && keypoint.score && keypoint.score > threshold;
    // });
    const requiredLeftKeypoints = [
        'left_shoulder',
        'left_elbow',
        'left_wrist',
        'left_hip',
        'left_knee',
        'left_ankle',
        
    ];

    const requiredRightKeypoints = [
        "right_shoulder",
        "right_elbow",
        "right_wrist",
        "right_hip",
        "right_knee",
        "right_ankle",
    ];

    const requiredLeftKeypointsVisible = requiredLeftKeypoints.every(
        (requiredKp) => {
            const keypoint = keypoints.find((kp) => kp.name === requiredKp);

            return keypoint && keypoint.score && keypoint.score > threshold;
        }
    );

    const requiredRightKeypointsVisible = requiredRightKeypoints.every(
        (requiredKp) => {
            const keypoint = keypoints.find((kp) => kp.name === requiredKp);

            return keypoint && keypoint.score && keypoint.score > threshold;
        }
    );

    return {requiredLeftKeypointsVisible, requiredRightKeypointsVisible}
}

export const getKeypoint = (keypoints: Keypoint[], keypointName: string) => {
    const keypoint = keypoints.find(kp => kp.name === keypointName);

    if (!keypoint) {
        throw new Error("Keypoint not found");
    }
    return keypoint;
}

export const getMidpoint = (
    keypoint1: {x: number, y: number},
    keypoint2: {x:number, y:number}
) => {
    const midPoint = {
        x: (keypoint1.x + keypoint2.x) / 2,
        y: (keypoint1.y + keypoint2.y) / 2,
    };

    return midPoint;
};