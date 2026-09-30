// Source: placeholder-react/src/components/CustomCursor/cursorSystem.js.
// Original engines/defaults with scroll compensation and a settling exit.
const DEFAULTS = Object.freeze({
  pointsNumber: 40,
  spring: 0.5,
  friction: 0.4,
  headSpringFactor: 0.4,
  pointerEase: 0.18,
  turnSmoothing: 0.75,
  lineWidth: 1.5,
  strokeStyle: "#8ca0b4",
  fade: false,
  fadePower: 1.5,
});

const LIMITS = Object.freeze({
  pointsNumber: [3, 150],
  spring: [0.01, 1],
  friction: [0, 0.99],
  headSpringFactor: [0, 1],
  pointerEase: [0.05, 1],
  turnSmoothing: [0, 0.75],
  lineWidth: [0.25, 20],
  fadePower: [0.1, 6],
});

const MAX_PIXEL_RATIO = 2;
const MAX_CANVAS_PIXELS = 8_388_608;
const MAX_CANVAS_DIMENSION = 8192;
const IDLE_MOVEMENT_EPSILON = 0.01;
const IDLE_DELAY_MS = 200;
const RELEASE_RAMP_MS = 120;
const RELEASE_START_SPEED = 2;
const RELEASE_MAX_SPEED = 8;
const MAX_RELEASE_DELTA_MS = 50;
const POINT_POSITION_EASE = 0.32;
const REFERENCE_FRAME_MS = 1000 / 60;
const INTERACTION_REFRESH_MS = 80;
const FINE_POINTER_QUERY =
  "(any-hover: hover) and (any-pointer: fine), " +
  "(hover: hover) and (pointer: fine)";
const POINTER_TARGET_SELECTOR = [
  'a[href]:not([aria-disabled="true"])',
  'button:not(:disabled):not([aria-disabled="true"])',
  '[role="button"]:not([aria-disabled="true"])',
  '[data-cursor="pointer"]:not([aria-disabled="true"])',
].join(", ");
const DRAG_TARGET_SELECTOR = '[data-cursor="drag"]';
function releasePhysicsTime(elapsed) {
  const ramp = Math.min(elapsed, RELEASE_RAMP_MS);
  return RELEASE_START_SPEED * elapsed + (RELEASE_MAX_SPEED - RELEASE_START_SPEED) *
    (ramp * ramp / (2 * RELEASE_RAMP_MS) + Math.max(0, elapsed - RELEASE_RAMP_MS));
}

function parseHexColor(hexColor) {
  return {
    red: Number.parseInt(hexColor.slice(1, 3), 16),
    green: Number.parseInt(hexColor.slice(3, 5), 16),
    blue: Number.parseInt(hexColor.slice(5, 7), 16),
  };
}

class CursorLineEffect {
  constructor(canvas, options = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError("CursorLineEffect requires a canvas element.");
    }

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("A 2D canvas context is not available.");
    }

    this.canvas = canvas;
    this.context = context;
    this.params = { ...DEFAULTS, ...options };
    this.validateParams(this.params);
    this.strokeRgb = parseHexColor(this.params.strokeStyle);

    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.pointer = {
      x: 0.5 * this.viewport.width,
      y: 0.5 * this.viewport.height,
    };
    this.rawPointer = { ...this.pointer };
    this.trail = Array.from({ length: this.params.pointsNumber }, () => ({
      x: this.pointer.x,
      y: this.pointer.y,
      dx: 0,
      dy: 0,
    }));
    this.renderTrail = this.trail.map((point) => ({
      x: point.x,
      y: point.y,
    }));

    this.frameId = null;
    this.resizeFrameId = null;
    this.isStarted = false;
    this.isReleasing = false;
    this.releaseLastTimestamp = null;
    this.releaseElapsed = 0;
    this.releaseAccumulator = 0;
    this.isRunning = false;
    this.isIdle = false;
    this.isCanvasReady = false;
    this.isDestroyed = false;
    this.hasPointerInput = false;
    this.idleStartedAt = null;
    this.effectivePixelRatio = 1;
    this.reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    this.finePointerQuery = window.matchMedia(FINE_POINTER_QUERY);

    this.handlePointer = this.handlePointer.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.commitResize = this.commitResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleReducedMotionChange = this.handleReducedMotionChange.bind(this);
    this.handleFinePointerChange = this.handleFinePointerChange.bind(this);
    this.render = this.render.bind(this);

    this.releaseCanvas();
    this.setState(this.isCursorAllowed() ? "dormant" : "disabled");
    this.addListeners();
  }

  validateParams(params) {
    Object.entries(LIMITS).forEach(([key, [minimum, maximum]]) => {
      const value = params[key];

      if (!Number.isFinite(value) || value < minimum || value > maximum) {
        throw new RangeError(
          `CursorLineEffect ${key} must be between ${minimum} and ${maximum}.`,
        );
      }
    });

    if (!Number.isInteger(params.pointsNumber)) {
      throw new TypeError("CursorLineEffect pointsNumber must be an integer.");
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(params.strokeStyle)) {
      throw new TypeError(
        "CursorLineEffect strokeStyle must be a six-digit HEX color.",
      );
    }

    if (typeof params.fade !== "boolean") {
      throw new TypeError("CursorLineEffect fade must be a boolean.");
    }
  }

  isCursorAllowed() {
    return (
      !this.isDestroyed &&
      this.finePointerQuery.matches &&
      !this.reducedMotionQuery.matches
    );
  }

  canAnimate() {
    return (
      this.isStarted &&
      this.canPrepareCanvas() &&
      !document.hidden
    );
  }

  canPrepareCanvas() {
    return this.isCursorAllowed() && this.hasPointerInput;
  }

  setState(state) {
    this.state = state;
    this.canvas.dataset.cursorState = state;
  }

  resetTrail(x, y) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.rawPointer.x = x;
    this.rawPointer.y = y;

    for (let index = 0; index < this.trail.length; index += 1) {
      const point = this.trail[index];
      const renderPoint = this.renderTrail[index];

      point.x = x;
      point.y = y;
      point.dx = 0;
      point.dy = 0;
      renderPoint.x = x;
      renderPoint.y = y;
    }
  }

  markActive() {
    this.isIdle = false;
    this.idleStartedAt = null;
  }

  syncPassiveState() {
    if (this.isDestroyed) {
      this.setState("destroyed");
    } else if (!this.isCursorAllowed()) {
      this.setState("disabled");
    } else if (!this.isStarted) {
      this.setState("stopped");
    } else if (this.isIdle) {
      this.setState("idle");
    } else if (document.hidden) {
      this.setState("paused");
    } else if (!this.hasPointerInput) {
      this.setState("dormant");
    }
  }

  setOptions(options = {}) {
    if (this.isDestroyed) {
      throw new Error("CursorLineEffect has already been destroyed.");
    }

    const nextParams = { ...this.params, ...options };

    this.validateParams(nextParams);

    if (nextParams.pointsNumber !== this.params.pointsNumber) {
      this.resizeTrail(nextParams.pointsNumber);
    }

    const colorChanged = nextParams.strokeStyle !== this.params.strokeStyle;

    this.params = nextParams;

    if (colorChanged) {
      this.strokeRgb = parseHexColor(this.params.strokeStyle);
    }

    this.markActive();
    this.wake();
  }

  resizeTrail(pointsNumber) {
    if (pointsNumber < this.trail.length) {
      this.trail.length = pointsNumber;
      this.renderTrail.length = pointsNumber;
      return;
    }

    const lastPoint = this.trail[this.trail.length - 1] ?? this.pointer;

    while (this.trail.length < pointsNumber) {
      this.trail.push({
        x: lastPoint.x,
        y: lastPoint.y,
        dx: 0,
        dy: 0,
      });
      this.renderTrail.push({
        x: lastPoint.x,
        y: lastPoint.y,
      });
    }
  }

  addListeners() {
    window.addEventListener("pointermove", this.handlePointer, {
      passive: true,
    });
    window.addEventListener("pointerdown", this.handlePointer, {
      passive: true,
    });
    window.addEventListener("resize", this.handleResize);
    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    if (typeof this.reducedMotionQuery.addEventListener === "function") {
      this.reducedMotionQuery.addEventListener(
        "change",
        this.handleReducedMotionChange,
      );
    } else {
      this.reducedMotionQuery.addListener(this.handleReducedMotionChange);
    }

    if (typeof this.finePointerQuery.addEventListener === "function") {
      this.finePointerQuery.addEventListener(
        "change",
        this.handleFinePointerChange,
      );
    } else {
      this.finePointerQuery.addListener(this.handleFinePointerChange);
    }
  }

  handlePointer(event) {
    if (
      this.isDestroyed ||
      !this.isStarted ||
      this.isReleasing ||
      event.pointerType !== "mouse" ||
      !this.isCursorAllowed()
    ) {
      return;
    }

    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
      return;
    }

    if (!this.hasPointerInput) {
      this.hasPointerInput = true;
      this.resetTrail(event.clientX, event.clientY);
    } else {
      this.rawPointer.x = event.clientX;
      this.rawPointer.y = event.clientY;
    }

    this.markActive();
    this.wake();
  }

  handleScroll(deltaX, deltaY) {
    if (
      !this.canAnimate() ||
      !Number.isFinite(deltaX) ||
      !Number.isFinite(deltaY) ||
      (deltaX === 0 && deltaY === 0)
    ) {
      return;
    }

    // A released target belongs to the section, while an active target follows the mouse.
    if (this.isReleasing) {
      this.pointer.x -= deltaX;
      this.pointer.y -= deltaY;
      this.rawPointer.x -= deltaX;
      this.rawPointer.y -= deltaY;
    }
    for (let index = 0; index < this.trail.length; index += 1) {
      this.trail[index].x -= deltaX;
      this.trail[index].y -= deltaY;
      this.renderTrail[index].x -= deltaX;
      this.renderTrail[index].y -= deltaY;
    }

    this.markActive();
    this.wake();
  }

  releaseAt(x, y) {
    if (!this.canAnimate() || !Number.isFinite(x) || !Number.isFinite(y)) {
      this.stop();
      return;
    }

    this.rawPointer.x = x;
    this.rawPointer.y = y;
    if (!this.isReleasing) {
      this.releaseLastTimestamp = performance.now();
      this.releaseElapsed = 0;
      // Always run an ordinary first step, even if the next RAF is very close.
      this.releaseAccumulator = REFERENCE_FRAME_MS;
    }
    this.isReleasing = true;
    this.markActive();
    this.wake();
    this.setState("releasing");
  }

  handleResize() {
    if (
      this.isDestroyed ||
      !this.isStarted ||
      this.resizeFrameId !== null
    ) {
      return;
    }

    this.resizeFrameId = window.requestAnimationFrame(this.commitResize);
  }

  commitResize() {
    this.resizeFrameId = null;

    if (this.isDestroyed) {
      return;
    }

    const previousViewport = this.viewport;
    const nextViewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const scaleX = previousViewport.width
      ? nextViewport.width / previousViewport.width
      : 1;
    const scaleY = previousViewport.height
      ? nextViewport.height / previousViewport.height
      : 1;

    this.pointer.x *= scaleX;
    this.pointer.y *= scaleY;
    this.rawPointer.x *= scaleX;
    this.rawPointer.y *= scaleY;

    for (let index = 0; index < this.trail.length; index += 1) {
      const point = this.trail[index];
      const renderPoint = this.renderTrail[index];

      point.x *= scaleX;
      point.y *= scaleY;
      renderPoint.x *= scaleX;
      renderPoint.y *= scaleY;
    }

    this.viewport = nextViewport;
    this.markActive();

    if (this.canAnimate()) {
      this.setupCanvas();
      this.wake();
    } else if (!this.canPrepareCanvas()) {
      this.releaseCanvas();
    } else {
      this.canvas.style.width = `${nextViewport.width}px`;
      this.canvas.style.height = `${nextViewport.height}px`;
    }

    this.syncPassiveState();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.pauseAnimation(false);
      this.syncPassiveState();
    } else {
      this.wake();
      this.syncPassiveState();
    }
  }

  handleReducedMotionChange(event) {
    if (event.matches) {
      this.hasPointerInput = false;
      this.isIdle = false;
      this.pauseAnimation(true);
      this.releaseCanvas();
    }

    this.syncPassiveState();
  }

  handleFinePointerChange(event) {
    if (!event.matches) {
      this.hasPointerInput = false;
      this.isIdle = false;
      this.pauseAnimation(true);
      this.releaseCanvas();
    }

    this.syncPassiveState();
  }

  setupCanvas() {
    if (!this.canPrepareCanvas()) {
      this.releaseCanvas();
      return false;
    }

    const { width, height } = this.viewport;
    const cssPixels = Math.max(1, width * height);
    const pixelBudgetRatio = Math.sqrt(MAX_CANVAS_PIXELS / cssPixels);
    const dimensionRatio = Math.min(
      MAX_CANVAS_DIMENSION / Math.max(1, width),
      MAX_CANVAS_DIMENSION / Math.max(1, height),
    );
    const requestedRatio = Math.max(
      Number.EPSILON,
      Math.min(
        window.devicePixelRatio || 1,
        MAX_PIXEL_RATIO,
        pixelBudgetRatio,
        dimensionRatio,
      ),
    );
    const backingWidth = Math.max(1, Math.floor(width * requestedRatio));
    const backingHeight = Math.max(1, Math.floor(height * requestedRatio));
    const scaleX = backingWidth / Math.max(1, width);
    const scaleY = backingHeight / Math.max(1, height);

    if (this.canvas.width !== backingWidth) {
      this.canvas.width = backingWidth;
    }

    if (this.canvas.height !== backingHeight) {
      this.canvas.height = backingHeight;
    }

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.context.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    this.canvas.classList.add("is-enabled");
    this.canvas.dataset.cursorPixels = String(backingWidth * backingHeight);
    this.effectivePixelRatio = Math.min(scaleX, scaleY);
    this.isCanvasReady = true;
    return true;
  }

  releaseCanvas() {
    this.canvas.classList.remove("is-enabled");

    if (this.canvas.width !== 1 || this.canvas.height !== 1) {
      this.canvas.width = 1;
      this.canvas.height = 1;
    }

    this.canvas.style.width = `${this.viewport.width}px`;
    this.canvas.style.height = `${this.viewport.height}px`;
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.canvas.dataset.cursorPixels = "1";
    this.effectivePixelRatio = 1;
    this.isCanvasReady = false;
  }

  start() {
    if (this.isDestroyed) {
      return;
    }

    this.isStarted = true;
    this.isReleasing = false;
    this.releaseLastTimestamp = null;
    this.releaseElapsed = 0;
    this.releaseAccumulator = 0;

    if (
      this.viewport.width !== window.innerWidth ||
      this.viewport.height !== window.innerHeight
    ) {
      this.commitResize();
    }

    this.markActive();
    this.wake();
    if (this.isRunning) this.setState("running");
    this.syncPassiveState();
  }

  wake() {
    if (this.isRunning || this.isIdle || !this.canAnimate()) {
      return;
    }

    if (!this.setupCanvas()) {
      return;
    }

    this.idleStartedAt = null;
    this.isRunning = true;
    this.setState("running");
    this.frameId = window.requestAnimationFrame(this.render);
  }

  stop(clearCanvas = true) {
    if (this.isDestroyed) {
      return;
    }

    this.isStarted = false;
    this.isReleasing = false;
    this.releaseLastTimestamp = null;
    this.releaseElapsed = 0;
    this.releaseAccumulator = 0;
    this.isIdle = false;
    this.pauseAnimation(clearCanvas);

    if (clearCanvas) {
      this.hasPointerInput = false;
      this.releaseCanvas();
    }

    this.syncPassiveState();
  }

  pauseAnimation(clearCanvas = false) {
    if (this.frameId !== null) {
      window.cancelAnimationFrame(this.frameId);
    }

    this.frameId = null;
    this.isRunning = false;
    this.idleStartedAt = null;

    if (clearCanvas && this.isCanvasReady) {
      this.context.clearRect(
        0,
        0,
        this.viewport.width,
        this.viewport.height,
      );
    }
  }

  render(timestamp = performance.now()) {
    this.frameId = null;

    if (!this.canAnimate()) {
      this.isRunning = false;
      this.idleStartedAt = null;
      this.syncPassiveState();
      return;
    }

    this.context.clearRect(
      0,
      0,
      this.viewport.width,
      this.viewport.height,
    );

    let maximumMovementSquared = Infinity;
    if (this.isReleasing) {
      const delta = Math.min(MAX_RELEASE_DELTA_MS, Math.max(0,
        timestamp - this.releaseLastTimestamp));
      this.releaseLastTimestamp = timestamp;
      const elapsed = this.releaseElapsed + delta;
      this.releaseAccumulator += releasePhysicsTime(elapsed) - releasePhysicsTime(this.releaseElapsed);
      this.releaseElapsed = elapsed;
      while (this.releaseAccumulator >= REFERENCE_FRAME_MS) {
        maximumMovementSquared = this.stepPhysics();
        this.releaseAccumulator -= REFERENCE_FRAME_MS;
        if (this.hasSettledMotion(maximumMovementSquared)) {
          this.stop();
          return;
        }
      }
    } else {
      // Preserve the original motion: exactly one physics step per active RAF.
      maximumMovementSquared = this.stepPhysics();
    }
    this.drawSmoothTrail();

    if (this.hasSettledMotion(maximumMovementSquared)) {
      if (this.idleStartedAt === null) {
        this.idleStartedAt = timestamp;
      } else if (timestamp - this.idleStartedAt >= IDLE_DELAY_MS) {
        this.isRunning = false;
        this.isIdle = true;
        this.idleStartedAt = null;
        this.setState("idle");
        return;
      }
    } else {
      this.idleStartedAt = null;
    }

    this.frameId = window.requestAnimationFrame(this.render);
  }

  stepPhysics() {
    const { spring, friction, headSpringFactor, pointerEase } = this.params;
    this.pointer.x += (this.rawPointer.x - this.pointer.x) * pointerEase;
    this.pointer.y += (this.rawPointer.y - this.pointer.y) * pointerEase;

    for (let index = 0; index < this.trail.length; index += 1) {
      const point = this.trail[index];
      const previous = index === 0 ? this.pointer : this.trail[index - 1];
      const localSpring = index === 0 ? spring * headSpringFactor : spring;

      point.dx += (previous.x - point.x) * localSpring;
      point.dy += (previous.y - point.y) * localSpring;
      point.dx *= friction;
      point.dy *= friction;
      point.x += point.dx;
      point.y += point.dy;
    }

    return this.updateRenderTrail();
  }

  hasSettledMotion(maximumMovementSquared) {
    return maximumMovementSquared <= IDLE_MOVEMENT_EPSILON ** 2 &&
      (
        this.params.friction === 0 ||
        this.getMaximumResidualSquared() <=
          IDLE_MOVEMENT_EPSILON ** 2
      );
  }

  updateRenderTrail() {
    const { trail, renderTrail } = this;
    const smoothing = this.params.turnSmoothing;
    const lastIndex = trail.length - 1;
    let maximumMovementSquared = 0;

    const headDx = trail[0].x - renderTrail[0].x;
    const headDy = trail[0].y - renderTrail[0].y;

    renderTrail[0].x = trail[0].x;
    renderTrail[0].y = trail[0].y;
    maximumMovementSquared = Math.max(
      maximumMovementSquared,
      headDx * headDx + headDy * headDy,
    );

    for (let index = 1; index < lastIndex; index += 1) {
      const point = trail[index];
      const neighborsX = 0.5 * (trail[index - 1].x + trail[index + 1].x);
      const neighborsY = 0.5 * (trail[index - 1].y + trail[index + 1].y);
      const nextX = point.x + (neighborsX - point.x) * smoothing;
      const nextY = point.y + (neighborsY - point.y) * smoothing;
      const movementX = nextX - renderTrail[index].x;
      const movementY = nextY - renderTrail[index].y;

      renderTrail[index].x = nextX;
      renderTrail[index].y = nextY;
      maximumMovementSquared = Math.max(
        maximumMovementSquared,
        movementX * movementX + movementY * movementY,
      );
    }

    const tailDx = trail[lastIndex].x - renderTrail[lastIndex].x;
    const tailDy = trail[lastIndex].y - renderTrail[lastIndex].y;

    renderTrail[lastIndex].x = trail[lastIndex].x;
    renderTrail[lastIndex].y = trail[lastIndex].y;
    maximumMovementSquared = Math.max(
      maximumMovementSquared,
      tailDx * tailDx + tailDy * tailDy,
    );

    return maximumMovementSquared;
  }

  getMaximumResidualSquared() {
    const pointerDx = this.rawPointer.x - this.pointer.x;
    const pointerDy = this.rawPointer.y - this.pointer.y;
    let maximumResidualSquared =
      pointerDx * pointerDx + pointerDy * pointerDy;

    for (let index = 0; index < this.trail.length; index += 1) {
      const point = this.trail[index];
      const previous = index === 0 ? this.pointer : this.trail[index - 1];
      const linkDx = previous.x - point.x;
      const linkDy = previous.y - point.y;
      const linkResidualSquared = linkDx * linkDx + linkDy * linkDy;
      const velocitySquared = point.dx * point.dx + point.dy * point.dy;

      maximumResidualSquared = Math.max(
        maximumResidualSquared,
        linkResidualSquared,
        velocitySquared,
      );
    }

    return maximumResidualSquared;
  }

  drawSmoothTrail() {
    const { context } = this;

    context.save();
    context.strokeStyle = this.params.strokeStyle;
    context.lineWidth = this.params.lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    if (this.params.fade) {
      this.drawFadedTrail();
    } else {
      this.drawSolidTrail();
    }

    context.restore();
  }

  drawSolidTrail() {
    const { context, renderTrail: trail } = this;

    context.beginPath();
    context.moveTo(trail[0].x, trail[0].y);

    for (let index = 1; index < trail.length - 1; index += 1) {
      const midpointX = 0.5 * (trail[index].x + trail[index + 1].x);
      const midpointY = 0.5 * (trail[index].y + trail[index + 1].y);

      context.quadraticCurveTo(
        trail[index].x,
        trail[index].y,
        midpointX,
        midpointY,
      );
    }

    context.lineTo(
      trail[trail.length - 1].x,
      trail[trail.length - 1].y,
    );
    context.stroke();
  }

  drawFadedTrail() {
    if (this.renderTrail.length < 10) {
      this.drawGradientFadedTrail();
      return;
    }

    this.drawSegmentFadedTrail();
  }

  drawSegmentFadedTrail() {
    const { context, renderTrail: trail } = this;
    const lastSegmentIndex = trail.length - 2;

    // Draw tail-to-head so the most opaque segments stay visually clean at
    // the joins. The final straight segment is fully transparent, so only
    // the quadratic segments need to be painted.
    for (let pointIndex = trail.length - 2; pointIndex >= 1; pointIndex -= 1) {
      const segmentIndex = pointIndex - 1;
      const progress = segmentIndex / lastSegmentIndex;
      const alpha = Math.pow(1 - progress, this.params.fadePower);
      const startX =
        pointIndex === 1
          ? trail[0].x
          : 0.5 * (trail[pointIndex - 1].x + trail[pointIndex].x);
      const startY =
        pointIndex === 1
          ? trail[0].y
          : 0.5 * (trail[pointIndex - 1].y + trail[pointIndex].y);
      const endX =
        0.5 * (trail[pointIndex].x + trail[pointIndex + 1].x);
      const endY =
        0.5 * (trail[pointIndex].y + trail[pointIndex + 1].y);

      context.globalAlpha = alpha;
      context.beginPath();
      context.moveTo(startX, startY);
      context.quadraticCurveTo(
        trail[pointIndex].x,
        trail[pointIndex].y,
        endX,
        endY,
      );
      context.stroke();
    }
  }

  drawGradientFadedTrail() {
    const { renderTrail: trail } = this;
    const segmentsNumber = trail.length - 1;
    const tailStartX =
      0.5 * (trail[trail.length - 2].x + trail[trail.length - 1].x);
    const tailStartY =
      0.5 * (trail[trail.length - 2].y + trail[trail.length - 1].y);

    this.strokeGradientSegment({
      startX: tailStartX,
      startY: tailStartY,
      endX: trail[trail.length - 1].x,
      endY: trail[trail.length - 1].y,
      startProgress: (segmentsNumber - 1) / segmentsNumber,
      endProgress: 1,
    });

    for (let pointIndex = trail.length - 2; pointIndex >= 1; pointIndex -= 1) {
      const segmentIndex = pointIndex - 1;
      const startX =
        pointIndex === 1
          ? trail[0].x
          : 0.5 * (trail[pointIndex - 1].x + trail[pointIndex].x);
      const startY =
        pointIndex === 1
          ? trail[0].y
          : 0.5 * (trail[pointIndex - 1].y + trail[pointIndex].y);
      const endX =
        0.5 * (trail[pointIndex].x + trail[pointIndex + 1].x);
      const endY =
        0.5 * (trail[pointIndex].y + trail[pointIndex + 1].y);

      this.strokeGradientSegment({
        startX,
        startY,
        controlX: trail[pointIndex].x,
        controlY: trail[pointIndex].y,
        endX,
        endY,
        startProgress: segmentIndex / segmentsNumber,
        endProgress: (segmentIndex + 1) / segmentsNumber,
      });
    }
  }

  strokeGradientSegment(segment) {
    const { context, strokeRgb } = this;
    const startAlpha = Math.pow(
      1 - segment.startProgress,
      this.params.fadePower,
    );
    const endAlpha = Math.pow(
      1 - segment.endProgress,
      this.params.fadePower,
    );
    const gradient = context.createLinearGradient(
      segment.startX,
      segment.startY,
      segment.endX,
      segment.endY,
    );

    gradient.addColorStop(
      0,
      `rgba(${strokeRgb.red}, ${strokeRgb.green}, ${strokeRgb.blue}, ${startAlpha})`,
    );
    gradient.addColorStop(
      1,
      `rgba(${strokeRgb.red}, ${strokeRgb.green}, ${strokeRgb.blue}, ${endAlpha})`,
    );

    context.globalAlpha = 1;
    context.strokeStyle = gradient;
    context.beginPath();
    context.moveTo(segment.startX, segment.startY);

    if (Number.isFinite(segment.controlX)) {
      context.quadraticCurveTo(
        segment.controlX,
        segment.controlY,
        segment.endX,
        segment.endY,
      );
    } else {
      context.lineTo(segment.endX, segment.endY);
    }

    context.stroke();
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.isStarted = false;
    this.isReleasing = false;
    this.releaseLastTimestamp = null;
    this.releaseElapsed = 0;
    this.releaseAccumulator = 0;
    this.isIdle = false;
    this.pauseAnimation(true);

    if (this.resizeFrameId !== null) {
      window.cancelAnimationFrame(this.resizeFrameId);
      this.resizeFrameId = null;
    }

    window.removeEventListener("pointermove", this.handlePointer);
    window.removeEventListener("pointerdown", this.handlePointer);
    window.removeEventListener("resize", this.handleResize);

    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    if (typeof this.reducedMotionQuery.removeEventListener === "function") {
      this.reducedMotionQuery.removeEventListener(
        "change",
        this.handleReducedMotionChange,
      );
    } else {
      this.reducedMotionQuery.removeListener(this.handleReducedMotionChange);
    }

    if (typeof this.finePointerQuery.removeEventListener === "function") {
      this.finePointerQuery.removeEventListener(
        "change",
        this.handleFinePointerChange,
      );
    } else {
      this.finePointerQuery.removeListener(this.handleFinePointerChange);
    }

    this.releaseCanvas();
    this.setState("destroyed");
  }
}

class CursorPointEffect {
  constructor(element, options = {}) {
    if (!(element instanceof HTMLElement)) {
      throw new TypeError("CursorPointEffect requires an HTML element.");
    }

    this.element = element;
    this.options = {
      positionEase: POINT_POSITION_EASE,
      pointerSelector: POINTER_TARGET_SELECTOR,
      dragSelector: DRAG_TARGET_SELECTOR,
      ...options,
    };
    this.validateOptions(this.options);

    this.target = { x: null, y: null };
    this.position = { x: null, y: null };
    this.lastRenderedX = null;
    this.lastRenderedY = null;
    this.lastFrameTimestamp = null;
    this.idleStartedAt = null;
    this.frameId = null;
    this.interactionTimerId = null;
    this.activeDragPointerId = null;
    this.mode = "default";
    this.isStarted = false;
    this.isRunning = false;
    this.isIdle = false;
    this.isDestroyed = false;
    this.hasPointerInput = false;
    this.isPointerInside = false;
    this.needsSnap = true;
    this.isDragLocked = false;
    this.reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    this.finePointerQuery = window.matchMedia(FINE_POINTER_QUERY);

    this.handlePointer = this.handlePointer.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerOver = this.handlePointerOver.bind(this);
    this.handlePointerOut = this.handlePointerOut.bind(this);
    this.handlePointerRelease = this.handlePointerRelease.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleReducedMotionChange = this.handleReducedMotionChange.bind(this);
    this.handleFinePointerChange = this.handleFinePointerChange.bind(this);
    this.render = this.render.bind(this);

    this.element.dataset.cursorMode = this.mode;
    this.setState(this.isAllowed() ? "dormant" : "disabled");
    this.addListeners();
    this.syncDocumentState();
  }

  validateOptions(options) {
    if (
      !Number.isFinite(options.positionEase) ||
      options.positionEase <= 0 ||
      options.positionEase > 1
    ) {
      throw new RangeError(
        "CursorPointEffect positionEase must be greater than 0 and at most 1.",
      );
    }

    for (const key of ["pointerSelector", "dragSelector"]) {
      if (typeof options[key] !== "string" || options[key].trim() === "") {
        throw new TypeError(`CursorPointEffect ${key} must be a selector.`);
      }

      try {
        document.querySelector(options[key]);
      } catch {
        throw new TypeError(
          `CursorPointEffect ${key} must be a valid selector.`,
        );
      }
    }
  }

  isAllowed() {
    return (
      !this.isDestroyed &&
      this.finePointerQuery.matches &&
      !this.reducedMotionQuery.matches
    );
  }

  canRun() {
    return (
      this.isStarted &&
      this.isAllowed() &&
      this.hasPointerInput &&
      this.isPointerInside &&
      !document.hidden
    );
  }

  setState(state) {
    this.state = state;
    this.element.dataset.cursorState = state;
  }

  setOptions(options = {}) {
    if (this.isDestroyed) {
      throw new Error("CursorPointEffect has already been destroyed.");
    }

    const nextOptions = { ...this.options, ...options };
    this.validateOptions(nextOptions);
    this.options = nextOptions;
    this.refreshInteractionMode();
    this.markActive();
    this.wake();
    this.scheduleInteractionRefresh();
  }

  addListeners() {
    window.addEventListener("pointermove", this.handlePointer, {
      passive: true,
    });
    window.addEventListener("pointerdown", this.handlePointerDown, {
      passive: true,
    });
    window.addEventListener("pointerover", this.handlePointerOver, {
      passive: true,
    });
    window.addEventListener("pointerout", this.handlePointerOut, {
      passive: true,
    });
    window.addEventListener("pointerup", this.handlePointerRelease, {
      passive: true,
    });
    window.addEventListener("pointercancel", this.handlePointerRelease, {
      passive: true,
    });
    window.addEventListener("blur", this.handleWindowBlur);
    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    if (typeof this.reducedMotionQuery.addEventListener === "function") {
      this.reducedMotionQuery.addEventListener(
        "change",
        this.handleReducedMotionChange,
      );
    } else {
      this.reducedMotionQuery.addListener(this.handleReducedMotionChange);
    }

    if (typeof this.finePointerQuery.addEventListener === "function") {
      this.finePointerQuery.addEventListener(
        "change",
        this.handleFinePointerChange,
      );
    } else {
      this.finePointerQuery.addListener(this.handleFinePointerChange);
    }
  }

  handlePointer(event) {
    if (
      this.isDestroyed ||
      !this.isStarted ||
      event.pointerType !== "mouse" ||
      !this.isAllowed() ||
      !Number.isFinite(event.clientX) ||
      !Number.isFinite(event.clientY)
    ) {
      return;
    }

    const wasOutside = !this.isPointerInside;
    this.isPointerInside = true;
    this.hasPointerInput = true;
    this.target.x = event.clientX;
    this.target.y = event.clientY;

    if (wasOutside || this.needsSnap) {
      this.snapPosition();
    }

    if (!this.isDragLocked) {
      this.setMode(this.resolveMode(event.target));
    }

    this.markActive();
    this.syncDocumentState();
    this.show();
    this.wake();
    this.scheduleInteractionRefresh();
  }

  handlePointerDown(event) {
    this.handlePointer(event);

    if (
      event.pointerType !== "mouse" ||
      !this.canRun() ||
      this.mode !== "drag"
    ) {
      return;
    }

    this.isDragLocked = true;
    this.activeDragPointerId = event.pointerId;
    this.element.classList.add("is-dragging");
    this.setMode("drag");
    this.syncDocumentState();
  }

  handlePointerOver(event) {
    this.handlePointer(event);
  }

  handlePointerOut(event) {
    const relatedTagName = event.relatedTarget?.tagName;

    if (
      event.pointerType === "mouse" &&
      (event.relatedTarget === null || relatedTagName === "IFRAME")
    ) {
      this.resetOutsideState();
    }
  }

  handlePointerRelease(event) {
    if (
      !this.isDragLocked ||
      (Number.isFinite(this.activeDragPointerId) &&
        event.pointerId !== this.activeDragPointerId)
    ) {
      return;
    }

    this.isDragLocked = false;
    this.activeDragPointerId = null;
    this.element.classList.remove("is-dragging");

    if (this.isPointerInside) {
      this.refreshInteractionMode();
    } else {
      this.setMode("default");
    }

    this.syncDocumentState();
  }

  handleWindowBlur() {
    this.resetOutsideState();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.resetOutsideState();
    } else {
      this.syncPassiveState();
    }
  }

  handleReducedMotionChange(event) {
    if (event.matches) {
      this.resetInputState();
    }

    this.syncPassiveState();
  }

  handleFinePointerChange(event) {
    if (!event.matches) {
      this.resetInputState();
    }

    this.syncPassiveState();
  }

  resetInputState() {
    this.hasPointerInput = false;
    this.resetOutsideState();
  }

  resetOutsideState() {
    this.isPointerInside = false;
    this.isDragLocked = false;
    this.activeDragPointerId = null;
    this.element.classList.remove("is-dragging");
    this.setMode("default");
    this.hide();
    this.pauseAnimation();
    this.cancelInteractionRefresh();
    this.syncDocumentState();
  }

  resolveMode(target) {
    if (this.isDragLocked) {
      return "drag";
    }

    const targetElement = target instanceof Element ? target : null;

    if (!targetElement) {
      return "default";
    }

    const dragTarget = targetElement.closest(this.options.dragSelector);
    const pointerTarget = targetElement.closest(this.options.pointerSelector);

    if (dragTarget) {
      const isNestedControl =
        pointerTarget &&
        pointerTarget !== dragTarget &&
        dragTarget.contains(pointerTarget);

      if (isNestedControl) {
        return "native";
      }

      return "drag";
    }

    if (pointerTarget) {
      return "native";
    }

    return "default";
  }

  refreshInteractionMode() {
    if (
      !this.hasPointerInput ||
      !this.isPointerInside ||
      !Number.isFinite(this.target.x) ||
      !Number.isFinite(this.target.y)
    ) {
      return this.mode;
    }

    const target = document.elementFromPoint(this.target.x, this.target.y);
    this.setMode(this.resolveMode(target));
    return this.mode;
  }

  setMode(mode) {
    if (!new Set(["default", "native", "drag"]).has(mode)) {
      throw new RangeError(`Unknown cursor point mode: ${mode}.`);
    }

    if (this.mode === mode) {
      return;
    }

    this.mode = mode;
    this.element.dataset.cursorMode = mode;
    this.syncDocumentState();
  }

  syncDocumentState() {
    const root = document.documentElement;

    if (this.canRun()) {
      root.dataset.cursorPointEnabled = "true";
      root.dataset.cursorMode = this.mode;
    } else {
      delete root.dataset.cursorPointEnabled;
      delete root.dataset.cursorMode;
    }

    if (this.canRun() && this.isDragLocked) {
      root.dataset.cursorDragging = "true";
    } else {
      delete root.dataset.cursorDragging;
    }
  }

  show() {
    if (!this.canRun()) {
      this.hide();
      return;
    }

    if (this.needsSnap) {
      this.snapPosition();
    }

    this.element.classList.add("is-visible");
    this.element.dataset.cursorVisibility = "visible";
  }

  hide() {
    this.element.classList.remove("is-visible");
    this.element.dataset.cursorVisibility = "hidden";
    this.needsSnap = true;
    this.lastFrameTimestamp = null;
  }

  snapPosition() {
    if (!Number.isFinite(this.target.x) || !Number.isFinite(this.target.y)) {
      return;
    }

    this.position.x = this.target.x;
    this.position.y = this.target.y;
    this.needsSnap = false;
    this.lastFrameTimestamp = null;
    this.writePosition();
  }

  writePosition() {
    if (
      this.position.x === this.lastRenderedX &&
      this.position.y === this.lastRenderedY
    ) {
      return;
    }

    this.element.style.transform =
      `translate3d(${this.position.x}px, ${this.position.y}px, 0)`;
    this.lastRenderedX = this.position.x;
    this.lastRenderedY = this.position.y;
  }

  updatePosition(timestamp) {
    if (
      !Number.isFinite(this.target.x) ||
      !Number.isFinite(this.target.y)
    ) {
      return 0;
    }

    if (this.needsSnap) {
      this.snapPosition();
      return 0;
    }

    const deltaMs =
      this.lastFrameTimestamp === null
        ? REFERENCE_FRAME_MS
        : Math.min(64, Math.max(0, timestamp - this.lastFrameTimestamp));
    const frameAdjustedEase =
      1 -
      Math.pow(
        1 - this.options.positionEase,
        deltaMs / REFERENCE_FRAME_MS,
      );
    const previousX = this.position.x;
    const previousY = this.position.y;

    this.position.x +=
      (this.target.x - this.position.x) * frameAdjustedEase;
    this.position.y +=
      (this.target.y - this.position.y) * frameAdjustedEase;
    this.lastFrameTimestamp = timestamp;

    const residualX = this.target.x - this.position.x;
    const residualY = this.target.y - this.position.y;
    let residualSquared =
      residualX * residualX + residualY * residualY;

    if (residualSquared <= IDLE_MOVEMENT_EPSILON ** 2) {
      this.position.x = this.target.x;
      this.position.y = this.target.y;
      residualSquared = 0;
    }

    this.writePosition();

    const movementX = this.position.x - previousX;
    const movementY = this.position.y - previousY;

    return Math.max(
      movementX * movementX + movementY * movementY,
      residualSquared,
    );
  }

  markActive() {
    this.isIdle = false;
    this.idleStartedAt = null;
  }

  wake() {
    if (this.isRunning || this.isIdle || !this.canRun()) {
      this.syncPassiveState();
      return;
    }

    this.isRunning = true;
    this.setState("running");
    this.frameId = window.requestAnimationFrame(this.render);
  }

  pauseAnimation() {
    if (this.frameId !== null) {
      window.cancelAnimationFrame(this.frameId);
    }

    this.frameId = null;
    this.isRunning = false;
    this.idleStartedAt = null;
    this.lastFrameTimestamp = null;
  }

  render(timestamp = performance.now()) {
    this.frameId = null;

    if (!this.canRun()) {
      this.isRunning = false;
      this.syncPassiveState();
      return;
    }

    this.refreshInteractionMode();
    const maximumMovementSquared = this.updatePosition(timestamp);

    if (maximumMovementSquared <= IDLE_MOVEMENT_EPSILON ** 2) {
      if (this.idleStartedAt === null) {
        this.idleStartedAt = timestamp;
      } else if (timestamp - this.idleStartedAt >= IDLE_DELAY_MS) {
        this.isRunning = false;
        this.isIdle = true;
        this.idleStartedAt = null;
        this.lastFrameTimestamp = null;
        this.setState("idle");
        return;
      }
    } else {
      this.idleStartedAt = null;
    }

    this.frameId = window.requestAnimationFrame(this.render);
  }

  scheduleInteractionRefresh() {
    if (
      this.interactionTimerId !== null ||
      !this.canRun()
    ) {
      return;
    }

    this.interactionTimerId = window.setTimeout(() => {
      this.interactionTimerId = null;

      if (!this.canRun()) {
        return;
      }

      this.refreshInteractionMode();
      this.scheduleInteractionRefresh();
    }, INTERACTION_REFRESH_MS);
  }

  cancelInteractionRefresh() {
    if (this.interactionTimerId !== null) {
      window.clearTimeout(this.interactionTimerId);
      this.interactionTimerId = null;
    }
  }

  syncPassiveState() {
    if (this.isDestroyed) {
      this.setState("destroyed");
    } else if (!this.isAllowed()) {
      this.setState("disabled");
    } else if (!this.isStarted) {
      this.setState("stopped");
    } else if (document.hidden) {
      this.setState("paused");
    } else if (!this.hasPointerInput || !this.isPointerInside) {
      this.setState("dormant");
    } else if (this.isIdle) {
      this.setState("idle");
    }

    this.syncDocumentState();
  }

  start() {
    if (this.isDestroyed) {
      return;
    }

    this.isStarted = true;

    if (this.hasPointerInput && this.isPointerInside && this.isAllowed()) {
      this.refreshInteractionMode();
      this.markActive();
      this.show();
      this.wake();
      this.scheduleInteractionRefresh();
    } else {
      this.syncPassiveState();
    }
  }

  stop() {
    if (this.isDestroyed) {
      return;
    }

    this.isStarted = false;
    this.isIdle = false;
    this.hasPointerInput = false;
    this.isPointerInside = false;
    this.isDragLocked = false;
    this.activeDragPointerId = null;
    this.element.classList.remove("is-dragging");
    this.pauseAnimation();
    this.cancelInteractionRefresh();
    this.hide();
    this.setMode("default");
    this.syncPassiveState();
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }

    this.stop();
    this.isDestroyed = true;

    window.removeEventListener("pointermove", this.handlePointer);
    window.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointerover", this.handlePointerOver);
    window.removeEventListener("pointerout", this.handlePointerOut);
    window.removeEventListener("pointerup", this.handlePointerRelease);
    window.removeEventListener("pointercancel", this.handlePointerRelease);
    window.removeEventListener("blur", this.handleWindowBlur);
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    if (typeof this.reducedMotionQuery.removeEventListener === "function") {
      this.reducedMotionQuery.removeEventListener(
        "change",
        this.handleReducedMotionChange,
      );
    } else {
      this.reducedMotionQuery.removeListener(this.handleReducedMotionChange);
    }

    if (typeof this.finePointerQuery.removeEventListener === "function") {
      this.finePointerQuery.removeEventListener(
        "change",
        this.handleFinePointerChange,
      );
    } else {
      this.finePointerQuery.removeListener(this.handleFinePointerChange);
    }

    this.element.style.removeProperty("transform");
    this.setState("destroyed");
    this.syncDocumentState();
  }
}


export { CursorLineEffect, CursorPointEffect, FINE_POINTER_QUERY };
