import moment from 'moment';
import { isEmpty, isNil } from 'ramda';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;

  margin-top: 20px;

  p {
    margin: 0.1rem;
  }
`;
const RemainingSlots = ({
  socket,
  clinic,
  date,
  onBookingStatusUpdate,
  employeeCount,
  shouldUpdateCount,
  setShouldUpdateCount,
}) => {
  const [appointmentsForDateCount, setAppointmentsForDateCount] = useState();
  const [isFullyBooked, setIsFullyBooked] = useState(false);
  const [clinicLimits, setLimits] = useState({});

  const exists = (i) => !isNil(i) && !isEmpty(i);

  useEffect(() => {
    if (socket && exists(date) && exists(clinic) && shouldUpdateCount) {
      console.log('getting count');
      
      // Get system settings first to get limits
      socket.emit('GET_SYSTEM_SETTINGS');
      const settingsHandler = (settings) => {
        setLimits(settings.limits || {});
        const limits = settings.limits || {};
        
        // Then get the booking count
        socket.emit('GET_APPOINTMENTS_FOR_DATE_COUNT', {
          clinic: clinic,
          date: date,
        });
        
        // Set up count handler
        const countHandler = ({ count }) => {
          console.log('COUNT', count);
          setAppointmentsForDateCount(count);
          const limit = limits[clinic] || 100;
          const isFullyBooked = (employeeCount + count) >= limit;
          onBookingStatusUpdate(isFullyBooked);
          setIsFullyBooked(isFullyBooked);
          setShouldUpdateCount(false);
          socket.off('RECEIVE_APPOINTMENTS_FOR_DATE_COUNT', countHandler);
        };
        
        socket.on('RECEIVE_APPOINTMENTS_FOR_DATE_COUNT', countHandler);
        socket.off('RECEIVE_SYSTEM_SETTINGS', settingsHandler);
      };
      
      socket.on('RECEIVE_SYSTEM_SETTINGS', settingsHandler);
    }
  }, [date, clinic, employeeCount, shouldUpdateCount, socket, onBookingStatusUpdate, setShouldUpdateCount]);
  
  const limit = clinicLimits[clinic] || 100;
  const currentBookings = appointmentsForDateCount || 0;
  const remainingSpots = Math.max(0, limit - currentBookings - employeeCount);
  const canAddMore = remainingSpots > 0;

  return (
    <Container>
      {exists(date) && (
        <div>
          <p className='text-secondary'>
            <strong>Booking Status for {moment(date).format('Do of MMM YYYY')} at {clinic}:</strong>
          </p>
          <p className='text-secondary'>
            Employees already booked: <strong>{currentBookings}</strong>
          </p>
          <p className='text-secondary'>
            Employees in this appointment: <strong>{employeeCount}</strong>
          </p>
          <p className='text-secondary'>
            Clinic limit: <strong>{limit} employees per day</strong>
          </p>
          <p className='text-secondary'>
            Remaining spots available: <strong>{remainingSpots}</strong>
          </p>
          {!canAddMore && employeeCount > 0 && (
            <p className='text-danger'>
              <strong>Warning:</strong> You cannot add any more employees. This clinic is now fully booked. Feel free to submit the employees you have already added.
            </p>
          )}
          {canAddMore && employeeCount > 0 && (
            <p className='text-success'>
              You can still add up to <strong>{remainingSpots}</strong> more employees before {clinic} is fully booked.
            </p>
          )}
        </div>
      )}
    </Container>
  );
};

export default RemainingSlots;
