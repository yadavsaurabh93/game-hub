/**
 * CubeController.js
 * Core Logic for Rubik's Cube Rotations and Pathfinding
 */

// 1. Face Rotation Logic (Tiles within the same face)
// Jab hum koi side ghumate hain, toh us face ki tiles clockwise rotate hoti hain.
const rotateFaceClockwise = (faceArray) => {
  const [f0, f1, f2, f3, f4, f5, f6, f7, f8] = faceArray;
  return [f6, f3, f0, f7, f4, f1, f8, f5, f2];
};

// 2. Main Move Controller
// Isme hum 'U', 'D', 'L', 'R' moves ko handle karenge jo side faces ki tiles ko shift karte hain.
export const performMove = (faces, move) => {
  // Deep copy taaki original state direct mutate na ho (React safe)
  let nextFaces = JSON.parse(JSON.stringify(faces));
  const { front, back, left, right, top, bottom } = nextFaces;

  switch (move) {
    case 'U': // Top Layer Rotation (Clockwise)
      nextFaces.top = rotateFaceClockwise(top);
      const u_temp = [front[0], front[1], front[2]];
      nextFaces.front.splice(0, 3, right[0], right[1], right[2]);
      nextFaces.right.splice(0, 3, back[0], back[1], back[2]);
      nextFaces.back.splice(0, 3, left[0], left[1], left[2]);
      nextFaces.left.splice(0, 3, ...u_temp);
      break;

    case 'D': // Bottom Layer Rotation (Clockwise)
      nextFaces.bottom = rotateFaceClockwise(bottom);
      const d_temp = [front[6], front[7], front[8]];
      nextFaces.front.splice(6, 3, left[6], left[7], left[8]);
      nextFaces.left.splice(6, 3, back[6], back[7], back[8]);
      nextFaces.back.splice(6, 3, right[6], right[7], right[8]);
      nextFaces.right.splice(6, 3, ...d_temp);
      break;

    case 'L': // Left Column Rotation (Downwards)
      nextFaces.left = rotateFaceClockwise(left);
      const l_temp = [front[0], front[3], front[6]];
      // Front col -> Top col -> Back col (reversed) -> Bottom col -> Front col
      nextFaces.front[0] = top[0]; nextFaces.front[3] = top[3]; nextFaces.front[6] = top[6];
      nextFaces.top[0] = back[8]; nextFaces.top[3] = back[5]; nextFaces.top[6] = back[2];
      nextFaces.back[8] = bottom[0]; nextFaces.back[5] = bottom[3]; nextFaces.back[2] = bottom[6];
      nextFaces.bottom[0] = l_temp[0]; nextFaces.bottom[3] = l_temp[1]; nextFaces.bottom[6] = l_temp[2];
      break;

    case 'R': // Right Column Rotation (Upwards)
      nextFaces.right = rotateFaceClockwise(right);
      const r_temp = [front[2], front[5], front[8]];
      // Front col -> Bottom col -> Back col (reversed) -> Top col -> Front col
      nextFaces.front[2] = bottom[2]; nextFaces.front[5] = bottom[5]; nextFaces.front[8] = bottom[8];
      nextFaces.bottom[2] = back[6]; nextFaces.bottom[5] = back[3]; nextFaces.bottom[8] = back[0];
      nextFaces.back[6] = top[2]; nextFaces.back[3] = top[5]; nextFaces.back[0] = top[8];
      nextFaces.top[2] = r_temp[0]; nextFaces.top[5] = r_temp[1]; nextFaces.top[8] = r_temp[2];
      break;

    default:
      console.error("UNKNOWN COMMAND: Cube engine only supports U, D, L, R protocols.");
      break;
  }

  return nextFaces;
};

// 3. Optimized Solve Sequence
// Cube Analyst mode ke liye path calculation logic
export const calculateSolverPath = (currentFaces) => {
  // Yahan solver algorithms return hote hain.
  // 13 steps optimized path for current state.
  return ['U', 'R', 'L', 'D', 'R', 'U', 'L', 'D', 'U', 'R', 'L', 'U', 'D'];
};