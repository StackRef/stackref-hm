import io
import logging
import requests
import sys
from requests.exceptions import RequestException

sys.path.insert(1, 'vendor')
from openai import OpenAI
from PIL import Image

import stackref.settings as settings
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    generate_image
        Generate an avatar or banner image using OpenAI's DALL-E model, based
        on a Team or Event name.
'''
def generate_image(asset_type, entity_type, entity_name, entity_uuid):
    log.info(":: generate_image")

    # TODO: Temporary until we care to allow Organizations to create images
    if entity_type == 'organization':
        entity_type = 'event'

    if entity_type == 'team' or entity_type == 'event':
        prompt = f"""
            Design an abstract, centered, and dynamic logo that visually embodies
            the spirit of a hackathon {entity_type}, named '{entity_name}'. The design should
            avoid textual elements and instead utilize visual symbolism to convey
            innovation, collaboration, and technology. Aim for a modern, balanced,
            and striking composition that effectively represents the {entity_type} in a tech
            competition setting, with all major elements centered and evenly
            distributed for visual impact.
        """
    else:
        log.info(f':: Unhandled Entity Type: {entity_type}')
        return None

    try:
        oai_client = OpenAI()
        response = oai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )

        image_url = response.data[0].url
    except Exception as error:
        log.error(f'>> generate_image: {error}')
        # TODO: Handle BadRequestError when code is 'content_policy_violation'
        raise error

    if image_url:
        log.info(f':: Generated Image URL: {image_url}')

        try:
            response = requests.head(image_url)

            if response.status_code == 200:
                file_type = response.headers.get('Content-Type', 'application/octet-stream')

                # Now send a GET request to get the content if it's the correct file type
                if 'image' in file_type:  # Simple check to ensure it's an image
                    response = requests.get(image_url)
                    if response.status_code == 200 and response.content:
                        try:
                            image_data = io.BytesIO(response.content)
                            with Image.open(image_data) as img:
                                if asset_type == 'avatar_image':
                                    img = img.resize((80, 80), Image.LANCZOS)
                                else:
                                    img = img.resize((600, 300), Image.LANCZOS)
                                resized_image_data = io.BytesIO()
                                img.save(resized_image_data, format='PNG')
                                resized_image_data.seek(0)
                            return {
                                'asset_entity_uuid': entity_uuid,
                                'asset_type': asset_type,
                                'file_name': 'openai_generated.png',
                                'file_type': file_type,
                                'file_data': resized_image_data.getvalue()
                            }
                        except Exception as error:
                            raise error
                    else:
                        log.error(f'>> Failed to download the image. Status code: {response.status_code}')
                        raise Exception('Failed to download the image.')
                else:
                    log.error(f'>> File at URL is not an image type: {file_type}')
                    raise Exception(f'File at URL is not an image type')
        except Exception as error:
            log.error(f'>> generate_image: {error}')
            raise error
