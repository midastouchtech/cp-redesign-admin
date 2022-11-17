import React, { useState } from "react";
import SearchModal from ".";

const AppointmentSearch = ({
  name,
  onAppointmentSelect,
  socket,
  show,
  close,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setNotFound(false);
    setResults([]);
    socket.emit("SEARCH_APPOINTMENT", { term: searchTerm });
    socket.on("RECEIVE_SEARCHED_APPOINTMENT", (data) => {
      setResults(data);
      setLoading(false);
    });
    socket.on("RECEIVE_SEARCHED_APPOINTMENT_NOT_FOUND", (data) => {
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
    <SearchModal
      name={name}
      title="Appointment Search"
      show={show}
      handleClose={clearAndClose}
    >
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search for an appointment"
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
        <table>
          <thead>
            <tr>
              <th>Appointment ID</th>
              <th>Company</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr
                key={result.appointment_id}
                onClick={() => onAppointmentSelect(result)}
              >
                <td>{result?.id}</td>
                <td>{result.details?.company?.name}</td>
                <td>
                  <button className="btn btn-xs btn-primary mb-1">Select</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SearchModal>
  );
};

export default AppointmentSearch;
