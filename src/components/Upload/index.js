import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";

const Container = styled.div``;

function Uploader({ title, onChange }) {
  const [isUploading, setIsUploading] = useState(null);

  const onFileChange = (event) => {
    //console.log("doing onchane")
    setIsUploading(true);
    const url = `${process.env.REACT_APP_IO_SERVER}/upload-file-to-cloud-storage`;
    const formData = new FormData();
    formData.append("file", event.target.files[0], event.target.files[0].name);
    formData.append("upload_preset", "pwdsm6sz");
    axios({
      method: "POST",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
      url,
    })
      .then((response) => {
        setIsUploading(false);
        onChange(response.data.publicUrl);
      })
      .then((data) => {});
  };

  return (
    <Container>
      <div>
        <div className="row">
        <div class="custom-file">
          <input type="file" class="custom-file-input" onChange={onFileChange}/>
          <label class="custom-file-label">Choose file</label>          
        </div>
        </div>
        <div className="row">
        <div className="col-12 mt-3">
        {isUploading === true && (
            <small className="login-loading">Uploading...</small>
          )}
          {isUploading === false && (
            <small className="login-loading">Upload complete!</small>
          )}
        </div>
        </div>

      </div>
    </Container>
  );
}

export default Uploader;
