import moment from "moment";
import { isEmpty, isNil } from "ramda";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
const clinicLimits = {
  Hendrina: 60,
  Churchill: 80,
};

const Container = styled.div`
    width: 100%;

    margin-top: 20px;

    p{
        margin:0.1rem;
    }
`;
const RemainingSlots = ({
  socket,
  clinic,
  date,
  onBookingStatusUpdate,
  employeeCount,
  shouldUpdateCount,
  setShouldUpdateCount
}) => {
  const [appointmentsForDateCount, setAppointmentsForDateCount] = useState();
  const [isFullyBooked, setIsFullyBooked] = useState(false);

  const exists = (i) => !isNil(i) && !isEmpty(i);

  useEffect(() => {
    if (socket && exists(date) && exists(clinic) && shouldUpdateCount) {
      console.log("getting count");
      socket.emit("GET_APPOINTMENTS_FOR_DATE_COUNT", {
        clinic: clinic,
        date: date,
      });
      socket.on("RECEIVE_APPOINTMENTS_FOR_DATE_COUNT", ({ count }) => {
        console.log("COUNT", count);
        setAppointmentsForDateCount(count);
        const isFullyBooked =
          (employeeCount + count) >= (clinicLimits[clinic] || 100);
        onBookingStatusUpdate(isFullyBooked);
        setIsFullyBooked(isFullyBooked);
        setShouldUpdateCount(false);
        socket.off("RECEIVE_APPOINTMENTS_FOR_DATE_COUNT")
      });

    }
  },[date, clinic, employeeCount]);
  return (
    <Container>
        {exists(date) && (
          <p>
            <p class="text-secondary">
              The current number of employees booked for the{" "}
              {moment(date).format("Do of MMM YYYY")} at {clinic} is{" "}
              {appointmentsForDateCount}. This clinic can only take{" "}
              {clinicLimits[clinic]} employees per day.
            </p>
            {!isFullyBooked && <p>
              You can add up to{" "}<strong>
              {(clinicLimits[clinic] || 100) - (appointmentsForDateCount+ employeeCount)}{" "}
              employees</strong> before {clinic} is fully booked.
            </p>}
            {isFullyBooked && <p className="text-danger">You cannot add any more employees. This clinic is now fully booked. Feel free to submit the employees you have already added.</p>}
          </p>
        )}
    </Container>
  );
};

export default RemainingSlots;
