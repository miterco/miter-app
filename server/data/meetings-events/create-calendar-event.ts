import {MeetingPhase} from 'miter-common/SharedTypes';
import {calculateIsGoalExempt} from '../data-util';
import {ValidationError} from 'miter-common/SharedTypes';
import {FullCalendarEventRecord} from '../../server-core/server-types';
import {v4 as uuid} from 'uuid';
import {getMeetingDatesFromCalendarDates} from '../../server-core/server-util';
import {getPrismaClient} from '../prisma-client';
import {Prisma} from '@prisma/client';

const prisma = getPrismaClient();

export const adHocMeetingTitle = 'Meeting in Miter';

export const createCalendarEvent = async (
  fullCalendarEvent: Omit<FullCalendarEventRecord, 'id' | 'meetingId'>
): Promise<FullCalendarEventRecord> => {
  const isFirstMeetingInSeries = true;
  const phase: MeetingPhase = 'NotStarted';

  const {token, tokenValue, serviceId, startDate, startTime, endDate, endTime, ...inputMeetingFields} =
    fullCalendarEvent;

  const {startDatetime, endDatetime, allDay} = getMeetingDatesFromCalendarDates(
    fullCalendarEvent.startDate,
    fullCalendarEvent.endDate,
    fullCalendarEvent.startTime,
    fullCalendarEvent.endTime
  );
  const allMeetingFields = {
    ...inputMeetingFields,
    startDatetime,
    endDatetime,
    allDay,
    phase,
    isFirstMeetingInSeries,
    isGoalExempt: calculateIsGoalExempt(inputMeetingFields.title),
  };

  try {
    const newCalendarEvent = await prisma.calendarEvent.create({
      data: {
        ...fullCalendarEvent,
        meeting: {
          create: allMeetingFields,
        },
      },
      include: {
        meeting: true,
      },
    });

    if (!newCalendarEvent) throw `New calendar event not created ${fullCalendarEvent.serviceId}`;
    if (!newCalendarEvent.meeting) {
      throw "This should not happen based on prisma query above, remove once meetingId is required on calendarEvent since that is the check that's being done below is based on prisma type not natural result of query";
    }

    return {
      ...newCalendarEvent,
      meetingId: newCalendarEvent.meeting.id,
    };
  } catch (e) {
    console.log(`Could not create single calendar event. Service ID: ${fullCalendarEvent.serviceId}`);
    throw e;
  }
};

export const createFirstInstanceOfRecurringCalendarEvent = async (
  firstCalendarEventInstance: Omit<FullCalendarEventRecord, 'meetingId' | 'id'>,
  recurringCalendarEventServiceId: string | null,
  recurrenceRule: string | null
) => {
  const isFirstMeetingInSeries = true;

  if (!recurringCalendarEventServiceId) {
    throw new ValidationError('createFirstInstanceOfRecurringCalendarEvent lacks a recurring ID.');
  }

  const {tokenValue, serviceId, token, startDate, startTime, endDate, endTime, ...inputMeetingFields} =
    firstCalendarEventInstance;
  const newCalendarEventId = uuid();

  const {startDatetime, endDatetime, allDay} = getMeetingDatesFromCalendarDates(
    firstCalendarEventInstance.startDate,
    firstCalendarEventInstance.endDate,
    firstCalendarEventInstance.startTime,
    firstCalendarEventInstance.endTime
  );
  const allMeetingFields = {
    ...inputMeetingFields,
    startDatetime,
    endDatetime,
    allDay,
    isFirstMeetingInSeries,
    isGoalExempt: calculateIsGoalExempt(inputMeetingFields.title),
  };

  try {
    const newCalendarEvent = await prisma.calendarEvent.create({
      data: {
        ...firstCalendarEventInstance,
        id: newCalendarEventId,
        startDate: undefined,
        startTime: undefined,
        endDate: undefined,
        endTime: undefined,
        serviceId: recurringCalendarEventServiceId,
        recurringCalendarEventId: undefined,
        recurringCalendarEvent: {
          create: {
            id: newCalendarEventId,
            serviceId: recurringCalendarEventServiceId,
            recurrenceRule: recurrenceRule || Prisma.DbNull,
            meetingSeries: {
              create: {
                title: firstCalendarEventInstance.title,
              },
            },
          },
        },
        meeting: {
          create: allMeetingFields,
        },
      },
      include: {
        meeting: true,
        recurringCalendarEvent: {
          include: {
            meetingSeries: true,
          },
        },
      },
    });

    // Because both Meeting and Recurring Calendar Event connect to the Meeting Series, we need to make sure that both connect to the same one.
    // To do this you take whatever the result of the initial create/update was on one fork and update the other fork.
    // Otherwise you have to check whether you are potentially created a recurrence but updating a meeting, which is even more complicated.
    // Since you don't know in one connectOrCreate fork of the prisma command what the outcome of the other connectOrCreate fork is.

    if (newCalendarEvent.recurringCalendarEvent?.meetingSeriesId && !newCalendarEvent.meeting.meetingSeriesId) {
      await prisma.meeting.update({
        where: {
          id: newCalendarEvent.meeting.id,
        },
        data: {
          meetingSeries: {
            connect: {
              id: newCalendarEvent.recurringCalendarEvent?.meetingSeriesId,
            },
          },
        },
      });
    }

    if (newCalendarEvent) {
      return {
        ...newCalendarEvent,
        phase: newCalendarEvent.meeting?.phase as MeetingPhase,
      };
    } else {
      throw `Calendar Event not created for Recurring Calendar Event Service ID: ${recurringCalendarEventServiceId}`;
    }
  } catch (e) {
    console.log(
      `Could not create first instance of recurring calendar event. First Calendar Event Service ID: ${firstCalendarEventInstance.serviceId}, Recurring Calendar Event Service ID: ${recurringCalendarEventServiceId}`
    );
    throw e;
  }
};
