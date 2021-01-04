// https://github.com/mbostock/solar-calculator Version 0.3.0. Copyright 2017 Mike Bostock.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.solar = global.solar || {})));
}(this, (function (exports) { 'use strict';

var acos = Math.acos;
var asin = Math.asin;
var cos = Math.cos;
var pi = Math.PI;
var pow = Math.pow;
var sin = Math.sin;
var tan = Math.tan;

function radians(degrees) {
  return pi * degrees / 180;
}

function degrees(radians) {
  return 180 * radians / pi;
}

// Given t in J2000.0 centuries, returns the sun’s mean longitude in degrees.
// https://en.wikipedia.org/wiki/Mean_longitude
var meanLongitude = function(t) {
  var l = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  return l < 0 ? l + 360 : l;
};

// Given t in J2000.0 centuries, returns the sun’s mean anomaly in degrees.
// https://en.wikipedia.org/wiki/Mean_anomaly
var meanAnomaly = function(t) {
  return 357.52911 + t * (35999.05029 - 0.0001537 * t);
};

// Given t in J2000.0 centuries, returns the sun’s equation of the center in degrees.
// https://en.wikipedia.org/wiki/Equation_of_the_center
var equationOfCenter = function(t) {
  var m = radians(meanAnomaly(t)), sinm = sin(m), sin2m = sin(m * 2), sin3m = sin(m * 3);
  return sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) + sin2m * (0.019993 - 0.000101 * t) + sin3m * 0.000289;
};

// Given t in J2000.0 centuries, returns the sun’s true longitude in degrees.
// https://en.wikipedia.org/wiki/True_longitude
var trueLongitude = function(t) {
  return meanLongitude(t) + equationOfCenter(t);
};

// Given t in J2000.0 centuries, returns the sun’s apparent longitude in degrees.
// https://en.wikipedia.org/wiki/Apparent_longitude
var apparentLongitude = function(t) {
  return trueLongitude(t) - 0.00569 - 0.00478 * sin(radians(125.04 - 1934.136 * t));
};

var epoch = Date.UTC(2000, 0, 1, 12); // J2000.0

var century = function(date) {
  return (date - epoch) / 315576e7;
};

// Given t in J2000.0 centuries, returns the obliquity of the Earth’s ecliptic in degrees.
var obliquityOfEcliptic = function(t) {
  var e0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60,
      omega = 125.04 - 1934.136 * t,
      e = e0 + 0.00256 * cos(radians(omega));
  return e;
};

// Given t in J2000.0 centuries, returns the solar declination in degrees.
// https://en.wikipedia.org/wiki/Position_of_the_Sun#Declination_of_the_Sun_as_seen_from_Earth
var declination = function(t) {
  return degrees(asin(sin(radians(obliquityOfEcliptic(t))) * sin(radians(apparentLongitude(t)))));
};

// Given t in J2000.0 centuries, returns eccentricity.
// https://en.wikipedia.org/wiki/Orbital_eccentricity
var orbitEccentricity = function(t) {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
};

// Given t in J2000.0 centuries, returns the equation of time in minutes.
// https://en.wikipedia.org/wiki/Equation_of_time
var equationOfTime = function(t) {
  var epsilon = obliquityOfEcliptic(t),
      l0 = meanLongitude(t),
      e = orbitEccentricity(t),
      m = meanAnomaly(t),
      y = pow(tan(radians(epsilon) / 2), 2),
      sin2l0 = sin(2 * radians(l0)),
      sinm = sin(radians(m)),
      cos2l0 = cos(2 * radians(l0)),
      sin4l0 = sin(4 * radians(l0)),
      sin2m = sin(2 * radians(m)),
      Etime = y * sin2l0 - 2 * e * sinm + 4 * e * y * sinm * cos2l0 - 0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;
  return degrees(Etime) * 4;
};

var riseHourAngle = function(date, latitude) {
  var phi = radians(latitude), theta = radians(declination(century(date)));
  return -degrees(acos(cos(radians(90.833)) / (cos(phi) * cos(theta)) - tan(phi) * tan(theta)));
};

var hours = function(date, latitude) {
  var delta = -riseHourAngle(date, latitude);
  if (isNaN(delta)) {
    delta = declination(century(date));
    return (latitude < 0 ? delta < 0.833 : delta > -0.833) * 24;
  }
  return 8 * delta / 60;
};

var day = function(date) {
  date = new Date(+date);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

var noon = function(date, longitude) {
  var t = century(+day(date) + (12 - longitude * 24 / 360) * 36e5), // First approximation.
      o1 = 720 - longitude * 4 - equationOfTime(t - longitude / (360 * 36525)), // First correction.
      o2 = 720 - longitude * 4 - equationOfTime(t + o1 / (1440 * 36525)); // Second correction.
  return new Date(+day(date) + o2 * 1000 * 60);
};

var rise = function(date, latitude, longitude) {
  date = noon(date, longitude);
  return new Date(+date + riseHourAngle(date, latitude) * 4 * 1000 * 60);
};

var set = function(date, latitude, longitude) {
  date = noon(date, longitude);
  return new Date(+date - riseHourAngle(date, latitude) * 4 * 1000 * 60);
};

exports.apparentLongitude = apparentLongitude;
exports.century = century;
exports.declination = declination;
exports.equationOfCenter = equationOfCenter;
exports.equationOfTime = equationOfTime;
exports.hours = hours;
exports.meanAnomaly = meanAnomaly;
exports.meanLongitude = meanLongitude;
exports.noon = noon;
exports.obliquityOfEcliptic = obliquityOfEcliptic;
exports.orbitEccentricity = orbitEccentricity;
exports.riseHourAngle = riseHourAngle;
exports.rise = rise;
exports.set = set;
exports.trueLongitude = trueLongitude;

Object.defineProperty(exports, '__esModule', { value: true });

})));
