import { Quaternion } from "three";
import EventEmitter from "../event-emitter";

export interface EasingFunction { (x: number): number }

export function LinearEasing(x: number): number {
  return x;
}

export function EaseOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export class Easing extends EventEmitter {
  private elapsed: number;
  active: boolean;
  repeat: boolean;
  progress: number;
  duration: number;
  easingFunction: EasingFunction;

  constructor(duration = 1, easingFunction = LinearEasing) {
    super();

    this.elapsed = 0;
    this.active = true;
    this.repeat = false;
    this.progress = 0;
    this.duration = duration;
    this.easingFunction = easingFunction;
  }

  update(deltaTime: number) {
    if (!this.active)
      return;

    this.elapsed += deltaTime;
    this.progress = this.easingFunction(Math.min(1, this.elapsed / this.duration));

    if (this.elapsed >= this.duration) {
      if (this.repeat) {
        this.elapsed = 0;
        this.progress = 0;
      } else {
        this.active = false;
      }
      this.emit("done");
    }
  }
}

export class Slerp extends Easing {
  from: Quaternion;
  to: Quaternion;
  value: Quaternion;

  constructor(to: Quaternion, duration = 1, easingFunction = LinearEasing) {
    super(duration, easingFunction);
    this.from = new Quaternion();
    this.to = to;
    this.value = new Quaternion();

    this.on("done", () => {
      this.from = this.to;
    });
  }

  update(deltaTime: number) {
    super.update(deltaTime);

    Quaternion.slerp(this.from, this.to, this.value, this.progress);
  }
}
