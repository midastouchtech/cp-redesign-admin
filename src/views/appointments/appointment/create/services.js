import { MEDICAL_SERVICES } from "../../../../config";

import styled from "styled-components";
import React, { useEffect, useState } from "react";
import { isEmpty, omit, values } from "ramda";

const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  label {
    vertical-align: text-bottom;
    margin-left: 0.2rem;
    font-size: 11px;
  }
`;

const CheckboxContainer = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  li {
    width: 20%;
    list-style: none;
  }
`;

const Right = styled.div`
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Total = styled.div`
  p {
    font-size: 14px;
    font-weight: bold;
    margin: 0;
    &:first-child {
      font-weight: 500;
    }
  }
`;

const Left = styled.div`
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  input {
    margin-left: 5px;
    &:checked {
      &:before {
        transform: scale(1);
      }
    }
    &:before {
      ${(props) =>
        props.checked ? "transform: scale(1);" : "transform: scale(0);"}
      content: "";
      width: 0.65em;
      height: 0.65em;
      transform: scale(0);
      transition: 120ms transform ease-in-out;
      box-shadow: inset 1em 1em var(--form-control-color);
      transform-origin: bottom left;
      clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
      background-color: #fff;
    }
    appearance: none;
    background-color: #a9aab3;
    font: inherit;
    color: currentColor;
    width: 1em;
    height: 1em;
    border-radius: 0.15em;
    transform: translateY(-0.075em);
    display: grid;
    place-content: center;
  }
`;

const services = values(MEDICAL_SERVICES);
const getFormattedPrice = (price) => `R${price.toFixed(2)}`;

function Services({ onChange, selectedServices }) {
  console.log("selectedServices", selectedServices);
  const [selected, setSelected] = useState([]);
  const [total, setTotal] = useState(0);


  const handleOnChange = (position) => {
    const selectedItem = services.find((item, index) => index === position);

    const newServices = [...selectedServices, omit(["info", "title"], selectedItem)];
    const itemAlreadySelected = selectedServices.find((i) => i.id === selectedItem.id);
    if (itemAlreadySelected) {
      const newSelected = selectedServices.filter((i) => i.id !== selectedItem.id);
      const totalPrice = newSelected.reduce((sum, currentItem) => {
        return sum + currentItem.price;
      }, 0);
      setTotal(totalPrice);
      setSelected(newSelected);
      onChange(newSelected);
    } else {
      const totalPrice = newServices.reduce((sum, currentItem) => {
        return sum + currentItem.price;
      }, 0);
      setTotal(totalPrice);
      setSelected(newServices);
      onChange(newServices);
    }
  };

  return (
    <>
      <div className="row">
        {services.map(({ id, title, price }, index) => {
          return (
            <div className="col-12" key={index}>
              <div className="row">
                <div className="col-8">
                  <input
                    type="checkbox"
                    id={`custom-checkbox-${index}`}
                    className="mr-2"
                    name={id}
                    value={id}
                    checked={selectedServices.find((s) => s.id === id) !== undefined}
                    onClick={() => handleOnChange(index)}
                  />
                  <label htmlFor={`custom-checkbox-${index}`}>{title}</label>
                </div>
                <div className="col-4">{getFormattedPrice(price)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Services;
