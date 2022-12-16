import {Meeting} from 'miter-common/SharedTypes';
import {calculateIsGoalExempt, meetingFromPrismaType} from '../data-util';
import {createBulkPeopleFromAttendees} from '../people/create-bulk-people';
import {fetchCalendarEventByGoogleId} from './fetch-calendar-event';
import {createFirstInstanceOfRecurringCalendarEvent} from './create-calendar-event';
import {
  Attendee,
  CalendarEventWithAttendees,
  FullCalendarEventRecord,
  UnsavedCalendarEventWithAttendees,
  UserRecord,
} from '../../server-core/server-types';
import {fetchRecurringCalendarEventByGoogleId} from './fetch-recurring-calendar-event';
import {addRecurrenceToCalendarEventByGoogleId} from './add-recurrence-to-calendar-event';
import {getMeetingDatesFromCalendarDates} from '../../server-core/server-util';
import {getPrismaClient} from '../prisma-client';
import {Prisma} from '@prisma/client';
import {getEmailDomain} from 'miter-common/CommonUtil';
import {fetchOrganizationAndDomainFromDomainNames} from './fetch-organization-domain-from-domain-name';
import {replacePeopleOnCalendarEvent} from '../people/replace-people-on-calendar-events';

export type CalendarEventStatus = 'confirmed' | 'cancelled' | 'tentative' | null | undefined;

const prisma = getPrismaClient();

const createCalendarEventFor1stInstance = async (
  calendarEvent: UnsavedCalendarEventWithAttendees
): Promise<FullCalendarEventRecord & {meeting: Meeting}> => {
  const isFirstMeetingInSeries = true;

  const {
    phase,
    recurringCalendarEventServiceId,
    recurrenceRule,
    attendees,
    googleEventType,
    status,
    ...justTheCalendarEvent
  } = calendarEvent;
  const {id, serviceId, tokenValue, startTime, startDate, endTime, endDate, ...inputMeetingFields} =
    justTheCalendarEvent;

  const {startDatetime, endDatetime, allDay} = getMeetingDatesFromCalendarDates(
    calendarEvent.startDate,
    calendarEvent.endDate,
    calendarEvent.startTime,
    calendarEvent.endTime
  );
  const allMeetingFields = {
    ...inputMeetingFields,
    startDatetime,
    endDatetime,
    allDay,
    isFirstMeetingInSeries,
    isGoalExempt: calculateIsGoalExempt(inputMeetingFields.title),
  };

  // recurringCalendarEventServiceId contains a "base" Google ID passed through or computed by
  // convertGoogleEventsToCalendarEvents().
  try {
    const upsertedCalendarEvent = await prisma.calendarEvent.upsert({
      where: {
        serviceId: calendarEvent.serviceId || undefined,
      },
      update: {
        ...justTheCalendarEvent,
        id: undefined,
        meeting: {
          upsert: {
            update: {
              phase: undefined,
            },
            create: allMeetingFields,
          },
        },
        recurringCalendarEventId: undefined,
        recurringCalendarEvent: {
          connectOrCreate: {
            where: {
              serviceId: recurringCalendarEventServiceId || undefined,
            },
            create: {
              id: calendarEvent.id,
              serviceId: recurringCalendarEventServiceId || undefined,
              recurrenceRule: recurrenceRule || Prisma.DbNull,
              meetingSeries: {
                create: {
                  title: justTheCalendarEvent.title,
                },
              },
            },
          },
        },
      },
      create: {
        ...justTheCalendarEvent,
        id: calendarEvent.id,
        meeting: {
          create: allMeetingFields,
        },
        recurringCalendarEventId: undefined,
        recurringCalendarEvent: {
          connectOrCreate: {
            where: {
              serviceId: recurringCalendarEventServiceId || undefined,
            },
            create: {
              id: calendarEvent.id,
              serviceId: recurringCalendarEventServiceId || undefined,
              recurrenceRule: recurrenceRule || Prisma.DbNull,
              meetingSeries: {
                create: {
                  title: justTheCalendarEvent.title,
                },
              },
            },
          },
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

    if (
      upsertedCalendarEvent.recurringCalendarEvent?.meetingSeriesId &&
      !upsertedCalendarEvent.meeting.meetingSeriesId
    ) {
      await prisma.meeting.update({
        where: {
          id: upsertedCalendarEvent.meeting.id,
        },
        data: {
          meetingSeries: {
            connect: {
              id: upsertedCalendarEvent.recurringCalendarEvent?.meetingSeriesId,
            },
          },
        },
      });
    }

    // If  Meeting Series Title hasn't been set yet, update it. Otherwise, keep it for the user to update as necessary and don't overwrite with calendar data.
    if (
      upsertedCalendarEvent.title &&
      upsertedCalendarEvent.recurringCalendarEvent?.meetingSeries &&
      !upsertedCalendarEvent.recurringCalendarEvent.meetingSeries.title
    ) {
      await prisma.meetingSeries.update({
        where: {
          id: upsertedCalendarEvent.recurringCalendarEvent.meetingSeries.id,
        },
        data: {
          title: upsertedCalendarEvent.title,
        },
      });
    }

    if (!upsertedCalendarEvent.meeting) {
      throw "This should not happen based on prisma query above, remove once meetingId is required on calendarEvent since that is the check that's being done below is based on prisma type not natural result of query";
    }

    return {
      ...upsertedCalendarEvent,
      meeting: meetingFromPrismaType(upsertedCalendarEvent.meeting),
    };
  } catch (e) {
    console.log(
      `Create Bulk Calendar Events: Could not create first instance of recurring calendarEvent. First Calendar Event Service ID: ${justTheCalendarEvent.serviceId}, Recurring Calendar Event Service ID: ${recurringCalendarEventServiceId}`
    );
    throw e;
  }
};

const createCalendarEventForNthInstance = async (
  calendarEvent: UnsavedCalendarEventWithAttendees
): Promise<FullCalendarEventRecord & {meeting: Meeting}> => {
  const isFirstMeetingInSeries = false;

  const {
    phase,
    recurringCalendarEventServiceId,
    recurrenceRule,
    attendees,
    googleEventType,
    status,
    ...justTheCalendarEvent
  } = calendarEvent;
  const {serviceId, tokenValue, startDate, startTime, endDate, endTime, ...inputMeetingFields} = justTheCalendarEvent;

  const {startDatetime, endDatetime, allDay} = getMeetingDatesFromCalendarDates(
    calendarEvent.startDate,
    calendarEvent.endDate,
    calendarEvent.startTime,
    calendarEvent.endTime
  );
  // TODO we end up creating this variable even if we don't need it (pure upsert)
  const allMeetingFields = {
    ...inputMeetingFields,
    startDatetime,
    endDatetime,
    allDay,
    isFirstMeetingInSeries,
    isGoalExempt: calculateIsGoalExempt(inputMeetingFields.title),
  };

  // This call uses connect rather than connect-or-create because we think we can assume the first
  // instance already exists.
  try {
    const upsertedCalendarEvent = await prisma.calendarEvent.upsert({
      where: {
        serviceId: calendarEvent.serviceId || undefined,
      },
      update: {
        ...justTheCalendarEvent,
        meeting: {
          upsert: {
            update: {
              phase: undefined,
            },
            create: allMeetingFields,
          },
        },
        recurringCalendarEventId: undefined,
        recurringCalendarEvent: {
          connect: {
            serviceId: recurringCalendarEventServiceId || undefined,
          },
        },
      },
      create: {
        ...justTheCalendarEvent,
        meeting: {
          create: allMeetingFields,
        },
        recurringCalendarEventId: undefined,
        recurringCalendarEvent: {
          connect: {
            serviceId: recurringCalendarEventServiceId || undefined,
          },
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
    // To do this you take whatever the result of the initial create/update was on one fork and update the other fork outside the prisma call.
    // (There's no way to know what the outcome of 1 connectOrCreate fork of the prisma command is in the outcome when the executing the other fork of the same prisma command.)

    if (
      upsertedCalendarEvent.recurringCalendarEvent?.meetingSeriesId &&
      !upsertedCalendarEvent.meeting.meetingSeriesId
    ) {
      await prisma.meeting.update({
        where: {
          id: upsertedCalendarEvent.meeting.id,
        },
        data: {
          meetingSeries: {
            connect: {
              id: upsertedCalendarEvent.recurringCalendarEvent?.meetingSeriesId,
            },
          },
        },
      });
    }

    // If  Meeting Series Title hasn't been set yet, update it. Otherwise, keep it for the user to update as necessary and don't overwrite with calendar data.
    if (
      upsertedCalendarEvent.title &&
      upsertedCalendarEvent.recurringCalendarEvent?.meetingSeries &&
      !upsertedCalendarEvent.recurringCalendarEvent.meetingSeries.title
    ) {
      await prisma.meetingSeries.update({
        where: {
          id: upsertedCalendarEvent.recurringCalendarEvent.meetingSeries.id,
        },
        data: {
          title: upsertedCalendarEvent.title,
        },
      });
    }

    if (!upsertedCalendarEvent.meeting) {
      throw "This should not happen based on prisma query above, remove once meetingId is required on calendarEvent since that is the check that's being done below is based on prisma type not natural result of query";
    }

    return {
      ...upsertedCalendarEvent,
      meeting: meetingFromPrismaType(upsertedCalendarEvent.meeting),
    };
  } catch (e) {
    console.log(
      `Create Bulk Calendar Events: Could not create Nth instance of recurring calendar event. Nth Calendar Event Service ID: ${justTheCalendarEvent.serviceId}, Recurring Calendar Event Service ID: ${recurringCalendarEventServiceId}`
    );
    throw e;
  }
};

export const createBulkCalendarEvents = async (
  calendarEvents: UnsavedCalendarEventWithAttendees[],
  user: UserRecord | null
): Promise<FullCalendarEventRecord[]> => {
  const result: CalendarEventWithAttendees[] = [];
  const notFrozenCalendarEventsSet = new Set();
  const peopleDeDuped: Attendee[] = [];
  const emails = new Set();

  const calendarEventImportStart = Date.now();

  for (let i = 0; i < calendarEvents.length; i++) {
    const calendarEvent = calendarEvents[i];

    // If it's canceled, we don't get data so we have to handle it differently. Note also that "canceled" for user A may
    // just be "removed from meeting" from user B's perspective.
    if (calendarEvent.status !== 'cancelled') {
      try {
        // Here we split off fields that don't belong in our database so Prisma doesn't get cranky at us.
        // TODO we're munging data we just finished munging...so maybe we merge the two?
        const isFirstMeetingInSeries = true;

        const {
          phase,
          recurringCalendarEventServiceId,
          recurrenceRule,
          attendees,
          googleEventType,
          status,
          ...justTheCalendarEvent
        } = calendarEvent;
        const {serviceId, tokenValue, startDate, startTime, endDate, endTime, ...inputMeetingFields} =
          justTheCalendarEvent;

        const {startDatetime, endDatetime, allDay} = getMeetingDatesFromCalendarDates(
          calendarEvent.startDate,
          calendarEvent.endDate,
          calendarEvent.startTime,
          calendarEvent.endTime
        );
        // TODO we create this even when we don't need it (pure upsert)
        const allMeetingFields = {
          ...inputMeetingFields,
          startDatetime,
          endDatetime,
          allDay,
          isFirstMeetingInSeries,
          isGoalExempt: calculateIsGoalExempt(inputMeetingFields.title),
        };

        if (googleEventType === 'Single') {
          const upsertedCalendarEvent = await prisma.calendarEvent.upsert({
            where: {
              serviceId: calendarEvent.serviceId || undefined,
            },
            update: {
              ...justTheCalendarEvent,
              id: undefined,
              meeting: {
                upsert: {
                  update: {
                    phase: undefined,
                  },
                  create: allMeetingFields,
                },
              },
              recurringCalendarEventId: undefined,
            },
            create: {
              ...justTheCalendarEvent,
              id: calendarEvent.id,
              meeting: {
                create: allMeetingFields,
              },
              recurringCalendarEventId: undefined,
            },
            include: {
              meeting: true,
            },
          });

          for (let h = 0; h < calendarEvent.attendees.length; h++) {
            // For each attendee, if we haven't seen them before *anywhere* in this
            // set of events, add them to an array of people we want to put in the
            // DB.
            if (!emails.has(calendarEvent.attendees[h].email)) {
              peopleDeDuped.push(calendarEvent.attendees[h]);
              emails.add(calendarEvent.attendees[h].email);
            }
          }

          //
          // It's easy in GCal, as a user, to retroactively modify the attendance
          // list of a recurring meeting. To sidestep that in our data, we "freeze"
          // meetings after they've ended. That is, we ignore attendance updates
          // to a meeting that's ended.
          //
          // TODO: We use our own concept of "ended" here —- may make sense to augment
          // with date/time info.
          //
          if (upsertedCalendarEvent.meeting.phase !== 'Ended') {
            // Event hasn't ended. Add to lists of not-frozen meetings / events.
            notFrozenCalendarEventsSet.add(upsertedCalendarEvent.id);
          }

          result.push({
            ...upsertedCalendarEvent,
            googleEventType,
            status: calendarEvent.status as CalendarEventStatus,
            recurringCalendarEventServiceId: calendarEvent.recurringCalendarEventServiceId,
            attendees,
          });
        } else {
          // Event type is some type of recurring

          if (!calendarEvent.recurringCalendarEventServiceId) throw 'Error present for TS purposes only.';

          // In theory, this shouldn't be necessary... but we do still seem to be getting missing first calendar event cases - we may end up collapsing the 2 Nth instance scenarios
          const doesInitialCalendarEventExist = Boolean(
            await fetchCalendarEventByGoogleId(calendarEvent.recurringCalendarEventServiceId)
          );

          if (!doesInitialCalendarEventExist) {
            console.log(
              `Found a normal-style Nth Recurring that didn't have an initial calendar event, creating dummy first-instance calendar event for ${calendarEvent.recurringCalendarEventServiceId}`
            );
            await createFirstInstanceOfRecurringCalendarEvent(
              justTheCalendarEvent,
              calendarEvent.recurringCalendarEventServiceId,
              calendarEvent.recurrenceRule
            );
          }

          // Occasionally, a first calendar event may be created as a single instance calendar event because Google doesn't send a recurrence rule
          // Need to check for this and fix

          const doesRecurringCalendarEventExist = Boolean(
            await fetchRecurringCalendarEventByGoogleId(calendarEvent.recurringCalendarEventServiceId)
          );
          if (!doesRecurringCalendarEventExist) {
            console.log(
              `Create Bulk Calendar Events: Could Not Find Recurring Calendar Events Id: ${calendarEvent.recurringCalendarEventServiceId} for Calendar Event: ${calendarEvent.serviceId}`
            );
            await addRecurrenceToCalendarEventByGoogleId(calendarEvent.recurringCalendarEventServiceId);
          }

          // At this point we effectively have either an Nth Instance or a 1st Instance.

          const upsertedCalendarEvent =
            calendarEvent.googleEventType === 'FirstInstance'
              ? await createCalendarEventFor1stInstance(calendarEvent)
              : await createCalendarEventForNthInstance(calendarEvent);

          if (!upsertedCalendarEvent) throw `Calendar Event insert failed: ${calendarEvent.serviceId}`;

          for (let h = 0; h < calendarEvent.attendees.length; h++) {
            // Add attendees we haven't seen before in this dataset to be put in the DB later.
            if (!emails.has(calendarEvent.attendees[h].email)) {
              peopleDeDuped.push(calendarEvent.attendees[h]);
              emails.add(calendarEvent.attendees[h].email);
            }
          }

          if (upsertedCalendarEvent.meeting?.phase !== 'Ended') {
            // Event hasn't ended. Add to set of not-frozen events.
            notFrozenCalendarEventsSet.add(upsertedCalendarEvent.id);
          }

          result.push({
            ...upsertedCalendarEvent,
            googleEventType: calendarEvent.googleEventType,
            status: calendarEvent.status as CalendarEventStatus,
            recurringCalendarEventServiceId: calendarEvent.recurringCalendarEventServiceId,
            attendees,
          });
        }
        ('');
      } catch (err) {
        console.error(
          `\n\ncreateBulkCalendarEvents encountered an error inserting a calendar event for Google ID: ${calendarEvent.serviceId}`,
          err
        );
      }
    } else if (user?.personId) {
      await prisma.calendarEventPerson.deleteMany({
        where: {
          calendarEvent: {
            serviceId: calendarEvent.serviceId,
          },
          personId: user.personId,
        },
      });
    }
  }

  console.log(
    `Imported ${calendarEvents.length} calendar events in ${(Date.now() - calendarEventImportStart) / 1000}s.`
  );

  // OK. We've created/updated all the calendar events we received. Now, let's do the people.

  const peopleImportStart = Date.now();

  const attendeeDomains = peopleDeDuped.map(row => getEmailDomain(row.email));
  const domainChart = await fetchOrganizationAndDomainFromDomainNames(attendeeDomains);

  peopleDeDuped.forEach(row => {
    const domainRecord = domainChart.find(domainRow => domainRow.name === getEmailDomain(row.email));
    row.domainId = domainRecord?.id;
    row.organizationId = domainRecord?.organizationId;
  });

  const bulkAttendees = await createBulkPeopleFromAttendees(peopleDeDuped);
  const personIdsByEmail: Record<string, string> = {};
  const emailAddressIdsbyEmail: Record<string, string> = {};

  bulkAttendees.forEach(({email, emailAddressId, id}) => {
    personIdsByEmail[email] = id;
    emailAddressIdsbyEmail[email] = emailAddressId;
  });

  //
  // For performance reasons, we first put the meetings in the db, THEN come back and do the
  // attendees. So we're looping over the meetings here and doing their attendees.
  //
  for (let j = 0; j < result.length; j++) {
    const calendarEvent = result[j];

    if (notFrozenCalendarEventsSet.has(calendarEvent.id)) {
      for (let k = 0; k < calendarEvent.attendees.length; k++) {
        calendarEvent.attendees[k].id = personIdsByEmail[calendarEvent.attendees[k].email];
        calendarEvent.attendees[k].emailAddressId = emailAddressIdsbyEmail[calendarEvent.attendees[k].email];
      }

      try {
        await replacePeopleOnCalendarEvent(calendarEvent.id, calendarEvent.attendees);
      } catch (err) {
        console.error(`Add People To Calendar Events failed for service ID: ${calendarEvent.serviceId}`);
      }
    }
  }

  console.log(
    `Imported ${calendarEvents.length} calendar events' people in ${(Date.now() - peopleImportStart) / 1000}s.`
  );

  //
  // For each non-frozen calendar event (again, trying to avoid modifying instances in the past), update the basic fields
  // of the associated meeting.
  //
  // TODO: If the meeting is open in our app, this won't propagate down the socket.
  //
  if (notFrozenCalendarEventsSet.size > 0) {
    for (let l = 0; l < result.length; l++) {
      const calendarEvent = result[l];
      if (notFrozenCalendarEventsSet.has(calendarEvent.id)) {
        const {startDatetime, endDatetime, allDay} = getMeetingDatesFromCalendarDates(
          calendarEvent.startDate,
          calendarEvent.endDate,
          calendarEvent.startTime,
          calendarEvent.endTime
        );

        const _updatedMeeting = await prisma.meeting.update({
          where: {
            id: calendarEvent.meetingId,
          },
          data: {
            title: calendarEvent.title,
            startDatetime,
            endDatetime,
            allDay,
          },
        });
      }
    }
  }

  return result;
};
