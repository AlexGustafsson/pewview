import {
  Euler
} from "three"

import EventEmitter from "../event-emitter"

export const bl: {[key: string]: any} = {};
export const messageBus = new EventEmitter();
export const START_ROTATION = new Euler(.3, 4.6, .05);
// export const START_ROTATION = new Euler(0, 0, 0);
export const EVENT_PAUSE = "pause";
export const EVENT_RESUME = "resume";
export const ul = "PR_OPENED";
export const dl = "PR_MERGED";
