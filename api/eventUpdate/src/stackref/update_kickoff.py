import boto3
from datetime import datetime, timedelta
import json
import logging

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    format_datetime
        Format various time formats returned from React for PostgreSQL use
'''
def format_datetime(date_time):
    try:
        t = datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%S.%fZ").replace(second=0,microsecond=0)
        return t
    except:
        pass
    try:
        t = datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%S.%f").replace(second=0,microsecond=0)
        return t
    except:
        pass
    try:
        t = datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%S").replace(second=0,microsecond=0)
        return t
    except:
        pass
    try:
        t = datetime.strptime(date_time, "%Y-%m-%d %H:%M:%S.%f").replace(second=0,microsecond=0)
        return t
    except:
        pass
    try:
        t = datetime.strptime(date_time, "%Y-%m-%d %H:%M:%S").replace(second=0,microsecond=0)
        return t
    except:
        pass

    return date_time

'''
    update_kickoff
        Update CloudWatch Event rules with new values
'''
def update_kickoff(payload_json):
    log.info(":: update_kickoff")

    scheduler_client = boto3.client('scheduler')
    
    event_uuid = str(payload_json['event']['event_uuid'])
    organization_uuid = str(payload_json['event']['organization_uuid'])
    event_status_id = int(json.dumps(payload_json['event']['event_status']))

    # Only create/re-create the Kickoff if the Event is in Ready or Running status
    if event_status_id == 2 or event_status_id == 3:
        event_judging_minutes  = int(payload_json['event']['event_judging_minutes'])
        ts_event_start = format_datetime(payload_json['event']['ts_event_start'])
        ts_event_end = format_datetime(payload_json['event']['ts_event_end'])
        ts_event_judging_warn = (ts_event_end + timedelta(minutes=event_judging_minutes)) - timedelta(minutes=10)
        ts_event_judging_end = ts_event_end + timedelta(minutes=event_judging_minutes)

        ts_event_start_warn = ts_event_start - timedelta(minutes=10)
        ts_event_end_warn = ts_event_end - timedelta(minutes=10)

        # yyyy-mm-ddThh:mm:ss
        start_dtm = ts_event_start.strftime('%Y-%m-%d'+'T'+'%H:%M'+':00')
        end_dtm = ts_event_end.strftime('%Y-%m-%d'+'T'+'%H:%M'+':00')
        start_warn_dtm = ts_event_start_warn.strftime('%Y-%m-%d'+'T'+'%H:%M'+':00')
        end_warn_dtm = ts_event_end_warn.strftime('%Y-%m-%d'+'T'+'%H:%M'+':00')
        judging_warn_dtm = ts_event_judging_warn.strftime('%Y-%m-%d'+'T'+'%H:%M'+':00')
        judging_end_dtm = ts_event_judging_end.strftime('%Y-%m-%d'+'T'+'%H:%M'+':00')

        schedules = [
            {'name': 'start', 'at': start_dtm, 'ts': ts_event_start},
            {'name': 'end', 'at': end_dtm, 'ts': ts_event_end},
            {'name': 'start_warn', 'at': start_warn_dtm, 'ts': ts_event_start_warn},
            {'name': 'end_warn', 'at': end_warn_dtm, 'ts': ts_event_end_warn},
            {'name': 'judging_warn', 'at': judging_warn_dtm, 'ts': ts_event_judging_warn},
            {'name': 'judging_end', 'at': judging_end_dtm, 'ts': ts_event_judging_end}
        ]

        for schedule in schedules:
            schedule_name = f"{event_uuid}_sr_event_{schedule['name']}"

            if schedule['ts'] > datetime.now():
                try:
                    target_input = {
                        "action": schedule['name'],
                        "event_uuid": event_uuid,
                        "organization_uuid": organization_uuid
                    }

                    schedule_res = scheduler_client.update_schedule(
                        Name=schedule_name,
                        GroupName=f'sr_event_{event_uuid}',
                        Description=f"Kickoff {schedule['name']} for Event {event_uuid}",
                        ScheduleExpression=f"at({schedule['at']})",
                        ScheduleExpressionTimezone='UTC',
                        FlexibleTimeWindow={
                            'Mode': 'OFF'
                        },
                        State='ENABLED',
                        Target={
                            'Arn': settings.kickoff_fn_arn,
                            'Input': json.dumps(target_input),
                            'RetryPolicy': {
                                'MaximumEventAgeInSeconds': 60,
                                'MaximumRetryAttempts': 10
                            },
                            'RoleArn': settings.kickoff_scheduler_role_arn
                        }
                    )
                except Exception as error:
                    log.error(f'>> update_kickoff: {error}')
                    raise error
