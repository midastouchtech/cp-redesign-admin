import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";

import { equals, isNil, keys, mergeAll, range, values } from "ramda";
import moment from "moment";

const Wrapper = styled.div`
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    overflow-x: scroll;
    height: auto;
  }
`;

const Operations = ({ socket }) => {
  const [events, setEvents] = useState([]);

  const addEvent = (e) => { 
    console.log(e.name)   
    const newEvents = [
      ...events,
      e
    ]
    if(!equals(events, newEvents)){
      setEvents(newEvents)
    }
  }

  useEffect(()=>{
    if (socket) {
      socket.off("LOG")
      socket.on("LOG", (data) => {      
        addEvent({ name: data.event, time: moment().format("HH:mm:ss"), args: data.args })
      });
    }
  }, [socket, events]);

  
  
  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">Operations</h6>
          <span className="fs-14 text-black">Current System Operations</span>
        </div>
        <div className="d-flex mb-3">
          <button
            type="button"
            class="btn btn-primary mb-3 mr-2"
            onClick={() => {}}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="row">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Time</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr>
                <td><strong>{e?.name}</strong></td>
                <td>{e?.time}</td>
                <td>{e?.args[0]?.id || e?.args[0]?.email  }</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Operations;
