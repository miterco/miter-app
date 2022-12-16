BEGIN;
LOCK TABLE organizations IN SHARE ROW EXCLUSIVE MODE;
insert into organizations (organization_id, name, lock_meetings) values ('db9768ab-837a-4892-b4dc-9a2d25f67eaa', 'BLOCKING ORGANIZATION', true);
COMMIT;

BEGIN;
LOCK TABLE organizations IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO organizations (organization_id, name, linkedin_company_url_suffix, hubspot_id)
	SELECT '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3', 'Miter', 'miterco', '8375842974'
	WHERE NOT EXISTS (
		SELECT * FROM organizations WHERE name='Miter'
	);
COMMIT;

BEGIN;
LOCK TABLE domains IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO domains (domain_id, organization_id, domain_name)
	SELECT 'a0e2d844-c969-4857-b024-81d789ebb596', '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3', 'miter.co'
		WHERE NOT EXISTS (
		SELECT * FROM domains WHERE domain_id = 'a0e2d844-c969-4857-b024-81d789ebb596'
	);
COMMIT;

BEGIN;
LOCK TABLE domains IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO domains (domain_id, organization_id, domain_name)
	SELECT 'ecef7f29-ec35-4195-aff5-9a365fe23bc1', '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3', 'miter.com'
			WHERE NOT EXISTS (
		SELECT * FROM domains WHERE domain_id = 'ecef7f29-ec35-4195-aff5-9a365fe23bc1'
	);
COMMIT;

BEGIN;
LOCK TABLE domains IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO domains (domain_id, organization_id, domain_name)
	SELECT '9d27ef71-6247-4f11-b015-3eca541e5bbf', '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3', 'miter.xyz'
				WHERE NOT EXISTS (
		SELECT * FROM domains WHERE domain_id = '9d27ef71-6247-4f11-b015-3eca541e5bbf'
	);

COMMIT;

BEGIN;
LOCK TABLE people IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO people (person_id, display_name, picture, organization_id)
SELECT 'c50b11ba-fa72-482c-94ee-ad4a73b6a118', 'Winchester Pratt', 'https://lh3.googleusercontent.com/a-/12345', '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3'
	WHERE NOT EXISTS (
		SELECT * FROM people WHERE person_id='c50b11ba-fa72-482c-94ee-ad4a73b6a118'
	);

INSERT INTO people (person_id, display_name, picture, organization_id)
SELECT '596c9ec2-3bf0-4805-a646-890742d270ca', 'Carla Rodriguez', 'https://lh3.googleusercontent.com/a-/12345', '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3'
	WHERE NOT EXISTS (
		SELECT * FROM people WHERE person_id ='596c9ec2-3bf0-4805-a646-890742d270ca'
	);

	INSERT INTO people (person_id, display_name, picture, organization_id)
SELECT '46e04719-94e3-431c-a042-6f0745f71c74', 'Darwin Fish', 'https://lh3.googleusercontent.com/a-/12345', '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3'
	WHERE NOT EXISTS (
		SELECT * FROM people WHERE person_id ='46e04719-94e3-431c-a042-6f0745f71c74'
	);

	INSERT INTO people (person_id, display_name, picture, organization_id)
SELECT '9f2876c0-2ee9-490e-b929-d60b902d0106', 'Wilson Smith', 'https://lh3.googleusercontent.com/a-/12345', '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3'
	WHERE NOT EXISTS (
		SELECT * FROM people WHERE person_id ='9f2876c0-2ee9-490e-b929-d60b902d0106'
	);



COMMIT;

BEGIN;
LOCK TABLE email_addresses IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO email_addresses (email_address_id, email_address, domain, domain_id, person_id)
SELECT 'f7dab009-19cb-43ad-a7e2-d88f0e225e8e', 'sampleemailw@test.miter.co', 'miter.co','a0e2d844-c969-4857-b024-81d789ebb596', 'c50b11ba-fa72-482c-94ee-ad4a73b6a118'
	WHERE NOT EXISTS (
		SELECT * FROM email_addresses WHERE email_address_id ='f7dab009-19cb-43ad-a7e2-d88f0e225e8e'
	);

INSERT INTO email_addresses (email_address_id, email_address, domain, domain_id, person_id)
SELECT '869bcb63-18cd-4c71-a9e2-57cd9ac9bb15', 'sampleemailc@test.miter.co', 'miter.co','a0e2d844-c969-4857-b024-81d789ebb596', '596c9ec2-3bf0-4805-a646-890742d270ca'
	WHERE NOT EXISTS (
		SELECT * FROM email_addresses WHERE email_address_ID ='869bcb63-18cd-4c71-a9e2-57cd9ac9bb15'
	);

	INSERT INTO email_addresses (email_address_id, email_address, domain, domain_id, person_id)
SELECT '62607a75-548a-49b7-9e19-8fd6354e25ea', 'sampleemaildf@test.miter.co', 'miter.co', 'a0e2d844-c969-4857-b024-81d789ebb596', '46e04719-94e3-431c-a042-6f0745f71c74'
	WHERE NOT EXISTS (
		SELECT * FROM email_addresses WHERE email_address_id ='62607a75-548a-49b7-9e19-8fd6354e25ea'
	);

INSERT INTO email_addresses (email_address_id, email_address, domain, domain_id, person_id)
SELECT '9cd083f0-c1df-41ab-8016-ddd91c365115', 'sampleemaildw@test.miter.co', 'miter.co', 'a0e2d844-c969-4857-b024-81d789ebb596', '9f2876c0-2ee9-490e-b929-d60b902d0106'
	WHERE NOT EXISTS (
		SELECT * FROM email_addresses WHERE email_address_ID ='9cd083f0-c1df-41ab-8016-ddd91c365115'
	);

COMMIT;


BEGIN;

LOCK TABLE people IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO people (person_id, display_name, picture, organization_id)
SELECT '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3',  'First Last', 'https://lh3.googleusercontent.com/a-/12345',  '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3'
	WHERE NOT EXISTS (
		SELECT * FROM people WHERE person_id='7e10bb4a-ddcb-4c54-9e85-b522cf393ce3'
	);

LOCK TABLE email_addresses IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO email_addresses (email_address_id, email_address, domain, domain_id, person_id)
SELECT  'efed2c50-530e-4d05-bf55-fa08a89d0f90', 'test@test.miter.co', 'miter.co', 'a0e2d844-c969-4857-b024-81d789ebb596','7e10bb4a-ddcb-4c54-9e85-b522cf393ce3'
	WHERE NOT EXISTS (
		SELECT * FROM email_addresses WHERE email_address_id ='efed2c50-530e-4d05-bf55-fa08a89d0f90'
	);

	LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE;
	INSERT INTO users ( user_id, organization_id, person_id, service_id, login_email, display_name, first_name, last_name, gcal_push_channel, gcal_resource_id, gcal_sync_token, picture, sign_up_product_surface)
SELECT '993093f1-76af-4abb-9bdd-72dfe9ba7b8f',  '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3',  '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3', '104169948880648460000', 'test@test.miter.co', 'First Last', 'First', 'Last',
'993093f1-76af-4abb-9bdd-72dfe9ba7b8f', 'ret08u3rv24htgh289g', 'CPDAlvWDx70CEPDAlvWDx70CGAU', 'https://lh3.googleusercontent.com/a-/12345', 'ChromeExtension'

	WHERE NOT EXISTS (
		SELECT * FROM users where login_email = 'test@test.miter.co'
	);

COMMIT;

BEGIN;
LOCK TABLE meetings IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO meetings (meeting_id, subject, goal, start_datetime, end_datetime)
	SELECT '1e77370b-535b-4955-96b1-64fe3ebe1580','Miter Test - 1st Meeting', 'Test Miter','2020-08-18 14:00:00',  '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM meetings WHERE meeting_id = '1e77370b-535b-4955-96b1-64fe3ebe1580'
	);
COMMIT;

BEGIN;
LOCK TABLE meetings IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO meetings (meeting_id,  subject, goal, start_datetime, end_datetime)
	SELECT '1e77370b-535b-4955-96b1-64fe3ebe1581', 'Miter Test - 2nd Meeting', 'Test Miter','2020-08-19 14:00:00',  '2020-08-19 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM meetings WHERE meeting_id = '1e77370b-535b-4955-96b1-64fe3ebe1581'
	);
COMMIT;

BEGIN;
LOCK TABLE meetings IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO meetings (meeting_id,  subject, goal, start_datetime, end_datetime)
	SELECT '829f99b8-e398-436b-8552-8ee778def54b',
    'Miter Test', 'Test Miter', '2020-08-18 14:00:00',  '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM meetings WHERE meeting_id='829f99b8-e398-436b-8552-8ee778def54b'
	);
COMMIT;

BEGIN;
LOCK TABLE calendar_events IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO calendar_events (calendar_event_id, meeting_id,  user_id, service_id, title, subject, goal, start_date, start_time, end_date, end_time)
	SELECT 'eaa0e3b3-ca77-457c-9fa5-55d36c11191f', '1e77370b-535b-4955-96b1-64fe3ebe1580', '993093f1-76af-4abb-9bdd-72dfe9ba7b8f', '98ef77e9g5e95978esr5789esr987s9r785798rs5978r57e59sr78h5ve7rs8',
    'Miter Test', 'Miter Test', 'Test Miter', '2020-08-18', '2020-08-18 14:00:00', '2020-08-18', '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM calendar_events WHERE service_id='98ef77e9g5e95978esr5789esr987s9r785798rs5978r57e59sr78h5ve7rs8'
	);
COMMIT;

BEGIN;
LOCK TABLE calendar_events IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO calendar_events (calendar_event_id, meeting_id, user_id, service_id, title, subject, goal, start_date, start_time, end_date, end_time)
	SELECT 'faa0e3b3-ca77-457c-9fa5-55d36c11191f', '1e77370b-535b-4955-96b1-64fe3ebe1581','993093f1-76af-4abb-9bdd-72dfe9ba7b8f','fake98s7ewfn98s478e48797e84897ve9s8975nes45789es589nes9ns98',
    'Miter Test', 'Miter Test', 'Test Miter', '2020-08-18', '2020-08-18 14:00:00', '2020-08-18', '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM calendar_events WHERE service_id='fake98s7ewfn98s478e48797e84897ve9s8975nes45789es589nes9ns98'
	);
COMMIT;



BEGIN;
LOCK TABLE calendar_events IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO calendar_events (calendar_event_id, meeting_id, user_id, service_id, title, subject, goal, start_date, start_time, end_date, end_time)
	SELECT 'BB2daf96-1382-49a0-b6e9-d7a7e6adfd5f', '829f99b8-e398-436b-8552-8ee778def54b', '993093f1-76af-4abb-9bdd-72dfe9ba7b8f','fake8dgr95797rd597h597h589h79r8d987hrdd98579875hd5798h78g95789',
    'Miter Test', 'Miter Test', 'Test Miter', '2020-08-18', '2020-08-18 14:00:00', '2020-08-18', '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM calendar_events WHERE service_id='fake8dgr95797rd597h597h589h79r8d987hrdd98579875hd5798h78g95789'
	);
COMMIT;



BEGIN;
LOCK TABLE notes IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO notes (notes_id,  meeting_id, note_text)
	SELECT 'BBBBaf96-1382-49a0-b6e9-d7a7e6adfd5f', '829f99b8-e398-436b-8552-8ee778def54b', 'This is a note (1/2)'
	WHERE NOT EXISTS (
		SELECT * FROM notes WHERE notes_id = 'BBBBaf96-1382-49a0-b6e9-d7a7e6adfd5f'
	);
COMMIT;

BEGIN;
LOCK TABLE notes IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO notes (notes_id,meeting_id, note_text)
	SELECT 'BBBBBf96-1382-49a0-b6e9-d7a7e6adfd5f', '829f99b8-e398-436b-8552-8ee778def54b', 'This is a note (2/2)'
	WHERE NOT EXISTS (
		SELECT * FROM notes WHERE notes_id = 'BBBBBf96-1382-49a0-b6e9-d7a7e6adfd5f'
	);
COMMIT;


BEGIN;
LOCK TABLE topics in SHARE ROW EXCLUSIVE MODE;
INSERT INTO topics (topic_id, meeting_id, topic_text, topic_order)
SELECT '3a738519-fc32-4b61-8732-42fbd5caf67d', '1e77370b-535b-4955-96b1-64fe3ebe1580', 'Test Topic 1',  '1.1'
	WHERE NOT EXISTS (
		SELECT * FROM topics where meeting_id = '3a738519-fc32-4b61-8732-42fbd5caf67d'
	);
INSERT INTO topics (topic_id, meeting_id, topic_text,  topic_order)
SELECT 	 '330da00c-1ddd-42fa-b505-bfdc2f7ce0e2', '1e77370b-535b-4955-96b1-64fe3ebe1580', 'Test Topic 2',  '2'
	WHERE NOT EXISTS (
		SELECT * FROM topics where meeting_id = '330da00c-1ddd-42fa-b505-bfdc2f7ce0e2'
	);

INSERT INTO topics (topic_id,  meeting_id, topic_text,  topic_order)
SELECT 	'e030f9d9-bc7a-4e9b-b9f3-d086ce3f92d5' , '1e77370b-535b-4955-96b1-64fe3ebe1580', 'Test Topic 3',   '12345'
	WHERE NOT EXISTS (
		SELECT * FROM topics where meeting_id = 'e030f9d9-bc7a-4e9b-b9f3-d086ce3f92d5'
	);
COMMIT;

BEGIN;
LOCK TABLE notes IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO notes (notes_id, topic_id, meeting_id, note_text)
	SELECT 'cc2daf96-1382-49a0-b6e9-d7a7e6adfd5f', '3a738519-fc32-4b61-8732-42fbd5caf67d', '1e77370b-535b-4955-96b1-64fe3ebe1580', 'This is a note'
	WHERE NOT EXISTS (
		SELECT * FROM notes WHERE notes_id = 'cc2daf96-1382-49a0-b6e9-d7a7e6adfd5f'
	);
COMMIT;

BEGIN;
LOCK TABLE notes IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO notes (notes_id, meeting_id,  note_text)
	SELECT 'cc2daf96-1382-49a0-b6e9-d7a7e6adfd6f', '1e77370b-535b-4955-96b1-64fe3ebe1580', 'This is a note'
	WHERE NOT EXISTS (
		SELECT * FROM notes WHERE notes_id = 'cc2daf96-1382-49a0-b6e9-d7a7e6adfd6f'
	);
COMMIT;


BEGIN;
LOCK TABLE summary_items IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO summary_items (summary_item_id, topic_id, meeting_id, note_id, item_text, item_type, item_timestamp)
	SELECT '0213b5ec-b3d5-44d9-b64f-4adbfa7b66ae','3a738519-fc32-4b61-8732-42fbd5caf67d', '1e77370b-535b-4955-96b1-64fe3ebe1580', 'cc2daf96-1382-49a0-b6e9-d7a7e6adfd5f','Test Miter - Decision', 'Decision', '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM summary_items WHERE summary_item_id = '0213b5ec-b3d5-44d9-b64f-4adbfa7b66ae'
	);
COMMIT;

BEGIN;
LOCK TABLE summary_items IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO summary_items (summary_item_id, topic_id, meeting_id, note_id, item_text, item_type, item_timestamp, item_owner_id)
	SELECT '0213b5ec-b3d5-44d9-b64f-4adbfa7b66a2', '330da00c-1ddd-42fa-b505-bfdc2f7ce0e2', '1e77370b-535b-4955-96b1-64fe3ebe1580', null,'Test Miter - Task 1', 'Task', '2020-08-18 15:00:00', 'c50b11ba-fa72-482c-94ee-ad4a73b6a118'
	WHERE NOT EXISTS (
		SELECT * FROM summary_items WHERE summary_item_id = '0213b5ec-b3d5-44d9-b64f-4adbfa7b66a2'
	);
COMMIT;

BEGIN;
LOCK TABLE summary_items IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO summary_items (summary_item_id, topic_id,  meeting_id, note_id, item_text, item_type, item_timestamp)
	SELECT '0213b5ec-b3d5-44d9-b64f-4adbfa7b66a3', '330da00c-1ddd-42fa-b505-bfdc2f7ce0e2','1e77370b-535b-4955-96b1-64fe3ebe1580', null,'Test Miter - Pin 1', 'Pin', '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM summary_items WHERE summary_item_id = '0213b5ec-b3d5-44d9-b64f-4adbfa7b66a3'
	);
COMMIT;

BEGIN;
LOCK TABLE summary_items IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO summary_items (summary_item_id, meeting_id, note_id, item_text, item_type, item_timestamp)
	SELECT '0213b5ec-b3d5-44d9-b64f-4adbfa7b66a4', '1e77370b-535b-4955-96b1-64fe3ebe1580', null,'Test Miter - Pin 2', 'Pin', '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM summary_items WHERE summary_item_id = '0213b5ec-b3d5-44d9-b64f-4adbfa7b66a4'
	);
COMMIT;




BEGIN;
LOCK TABLE summary_items IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO summary_items (summary_item_id, meeting_id, note_id, item_text, item_type, item_timestamp)
	SELECT '0213b5ec-b3d5-44d9-b64f-4adbfa7b66bf', '1e77370b-535b-4955-96b1-64fe3ebe1581', 'cc2daf96-1382-49a0-b6e9-d7a7e6adfd6f','Test Miter - Decision', 'Decision', '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM summary_items WHERE summary_item_id = '0213b5ec-b3d5-44d9-b64f-4adbfa7b66bf'
	);
COMMIT;

BEGIN;
LOCK TABLE summary_items IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO summary_items (summary_item_id, meeting_id, note_id, item_text, item_type, item_timestamp, item_owner_id)
	SELECT '0213b5ec-b3d5-44d9-b64f-4adbfa7b66b2', '1e77370b-535b-4955-96b1-64fe3ebe1581', null,'Test Miter - Task 1', 'Task', '2020-08-18 15:00:00', '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3'
	WHERE NOT EXISTS (
		SELECT * FROM summary_items WHERE summary_item_id = '0213b5ec-b3d5-44d9-b64f-4adbfa7b66b2'
	);
COMMIT;

BEGIN;
LOCK TABLE summary_items IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO summary_items (summary_item_id, meeting_id, note_id, item_text, item_type, item_timestamp)
	SELECT '0213b5ec-b3d5-44d9-b64f-4adbfa7b66b3', '1e77370b-535b-4955-96b1-64fe3ebe1581', null,'Test Miter - Pin 1', 'Pin', '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM summary_items WHERE summary_item_id = '0213b5ec-b3d5-44d9-b64f-4adbfa7b66b3'
	);
COMMIT;

BEGIN;
LOCK TABLE summary_items IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO summary_items (summary_item_id, meeting_id, note_id, item_text, item_type, item_timestamp)
	SELECT '0213b5ec-b3d5-44d9-b64f-4adbfa7b66b4', '1e77370b-535b-4955-96b1-64fe3ebe1581', null,'Test Miter - Pin 2', 'Pin', '2020-08-18 15:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM summary_items WHERE summary_item_id = '0213b5ec-b3d5-44d9-b64f-4adbfa7b66b4'
	);
COMMIT;

BEGIN;
LOCK TABLE meeting_tokens in SHARE ROW EXCLUSIVE MODE;
INSERT INTO meeting_tokens (meeting_token_id, meeting_id, token_value, expiration_date)
SELECT 'a48031d0-57cf-4de4-ae14-8feead4a5a5f', '1e77370b-535b-4955-96b1-64fe3ebe1581', 'VALIDTESTTOKEN', '1/1/2300'
WHERE NOT EXISTS (
	SELECT * FROM meeting_tokens WHERE meeting_token_id = 'a48031d0-57cf-4de4-ae14-8feead4a5a5f'
);
COMMIT;

BEGIN;
LOCK TABLE meeting_tokens in SHARE ROW EXCLUSIVE MODE;
INSERT INTO meeting_tokens (meeting_token_id, meeting_id, token_value, expiration_date)
SELECT '3BE9A47E-ABC8-4A9A-BB80-F4871A8E9904', '1e77370b-535b-4955-96b1-64fe3ebe1580', 'ANOTHERVALIDTESTTOKEN', '1/1/2300'
WHERE NOT EXISTS (
	SELECT * FROM meeting_tokens WHERE meeting_token_id = '3BE9A47E-ABC8-4A9A-BB80-F4871A8E9904'
);
COMMIT;

BEGIN;
LOCK TABLE meeting_tokens in SHARE ROW EXCLUSIVE MODE;
INSERT INTO meeting_tokens (meeting_token_id, meeting_id, token_value, expiration_date)
SELECT 'a48031d0-57cf-4de4-ae14-8feead4a5a5f', '1e77370b-535b-4955-96b1-64fe3ebe1581', 'EXPIREDTESTTOKEN', '1/1/2000'
WHERE NOT EXISTS (
	SELECT * FROM meeting_tokens WHERE meeting_token_id = 'a48031d0-57cf-4de4-ae14-8feead4a5a5f'
);
COMMIT;





BEGIN;
LOCK TABLE calendar_event_people IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO calendar_event_people ( calendar_event_person_id, calendar_event_id, person_id, person_email_id, response_status, optional)
SELECT 'e4cb515e-8f99-40e2-8cfa-4bc429e7fc33','eaa0e3b3-ca77-457c-9fa5-55d36c11191f', 'c50b11ba-fa72-482c-94ee-ad4a73b6a118', 'f7dab009-19cb-43ad-a7e2-d88f0e225e8e', 'Accepted', 'False'
	WHERE NOT EXISTS (
		SELECT * FROM calendar_event_people where calendar_event_person_id = 'e4cb515e-8f99-40e2-8cfa-4bc429e7fc33'
	);
INSERT INTO calendar_event_people (calendar_event_person_id, calendar_event_id, person_id, person_email_id, response_status, optional)
SELECT '696c9ec2-3bf0-4805-a646-890742d270ca','eaa0e3b3-ca77-457c-9fa5-55d36c11191f', '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3', 'efed2c50-530e-4d05-bf55-fa08a89d0f90', 'Accepted', 'False'
	WHERE NOT EXISTS (
		SELECT * FROM calendar_event_people where calendar_event_person_id = '696c9ec2-3bf0-4805-a646-890742d270ca'
	);

	INSERT INTO calendar_event_people ( calendar_event_id, person_id, person_email_id, response_status, optional)
SELECT 'faa0e3b3-ca77-457c-9fa5-55d36c11191f', '46e04719-94e3-431c-a042-6f0745f71c74', '62607a75-548a-49b7-9e19-8fd6354e25ea', 'Accepted', 'False'
	WHERE NOT EXISTS (
		SELECT * FROM calendar_event_people where calendar_event_person_id = 'faa0e3b3-ca77-457c-9fa5-55d36c11191f'
	);
INSERT INTO calendar_event_people ( calendar_event_id, person_id, person_email_id, response_status, optional)
SELECT 'faa0e3b3-ca77-457c-9fa5-55d36c11191f', '9f2876c0-2ee9-490e-b929-d60b902d0106', '9cd083f0-c1df-41ab-8016-ddd91c365115', 'Accepted', 'False'
	WHERE NOT EXISTS (
		SELECT * FROM calendar_event_people where calendar_event_person_id = 'faa0e3b3-ca77-457c-9fa5-55d36c11191f'
	);
INSERT INTO calendar_event_people (calendar_event_person_id, calendar_event_id, person_id, person_email_id, response_status, optional)
SELECT '7d68289c-bb2b-420a-94d5-af93c306d450', 'eaa0e3b3-ca77-457c-9fa5-55d36c11191f', '9f2876c0-2ee9-490e-b929-d60b902d0106', '9cd083f0-c1df-41ab-8016-ddd91c365115', 'Accepted', 'False'
	WHERE NOT EXISTS (
		SELECT * FROM calendar_event_people where calendar_event_person_id = '7d68289c-bb2b-420a-94d5-af93c306d450'
	);


COMMIT;

BEGIN;

LOCK TABLE people IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO people (person_id, display_name, picture, organization_id)
SELECT '9dea0517-3ef1-45ff-9cfa-cef1eb59504e', 'Ross Rossson', 'https://lh3.googleusercontent.com/a-/12345', '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3'
WHERE NOT EXISTS  (
SELECT * FROM people WHERE person_id = '9dea0517-3ef1-45ff-9cfa-cef1eb59504e'
);

LOCK TABLE email_addresses IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO email_addresses (email_address_id, person_id, email_address, domain, domain_id)
SELECT  '459cf5fc-b034-4dd7-8e70-ff99dba819b9', '9dea0517-3ef1-45ff-9cfa-cef1eb59504e', 'test.fake@test.miter.co', 'miter.co', 'a0e2d844-c969-4857-b024-81d789ebb596'
WHERE NOT EXISTS  (
SELECT * FROM email_addresses WHERE email_address_id = '459cf5fc-b034-4dd7-8e70-ff99dba819b9'
);

LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO users ( user_id, organization_id,  person_id, service_id, login_email, display_name, first_name, last_name,
 gcal_push_channel, gcal_resource_id, gcal_sync_token, picture, tokens )
SELECT '3ae53462-70b2-46da-a62e-27ec9b12efbf', '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3', '9dea0517-3ef1-45ff-9cfa-cef1eb59504e', '123456789012345678901', 'test.fake@test.miter.co', 'Ross Rossson', 'Ross', 'Rossson',
null, null, null , 'https://lh3.googleusercontent.com/a-/12345','{"access_token":"uwe4fwkefn4uei47esilus7n4n3897nvs389nvso957vn57s45ns3489598nvs3489v7o97nv5o59578nn59v9sn57987n","refresh_token":"98aw37498answ34978w3a7n4938aw7n7w987nw789wan344879n34789nwa9834n987n4","scope":"https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly openid","token_type":"Bearer","id_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6ImQzZmZiYjhhZGUwMWJiNGZhMmYyNWNmYjEwOGNjZWI4ODM0MDZkYWMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyNDM4Nzk2OTAxNDUtdDNodDZwcHVkbWh0NDR0NDljM2Vobjg1dmQ1MjhnNHUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyNDM4Nzk2OTAxNDUtdDNodDZwcHVkbWh0NDR0NDljM2Vobjg1dmQ1MjhnNHUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDkzNTk2MzQwMDgyMzQ4OTcxNjUiLCJoZCI6Im1pdGVyLmNvIiwiZW1haWwiOiJ0ZXN0LnphbWJvbmlAbWl0ZXIuY28iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6InFQbzlMaWhXUmdTcHVkNUpzbGxyemciLCJuYW1lIjoiVGVzcyBUZXN0c29uIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdnaVl5SEkzbVpJaUs3RHhuUVlkeFM2QjEtZmJjUS1XaVhsQk9PMj1zOTYtYyIsImdpdmVuX25hbWUiOiJUZXNzIiwiZmFtaWx5X25hbWUiOiJUZXN0c29uIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE2MjEzODEyNTAsImV4cCI6MTYyMTM4NDg1MH0.toXIGd8Kp5MYtV9vnyqvHqV1gsJuaiUh1U896MEeqXBNiv-cqI_oLowgGnxkyY7Jmw1coqjINN6u9agIijX0JHiSyUowOK5B6vs9jFkPxJKMiHxyS9wTSb0wEOx1hxGYO9BrghkmX-2O4MFBM1Lu9yzll3nJHKGi-ZTNLtmM0zAp_dDyFJn5tJv4bIN6aDHH6jwo99MgK9qJe_sWPvoIgMXEJa6nQlAzSQS_s4ckgXAX4wiBiX4os5h-I1X8O0eQo24yOUhYZ61G-IeHUfI04bG-d8AqVo0dS83SV7HcShrZhoYiyvOmNWfL3qFCFjnV-m_hLCWF_oLGwaGqF9nrhw","expiry_date":1621384847424}'
	WHERE NOT EXISTS (
		SELECT * FROM users where login_email = 'test.fake@test.miter.co'
	);

	LOCK TABLE meeting_series in SHARE ROW EXCLUSIVE MODE;
INSERT INTO meeting_series (meeting_series_id, series_title)
SELECT '35c297c5-bacf-4e11-bfcc-89ead277b775', 'Recurring Meeting Series'
WHERE NOT EXISTS
	(SELECT * FROM meeting_series where meeting_series_id = '35c297c5-bacf-4e11-bfcc-89ead277b775');

LOCK TABLE meetings in SHARE ROW EXCLUSIVE MODE;
INSERT INTO meetings (meeting_id, meeting_series_id, subject, goal, start_datetime, end_datetime)
select   'ce126ef0-ad98-4d37-b6dd-d241929c4ae7', '35c297c5-bacf-4e11-bfcc-89ead277b775','Initial Recurring Foo', 'Initial Recurring Foo',  '2021-05-10 15:00:00', '2020-05-10 16:00:00'
where not exists  (
	SELECT * FROM meetings where meeting_id = 'ce126ef0-ad98-4d37-b6dd-d241929c4ae7'
);

LOCK TABLE meetings in SHARE ROW EXCLUSIVE MODE;
INSERT INTO meetings (meeting_id, meeting_series_id, subject, goal, start_datetime, end_datetime, is_first_meeting_in_series)
select   'bd205823-61b3-4904-92d4-ca9aef70ab22' ,'35c297c5-bacf-4e11-bfcc-89ead277b775','2nd Recurring Foo', '2nd Recurring Foo',  '2021-05-10 15:00:00', '2020-05-10 16:00:00', false
where not exists  (
	SELECT * FROM meetings where meeting_id = 'bd205823-61b3-4904-92d4-ca9aef70ab22'
);



LOCK TABLE recurring_calendar_events in SHARE ROW EXCLUSIVE MODE;
INSERT INTO recurring_calendar_events (recurring_calendar_event_id, meeting_series_id, service_id, start_date, end_date)
SELECT 'e09e8a4d-753e-4722-82ee-63f489ee5877', '35c297c5-bacf-4e11-bfcc-89ead277b775', 'fake98wa7498w7hc987w48c8a7h498wahc984e94wa9h8749a49c84h978h49',
	'2020-08-18', '2020-08-18'
	WHERE NOT EXISTS (
		SELECT * FROM recurring_calendar_events WHERE service_id = 'fake90esw8479se487v8e79v89nes897nsv789789e5789rnvresv5897vn55nv7n'
	);

LOCK TABLE calendar_events IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO calendar_events (calendar_event_id, meeting_id, recurring_calendar_event_id, user_id, service_id, title, subject, goal, start_date, start_time, end_date, end_time)
	SELECT 'e09e8a4d-753e-4722-82ee-63f489ee5877',  'ce126ef0-ad98-4d37-b6dd-d241929c4ae7', 'e09e8a4d-753e-4722-82ee-63f489ee5877', '3ae53462-70b2-46da-a62e-27ec9b12efbf', 'fake934875dfhdfhdfkjghdfjghfdj',
    'Initial Recurring Foo', 'Initial Recurring Foo', 'Initial Recurring Foo', null, '2021-05-10 15:00:00', null, '2020-08-18 16:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM calendar_events WHERE service_id='fake934875dfhdfhdfkjghdfjghfdj'
	);

LOCK TABLE calendar_events IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO calendar_events (calendar_event_id, meeting_id, recurring_calendar_event_id, user_id, service_id, title, subject, goal, start_date, start_time, end_date, end_time)
	SELECT 'a88f13c7-5b94-4011-b52c-7a95824b6b37',  'bd205823-61b3-4904-92d4-ca9aef70ab22', 'e09e8a4d-753e-4722-82ee-63f489ee5877', '3ae53462-70b2-46da-a62e-27ec9b12efbf', 'fake934875dfhdfhdfkjghdfjghfdj_2000000T0000',
    '2nd Recurring Foo', '2nd Recurring Foo', '2nd Recurring Foo', null, '2021-05-17 15:00:00', null, '2020-05-17 16:00:00'
	WHERE NOT EXISTS (
		SELECT * FROM calendar_events WHERE service_id='fake934875dfhdfhdfkjghdfjghfdj_2000000T0000'
	);
COMMIT;

BEGIN;
LOCK TABLE jobs_email IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO jobs_email (job_email_id, job_name, job_type, job_status, send_after_time, meeting_id, job_recipients)
SELECT '8c43f9e5-e8df-4814-afbc-d5ec50294a29', 'Summary_Email', 'Automated', 'NotStarted',   '2021-05-10 15:00:00', '1e77370b-535b-4955-96b1-64fe3ebe1580', '[{"email":"sampleemaildf@test.miter.co", "name":"Darwin"}, {"email":"sampleemailc@test.miter.co"}]'
WHERE NOT EXISTS (
	SELECT * FROM jobs_email WHERE job_email_id = '8c43f9e5-e8df-4814-afbc-d5ec50294a29'
);
COMMIT;


BEGIN;

LOCK TABLE meetings in SHARE ROW EXCLUSIVE MODE;
INSERT INTO meetings (meeting_id,  subject, goal, start_datetime, end_datetime)
SELECT '00757422-fafe-4917-89de-71421b772518', 'Test meeting for item associated people', 'test', '2020-08-18 14:00:00',  '2020-08-18 15:00:00'
WHERE NOT EXISTS (
SELECT * FROM meetings WHERE meeting_id = '00757422-fafe-4917-89de-71421b772518'
);

LOCK TABLE notes IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO notes (notes_id, meeting_id, owner_id, note_type, note_text)
SELECT 'b4eefb30-0c33-440f-bf8c-86122b4a670e', '00757422-fafe-4917-89de-71421b772518', '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3', 'Decision', 'test@test.miter.co'
WHERE NOT EXISTS (
SELECT * FROM notes WHERE notes_id = 'b4eefb30-0c33-440f-bf8c-86122b4a670e'
);

LOCK TABLE summary_items IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO summary_items (summary_item_id, meeting_id, item_type, item_owner_id, note_id, item_text)
SELECT 'a4dcb32a-6b77-48c0-addf-83a2a49d2a01', '00757422-fafe-4917-89de-71421b772518', 'Decision', '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3', 'b4eefb30-0c33-440f-bf8c-86122b4a670e','test@test.miter.co'
WHERE NOT EXISTS (
SELECT * FROM summary_items WHERE summary_item_id = 'a4dcb32a-6b77-48c0-addf-83a2a49d2a01'
);

LOCK TABLE item_associated_people IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO item_associated_people (item_associated_person_id, person_id, person_email_id, note_id, summary_item_id)
SELECT '9a84256a-197b-4427-a380-3f48975e09c4', '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3', 'efed2c50-530e-4d05-bf55-fa08a89d0f90', 'b4eefb30-0c33-440f-bf8c-86122b4a670e', 'a4dcb32a-6b77-48c0-addf-83a2a49d2a01'
WHERE NOT EXISTS (
SELECT * FROM item_associated_people where item_associated_person_id = '9a84256a-197b-4427-a380-3f48975e09c4'
);

COMMIT;

BEGIN;
LOCK TABLE meeting_people IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO meeting_people (meeting_person_id, meeting_id, person_id)
SELECT '5a5ab0ff-9537-4c21-8c36-cc61ba63de61', '1e77370b-535b-4955-96b1-64fe3ebe1580', '9dea0517-3ef1-45ff-9cfa-cef1eb59504e'
WHERE NOT EXISTS (
	SELECT * FROM meeting_people WHERE meeting_person_id = '5a5ab0ff-9537-4c21-8c36-cc61ba63de61'
);

LOCK TABLE meeting_people IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO meeting_people (meeting_person_id, meeting_id, person_id)
SELECT '5a5ab0ff-9537-4c21-8c36-cc61ba63de62', '1e77370b-535b-4955-96b1-64fe3ebe1581', '9dea0517-3ef1-45ff-9cfa-cef1eb59504e'
WHERE NOT EXISTS (
	SELECT * FROM meeting_people WHERE meeting_person_id = '5a5ab0ff-9537-4c21-8c36-cc61ba63de62'
);

COMMIT;


----------------------------------- ZOOM INTEGRATION DATA ------------------------------------------


-- Insert Zoom person
BEGIN;
LOCK TABLE people in SHARE ROW EXCLUSIVE MODE;
INSERT INTO people (person_id, organization_id, display_name, picture)
SELECT
    '4c132e0e-e8ee-42c3-a47b-468cf81e4c8e',  -- Person ID
		 '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3', -- Organization ID
    'Zoom User',  -- Display name
    'https://lh3.googleusercontent.com/a-/12345'  -- Picture URL
WHERE NOT EXISTS  (
    SELECT * FROM people WHERE person_id = '4c132e0e-e8ee-42c3-a47b-468cf81e4c8e'
);

-- Insert Zoom user
LOCK TABLE users in SHARE ROW EXCLUSIVE MODE;
INSERT INTO users (
    user_id, organization_id, person_id, zoom_user_id, login_email, display_name, first_name, last_name, picture
)
SELECT
    '746f7ff7-f198-429c-bdbe-638812b89878',  -- User ID
		 '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3', -- Organization ID
    '4c132e0e-e8ee-42c3-a47b-468cf81e4c8e',  -- Person ID
    '1de4a41d-9fcf-43a3-8e1d-cb12d316dce1',  -- Zoom user ID.
    'zoom-user@test.miter.co',  -- Login Email
    'Zoom User',  -- Display name
    'Zoom',  -- First name
    'User',  -- Last name
    'https://lh3.googleusercontent.com/a-/12345'  -- Picture URL
WHERE NOT EXISTS (
    SELECT * FROM users where login_email = 'zoom-user@test.miter.co'
);

-- Insert Zoom meeting
LOCK TABLE meetings in SHARE ROW EXCLUSIVE MODE;
INSERT INTO meetings (meeting_id, subject, goal, zoom_meeting_id, start_datetime, end_datetime)
SELECT
    'b98fb173-3214-4915-a357-ed091a257046',  -- Meeting ID
    'Zoom Meeting',  -- Meeting subject
    'Test Zoom',  -- Goal
    'cac994dd-98e3-4931-b48f-cbd9b76bf9ef',  -- Zoom meeting ID
    '2020-08-18 14:00:00',  -- Start time
    '2020-08-18 15:00:00'  -- End time
WHERE NOT EXISTS (
    SELECT * FROM meetings WHERE meeting_id = 'b98fb173-3214-4915-a357-ed091a257046'
);

COMMIT;


------------------------------------------- PROTOCOL: ASK A QUESTION ---------------------------------------------------

BEGIN;

INSERT INTO public.protocol_types (id, name, description, data)
VALUES ('21cabdf2-23a0-42f0-951c-26f0cb5d6c87', 'Ask Everyone', '', '{}');

INSERT INTO public.protocol_phases (id, protocol_type_id, index, name, description, type, is_collective, data)
VALUES (
  'ba9e86d2-aba7-4be6-817d-54c6b7d45fc9',
  '21cabdf2-23a0-42f0-951c-26f0cb5d6c87',
  0,
  'Respond',
  'Answer this question while your teammates do the same. You''ll compare notes in the next step',
  'SingleResponse',
  false,
  '{"userActivityLabel": "typing"}'
 );

INSERT INTO public.protocol_phases (id, protocol_type_id, index, name, description, type, is_collective, data)
VALUES (
  'faa5e134-17b9-4082-87d9-f548e8871464',
  '21cabdf2-23a0-42f0-951c-26f0cb5d6c87',
  1,
  'Discuss',
  'Here are the results! Take a moment to discuss before moving on.',
  'ContentList',
  true,
  '{}'
 );

COMMIT;

------------------------------------------- PROTOCOL: PRIORITIZE ---------------------------------------------------
BEGIN;

INSERT INTO public.protocol_types (id, name, description, data)
VALUES ('1802d609-c39f-4e67-893d-fcc219abf5bc', 'Prioritize', '', '{}');

INSERT INTO public.protocol_phases (id, protocol_type_id, index, name, description, type, is_collective, data)
VALUES (
  '81ff7a03-42af-45da-aae4-2b36fc58c585',
  '1802d609-c39f-4e67-893d-fcc219abf5bc',
  0,
  'Collect',
  'First, add the options you want to consider as a team.',
  'MultipleResponses',
  true,
  '{"userActivityLabel": "typing", "minItems": 3}'
 );

INSERT INTO public.protocol_phases (id, protocol_type_id, index, name, description, type, is_collective, data)
VALUES (
  'a1f93c89-3ef1-4a22-bbe5-8fbbb330368d',
  '1802d609-c39f-4e67-893d-fcc219abf5bc',
  1,
  'Vote',
  'Here are the results! Take a moment to discuss before moving on.',
  'VoteOnContentList',
  true,
  '{"userActivityLabel": "voting"}'
 );

INSERT INTO public.protocol_phases (id, protocol_type_id, index, name, description, type, is_collective, data)
VALUES (
  '46ec720c-cc98-4360-989d-480c6df78c8a',
  '1802d609-c39f-4e67-893d-fcc219abf5bc',
  2,
  'Discuss',
  'Here are the results! It’s OK to make changes—anyone can click to reprioritize as you discuss.',
  'ReviewVoteResults',
  true,
  '{}'
 );

COMMIT;

------------------------------------------- PROTOCOL: BRAINSTORM -------------------------------------------------------
BEGIN;

INSERT INTO public.protocol_types (id, name, description, data)
VALUES ('3044c44e-e512-43e0-b9bb-dd76360c674b', 'Brainstorm', '', '{}');

INSERT INTO public.protocol_phases (id, protocol_type_id, index, name, description, type, is_collective, data)
VALUES (
  '7a4517a0-a7fa-491f-acbd-717758675630',
  '3044c44e-e512-43e0-b9bb-dd76360c674b',
  0,
  'Collect',
  'Add as many ideas as possible. It’s OK if they’re not all great: quantity over quality for now.',
  'SoloMultipleResponses',
  false,
  '{"userActivityLabel": "ideating"}'
 );

INSERT INTO public.protocol_phases (id, protocol_type_id, index, name, description, type, is_collective, data)
VALUES (
  '21a8f8be-409a-4da0-a93d-4bf1809b4f58',
  '3044c44e-e512-43e0-b9bb-dd76360c674b',
  1,
  'Review',
  'Time for everyone to talk through their ideas—just go around the room in this order:',
  'UserContentList',
  true,
  '{}'
 );

INSERT INTO public.protocol_phases (id, protocol_type_id, index, name, description, type, is_collective, data)
VALUES (
  '51a60db2-7d5c-4293-bb38-a2fac11fa5a4',
  '3044c44e-e512-43e0-b9bb-dd76360c674b',
  2,
  'Organize',
  'Click the star to favorite an idea. Drag ideas together to combine them. All together now!',
  'OrganizeContentList',
  true,
  '{}'
 );

COMMIT;

BEGIN;
LOCK TABLE meetings in SHARE ROW EXCLUSIVE MODE;
INSERT INTO meetings (meeting_id, subject, goal, start_datetime, end_datetime, is_template)
SELECT
'3183c778-4642-462b-a5b6-14756c1220b9', --  Meeting ID,
'Meeting Template', -- Template Subject
'Here for the copying', -- goal
   '2020-08-18 14:00:00',  -- Start time
    '2020-08-18 15:00:00',  -- End time
		true  -- is_template
WHERE NOT EXISTS (
	SELECT * FROM meetings WHERE meeting_id = '3183c778-4642-462b-a5b6-14756c1220b9'
);

LOCK TABLE topics in SHARE ROW EXCLUSIVE MODE;
INSERT INTO topics (topic_id, meeting_id, topic_text, topic_order)
SELECT 'd3777223-a89c-44a1-b142-65ff5ea47d5f', '3183c778-4642-462b-a5b6-14756c1220b9', 'Test Topic 1',  '1.1'
WHERE NOT EXISTS (
	SELECT * FROM topics WHERE topic_id = 'd3777223-a89c-44a1-b142-65ff5ea47d5f'
);

INSERT INTO topics (topic_id, meeting_id, topic_text,  topic_order)
SELECT '06370c3a-0c67-4681-9814-e68988b64750', '3183c778-4642-462b-a5b6-14756c1220b9', 'Test Topic 2',  '2'
WHERE NOT EXISTS (
	SELECT * FROM topics WHERE topic_id = '06370c3a-0c67-4681-9814-e68988b64750'
);


INSERT INTO topics (topic_id, meeting_id, topic_text,  topic_order)
SELECT 'c5a164dd-0b18-4911-8368-1209621309d5', '3183c778-4642-462b-a5b6-14756c1220b9' , 'Test Topic 3',   '12345'
WHERE NOT EXISTS (
	SELECT * FROM topics WHERE topic_id ='c5a164dd-0b18-4911-8368-1209621309d5'
);


LOCK TABLE notes IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO notes (notes_id, topic_id, meeting_id, note_text)
	SELECT '7d3e7ed5-d83a-425b-bdba-b502d5a1b16c', 'd3777223-a89c-44a1-b142-65ff5ea47d5f', '3183c778-4642-462b-a5b6-14756c1220b9', 'Note 1 on Topic 1'
	WHERE NOT EXISTS (
		SELECT * FROM notes WHERE notes_id = '7d3e7ed5-d83a-425b-bdba-b502d5a1b16c'
	);


	INSERT INTO notes (notes_id, topic_id, meeting_id, note_text)
	SELECT '4d39de7d-ff82-41db-9335-2fd255e9326d', 'd3777223-a89c-44a1-b142-65ff5ea47d5f', '3183c778-4642-462b-a5b6-14756c1220b9', 'Note 2 on Topic 1'
	WHERE NOT EXISTS (
		SELECT * FROM notes WHERE notes_id = '4d39de7d-ff82-41db-9335-2fd255e9326d'
	);


INSERT INTO notes (notes_id, topic_id, meeting_id, note_text)
	SELECT '5545ee40-202c-4c29-a46e-83dfbbe5ee5a', '06370c3a-0c67-4681-9814-e68988b64750', '3183c778-4642-462b-a5b6-14756c1220b9', 'Note 1 on Topic 2'
	WHERE NOT EXISTS (
		SELECT * FROM notes WHERE notes_id = '5545ee40-202c-4c29-a46e-83dfbbe5ee5a'
	);

	INSERT INTO notes (notes_id, topic_id, meeting_id, note_text, note_type)
	SELECT 'ec49cc36-eb2b-4779-b71f-c7304f603df6', 'c5a164dd-0b18-4911-8368-1209621309d5', '3183c778-4642-462b-a5b6-14756c1220b9', 'Note 1 on Topic 3 - Starred', 'Pin'
	WHERE NOT EXISTS (
		SELECT * FROM notes WHERE notes_id = 'ec49cc36-eb2b-4779-b71f-c7304f603df6'
	);


	INSERT INTO notes (notes_id, topic_id, meeting_id, note_text, note_type)
	SELECT  '92f3810d-4b06-451e-960d-d0d0dd52857c', 'c5a164dd-0b18-4911-8368-1209621309d5', '3183c778-4642-462b-a5b6-14756c1220b9', 'Note 2 on Topic 3 - Task', 'Task'
	WHERE NOT EXISTS (
		SELECT * FROM notes WHERE notes_id = '92f3810d-4b06-451e-960d-d0d0dd52857c'
	);


	INSERT INTO notes (notes_id, topic_id, meeting_id, note_text, note_type)
	SELECT   'c6b81217-89bf-4bbf-9575-eb69032e3d3e', 'c5a164dd-0b18-4911-8368-1209621309d5', '3183c778-4642-462b-a5b6-14756c1220b9', 'Note 3 on Topic 3 - Decision', 'Decision'
	WHERE NOT EXISTS (
		SELECT * FROM notes WHERE notes_id = 'c6b81217-89bf-4bbf-9575-eb69032e3d3e'
	);

COMMIT;

BEGIN;

LOCK TABLE meetings IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO meetings (meeting_id, is_template, subject, goal)
SELECT '25627752-49c4-4ca9-af7f-b8aa214bf045', true, 'Sample Miter Meeting', '{"type":"Other","customText":"Demonstrate how to use Miter!"}'
WHERE NOT EXISTS (
	SELECT * FROM meetings WHERE meeting_id = '25627752-49c4-4ca9-af7f-b8aa214bf045'
);

LOCK TABLE topics in SHARE ROW EXCLUSIVE MODE;
INSERT INTO topics (topic_id, meeting_id, topic_text, topic_order)
SELECT '4d2dccbe-4385-4e20-8d53-8ad6822bccf4', '25627752-49c4-4ca9-af7f-b8aa214bf045', 'Topic 1', '1'
WHERE NOT EXISTS (
	SELECT * FROM topics where topic_id = '4d2dccbe-4385-4e20-8d53-8ad6822bccf4'
);

LOCK TABLE notes in SHARE ROW EXCLUSIVE MODE;
INSERT INTO notes (notes_id, meeting_id, topic_id, note_type, note_text)
SELECT '28a13de3-b9e1-410f-93d6-2410db476cd6', '25627752-49c4-4ca9-af7f-b8aa214bf045',  '4d2dccbe-4385-4e20-8d53-8ad6822bccf4', 'Pin', 'Pinned Note'
WHERE NOT EXISTS (
	SELECT * FROM notes WHERE notes_id = '28a13de3-b9e1-410f-93d6-2410db476cd6'
);

LOCK TABLE summary_items IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO summary_items (summary_item_id, meeting_id, topic_id, note_id, item_type, item_text)
SELECT 'e0096451-3cee-4a39-8f44-9656963a1945', '25627752-49c4-4ca9-af7f-b8aa214bf045', '4d2dccbe-4385-4e20-8d53-8ad6822bccf4', '28a13de3-b9e1-410f-93d6-2410db476cd6', 'Pin', 'Pinned Note'
WHERE NOT EXISTS (
		SELECT * FROM summary_items WHERE summary_item_id = 'e0096451-3cee-4a39-8f44-9656963a1945'
);

COMMIT;

BEGIN;
LOCK TABLE google_event_log IN SHARE ROW EXCLUSIVE MODE;

INSERT INTO google_event_log (service_id, user_id, created_by_process, event)
VALUES ('sampleevent', '993093f1-76af-4abb-9bdd-72dfe9ba7b8f', 'Test Data', '"{\"kind\":\"calendar#event\",\"etag\":\"\\\"3301722107092000\\\"\",\"id\":\"sampleevent\",\"status\":\"confirmed\",\"htmlLink\":\"\",\"created\":\"2022-04-25T04:30:53.000Z\",\"updated\":\"2022-04-25T04:30:53.546Z\",\"summary\":\"HOLD for X\",\"creator\":{\"email\":\"test@test.miter.co\",\"self\":true},\"organizer\":{\"email\":\"test@test.miter.co\",\"self\":true},\"start\":{\"dateTime\":\"2022-04-28T15:00:00-07:00\",\"timeZone\":\"America/Los_Angeles\"},\"end\":{\"dateTime\":\"2022-04-28T18:00:00-07:00\",\"timeZone\":\"America/Los_Angeles\"},\"iCalUID\":\"@google.com\",\"sequence\":0,\"guestsCanModify\":true,\"reminders\":{\"useDefault\":true},\"eventType\":\"default\"}"');
COMMIT;

------------------------------------------- PROTOCOL-TYPE CONTENT ------------------------------------------------------
BEGIN;

UPDATE public.protocol_types SET
description = 'As a team, collect and rank your options so you can move forward with just a few.',
data = '{
	"setup": {"placeholder":"What will your team be prioritizing?","label":"Prompt"},
	"config": {"minItemsCount":3,"votesPerUser":3}
}'
WHERE name = 'Prioritize';

UPDATE public.protocol_types SET
description = 'Collect individual answers from everyone simultaneously. Maximize unique perspectives and avoid groupthink.',
data = '{
	"setup": {"placeholder": "What question should everyone answer?", "label": "Prompt" },
	"config": {}
}'
WHERE name = 'Ask Everyone';

UPDATE public.protocol_types SET
description = 'Generate a broad set of ideas, taking advantage of the collective brainpower of your team.',
data = '{
	"setup": {"placeholder": "What should everyone ideate about?", "label": "Prompt" },
	"config": {}
}'
WHERE name = 'Brainstorm';

COMMIT;
