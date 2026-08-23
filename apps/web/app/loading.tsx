export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <img
          src="/logo.svg"
          alt="GrocGo"
          width={64}
          height={64}
          className="animate-bounce mx-auto mb-4"
          draggable={false}
        />
        <p className="text-sm font-semibold text-gray-400 tracking-wide">Loading GrocGo...</p>
      </div>
    </div>
  );
}
