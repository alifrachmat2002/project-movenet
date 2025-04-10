import poseConstants from "@/constants/pose.constants";
import { requiredKeypointsVisible, calculateAngle, getKeypoint, getMidpoint } from "@/utils/exercise.utils";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { useRef, useState } from "react";

type PushupState = 'uknown' | 'up' | 'down' | 'transitioning' | "moving up" | "moving down";
type FormQuality = 'good' | 'bad' | 'warning' | 'unknown';

interface ExerciseStats {
    repCount: number;
    currentState: PushupState;
    formQuality: FormQuality;
    feedback: string;
    elbowAngle: number;
    upperBodyAngle: number;
    lowerBodyAngle: number;
}

export function usePushupDetection() {
    const [stats, setStats] = useState<ExerciseStats>({
        repCount: 0,
        currentState: 'uknown',
        feedback: "Get in position to start",
        formQuality: "unknown",
        elbowAngle: 0,
        lowerBodyAngle: 0,
        upperBodyAngle: 0,
    });
    const prevStateRef = useRef<PushupState>("uknown");
    const repCountRef = useRef<number>(0);

    const detectPushup = (poses: poseDetection.Pose[]) => {
        if (!poses || poses.length === 0) {
            return setStats((prev) => ({
                ...prev,
                formQuality: "unknown",
                feedback: "No pose detected",
            }));
        }

        const pose = poses[0];
        const keypoints = pose.keypoints;

        // check if all of the required keypoints is visible
        const {requiredLeftKeypointsVisible, requiredRightKeypointsVisible} = requiredKeypointsVisible(keypoints);

        // if least required keypoints is not visible, return with feedback
        if (!requiredLeftKeypointsVisible && !requiredRightKeypointsVisible) {
            return setStats((prev) => {
                return {
                    ...prev,
                    formQuality: "unknown",
                    feedback:
                        "Please make sure your entire body is captured by the camera",
                };
            });
        }

        // get important keypoints from the pose
        const leftShoulder = getKeypoint(keypoints, "left_shoulder");
        const leftElbow = getKeypoint(keypoints, "left_elbow");
        const leftWrist = getKeypoint(keypoints, "left_wrist");
        const leftHip = getKeypoint(keypoints, "left_hip");
        const rightHip = getKeypoint(keypoints, "right_hip");
        const rightKnee = getKeypoint(keypoints, "right_knee");
        const leftAnkle = getKeypoint(keypoints, "left_ankle");
        const rightShoulder = getKeypoint(keypoints, "right_shoulder");
        const rightElbow = getKeypoint(keypoints, "right_elbow");
        const rightWrist = getKeypoint(keypoints, "right_wrist");
        const leftKnee = getKeypoint(keypoints, "left_knee");
        const rightAnkle = getKeypoint(keypoints, "right_ankle");

        // calculate average elbow angle
        let leftElbowAngle: number = 0;
        let rightElbowAngle: number = 0;

        if (requiredLeftKeypointsVisible) {
            leftElbowAngle = calculateAngle(
                {x: leftShoulder.x, y: leftShoulder.y},
                {x: leftElbow.x, y: leftElbow?.y},
                {x: leftWrist.x, y: leftWrist.y},
            )

        }

        if (requiredRightKeypointsVisible) {
            rightElbowAngle = calculateAngle(
                {x: rightShoulder.x, y: rightShoulder.y},
                {x: rightElbow.x, y: rightElbow?.y},
                {x: rightWrist.x, y: rightWrist.y},
            )
        }

        let averageElbowAngle: number = 0;
        if (requiredLeftKeypointsVisible && requiredRightKeypointsVisible) {
            averageElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
        } else if (!requiredLeftKeypointsVisible) {
            averageElbowAngle = rightElbowAngle;
        } else if (!requiredRightKeypointsVisible) {
            averageElbowAngle = leftElbowAngle;
        }

        // calculate shoulder, hip, knee and ankle midpoints based on visible kepypoints
        let shoulderMidpoint: {x: number, y: number} = {x:0, y:0};
        let hipMidpoint: { x: number; y: number } = { x: 0, y: 0 };
        let kneeMidpoint: { x: number; y: number } = { x: 0, y: 0 };
        let ankleMidpoint: { x: number; y: number } = { x: 0, y: 0 };


        if (requiredRightKeypointsVisible && requiredLeftKeypointsVisible) {
            shoulderMidpoint = getMidpoint(
                {
                    x: leftShoulder.x,
                    y: leftShoulder.y,
                },
                {
                    x: rightShoulder.x,
                    y: rightShoulder.y,
                }
            );
            hipMidpoint = getMidpoint(
                {
                    x: leftHip.x,
                    y: leftHip.y,
                },
                {
                    x: rightHip.x,
                    y: rightHip.y,
                }
            );
            kneeMidpoint = getMidpoint(
                {
                    x: leftKnee.x,
                    y: leftKnee.y,
                },
                {
                    x: rightKnee.x,
                    y: rightKnee.y,
                }
            );
            ankleMidpoint = getMidpoint(
                {
                    x:leftAnkle.x,
                    y:leftAnkle.y,
                },
                {
                    x: rightAnkle.x,
                    y: rightAnkle.y,
                }
            );
        } else if(requiredLeftKeypointsVisible) {
            shoulderMidpoint = {
                x:leftShoulder.x,
                y:leftShoulder.y
            };
            hipMidpoint = {
                x:leftHip.x,
                y:leftHip.y
            };
            kneeMidpoint = {
                x:leftKnee.x,
                y:leftKnee.y
            };
            ankleMidpoint = {
                x:leftAnkle.x,
                y:leftAnkle.y
            };
        } else if (requiredRightKeypointsVisible) {
            shoulderMidpoint = {
                x: rightShoulder.x,
                y: rightShoulder.y,
            };
            hipMidpoint = {
                x: rightHip.x,
                y: rightHip.y,
            };
            kneeMidpoint = {
                x: rightKnee.x,
                y: rightKnee.y,
            };
            ankleMidpoint = {
                x: rightAnkle.x,
                y: rightAnkle.y,
            };
        }

        // calculate angle between shoulder, hip and knee
        const upperBodyAngle = calculateAngle(
            {
                x: shoulderMidpoint.x,
                y: shoulderMidpoint.y,
            },
            {
                x: hipMidpoint.x,
                y: hipMidpoint.y,
            },
            {
                x: kneeMidpoint.x,
                y: kneeMidpoint.y,
            }
        );

        // calculate angle between hip, knee and ankle
        const lowerBodyAngle = calculateAngle(
            {
                x: hipMidpoint.x,
                y: hipMidpoint.y,
            },
            {
                x: kneeMidpoint.x,
                y: kneeMidpoint.y,
            },
            {
                x: ankleMidpoint.x,
                y: ankleMidpoint.y,
            }
        );

        // detect UP, MOVING or DOWN position
        let newState: PushupState = "uknown";
        let formQuality: FormQuality = "unknown";
        let feedback = '';

        const isBodyStraight =
            upperBodyAngle > poseConstants.BODY_ANGLE_ALIGNED_THRESHOLD &&
            lowerBodyAngle > poseConstants.BODY_ANGLE_ALIGNED_THRESHOLD;

        if (averageElbowAngle < poseConstants.ELBOW_ANGLE_DOWN_THRESHOLD) {
            newState = "down";
            formQuality = isBodyStraight ? "good" : "warning";
            feedback = isBodyStraight ? "Good form!" : "Keep your back Straight!";
        }
        else if (averageElbowAngle > poseConstants.ELBOW_ANGLE_UP_THRESHOLD) {
            newState = "up";
            formQuality = isBodyStraight ? "good" : "warning";
            feedback = isBodyStraight
                ? "Good form!"
                : "Keep your back Straight!";
        }
        else {
            newState = prevStateRef.current === "up" ? "moving down" : prevStateRef.current === "down" ? "moving up" : prevStateRef.current;
            formQuality = 'unknown';
            feedback = "Moving..."
        }

        // update repCount if full range of motion is detected
        // let repCount = stats.repCount;
        if (prevStateRef.current == "moving up" && newState == "up") {
            repCountRef.current += 1;
            feedback = "Good rep, keep going!";
        }

        prevStateRef.current = newState;

        setStats({
            currentState: newState,
            feedback: feedback,
            formQuality: formQuality,
            repCount: repCountRef.current,
            elbowAngle: averageElbowAngle,
            upperBodyAngle: upperBodyAngle,
            lowerBodyAngle: lowerBodyAngle
        });
    };

    return {
        stats,
        detectPushup,
        resetCounter: () => {
            setStats((prev) => ({
                ...prev,
                repCount: 0,
                currentState: "uknown",
                formQuality: "unknown",
                feedback: "Counter Reset. Please get in position to start"
            }))
        }
    };


}
