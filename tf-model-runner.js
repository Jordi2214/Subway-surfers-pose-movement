// tf-model-runner.js
// Loads the Teachable Machine Pose model and feeds webcam frames to it,
// connecting the AI layer to the UI layer.

const MODEL_PATH = "./model/"; 
let tfModel, maxPredictions;

async function initModel() {
    try {
        const modelURL = MODEL_PATH + "model.json";
        const metadataURL = MODEL_PATH + "metadata.json";

        // Load the model and metadata from the local folder
        console.log("Loading TensorFlow.js Pose model...");
        tfModel = await tmPose.load(modelURL, metadataURL);
        maxPredictions = tfModel.getTotalClasses();
        console.log("Model loaded successfully with", maxPredictions, "classes.");

        // Start the prediction processing loop
        window.requestAnimationFrame(predictLoop);
    } catch (e) {
        console.error("Failed to load the model. Check if model files are in the /model/ folder.", e);
        const dbg = document.getElementById("debug-text");
        if (dbg) dbg.innerText = "MODEL LOAD ERROR";
    }
}

async function predictLoop() {
    const video = document.getElementById('webcam-video');
    
    // Only predict if the video is ready and playing
    if (video && video.readyState >= 2) { 
        try {
            // estimatePose extracts the skeleton keypoints from the video frame
            const { pose, posenetOutput } = await tfModel.estimatePose(video);

            // predict returns the probabilities for each class
            const prediction = await tfModel.predict(posenetOutput);

            // Reconstruct the array output into a dictionary map for our UI
            // The model itself (metadata.json) has now been configured to output English and mirrored directions natively
            let predictionMap = {};
            for (let i = 0; i < maxPredictions; i++) {
                predictionMap[prediction[i].className] = prediction[i].probability;
            }

            // Pipe the data to the onPoseUpdate hook we defined in pose-ui.js
            if (window.onPoseUpdate) {
                window.onPoseUpdate(pose, predictionMap);
            }
        } catch(e) {
            // Suppress minor errors but keep loop alive
        }
    }

    // Call predictLoop again for the next frame
    window.requestAnimationFrame(predictLoop);
}

// Ensure things start correctly once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    initModel();
});
