import { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../../assets/css/fullcalendar.min.css";
import { Calendar } from "primereact/calendar";
import { Link } from "react-router-dom";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import { emailbg01, emailbg02 } from "../../utils/imagepath";
import CommonDatePicker from "../../components/date-picker/common-date-picker";
import CommonTimePicker from "../../components/time-picker";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";
import CommonFooter from "../../components/footer/commonFooter";
import { ApplicationService } from "../services/application.service";

const Calendars = () => {
  const calendarRef = useRef(null);
  const [date, setDate] = useState(null);
  const [date2, setDate2] = useState<Date | null>(new Date());
  const [selectedTime1, setSelectedTime1] = useState<Date | null>(null);
  const [selectedTime2, setSelectedTime2] = useState<Date | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  const [newEvent, setNewEvent] = useState({ title: "", location: "", description: "" });

  const fetchEvents = () => {
    ApplicationService.getCalendarEvents()
      .then((res) => {
        const evts = Array.isArray(res) ? res : (res?.data || []);
        setEvents(evts);
      })
      .catch((err) => {
        console.error("Failed to load calendar events from backend:", err);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = (e: any) => {
    e.preventDefault();
    if (!newEvent.title) return;

    ApplicationService.createEvent({
      title: newEvent.title,
      date: date || new Date(),
      startTime: selectedTime1 ? selectedTime1.toLocaleTimeString() : "00:00",
      endTime: selectedTime2 ? selectedTime2.toLocaleTimeString() : "23:59",
      location: newEvent.location,
      description: newEvent.description,
    }).then(() => {
      setNewEvent({ title: "", location: "", description: "" });
      fetchEvents();
    }).catch(err => console.error("Failed to create event:", err));
  };


  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Calendar</h4>
                <h6>Manage Your calendar</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <li className="me-2">
                <div className="input-icon-end position-relative calender-datepicker">
                  <CommonDateRangePicker />
                  <span className="input-icon-addon">
                    <i className="ti ti-chevron-down ms-1" />
                  </span>
                </div>
              </li>
              <TooltipIcons />
              <RefreshIcon />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add_event"
              >
                <i className="ti ti-circle-plus me-1"></i>
                Create
              </Link>
            </div>
          </div>

          <div className="row">
            {/* Calendar Sidebar */}
            <div className="col-xxl-3 col-xl-4 theiaStickySidebar">
              <div className="stickybar">
                <div className="card">
                  <div className="card-body p-3">
                    <div className="border-bottom pb-2 mb-4">
                      <Calendar
                        className="datepickers mb-4"
                        value={date}
                        onChange={(e: any) => setDate(e.value)} // Ensure proper typing for e
                        inline={true}
                      />
                    </div>
                    {/* Event */}
                    {/* Event */}
                    <div className="border-bottom pb-4 mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h5>Event </h5>
                        <a
                          href="#"
                          className="text-secondary"
                          data-bs-toggle="modal"
                          data-bs-target="#add_event"
                        >
                          <i className="ti ti-square-rounded-plus-filled fs-16" />
                        </a>
                      </div>
                      <p className="fs-12 mb-2">
                        Drag and drop your event or click in the calendar
                      </p>
                      <div id="external-events">
                        <div
                          className="fc-event bg-success-transparent mb-1"
                          data-event='{ "title": "Team Events" }'
                          data-event-classname="bg-transparent-success"
                        >
                          <i className="ti ti-square-rounded text-success me-2" />
                          Team Events
                        </div>
                        <div
                          className="fc-event bg-warning-transparent mb-1"
                          data-event='{ "title": "Team Events" }'
                          data-event-classname="bg-transparent-warning"
                        >
                          <i className="ti ti-square-rounded text-warning me-2" />
                          Work
                        </div>
                        <div
                          className="fc-event bg-danger-transparent mb-1"
                          data-event='{ "title": "External" }'
                          data-event-classname="bg-transparent-danger"
                        >
                          <i className="ti ti-square-rounded text-danger me-2" />
                          External
                        </div>
                        <div
                          className="fc-event bg-cyan-transparent mb-1"
                          data-event='{ "title": "Projects" }'
                          data-event-classname="bg-transparent-skyblue"
                        >
                          <i className="ti ti-square-rounded text-cyan me-2" />
                          Projects
                        </div>
                        <div
                          className="fc-event bg-pink-transparent mb-1"
                          data-event='{ "title": "Applications" }'
                          data-event-classname="bg-transparent-purple"
                        >
                          <i className="ti ti-square-rounded text-pink me-2" />
                          Applications
                        </div>
                        <div
                          className="fc-event bg-info-transparent mb-0"
                          data-event='{ "title": "Desgin" }'
                          data-event-classname="bg-transparent-info"
                        >
                          <i className="ti ti-square-rounded text-info me-2" />
                          Desgin
                        </div>
                      </div>
                    </div>
                    {/* /Event */}
                    {/* /Event */}
                    {/* Upcoming Event */}
                    <div className="border-bottom pb-2 mb-4">
                      <h5 className="mb-2">
                        Upcoming Event
                        <span className="badge badge-success rounded-pill ms-2">
                          {events?.length || 0}
                        </span>
                      </h5>
                      {events && events.length > 0 ? (
                        events.slice(0, 3).map((event: any, index: number) => {
                          const borders = ["border-purple", "border-pink", "border-success", "border-info"];
                          const borderClass = borders[index % borders.length];
                          
                          // Format date nicely if available
                          let dateStr = "TBD";
                          if (event.start) {
                            try {
                              dateStr = new Date(event.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                            } catch (e) {
                              dateStr = event.start;
                            }
                          }
                          
                          return (
                            <div key={index} className={`border-start ${borderClass} border-3 mb-3`}>
                              <div className="ps-3">
                                <h6 className="fw-medium mb-1">
                                  {event.title || 'Untitled Event'}
                                </h6>
                                <p className="fs-12">
                                  <i className="ti ti-calendar-check text-info me-2" />
                                  {dateStr}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="fs-12 text-muted">No upcoming events.</p>
                      )}
                    </div>
                    {/* /Upcoming Event */}
                    {/* Upgrade Details */}
                    <div className="bg-dark rounded text-center position-relative p-4">
                      <span className="avatar avatar-lg rounded-circle bg-white mb-2">
                        <i className="ti ti-alert-triangle text-dark" />
                      </span>
                      <h6 className="text-white mb-3">
                        Enjoy Unlimited Access on a small price monthly.
                      </h6>
                      <Link to="#" className="btn btn-white">
                        Upgrade Now <i className="ti ti-arrow-right" />
                      </Link>
                      <div className="box-bg">
                        <span className="bg-right">
                          <img src={emailbg01} alt="Img" />
                        </span>
                        <span className="bg-left">
                          <img src={emailbg02} alt="Img" />
                        </span>
                      </div>
                    </div>
                    {/* /Upgrade Details */}
                  </div>
                </div>
              </div>
            </div>
            {/* /Calendar Sidebar */}
            <div className="col-xxl-9 col-xl-8 theiaStickySidebar">
              <div className="stickybar">
                <div className="card border-0">
                  <div className="card-body">
                    <FullCalendar
                      plugins={[
                        dayGridPlugin,
                        timeGridPlugin,
                        interactionPlugin,
                      ]}
                      initialView="dayGridMonth"
                      events={events}
                      headerToolbar={{
                        start: "today,prev,next",
                        center: "title",
                        end: "dayGridMonth,dayGridWeek,dayGridDay",
                      }}
                      ref={calendarRef}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CommonFooter />
      </div>
      <>
        {/* Add New Event */}
        <div className="modal fade" id="add_event">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add New Event</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close p-0 p-0"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={handleCreateEvent}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Event Name<span className="text-danger ms-1">*</span>
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Event Date<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-icon-end position-relative">
                          <CommonDatePicker
                            value={date2}
                            onChange={setDate2}
                            className="w-100"
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar text-gray-7" />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Start Time<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-icon-end position-relative">
                          <CommonTimePicker
                            selectedTime={selectedTime1}
                            onChange={setSelectedTime1}
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-clock text-gray-7" />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          End Time<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-icon-end position-relative">
                          <CommonTimePicker
                            selectedTime={selectedTime2}
                            onChange={setSelectedTime2}
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-clock text-gray-7" />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Event Location
                          <span className="text-danger ms-1">*</span>
                        </label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={newEvent.location}
                          onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">
                          Descriptions
                          <span className="text-danger ms-1">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={newEvent.description}
                          onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    data-bs-dismiss="modal"
                    onClick={(e) => {
                      if (!newEvent.title) {
                        e.preventDefault();
                        e.stopPropagation();
                        alert("Event Name is required!");
                      }
                    }}
                  >
                    Add Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /Add New Event */}
        {/* Event */}
        <div className="modal fade" id="event_modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header modal-bg">
                <div className="modal-title text-gray-9">
                  <span id="eventTitle" />
                </div>
                <button
                  type="button"
                  className="btn-close p-0 custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <div className="modal-body">
                <p className="d-flex align-items-center fw-medium text-black mb-3">
                  <i className="ti ti-calendar-check text-default me-2" />
                  26 Jul,2024 to 31 Jul,2024
                </p>
                <p className="d-flex align-items-center fw-medium text-black mb-3">
                  <i className="ti ti-calendar-check text-default me-2" />
                  11:00 AM to 12:15 PM
                </p>
                <p className="d-flex align-items-center fw-medium text-black mb-3">
                  <i className="ti ti-map-pin-bolt text-default me-2" />
                  Las Vegas, US
                </p>
                <p className="d-flex align-items-center fw-medium text-black mb-0">
                  <i className="ti ti-calendar-check text-default me-2" />A
                  recurring or repeating event is simply any event that you will
                  occur more than once on your calendar.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* /Event */}
      </>
    </>
  );
};

export default Calendars;
