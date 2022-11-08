import moment from "moment";
import {
  any,
  assoc,
  has,
  isEmpty,
  isNil,
  values,
  assocPath,
  omit,
  reject,
  without,
  insert,
  equals,
} from "ramda";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Uploader from "../../../../components/Upload";
import { SegmentedControl } from "segmented-control-react";


function App({ socket }) {
  let params = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState({});
  const [originalCompany, setOriginalCompany] = useState({});
  const [hasUpdatedCompany, sethasUpdatedCompany] = useState(false);

  if (socket && isLoading) {
    socket.emit("GET_COMPANY", { id: params.companyId });
    socket.on("RECEIVE_COMPANY", (client) => {
      console.log("client page RECEIVE_company", client);
      setIsLoading(false);
      setCompany(client);
      setOriginalCompany(client);
    });
    socket.on("DATABASE_UPDATED", (u) => {
      console.log("Database updated FROM CLient PAGE");
      socket.emit("GET_COMPANY", { id: params.companyId });
    });
  }

  const setDetail = (key, value) => {
    setCompany(assocPath(["details", key], value, company));
  };

  const resetCompanyToOriginal = () => {
    setCompany(originalCompany);
  };

  console.log(company);

  const saveCompany = () => {
    console.log("saving appza");
    socket.emit("UPDATE_COMPANY", company);
    socket.on("COMPANY_UPDATED", () => {
      console.log("company updated");
      navigate("/company-edit/" + company.id);
    });
  };

  useEffect(() => {
    const hasUpdatedCompany = !equals(company, originalCompany);
    sethasUpdatedCompany(hasUpdatedCompany);
  });

  return (
    <div class="container-fluid">
      <div class="row">
        <div className="col-xl-12 col-lg-12">
          <div className="card">
            <div className="card-body">
              <button
                className={`btn btn-primary btn-outline-primary mr-1`}
                onClick={() => navigate("/companies")}
                disabled={hasUpdatedCompany}
              >
                Close
              </button>
              <button
                className={`btn mr-1 ${
                  hasUpdatedCompany ? "btn-primary" : "btn-secondary"
                }`}
                onClick={saveCompany}
                disabled={!hasUpdatedCompany}
              >
                Save Company
              </button>
              <button
                className={`btn ${
                  hasUpdatedCompany ? "btn-link" : "btn-secondary"
                }`}
                onClick={resetCompanyToOriginal}
                disabled={!hasUpdatedCompany}
              >
                Cancel Changes
              </button>
            </div>
          </div>
        </div>
        <div class="col-xl-6 col-lg-12">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">Details</h4>
            </div>
            <div class="card-body">
              <div class="basic-form">
                <form>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">ID</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default"
                        value={company?.id}
                        disabled
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Name</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default"
                        placeholder="enter name "
                        onChange={(e) => setDetail("name", e.target.value)}
                        value={company?.details?.name}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Registration Name</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default"
                        placeholder="enter registrationName"
                        onChange={(e) => setDetail("registrationName", e.target.value)}
                        value={company?.details?.registrationName}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Registration Number</label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default"
                        placeholder="enter registrationNumber"
                        onChange={(e) => setDetail("registrationNumber", e.target.value)}
                        value={company?.details?.registrationNumber}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">
                      VAT
                    </label>
                    <div class="col-sm-8">
                      <input
                        class="form-control input-default"
                        placeholder="enter vat"
                        onChange={(e) => setDetail("vat", e.target.value)}
                        value={company?.details?.vat}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">
                      Physical Address
                    </label>
                    <div class="col-sm-8">
                      <textarea
                        class="form-control input-default"
                        placeholder="enter physical address"
                        onChange={(e) => setDetail("physicalAddress", e.target.value)}
                        value={company?.details?.physicalAddress}
                      />
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-4 col-form-label">
                      Physical Address
                    </label>
                    <div class="col-sm-8">
                      <textarea
                        class="form-control input-default"
                        placeholder="enter postal address"
                        onChange={(e) => setDetail("postalAddress", e.target.value)}
                        value={company?.details?.postalAddress}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-6 col-lg-12">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">Decomission</h4>
            </div>
            <div class="card-body">
              <p>You can select one of he two options below to select whether the company has been decomissioned.</p>
              <div class="basic-form">
                <form>
                  <div class="form-group">
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={company?.isDecomissioned === true}
                        onChange={() => setCompany(assoc("isDecomissioned", true, company))}
                      />
                      <label class="form-check-label" for="check1">
                        Allow appointments from this company
                      </label>
                    </div>
                    <div class="form-check mb-2">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        checked={company?.isDecomissioned === false}
                        onChange={() => setCompany(assoc("isDecomissioned", false, company))}
                      />
                      <label class="form-check-label" for="check2">
                        Don't allow appointments from this company
                      </label>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-12">
          <div class="card">
            <div class="card-header">Users who manage this company</div>
            <div class="card-body p-0">
              <div class="table-responsive fs-14">
                <table class="table">
                  <thead>
                    <tr>
                      <th>
                        <strong>ID</strong>
                      </th>
                      <th>
                        <strong>Name</strong>
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {company?.usersWhoCanManage?.map((c) => (
                      <tr>
                        <td>{c?.id}</td>
                        <td>{c?.name}</td>
                        <td>
                          <Link to={`/client-edit/${c?.id}`}> Open </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
