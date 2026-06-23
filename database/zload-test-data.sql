-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

drop table if exists sr.ztmp_uuid_bucket;
create table sr.ztmp_uuid_bucket (
	c_uuid uuid,
	e_uuid uuid,
	t_uuid uuid,
	p_uuid uuid,
	p2_uuid uuid,
	p3_uuid uuid,
	u_uuid uuid,
	u2_uuid uuid,
	u3_uuid uuid
);

truncate table sr.ztmp_uuid_bucket cascade;
truncate table sr.organization cascade;
truncate table sr.user cascade;

insert into sr.ztmp_uuid_bucket (c_uuid, e_uuid, t_uuid, p_uuid, p2_uuid, 
	p3_uuid, u_uuid, u2_uuid, u3_uuid)
select uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), 
uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4();

insert into sr.organization ( 
	organization_uuid, organization_name, organization_status_id, primary_contact_email, street_address_1, 
	street_address_2, city, state_region, postal_code, phone, organization_domain 
)
select c_uuid, 'organization1', 1, 'user2@example.com', '123 Main St',
'Apt 5', 'Merrimack', 'NH', '03054', '(555) 555-0101', 'organization1.com'
from sr.ztmp_uuid_bucket;

-- Another one
insert into sr.organization ( 
	organization_uuid, organization_name, organization_status_id, primary_contact_email, street_address_1, 
	street_address_2, city, state_region, postal_code, phone, organization_domain 
)
select uuid_generate_v4(), 'organization2', 1, 'user2@example.com', '456 Bond St',
'', 'Worcester', 'MA', '01609', '(555) 555-0101', 'organization2.com';

insert into sr.organization ( 
	organization_uuid, organization_name, organization_status_id, primary_contact_email, street_address_1, 
	street_address_2, city, state_region, postal_code, phone, organization_domain
)
select uuid_generate_v4(), 'organization3', 1, 'user1@example.com', '23 1/2 Baker St',
'', 'London', 'CT', '34567', '(555) 555-0101', 'organization3.com';


insert into sr.user ( 
	user_uuid, organization_uuid, email_address, first_name, last_name, phone
)
select u.u_uuid , u.c_uuid, 'user2@example.com', 'Joe', 'Namath', '234-567-8901' from sr.ztmp_uuid_bucket u
union
select u.u2_uuid , u.c_uuid, 'user3@example.com', 'Malik', 'Amir', '123-456-7890' from sr.ztmp_uuid_bucket u
union
select u.u3_uuid , null, 'user4@example.com', null, null, null from sr.ztmp_uuid_bucket u



/*
insert into sr."currency_type" (
	currency_type_name, currency_type_description
) values 
  ('StackBux','StackRef default currency'),
  ('US Dollars','US legal tender'),
  ('AWS-Bucks','$ for resources');



insert into sr.event (
	event_uuid, organization_uuid, event_name, currency_type_id, package_type_id
)
select u.e_uuid , u.c_uuid, 'Event 1', 1, 1
from sr.ztmp_uuid_bucket u


insert into sr.team (
	team_uuid, event_uuid, team_name
)
select u.t_uuid , u.e_uuid, 'Team 1'
from sr.ztmp_uuid_bucket u

insert into sr.participant ( 
	participant_uuid, user_uuid, team_uuid, event_uuid, nickname, participant_type_id
) 
select p_uuid, u_uuid, t_uuid, e_uuid, 'Particpant 1', 1 from sr.ztmp_uuid_bucket 
union
select p2_uuid, u2_uuid, t_uuid, e_uuid, 'Particpant 2', 1 from sr.ztmp_uuid_bucket 
union
select p3_uuid, u3_uuid, t_uuid, e_uuid, 'Particpant 3', 1 from sr.ztmp_uuid_bucket ;
*/










