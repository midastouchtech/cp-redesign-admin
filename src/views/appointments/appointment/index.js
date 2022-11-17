import moment from "moment";
import { any, assoc, has, isEmpty, isNil, mathMod, values } from "ramda";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import styled from "styled-components";

const exists = (i) => !isNil(i) && !isEmpty(i);
const ChatContainer = styled.div`
   .chatbox{
    position: initial;
   }
   .chatbox .msg_card_body {
    height: calc(100vh - 195px);
    overflow: scroll;
}
`;
function App({ socket }) {
  let params = useParams();

  const [bodyItem, setBodyItem] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState({});
  const [avatars, setAvatars] = useState({});

  if (socket && isLoading) {
    socket.emit("GET_APPOINTMENT", { id: params.appId });
    socket.on("RECEIVE_APPOINTMENT", (appointment) => {
      console.log("appointment page RECEIVE_APPOINTMENT", appointment);
      setIsLoading(false);
      setAppointment(appointment);
      
    });
    socket.on("DATABASE_UPDATED", (u) => {
      console.log("Database updated FROM APPOINTMENT PAGE");
      socket.emit("GET_APPOINTMENT", { id: params.appId });
    });
  }

  return (
    <div class="container-fluid">
      <div class="row">
        <div class="col-xl-9 col-xxl-8">
          <div class="row">
            <div class="col-xl-12">
              <div class="card event-detail-bx overflow-hidden">
                <div class="card-media">
                  <img src="images/hill.jpg" alt="" class="w-100" />
                </div>
                <div class="card-body">
                  <div class="d-flex flex-wrap align-items-center mb-4">
                    <h2 class="text-black col-xl-6 p-0 col-xxl-12 mr-auto title mb-3">
                      {appointment?.details?.company?.name}
                    </h2>
                    <div class="d-flex align-items-center">
                      <Link
                        to={`/appointment/edit/${appointment.id}`}
                        class="btn btn-primary mr-3"
                      >
                        Edit
                      </Link>
                      <a
                        href={`/appointment/quote/${appointment.id}`}
                        class="btn btn-outline-primary mr-3"
                      >
                        View Quote
                      </a>
                       <a href="#" class="badge mr-3">
                        {appointment.status}
                      </a>
                      
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-lg-3 col-md-6 col-xxl-6 mb-3">
                      <div class="media bg-light p-3 rounded align-items-center">
                        <svg
                          class="mr-2"
                          width="25"
                          height="25"
                          viewBox="0 0 25 25"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.07438 25H7.95454V22.6464C11.8595 22.302 14 19.6039 14 16.8197C14 12.7727 10.8471 11.9977 7.95454 11.3088V5.10907C9.34297 5.4535 10.1529 6.5155 10.2686 7.66361H13.7975C13.5372 4.42021 11.281 2.61194 7.95454 2.32492V0H6.07438V2.35362C2.4876 2.66935 0 4.87945 0 8.09415C0 12.1412 3.18182 12.9449 6.07438 13.6625V19.977C4.45455 19.69 3.64463 18.628 3.52893 17.1929H0C0 20.4363 2.54545 22.3594 6.07438 22.6751V25ZM10.6736 16.992C10.6736 18.4845 9.69008 19.69 7.95454 19.977V14.1504C9.51653 14.6383 10.6736 15.3559 10.6736 16.992ZM3.35537 7.92193C3.35537 6.17107 4.48347 5.22388 6.07438 5.02296V10.8209C4.5124 10.333 3.35537 9.58668 3.35537 7.92193Z"
                            fill="#FE634E"
                          />
                        </svg>
                        <div class="media-body">
                          <span class="fs-12 d-block mb-1">Booking Price</span>
                          <span class="fs-16 text-black">R{Math.round(appointment?.payment?.amount?? 0)}</span>
                        </div>
                        <div class="media-body">
                          <span class="fs-12 d-block mb-1">Completion</span>
                          <span class="fs-16 text-black">{appointment?.isComplete ? "Complete" : "Not Complete"}</span>
                        </div>                        
                      </div>
                    </div>
                    <div class="col-lg-4 col-md-6 col-xxl-6 mb-3">
                      <div class="media bg-light p-3 rounded align-items-center">
                        <svg
                          class="mr-4"
                          width="25"
                          height="25"
                          viewBox="0 0 25 25"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clip-path="url(#clip0)">
                            <path
                              d="M21 3H20C20 2.20435 19.6839 1.44129 19.1213 0.87868C18.5587 0.31607 17.7956 0 17 0C16.2044 0 15.4413 0.31607 14.8787 0.87868C14.3161 1.44129 14 2.20435 14 3H10C10 2.20435 9.68393 1.44129 9.12132 0.87868C8.55871 0.316071 7.79565 4.47035e-08 7 4.47035e-08C6.20435 4.47035e-08 5.44129 0.316071 4.87868 0.87868C4.31607 1.44129 4 2.20435 4 3H3C2.20435 3 1.44129 3.31607 0.87868 3.87868C0.31607 4.44129 0 5.20435 0 6L0 21C0 21.7956 0.31607 22.5587 0.87868 23.1213C1.44129 23.6839 2.20435 24 3 24H21C21.7956 24 22.5587 23.6839 23.1213 23.1213C23.6839 22.5587 24 21.7956 24 21V6C24 5.20435 23.6839 4.44129 23.1213 3.87868C22.5587 3.31607 21.7956 3 21 3ZM3 5H4C4 5.79565 4.31607 6.55871 4.87868 7.12132C5.44129 7.68393 6.20435 8 7 8C7.26522 8 7.51957 7.89464 7.70711 7.70711C7.89464 7.51957 8 7.26522 8 7C8 6.73478 7.89464 6.48043 7.70711 6.29289C7.51957 6.10536 7.26522 6 7 6C6.73478 6 6.48043 5.89464 6.29289 5.70711C6.10536 5.51957 6 5.26522 6 5V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2C7.26522 2 7.51957 2.10536 7.70711 2.29289C7.89464 2.48043 8 2.73478 8 3V4C8 4.26522 8.10536 4.51957 8.29289 4.70711C8.48043 4.89464 8.73478 5 9 5H14C14 5.79565 14.3161 6.55871 14.8787 7.12132C15.4413 7.68393 16.2044 8 17 8C17.2652 8 17.5196 7.89464 17.7071 7.70711C17.8946 7.51957 18 7.26522 18 7C18 6.73478 17.8946 6.48043 17.7071 6.29289C17.5196 6.10536 17.2652 6 17 6C16.7348 6 16.4804 5.89464 16.2929 5.70711C16.1054 5.51957 16 5.26522 16 5V3C16 2.73478 16.1054 2.48043 16.2929 2.29289C16.4804 2.10536 16.7348 2 17 2C17.2652 2 17.5196 2.10536 17.7071 2.29289C17.8946 2.48043 18 2.73478 18 3V4C18 4.26522 18.1054 4.51957 18.2929 4.70711C18.4804 4.89464 18.7348 5 19 5H21C21.2652 5 21.5196 5.10536 21.7071 5.29289C21.8946 5.48043 22 5.73478 22 6V10H2V6C2 5.73478 2.10536 5.48043 2.29289 5.29289C2.48043 5.10536 2.73478 5 3 5ZM21 22H3C2.73478 22 2.48043 21.8946 2.29289 21.7071C2.10536 21.5196 2 21.2652 2 21V12H22V21C22 21.2652 21.8946 21.5196 21.7071 21.7071C21.5196 21.8946 21.2652 22 21 22Z"
                              fill="#FE634E"
                            />
                            <path
                              d="M12 16C12.5523 16 13 15.5523 13 15C13 14.4477 12.5523 14 12 14C11.4477 14 11 14.4477 11 15C11 15.5523 11.4477 16 12 16Z"
                              fill="#FE634E"
                            />
                            <path
                              d="M18 16C18.5523 16 19 15.5523 19 15C19 14.4477 18.5523 14 18 14C17.4477 14 17 14.4477 17 15C17 15.5523 17.4477 16 18 16Z"
                              fill="#FE634E"
                            />
                            <path
                              d="M6 16C6.55228 16 7 15.5523 7 15C7 14.4477 6.55228 14 6 14C5.44771 14 5 14.4477 5 15C5 15.5523 5.44771 16 6 16Z"
                              fill="#FE634E"
                            />
                            <path
                              d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
                              fill="#FE634E"
                            />
                            <path
                              d="M18 20C18.5523 20 19 19.5523 19 19C19 18.4477 18.5523 18 18 18C17.4477 18 17 18.4477 17 19C17 19.5523 17.4477 20 18 20Z"
                              fill="#FE634E"
                            />
                            <path
                              d="M6 20C6.55228 20 7 19.5523 7 19C7 18.4477 6.55228 18 6 18C5.44771 18 5 18.4477 5 19C5 19.5523 5.44771 20 6 20Z"
                              fill="#FE634E"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0">
                              <rect width="24" height="24" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        <div class="media-body">
                          <span class="fs-12 d-block mb-1">Date</span>
                          <span class="fs-16 text-black">
                            {moment(appointment?.details?.date).format("DD MMM YYYY")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="col-lg-5 col-md-6 col-xxl-6 mb-3">
                      <div class="media bg-light p-3 rounded align-items-center">
                        <svg
                          class="mr-4"
                          width="32"
                          height="32"
                          viewBox="0 0 32 32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clip-path="">
                            <path
                              d="M27.5713 13.4286C27.5713 22.4286 15.9999 30.1428 15.9999 30.1428C15.9999 30.1428 4.42847 22.4286 4.42847 13.4286C4.42847 10.3596 5.6476 7.41638 7.81766 5.24632C9.98772 3.07625 12.931 1.85712 15.9999 1.85712C19.0688 1.85712 22.0121 3.07625 24.1821 5.24632C26.3522 7.41638 27.5713 10.3596 27.5713 13.4286Z"
                              stroke="#FE634E"
                              stroke-width="3"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M15.9997 17.2857C18.13 17.2857 19.8569 15.5588 19.8569 13.4286C19.8569 11.2983 18.13 9.57141 15.9997 9.57141C13.8695 9.57141 12.1426 11.2983 12.1426 13.4286C12.1426 15.5588 13.8695 17.2857 15.9997 17.2857Z"
                              stroke="#FE634E"
                              stroke-width="3"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip3">
                              <rect
                                width="30.8571"
                                height="30.8571"
                                fill="white"
                                transform="translate(0.571289 0.571411)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        <div class="media-body">
                          <span class="fs-12 d-block mb-1">Location</span>
                          <span class="fs-16 text-black">
                            {appointment?.details?.clinic}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="col-lg-5 col-md-6 col-xxl-6 mb-3">
                      <div class="media bg-light p-3 rounded align-items-center">
                        <svg
                          class="mr-4"
                          width="32"
                          height="32"
                          viewBox="0 0 32 32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clip-path="">
                            <path
                              d="M27.5713 13.4286C27.5713 22.4286 15.9999 30.1428 15.9999 30.1428C15.9999 30.1428 4.42847 22.4286 4.42847 13.4286C4.42847 10.3596 5.6476 7.41638 7.81766 5.24632C9.98772 3.07625 12.931 1.85712 15.9999 1.85712C19.0688 1.85712 22.0121 3.07625 24.1821 5.24632C26.3522 7.41638 27.5713 10.3596 27.5713 13.4286Z"
                              stroke="#FE634E"
                              stroke-width="3"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M15.9997 17.2857C18.13 17.2857 19.8569 15.5588 19.8569 13.4286C19.8569 11.2983 18.13 9.57141 15.9997 9.57141C13.8695 9.57141 12.1426 11.2983 12.1426 13.4286C12.1426 15.5588 13.8695 17.2857 15.9997 17.2857Z"
                              stroke="#FE634E"
                              stroke-width="3"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip3">
                              <rect
                                width="30.8571"
                                height="30.8571"
                                fill="white"
                                transform="translate(0.571289 0.571411)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        <div class="media-body">
                          <span class="fs-12 d-block mb-1">Purchase Order Number</span>
                          <span class="fs-16 text-black">
                            {appointment?.details?.purchaseOrderNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-12">
              <div class="card">
                <div class="card-header">
                  Clients who manage this appointment
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive fs-14">
                    <table class="table">
                      <thead>
                        <tr>
                          <th>
                            <strong>Client Name</strong>
                          </th>
                          <th>
                            <strong>View</strong>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointment?.usersWhoCanManage?.map((user) => (
                            <tr>
                                <td>{user?.name}</td>
                                <td><Link to={`/client/edit/${user.id}`}>Open</Link></td>
                            </tr>
                        ))}

                        </tbody>
                        
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-12">
              <div class="card">
                <div class="card-header">
                  Clients who manage this appointment
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive fs-14">
                    <table class="table">
                      <thead>
                        <tr>
                          <th>
                            <strong>Client Name</strong>
                          </th>
                          <th>
                            <strong>View</strong>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointment?.usersWhoCanManage?.map((user) => (
                            <tr>
                                <td>{user?.name}</td>
                                <td><Link to={`/client/edit/${user.id}`}>Open</Link></td>
                            </tr>
                        ))}

                        </tbody>
                        
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-12">
              <div class="card">
                <div class="card-body p-0">
                  <div class="table-responsive fs-14">
                    <table class="table">
                      <thead>
                        <tr>
                          <th>
                            <strong>Employee Name</strong>
                          </th>
                          <th>
                            <strong>Occupation</strong>
                          </th>
                          <th>
                            <strong>Site</strong>
                          </th>
                          <th>
                            <strong>Job spec</strong>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointment?.details?.employees?.map((employee) => (
                            <tr>
                                <td>{employee?.name}</td>
                                <td>{employee?.occupation}</td>
                                <td>{employee?.site}</td>
                                <td><a href={employee?.jobSpecFile}>View</a></td>
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
        <div class="col-xl-3 col-xxl-4">

        <ChatContainer>
        <div class="chatbox">
			<div class="chatbox-close"></div>
			<div class="custom-tab-1">
				<div class="tab-content">
					<div class="tab-pane fade active show" id="chat" role="tabpanel">
						<div class="card active chat dz-chat-history-box">
							<div class="card-header chat-list-header text-center">
								<a href="javascript:void(0)" class="dz-chat-history-back">
									<svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><polygon points="0 0 24 0 24 24 0 24"/><rect fill="#000000" opacity="0.3" transform="translate(15.000000, 12.000000) scale(-1, 1) rotate(-90.000000) translate(-15.000000, -12.000000) " x="14" y="7" width="2" height="10" rx="1"/><path d="M3.7071045,15.7071045 C3.3165802,16.0976288 2.68341522,16.0976288 2.29289093,15.7071045 C1.90236664,15.3165802 1.90236664,14.6834152 2.29289093,14.2928909 L8.29289093,8.29289093 C8.67146987,7.914312 9.28105631,7.90106637 9.67572234,8.26284357 L15.6757223,13.7628436 C16.0828413,14.136036 16.1103443,14.7686034 15.7371519,15.1757223 C15.3639594,15.5828413 14.7313921,15.6103443 14.3242731,15.2371519 L9.03007346,10.3841355 L3.7071045,15.7071045 Z" fill="#000000" fill-rule="nonzero" transform="translate(9.000001, 11.999997) scale(-1, -1) rotate(90.000000) translate(-9.000001, -11.999997) "/></g></svg>
								</a>
								<div>
									<h6 class="mb-1">Chat with {appointment?.details?.company?.name}</h6>
									{/* <p class="mb-0 text-success">Online</p> */}
								</div>							
								<div class="dropdown">
									<a href="javascript:void(0)" data-toggle="dropdown" >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><rect x="0" y="0" width="24" height="24"/><circle fill="#000000" cx="5" cy="12" r="2"/><circle fill="#000000" cx="12" cy="12" r="2"/><circle fill="#000000" cx="19" cy="12" r="2"/></g></svg></a>
									<ul class="dropdown-menu dropdown-menu-right">
										<li class="dropdown-item"><i class="fa fa-user-circle text-primary mr-2"></i> View profile</li>
										<li class="dropdown-item"><i class="fa fa-users text-primary mr-2"></i> Add to close friends</li>
										<li class="dropdown-item"><i class="fa fa-plus text-primary mr-2"></i> Add to group</li>
										<li class="dropdown-item"><i class="fa fa-ban text-primary mr-2"></i> Block</li>
									</ul>
								</div>
							</div>
							<div class="card-body msg_card_body dz-scroll" id="DZ_W_Contacts_Body3">
								{appointment.messages?.map((message) => {
                                    return message.author?.role === "admin" ? 
                                    (
                                        <div class="d-flex justify-content-start mb-4">
                                            <div class="img_cont_msg">
                                                <img src={avatars[message?.author?.id
                                                ]} class="rounded-circle user_img_msg" alt=""/>
                                                
                                            </div>
                                            <div class="msg_cotainer">
                                                {message?.message}
                                                <span class="msg_time"> {message?.author?.name} {moment(message?.createdAt).format("DD MMMM YYYY HH:mm")}</span>
                                                
                                            </div>
                                        </div>
                                    )
                                    :
                                    (
                                        <div class="d-flex justify-content-end mb-4">
                                            <div class="img_cont_msg">
                                                <img src={message?.author?.avatar} class="rounded-circle user_img_msg" alt=""/>
                                            </div>
                                            <div class="msg_cotainer">
                                                {message?.message}
                                                <span class="msg_time">{moment(message?.createdAt).format("DD MMMM YYYY HH:mm")}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
							<div class="card-footer type_msg">
								<div class="input-group">
									<textarea class="form-control" placeholder="Type your message..."></textarea>
									<div class="input-group-append">
										<button type="button" class="btn btn-primary"><i class="fa fa-location-arrow"></i></button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
        </ChatContainer>

        </div>
      </div>
    </div>
  );
}

export default App;
