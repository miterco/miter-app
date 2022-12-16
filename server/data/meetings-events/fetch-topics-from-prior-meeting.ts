import { Meeting, Topic } from "miter-common/SharedTypes";
import { fetchAllTopicsForMeeting } from "../topics/fetch-all-topics";
import { fetchPastMeetingsFromMeetingSeries } from "./fetch-meetings-from-meeting-series";

export const fetchTopicsFromPriorMeeting = async (meeting: Meeting): Promise<Topic[]> => {
  if (!meeting.meetingSeriesId) {
    // Not part of a series, so no prior topics
    return [];
  }

  const meetingStart = meeting.startDatetime;
  if (!meetingStart) throw new Error(`Meeting ${meeting.id} has no start time info!`);

  const pastMeetings = await fetchPastMeetingsFromMeetingSeries(meeting.meetingSeriesId, meetingStart, true);
  const pastMeetingsWithTopics = pastMeetings.filter(row => row.hasTopics);

  if (pastMeetingsWithTopics.length === 0) return [];
  const lastMeeting = pastMeetingsWithTopics[0].meeting;

  return await fetchAllTopicsForMeeting(lastMeeting.id);

};


