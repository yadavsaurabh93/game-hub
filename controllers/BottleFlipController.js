// Is logic ko BottleFlip.jsx ke andar handleInput functions mein use karna hai

const handleBottleController = {
  // 1. Jab mouse click start ho (Drag Start)
  onStart: (e, G) => {
    if (G.current.bottle.landing) {
      G.current.isDragging = true;
      // Mouse ya Touch dono ke liye
      G.current.dragStart = e.clientY || (e.touches && e.touches[0].clientY);
    }
  },

  // 2. Jab mouse move ho (Sirf visual feedback ke liye)
  onMove: (e, G) => {
    if (G.current.isDragging) {
      const currentY = e.clientY || (e.touches && e.touches[0].clientY);
      const diff = G.current.dragStart - currentY;
      // Bottle ko halka sa niche dabao (Spring effect)
      G.current.bottle.yOffset = Math.min(20, diff * 0.1); 
    }
  },

  // 3. Jab mouse chhode (Launch/Flip)
  onRelease: (e, G, setMsg) => {
    if (!G.current.isDragging) return;
    
    const dragEnd = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
    // Jitna bada drag, utni zyada velocity (Power)
    const dragDistance = G.current.dragStart - dragEnd;
    const power = Math.min(25, dragDistance * 0.25); // Cap the max power

    if (power > 8) {
      G.current.bottle.vy = -power;      // Upar ki taraf uchalna
      G.current.bottle.vRotation = 0.18; // Ghumne ki speed (Flip)
      G.current.bottle.landing = false;
      setMsg("FLIPPING... 🔥");
    } else {
      setMsg("DRAG HIGHER!");
    }
    
    G.current.isDragging = false;
    G.current.bottle.yOffset = 0;
  }
};