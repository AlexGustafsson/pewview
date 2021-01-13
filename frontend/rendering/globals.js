import {
  Euler
} from "../include/three"

import EventEmitter from "../event-emitter"

export const bl = {};
export const messageBus = new EventEmitter();
export const START_ROTATION = new Euler(.3, 4.6, .05);
export const EVENT_PAUSE = Symbol("pause");
export const EVENT_RESUME = Symbol("resume");
export const ul = "PR_OPENED";
export const dl = "PR_MERGED";
