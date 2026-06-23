import elasticache_auto_discovery
import json
from pymemcache.client.hash import HashClient
from pymemcache.exceptions import MemcacheUnexpectedCloseError
from pymemcache.serde import python_memcache_deserializer
from pymemcache.serde import python_memcache_serializer
from random import randint

import logging

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

class JsonSerde(object):
    def serialize(self, key, value):
        if isinstance(value, str):
            return value, 1
        return json.dumps(value), 2

    def deserialize(self, key, value, flags):
        if flags == 1:
            return value
        if flags == 2:
            return json.loads(value)
        raise Exception("Unknown serialization format")

'''
    init_key_prefix
        Initialize/clear the key prefix
'''
def init_key_prefix(table):
    log.debug(':: init_key_prefix')
    key_prefix = str('StackRef').encode('utf-8')
    key = str(table).encode('utf-8')
    nodes = elasticache_auto_discovery.discover(settings.memcached_cluster_cfg_ep)
    nodes = map(lambda x: (x[1], int(x[2])), nodes)
    initial_key_prefix = randint(0, 10000)
    try:
        memcache_client = HashClient(nodes, key_prefix=key_prefix, connect_timeout=2, timeout=2, serializer=python_memcache_serializer, deserializer=python_memcache_deserializer)
        memcache_client.delete(key)
        memcache_client.set(key, initial_key_prefix, expire=86400)
        return initial_key_prefix
    except BaseException as error:
        log.error(f">> init_key_prefix: {error}")
        return initial_key_prefix

'''
    get_key_prefix
        Retrieve the current key prefix
'''
def get_key_prefix(table):
    log.debug(':: get_key_prefix')
    key_prefix = str('StackRef').encode('utf-8')
    key = str(table).encode('utf-8')
    nodes = elasticache_auto_discovery.discover(settings.memcached_cluster_cfg_ep)
    nodes = map(lambda x: (x[1], int(x[2])), nodes)
    try:
        memcache_client = HashClient(nodes, key_prefix=key_prefix, connect_timeout=2, timeout=2, serializer=python_memcache_serializer, deserializer=python_memcache_deserializer)
        response = memcache_client.get(key)
        if response:
            return response
        else:
            initial_key_prefix = init_key_prefix(table)
            memcache_client.set(key, initial_key_prefix, expire=86400)
            return initial_key_prefix
    except BaseException as error:
        log.error(f">> get_key_prefix: {error}")
        initial_key_prefix = init_key_prefix(table)
        memcache_client.set(key, initial_key_prefix, expire=86400)
        return initial_key_prefix

'''
    incr_key_prefix
        Increment the current key prefix
'''
def incr_key_prefix(table):
    log.debug(':: incr_key_prefix')
    key_prefix = str('StackRef').encode('utf-8')
    key = str(table).encode('utf-8')
    nodes = elasticache_auto_discovery.discover(settings.memcached_cluster_cfg_ep)
    nodes = map(lambda x: (x[1], int(x[2])), nodes)
    try:
        memcache_client = HashClient(nodes, key_prefix=key_prefix, connect_timeout=2, timeout=2, serializer=python_memcache_serializer, deserializer=python_memcache_deserializer)
        response = memcache_client.get(key)
        if response:
            memcache_client.incr(key, 1, noreply=True)
        else:
            init_key_prefix(table)
        return response
    except MemcacheUnexpectedCloseError as error:
        log.error(f">> incr_key_prefix: {error}")
        return False
    except BaseException as error:
        log.error(f">> incr_key_prefix: {error}")
        return False

'''
    cache_query_response
        Store the hashed query and the query result in memcached.
'''
def cache_query_response(table, key, value, ttl=None):
    log.debug(':: cache_query_response')
    if not ttl:
        ttl = settings.memcached_cache_ttl
    nodes = elasticache_auto_discovery.discover(settings.memcached_cluster_cfg_ep)
    nodes = map(lambda x: (x[1], int(x[2])), nodes)
    try:
        key_prefix = str(f'{table}{get_key_prefix(table)}').encode('utf-8')
        memcache_client = HashClient(nodes, key_prefix=key_prefix, connect_timeout=2, timeout=2, serializer=python_memcache_serializer, deserializer=python_memcache_deserializer)
        memcache_client.set(key, value, expire=ttl)
    except MemcacheUnexpectedCloseError as error:
        log.error(f">> cache_query_response: {error}")
    except BaseException as error:
        log.error(f">> cache_query_response: {error}")

'''
    retrieve_query_response
        Search for and retrieve the cached query data.
'''
def retrieve_query_response(table, key):
    log.debug(':: retrieve_query_response')
    nodes = elasticache_auto_discovery.discover(settings.memcached_cluster_cfg_ep)
    nodes = map(lambda x: (x[1], int(x[2])), nodes)
    try:
        key_prefix = str(f'{table}{get_key_prefix(table)}').encode('utf-8')
        memcache_client = HashClient(nodes, key_prefix=key_prefix, connect_timeout=2, timeout=2, serializer=python_memcache_serializer, deserializer=python_memcache_deserializer)

        cached_query_response = memcache_client.get(key)
        if cached_query_response:
            return cached_query_response
        else:
            return False
    except MemcacheUnexpectedCloseError as error:
        log.error(f">> retrieve_query_response: {error}")
        return False
    except BaseException as error:
        log.error(f">> retrieve_query_response: {error}")
        return False

'''
    flush_cache
        Flush cache based on key_prefix
'''
def flush_cache():
    log.debug(':: flush_cache')
    nodes = elasticache_auto_discovery.discover(settings.memcached_cluster_cfg_ep)
    nodes = map(lambda x: (x[1], int(x[2])), nodes)
    try:
        memcache_client = HashClient(nodes, connect_timeout=2, timeout=2, serializer=python_memcache_serializer, deserializer=python_memcache_deserializer)
        memcache_client.flush_all(noreply=True)
    except MemcacheUnexpectedCloseError as error:
        log.error(f">> flush_cache: {error}")
    except BaseException as error:
        log.error(f">> flush_cache: {error}")
