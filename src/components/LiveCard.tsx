import React from 'react';
import ReactPlayer from 'react-player';

const LiveCard = ({ stream }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-100">
      <div className="relative pt-[56.25%] bg-black"> {/* 16:9 Aspect Ratio */}
        <ReactPlayer
          url={stream.streamUrl}
          className="absolute top-0 left-0"
          width="100%"
          height="100%"
          controls
          config={{
            youtube: {
              playerVars: { showinfo: 1 }
            }
          }}
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded ${stream.status === 'live' ? 'bg-red-600 animate-pulse' : 'bg-gray-500'}`}>
              {stream.status === 'live' ? 'LIVE' : stream.status.toUpperCase()}
            </span>
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              {stream.category}
            </span>
          </div>
          {stream.scheduledAt && (
            <span className="text-xs text-gray-400">
              {new Date(stream.scheduledAt).toLocaleString()}
            </span>
          )}
        </div>
        <h3 className="font-bold text-lg text-gray-900">{stream.title}</h3>
        <p className="text-gray-600 text-sm mt-1">{stream.description}</p>
      </div>
    </div>
  );
};

export default LiveCard;
