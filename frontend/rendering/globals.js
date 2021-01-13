import {
  Euler
} from "../include/three"

import EventEmitter from "../event-emitter"

export const bl = {};
export const _l = new EventEmitter();
export const hl = new Euler(.3, 4.6, .05);
export const vl = "PAUSE";
export const yl = "RESUME";
export const ul = "PR_OPENED";
export const dl = "PR_MERGED";
