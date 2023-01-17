import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import SearchModal from ".";
import { useNavigate } from "react-router-dom";
import { isEmpty } from "ramda";

const CompanySearch = ({prefilledSearchTerm, clearPrefilledSearchTerm, name, onCompanySelect, socket, show, close }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (term) => {
    console.log("searching", term || searchTerm)
    setLoading(true);
    setNotFound(false);
    setResults([]);
    socket.emit("SEARCH_COMPANY", {term: term || searchTerm});
    socket.on("RECEIVE_SEARCHED_COMPANY", (data) => {
      setResults(data);
      setLoading(false);
    });
    socket.on("RECEIVE_SEARCHED_COMPANY_NOT_FOUND", (data) => {
      setResults([]);
      setNotFound(true);
      setLoading(false);
    });
  };

  const clearAndClose = () => {
    setSearchTerm("");
    setResults([]);
    close();
    };

  if(prefilledSearchTerm && prefilledSearchTerm !== searchTerm) {
    setSearchTerm(prefilledSearchTerm)
    handleSearch(prefilledSearchTerm)
  }

  return (
    <SearchModal name={name} title="Company Search" show={show} handleClose={clearAndClose}>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search for a company"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="input-group-append">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => handleSearch()}
          >
            Search
          </button>
        </div>
      </div>
      <div className="list-group">
        {loading && (
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        )}
        {notFound && (
          <div className="alert alert-danger row" role="alert">
            <p className="col-8">No results found! </p>
            <button className="btn btn-primary col-4" onClick={() => navigate('/company/create')}> Create </button>
            
          </div>
        )}
        {!isEmpty(results) && <strong><p>Select a company</p></strong>}
        {results.map((result) => (
          <button
            type="button"
            className="list-group-item list-group-item-action"
            onClick={() => {
              onCompanySelect(result)
              clearAndClose()
            }}
          >
            {result?.details?.name}
            <span className="btn btn-primary float-right">Select</span>
          </button>
        ))}
      </div>
    </SearchModal>
  );
};

export default CompanySearch;
