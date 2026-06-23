import { useEffect, useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import { stackrefConfig } from 'src/config';
import useAuth from 'src/hooks/useAuth';
import { renderToStaticMarkup } from 'react-dom/server';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import './stackref-filepond.css';

import FilePondPluginFileEncode from 'filepond-plugin-file-encode';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginImageCrop from 'filepond-plugin-image-crop';
import FilePondPluginImageResize from 'filepond-plugin-image-resize';
import FilePondPluginImageTransform from 'filepond-plugin-image-transform';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

import UploadRoundedIcon from '@mui/icons-material/UploadRounded';

registerPlugin(
  FilePondPluginFileEncode,
  FilePondPluginFileValidateSize,
  FilePondPluginFileValidateType,
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview,
  FilePondPluginImageCrop,
  FilePondPluginImageResize,
  FilePondPluginImageTransform,
);

async function AssetDelete(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/assetDelete`;
  const user = payload.user;
  const deletePayload = payload.deletePayload;

  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
    body: deletePayload,
  };

  try {
    const response = await fetch(srAPIUrl, requestOptions);
    if (!response.ok) {
      throw await response.text();
    }
    const data = await response.json();
    _callback(data);
  } catch (error) {
    console.error(`>> DeletePayload: ${error}`);
    _callback(JSON.parse(error));
  }
}

const ImageUploader = (props) => {
  const {
    disabled,
    entityUuid,
    assetUuid,
    assetType = 'unknown',
    isSubmitting,
    setEntityAsset,
    setSubmitting,
    ...other
  } = props;

  const [files, setFiles] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [imageData, setImageData] = useState(null);
  const { user } = useAuth();

  const uploadIconString = renderToStaticMarkup(
    <UploadRoundedIcon className='upload-icon' />,
  );

  useEffect(() => {
    const dropArea = document.getElementById('image-drop-area');

    if (dropArea) {
      const handleDragOver = (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
      };

      const handleDragLeave = () => {
        dropArea.classList.remove('dragover');
      };

      const handleDrop = (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
      };

      dropArea.addEventListener('dragover', handleDragOver);
      dropArea.addEventListener('dragleave', handleDragLeave);
      dropArea.addEventListener('drop', handleDrop);

      return () => {
        dropArea.removeEventListener('dragover', handleDragOver);
        dropArea.removeEventListener('dragleave', handleDragLeave);
        dropArea.removeEventListener('drop', handleDrop);
      };
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      setLoading(true);
      const srAPIUrl = `${stackrefConfig.apiUrl}/assetRead`;

      const requestOptions = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
        },
        mode: 'cors',
      };

      try {
        const response = await fetch(
          `${srAPIUrl}?entity_uuid=${entityUuid}&asset_uuid=${assetUuid}`,
          requestOptions,
        );

        if (!response.ok) {
          const error = new Error(`>> ImageUploader: ${response.status}`);
          error.status = response.status;
          throw error;
        }

        const data = await response.blob();
        setImageData(data);
        setFiles([data]);
        setLoading(false);
      } catch (err) {
        console.error(`>> ImageUploader: ${err}`);
        setLoading(false);
      }
    }
    if (assetUuid && entityUuid && user.token) initialize();
  }, [assetUuid, entityUuid, user.token]);

  const filepondServer = (props) => {
    const { entityUuid = '', assetType, ...other } = props;
    const srAPIUrl = `${stackrefConfig.apiUrl}/assetCreate`;

    return {
      process: (
        fieldName,
        file,
        metadata,
        load,
        error,
        progress,
        abort,
        transfer,
        options,
      ) => {
        console.log(':: FilePond PROCESS');

        if (imageData) {
          load();
          return;
        }

        setSubmitting(true);
        // fieldName is the name of the input field
        // file is the actual file object to send
        const formData = new FormData();

        formData.append(fieldName, file, file.name);

        const request = new XMLHttpRequest();
        request.open(
          'POST',
          `${srAPIUrl}?asset_entity_uuid=${entityUuid}&asset_type=${assetType}`,
        );

        request.setRequestHeader('Authorization', `Bearer ${user.token}`);

        // Should call the progress method to update the progress to 100% before calling load
        // Setting computable to false switches the loading indicator to infinite mode
        request.upload.onprogress = (e) => {
          progress(e.lengthComputable, e.loaded, e.total);
        };

        // Should call the load method when done and pass the returned server file id
        // this server file id is then used later on when reverting or restoring a file
        // so your server knows which file to return without exposing that info to the client
        request.onload = function () {
          if (request.status >= 200 && request.status < 300) {
            // the load method accepts either a string (id) or an object
            setEntityAsset(JSON.parse(request.responseText));
            load(request.responseText);
          } else {
            setSubmitting(false);
            // Can call the error method if something is wrong, should exit after
            error('>> ImageUploader');
            console.error('>> ImageUploader');
          }
        };

        request.send(formData);

        // Should expose an abort method so the request can be cancelled
        return {
          abort: () => {
            setEntityAsset(null);
            // This function is entered if the user has tapped the cancel button
            request.abort();

            // Let FilePond know the request has been cancelled
            abort();
          },
        };
      },
      revert: async (uniqueFileId, load, error) => {
        console.log(':: FilePond REVERT');
        let deletePayload;

        if (uniqueFileId && uniqueFileId !== 'undefined') {
          deletePayload = uniqueFileId;
        } else {
          deletePayload = {
            asset_entity_uuid: entityUuid,
            asset_uuid: assetUuid,
          };
          deletePayload = JSON.stringify(deletePayload);
        }

        await AssetDelete(
          { user: user, deletePayload: deletePayload },
          (response) => {
            if (!response || response.status_code !== 200) {
              throw new Error(
                `${response?.error ? response.error : 'Asset delete failed'}`,
              );
            }
          },
        ).catch((err) => {
          console.error(err);
          error(err);
          throw err;
        });
        setImageData(null);
        setFiles([]);
        load();
      },
      fetch: (url, load, error, progress, abort, headers) => {
        console.log(':: FilePond FETCH');
      },
      load: (source, load, error, progress, abort, headers) => {
        console.log(':: FilePond LOAD');
      },
    };
  };

  return (
    <div>
      <FilePond
        id='image-drop-area'
        disabled={isSubmitting || disabled}
        files={files}
        acceptedFileTypes={['image/*']}
        allowFileEncode
        allowFileSizeValidation
        allowFileTypeValidation
        allowMultiple={false}
        allowImageResize
        allowImageTransform
        allowImageValidateSize
        allowReorder={false}
        imageCropAspectRatio={assetType === 'avatar_image' ? '1:1' : '16:9'}
        imagePreviewHeight={assetType === 'avatar_image' ? 80 : 300}
        imagePreviewWidth={assetType === 'avatar_image' ? 80 : 600}
        imageResizeTargetHeight={assetType === 'avatar_image' ? 80 : 300}
        imageResizeTargetWidth={assetType === 'avatar_image' ? 80 : 600}
        imageValidateSizeMinHeight={assetType === 'avatar_image' ? 80 : 300}
        imageValidateSizeMinWidth={assetType === 'avatar_image' ? 80 : 600}
        imageValidateSizeMaxHeight={assetType === 'avatar_image' ? 80 : 300}
        imageValidateSizeMaxWidth={assetType === 'avatar_image' ? 80 : 600}
        labelFileProcessing={!imageData ? 'Uploading' : 'Loading'}
        labelFileProcessingComplete={
          !imageData ? 'Upload complete' : 'Load complete'
        }
        labelTapToCancel={!imageData ? 'tap to cancel' : ''}
        labelTapToUndo={!imageData ? 'tap to undo' : 'tap to delete'}
        onprocessfiles={() => setSubmitting(false)}
        onprocessfilestart={() => setSubmitting(true)}
        onupdatefiles={setFiles}
        onremovefile={() => setEntityAsset(null)}
        labelIdle={`${uploadIconString}`}
        labelMaxFileSizeExceeded='Maximum file size is 5MB'
        maxFiles={1}
        maxFileSize='5MB'
        server={filepondServer({
          entityUuid: entityUuid,
          assetType: assetType,
        })}
      />
    </div>
  );
};

export default ImageUploader;
