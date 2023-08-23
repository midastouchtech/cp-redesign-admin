import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";

const Container = styled.div``;

function Uploader({ title, onChange }) {
  const [isUploading, setIsUploading] = useState(null);
  const [fileName, setFileName] = useState(null);

  const onFileChange = (event) => {
    setIsUploading(true);
    setFileName(event.target.files[0].name);
    const url = `${process.env.REACT_APP_IO_SERVER}/upload-file-to-cloud-storage`;
    const formData = new FormData();
    formData.append("file", event.target.files[0], event.target.files[0].name);
    const headers = {
      "Content-Type": "multipart/form-data",
    };
    console.log("Headers", headers);
    axios({
      method: "POST",
      data: formData,
      headers,
      url,
    })
      .then((response) => {
        console.log("response is", response);
        setIsUploading(false);
        onChange(response.data.publicUrl);
      })
      .then((data) => {});
  };

  return (
    <Container>
      <div class="input-group row">
        <div class="col-12 custom-file ml-3">
          <input
            type="file"
            class="custom-file-input"
            onChange={onFileChange}
          />
          <label class="custom-file-label">Choose file</label>
        </div>
        <div className="col-12 mt-3">
          {isUploading === true && (
            <p>
              <i>Uploading...</i>
            </p>
          )}
          {isUploading === false && (
            <div>
              <p>
                <strong>Upload complete!</strong>
              </p>
              <p>
                <small className="badge badge-warning">
                  <b>File name:</b>
                </small>{" "}
                {fileName}
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

export default Uploader;
