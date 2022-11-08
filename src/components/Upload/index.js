import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";

const Container = styled.div``;

function Uploader({ title, onChange }) {
  const [isUploading, setIsUploading] = useState(null);

  const onFileChange = (event) => {
    setIsUploading(true);
    const url = "https://api.cloudinary.com/v1_1/clinic-plus/raw/upload";
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
        onChange(response.data.secure_url);
      })
      .then((data) => {});
  };

  return (
    <Container>
      <div class="input-group">
        <div class="custom-file">
          <input type="file" class="custom-file-input" />
          <label class="custom-file-label">Choose file</label>
          {isUploading === true && (
            <div className="login-loading">Uploading...</div>
          )}
          {isUploading === false && (
            <div className="login-loading">Upload complete!</div>
          )}
        </div>
      </div>
    </Container>
  );
}

export default Uploader;
