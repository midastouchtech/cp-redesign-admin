import React, { useState } from "react";
import SearchModal from ".";

const CompanySearch = ({name, onCompanySelect, socket, show, close }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setNotFound(false);
    setResults([]);
    socket.emit("SEARCH_COMPANY", {term: searchTerm});
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
            onClick={handleSearch}
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
          <div className="alert alert-danger" role="alert">
            No results found!
          </div>
        )}
        {results.map((result) => (
          <button
            type="button"
            className="list-group-item list-group-item-action"
            onClick={() => onCompanySelect(result)}
          >
            {result?.details?.name}
          </button>
        ))}
      </div>
    </SearchModal>
  );
};

export default CompanySearch;
