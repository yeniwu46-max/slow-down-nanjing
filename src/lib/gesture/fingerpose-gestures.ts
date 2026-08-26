import {
  Finger,
  FingerCurl,
  FingerDirection,
  GestureDescription,
} from "fingerpose";

export const ReleaseWindGesture = new GestureDescription("release_wind");
ReleaseWindGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
ReleaseWindGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
ReleaseWindGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
ReleaseWindGesture.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
ReleaseWindGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);

export const OpenStoryGesture = new GestureDescription("open_story");
OpenStoryGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.5);
OpenStoryGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
OpenStoryGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
OpenStoryGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
OpenStoryGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
OpenStoryGesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.75);

export const StartJourneyGesture = new GestureDescription("start_journey");
StartJourneyGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
StartJourneyGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
StartJourneyGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
StartJourneyGesture.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
StartJourneyGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);

export const ALL_FINGERPOSE_GESTURES = [
  ReleaseWindGesture,
  OpenStoryGesture,
  StartJourneyGesture,
];
