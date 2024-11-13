const GlowingTextLoader = ({ text = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center">
      <span className="text-[13px] font-bold animate-pulse bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
        {text}
      </span>
    </div>
  );
};

export default GlowingTextLoader;