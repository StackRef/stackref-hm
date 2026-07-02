import { useEffect, useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import { stackrefConfig } from 'src/config';
import useAuth from 'src/hooks/useAuth';
import { renderToStaticMarkup } from 'react-dom/server';
import { Box, Typography } from '@mui/material';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import './stackref-filepond.css';

import FilePondPluginFileEncode from 'filepond-plugin-file-encode';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

import UploadRoundedIcon from '@mui/icons-material/UploadRounded';

registerPlugin(
  FilePondPluginFileEncode,
  FilePondPluginFileValidateSize,
  FilePondPluginFileValidateType,
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

const InvitationsUploader = (props) => {
  const {
    entityUuid,
    assetUuid,
    assetType = 'unknown',
    isSubmitting,
    setEntityAsset,
    setSubmitting,
    ...other
  } = props;

  const [files, setFiles] = useState([]);
  const [imageData, setImageData] = useState(null);
  const { user } = useAuth();

  const uploadIconString = renderToStaticMarkup(
    <UploadRoundedIcon className='upload-icon' />,
  );

  useEffect(() => {
    const dropArea = document.getElementById('invitations-drop-area');

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
            error('>> InvitationsUploader');
            console.error('>> InvitationsUploader');
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
        id='invitations-drop-area'
        disabled={isSubmitting}
        files={files}
        acceptedFileTypes={[
          // CSV files
          'text/csv', // MIME type for CSV files
          'text/tab-separated-values', // MIME type for tab-separated files

          // Excel spreadsheet files
          'application/vnd.ms-excel', // MIME type for older .xls Excel files
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // MIME type for newer .xlsx Excel files

          // Additional MIME types and file extensions
          'application/excel', // MIME type for older .xls Excel files
          'application/x-excel', // MIME type for older .xls Excel files
          'application/x-msexcel', // MIME type for older .xls Excel files
          'application/xlsx', // Extension for newer .xlsx Excel files
          'application/vnd.ms-excel.sheet.macroenabled.12', // Extension for .xlsm Excel files (macro-enabled)
          'text/comma-separated-values', // MIME type for CSV files (alternative)
          'text/tsv', // Extension for tab-separated files (alternative)
          '.xls', // Extension for older .xls Excel files
          '.xlsx', // Extension for newer .xlsx Excel files
          '.csv', // Extension for CSV files
          '.tsv', // Extension for tab-separated files
        ]}
        allowFileEncode
        allowFileSizeValidation
        allowFileTypeValidation
        allowMultiple={false}
        allowReorder={false}
        allowRemove={false}
        allowReplace={false}
        allowRevert={false}
        labelFileProcessing={'Uploading'}
        labelFileProcessingComplete={'Upload complete'}
        labelTapToCancel={''}
        labelTapToUndo={''}
        //onaddfilestart={() => setSubmitting(true)}
        onprocessfiles={() => setSubmitting(false)}
        onprocessfilestart={() => setSubmitting(true)}
        onupdatefiles={setFiles}
        labelIdle={`${uploadIconString}`}
        labelMaxFileSizeExceeded='Maximum file size is 2MB'
        maxFiles={1}
        maxFileSize='2MB'
        server={filepondServer({
          entityUuid: entityUuid,
          assetType: assetType,
        })}
      />
    </div>
  );
};

export default InvitationsUploader;
