export const LoadingSpinner = ({ 
    size = "50px", 
    color = "#3B82F6", 
    thickness = 5,
    speed = 1 
  }) => {
    return (
      <div className="inline-block" style={{ width: size, height: size }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 50 50"
          className="w-full h-full"
        >
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray="94.2477796077"
            strokeDashoffset="47.123889803849996"
            style={{
              transformOrigin: 'center',
              animation: `spin ${speed}s linear infinite`
            }}
          />
        </svg>
      </div>
    );
  };