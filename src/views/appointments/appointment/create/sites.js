import React, { useState } from "react";

const Sites = ({ employeeSites, onChange }) => {
  const [site, setSite] = useState(null);

  const addSiteAndClear = (e) => {
    e.preventDefault();
    const sites = [...employeeSites, site];
    //console.log(sites);
    onChange(sites);
    setSite("");
  };

  const removeSite = (site) => {
    const sites = employeeSites.filter((s) => s !== site);
    onChange(sites);
  };

  return (
    <>
      {employeeSites?.map((site) => (
        <div className="col-12 mb-1" key={site}>
          <div class="row">
            <div class="col-8">
              <p>{site}</p>
            </div>
            <div class="col-4">
              <button
                type="button"
                class="btn btn-outline-secondary btn-xs"
                onClick={() => removeSite(site)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
      <input
        type="text"
        class="form-control"
        value={site}
        onChange={(e) => setSite(e.target.value)}
      />
      <br />
      <button class="btn btn-outline-secondary btn-xs" onClick={addSiteAndClear}>
        Add
      </button>
    </>
  );
};

export default Sites;
