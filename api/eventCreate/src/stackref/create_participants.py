from datetime import datetime
import json
import logging
import uuid

import stackref.settings as settings
from stackref.cache_functions import incr_key_prefix
from stackref.get_org_users import get_org_users

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    create_participants
        Create Event Participants from all Organization Users
'''
def create_participants(organization_uuid, event_uuid):
    log.info(":: create_participants")

    try:
        org_users = get_org_users(organization_uuid)
    except Exception as error:
        log.error(f'>> create_participants: {error}')
        return

    for user_uuid in org_users:
        participant_uuid = uuid.uuid4()

        sql_statement = ("""
            -- Create new Participant for the Event
            WITH s AS (
                SELECT
                    participant_uuid
                FROM
                    sr.participant
                WHERE
                    user_uuid = %(user_uuid)s::UUID
                    AND event_uuid = %(event_uuid)s::UUID
            ),
            i AS (
                INSERT
                    INTO
                        sr.participant (
                            participant_uuid,
                            user_uuid,
                            event_uuid
                        )
                        SELECT
                            %(participant_uuid)s::UUID,
                            %(user_uuid)s::UUID,
                            %(event_uuid)s::UUID
                        WHERE
                            -- User not already in this Event
                            NOT EXISTS (
                                SELECT
                                    participant_uuid AS pid
                                FROM
                                    sr.participant
                                WHERE
                                    user_uuid = %(user_uuid)s::UUID
                                    AND event_uuid = %(event_uuid)s::UUID
                            ) RETURNING participant_uuid
            )
            SELECT
                participant_uuid
            FROM
                i
            UNION ALL
                SELECT
                    participant_uuid
                FROM
                    s;
        """)
        sql_parameters = {
            'participant_uuid': participant_uuid,
            'user_uuid': user_uuid,
            'event_uuid': event_uuid
        }
        log.debug(sql_statement)
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> create_participants: {error}")
            raise error

        if not response or not response[0]:
            payload = ''
        else:
            payload = response[0]
            participant_uuid = str(payload)
            try:
                initial_participant_role(participant_uuid, 2)
            except Exception as error:
                log.error(f'>> create_participant: {error}')

        try:
            incr_key_prefix('participant')
            incr_key_prefix('participant_role_member')
        except:
            log.error('>> incr_key_prefix')

'''
    initial_participant_role
        Update a Participant's roles
'''
def initial_participant_role(participant_uuid, initial_role_id):
    log.info(':: initial_participant_role')

    participant_role_member_uuid = uuid.uuid4()

    sql_statement = (f"""
        -- Add Participant to initial role
        INSERT
            INTO
            sr.participant_role_member (
                participant_role_member_uuid,
                participant_uuid,
                participant_role_id
            )
        VALUES (
            %(participant_role_member_uuid)s::UUID,
            %(participant_uuid)s::UUID,
            %(role_id)s
        );
    """)
    log.info(str(sql_statement))
    sql_parameters = {
        'participant_role_member_uuid': participant_role_member_uuid,
        'participant_uuid': participant_uuid,
        'role_id': int(initial_role_id)
    }
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> assign_cloud_account: {error}")
        raise error

    log.info(f":: initial_participant_role participant_uuid: {participant_uuid}")
