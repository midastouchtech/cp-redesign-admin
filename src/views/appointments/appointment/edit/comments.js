import React, { useState } from "react";
import short from "short-uuid";

const Comments = ({ employeeComments, onChange }) => {
  const [comment, setComment] = useState(null);

  if(typeof employeeComments === "string") {
    const comment = { 
      id: short.generate(),
      comment: employeeComments
    }
    employeeComments = [comment];
  }

  const addCommentAndClear = (e) => {
    e.preventDefault();
    const comments = [...employeeComments, { id: short.generate(), message: comment }];
    console.log(comments);
    onChange(comments);
    setComment("");
  };

  const removeComment = (id) => {
    const comments = employeeComments.filter((c) => c.id !== id);
    onChange(comments);
  };

  console.log("employee commenst",employeeComments);

  return (
    <>
      {employeeComments?.map((comment) => (
        <div className="col-12 mb-1" key={comment?.id}>
          <div class="row">
            <div class="col-8">
              <p>{comment?.message}</p>
            </div>
            <div class="col-4">
              <button
                type="button"
                class="btn btn-outline-secondary btn-xs"
                onClick={() => removeComment(comment?.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
      <textarea
        rows="5"
        type="text"
        class="form-control"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <br />
      <button class="btn btn-outline-secondary btn-xs" onClick={addCommentAndClear}>
        Add Comment
      </button>
    </>
  );
};

export default Comments;
