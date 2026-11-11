/** @workspace/motion: native scroll animations, CSS presets plus one IntersectionObserver (README.md). */
export { CountUp, MotionScope, Reveal, StaggerChildren, type RevealVariant } from "./components";
export { Intro, IntroWords } from "./intro";
export { AnimationObserver, destroyAnimations, initAnimations, JS_ANIMATIONS_CLASS, replayAnimation } from "./animations.client";
export { ANIMATIONS_INIT_SCRIPT } from "./init-script";
export {
  ANIMATION_PRESETS,
  animationDefaultSchema,
  animationPresetSchema,
  animationSpeedSchema,
  MARKETING_PRESETS,
  MOTION,
  motionIntensitySchema,
  parseAnimationSetting,
  resolveAnimation,
  siteAnimationSchema,
  type AnimationDefault,
  type AnimationPreset,
  type AnimationSetting,
  type AnimationSpeed,
  type MarketingPreset,
  type SiteAnimation,
} from "./presets";
export {
  batchDelays,
  INTENSITY_FACTOR,
  MOTION_INTENSITIES,
  MOTION_V2,
  MOTION_V2_EASE,
  MOTION_V2_SCROLL,
  MOTION_V2_STAGGER,
  MOTION_V2_TRIGGER,
  staggerDelay,
  wordStep,
  type MotionIntensity,
} from "./tokens";
