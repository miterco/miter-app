let meetingId: string;

export const getMeetingId = (): string => {
  return meetingId;
};

export const setMeetingId = (value: string): void => {
  if (meetingId) throw new Error('Meeting ID already set');
  else meetingId = value;
};
