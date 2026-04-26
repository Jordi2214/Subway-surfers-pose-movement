# Subway Surfers Pose Movement

## Overview

This project is a web-based implementation that allows controlling a Subway Surfers–style game using body poses instead of a keyboard.

It combines a pose recognition model with a browser-based game to translate real-time human movements into in-game actions such as moving left, right, jumping, and crouching.

The project is designed to run entirely in the browser and is suitable for deployment on platforms like GitHub Pages.

---

## Credits

This project is based on a fork of a Subway Surfers remake created by **KowalewskiAdrian**.
All core game mechanics and base structure come from that original work.

This repository extends it by adding pose-based control using a machine learning model.

---

## Features

* Control the game using body movements
* Real-time webcam input
* Pose classification using a trained model
* Visual feedback with probability bars for each pose class
* Fully browser-based (no installation required)

---

## Pose Classes

The model is trained to recognize the following classes:

* **Standby** (Idle position)
* **Right**
* **Left**
* **Up** (used for jumping)
* **Crouch**

### Important note

To trigger the jump action (**Up**), the left arm must be raised to a near 180° angle. And to crouch, you have to incline your body forward.
Clear and exaggerated poses improve detection accuracy.



---

## Dataset

The model was trained using a custom dataset with the following distribution:

| Class   | Samples |
| ------- | ------- |
| Standby | 652     |
| Right   | 519     |
| Left    | 588     |
| Up      | 371     |
| Crouch  | 470     |

---

## How It Works

1. The webcam captures the user's movements in real time.
2. A pose-based machine learning model analyzes the body position.
3. The model outputs probabilities for each pose class.
4. The system selects the most confident action.
5. The action is mapped to in-game controls:

   * Left → move left
   * Right → move right
   * Up → jump
   * Crouch → crouch
6. The game responds immediately to the detected pose.

---

## User Interface

* A live webcam feed is displayed in the bottom-right corner
* Probability bars show confidence for each pose class
* Each bar updates dynamically in real time
* The interface is designed to be minimal and non-intrusive

---

## Usage

1. Open the project in a modern browser
2. Allow access to the webcam when prompted
3. Position yourself in front of the camera
4. Perform the poses to control the character:

   * Move arms left/right for movement
   * Raise your left arm to jump
   * Lower your body to crouch
5. Keep poses clear and consistent for best results

---

## Notes

* Performance may vary depending on hardware and lighting conditions
* A stable camera position improves accuracy
* Background simplicity can help reduce misclassification
* Fast or unclear movements may reduce detection reliability

---

## Deployment

This project can be deployed easily using GitHub Pages since it only requires static files (HTML, JavaScript, and assets).

---

## Goal of the Project

The purpose of this project is to demonstrate how machine learning and computer vision can be used to create alternative input systems for games, replacing traditional keyboard controls with body movement.

It serves as an example of real-time interaction between a trained model and an interactive application.

---
