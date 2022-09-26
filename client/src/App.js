import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { io } from "socket.io-client";
import { CopyToClipboard } from "react-copy-to-clipboard";

import "./App.css";

const BASE_URL = process.env.REACT_APP_BASE_URL;

const socket = io(BASE_URL);

function App() {
  const [myId, setMyId] = useState("");
  const [call, setCall] = useState({});
  const [isAnswerCall, setIsAnswerCall] = useState(false);
  const [toCallingUserId, setToCallingUserId] = useState("");
  const [name, setName] = useState("");

  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);

  const [copied, setCopied] = useState(false);

  const [stream, setStream] = useState(null);

  const video = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: true,
      })
      .then((media) => {
        setStream(media);
        video.current.srcObject = media;
      })
      .catch((err) => {
        console.log(err);
      });

    socket.on("start", (data) => {
      setMyId(data.id);
    });

    socket.on("userCall", ({ to, from, signal, callerName }) => {
      setCall({ to, from, signal, isReceived: true, callerName });
    });

    socket.on("endcall", (data) => {
      endCall();
    });

    socket.on("receivemessage", ({ conversation }) => {
      setConversation(conversation);
    });
  }, []);

  const callUser = (id) => {
    var peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callinguser", {
        to: id,
        from: myId,
        signal: data,
        callerName: name,
      });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    socket.on("callaccepted", ({ signal, name }) => {
      setIsAnswerCall(true);
      setCall({ callerName: name });
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setIsAnswerCall(true);
    const peer = new Peer({ initiator: false, trickle: false, stream: stream });

    peer.on("signal", (data) => {
      socket.emit("callanswer", { from: call.from, signal: data, name });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const endCall = () => {
    socket.emit(
      "callend",
      call.from ? { id: call.from } : { id: toCallingUserId }
    );
    connectionRef.current.destroy();
    window.location.reload();
  };

  const sendMessage = (to, from) => {
    setConversation([...conversation, { id: from, message }]);
    setMessage("");
    socket.emit("sendmessage", {
      to: to,
      conversation: [...conversation, { id: from, message }],
      from: from,
    });
  };

  return (
    <div className="xl:px-20 lg:px-16 md:px-12 sm:px-8 px-4 py-10 min-h-full min-w-full bg-bgColor">
      <h1 className="xl:text-4xl lg:text-4xl md:text-2xl sm:text-2xl text-2xl font-bold">
        Video Chat Application
      </h1>
      <div className="flex justify-center">
        <div className="flex xl:w-4/5 lg:w-4/5 md:w-4/5 sm:w-11/12 w-11/12 xl:flex-row lg:flex-row flex-col gap-4 justify-center items-center mt-10">
          {video && (
            <div className="flex flex-col justify-center shadow border rounded bg-white xl:h-96 lg:h-96 md:h-96 sm:h-80 h-72">
              <h1 className="text-xl italic ml-2 mb-1">
                {name.length > 0 ? name : "Name"}
              </h1>
              <video ref={video} autoPlay style={{ height: "90%" }} />
            </div>
          )}
          {isAnswerCall && (
            <div className="flex flex-col justify-center shadow border rounded bg-white xl:h-96 lg:h-96 md:h-96 sm:h-80 h-72">
              <h1 className="text-xl italic ml-2 mb-1">
                {call.callerName ? call.callerName : toCallingUserId}
              </h1>
              <video ref={userVideo} autoPlay style={{ height: "90%" }} />
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-center items-center mt-10 ">
        <div className="xl:w-1/2 lg:w-1/2 md:w-1/2 sm:w-4/5 w-4/5 bg-white p-2 rounded py-4 px-6">
          <div className="grid xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 grid-cols-1 gap-4">
            <div>
              <label className="text-lg">Name</label>
              <input
                className="shadow appearance-none mt-2 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="username"
                type="text"
                placeholder="Your name"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
              <CopyToClipboard
                text={myId}
                onCopy={() => {
                  setCopied(true);
                  setTimeout(() => {
                    setCopied(false);
                  }, 2000);
                }}
              >
                <button
                  type="button"
                  className="py-2 px-4 mt-4 flex justify-center w-full items-center bg-indigo-500 hover:bg-indigo-700 focus:bg-indigo-500 focus:ring-offset-indigo-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-tabler icon-tabler-clipboard mr-1"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path>
                    <rect x="9" y="3" width="6" height="4" rx="2"></rect>
                  </svg>
                  {copied ? "Copied!" : "Copy your Id"}
                </button>
              </CopyToClipboard>
            </div>
            <div>
              <label className="text-lg">Caller Id</label>
              <input
                className="shadow appearance-none mt-2 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="username"
                type="text"
                placeholder="Caller Id"
                onChange={(e) => {
                  if (!isAnswerCall) {
                    setToCallingUserId(e.target.value);
                  }
                }}
              />
              {isAnswerCall ? (
                <button
                  onClick={endCall}
                  type="button"
                  className="py-2 px-4 mt-4 flex justify-center w-full items-center bg-red-500 hover:bg-red-700 focus:bg-red-500 focus:ring-offset-red-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-tabler icon-tabler-phone-off mr-1"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <line x1="3" y1="21" x2="21" y2="3"></line>
                    <path d="M5.831 14.161a15.946 15.946 0 0 1 -2.831 -8.161a2 2 0 0 1 2 -2h4l2 5l-2.5 1.5c.108 .22 .223 .435 .345 .645m1.751 2.277c.843 .84 1.822 1.544 2.904 2.078l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a15.963 15.963 0 0 1 -10.344 -4.657"></path>
                  </svg>
                  Hangup
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (name.length > 0 && toCallingUserId.length > 0) {
                      callUser(toCallingUserId);
                    }
                  }}
                  disabled={name.length <= 0 && toCallingUserId.length <= 0}
                  className="py-2 px-4 mt-4 flex justify-center w-full items-center bg-indigo-500 hover:bg-indigo-700 focus:bg-indigo-500 focus:ring-offset-indigo-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-tabler icon-tabler-phone mr-1"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                  </svg>
                  Call To User
                </button>
              )}
            </div>
          </div>
          {isAnswerCall && (
            <div className="w-full mt-6">
              <h1 className="text-2xl font-bold mb-2 text-center">Chat</h1>
              <div className="h-72 w-full overflow-y-scroll border">
                {conversation.length > 0 &&
                  conversation.map((u, i) => {
                    if (u.id === myId) {
                      return (
                        <p
                          key={i}
                          className="float-right w-1/2 my-2 mr-2 break-words bg-bgColor p-2 rounded"
                        >
                          {u.message}
                        </p>
                      );
                    } else {
                      return (
                        <p
                          key={i}
                          className="float-left w-1/2 my-2 ml-2 break-words bg-bgColor p-2 rounded"
                        >
                          {u.message}
                        </p>
                      );
                    }
                  })}
              </div>
              <input
                className="shadow appearance-none mt-2 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="Write message..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
              />
              <div className="flex justify-center mt-4">
                <button
                  className="shadow border border-r-0 py-1 px-3"
                  onClick={() => {
                    if (call.from) {
                      sendMessage(call.from, call.to);
                    } else {
                      sendMessage(toCallingUserId, myId);
                    }
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {call.isReceived && !isAnswerCall && (
            <div className="absolute top-10 right-10 xl:w-96 lg:w-96 md:w-96 sm:w-72 w-72 bg-white rounded p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="xl:text-lg lg:text-lg md:text-lg sm:text-md text-md font-bold">
                    {call.callerName}
                  </h4>
                  <span className="text-sm italic text-gray-400">
                    Calling You...
                  </span>
                </div>
                <button
                  onClick={answerCall}
                  className="py-2 px-4  flex justify-center items-center bg-green-500 hover:bg-green-700 focus:bg-green-500 focus:ring-offset-green-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
                >
                  Accept
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
