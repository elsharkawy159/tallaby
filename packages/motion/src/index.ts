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
  MOTION,
  parseAnimationSetting,
  resolveAnimation,
  siteAnimationSchema,
  type AnimationDefault,
  type AnimationPreset,
  type AnimationSetting,
  type AnimationSpeed,
  type SiteAnimation,
} from "./presets";
