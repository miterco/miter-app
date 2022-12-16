BEGIN; 
DELETE FROM google_event_log WHERE   created_date < now() - interval '2 week'; 
COMMIT; 